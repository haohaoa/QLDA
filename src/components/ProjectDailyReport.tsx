import React, { useState } from 'react';
import { UndergroundProject, DailyLogEntry, SiteBulletin, ViolationReport } from '../types/undergrounding';
import {
  Calendar as CalendarIcon,
  Download,
  Copy,
  Check,
  PlusCircle,
  Edit3,
  Trash2,
  HardHat,
  CloudRain,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  FileWarning,
  Lock,
  ChevronDown,
  X,
  ExternalLink,
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { exportDailyLogsToCsv, generateZaloReportText } from '../utils/exportUtils';

interface ProjectDailyReportProps {
  projects: UndergroundProject[];
  dailyLogs: DailyLogEntry[];
  bulletins?: SiteBulletin[];
  selectedProjectId: string;
  onSelectProjectId: (projectId: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isAdmin: boolean;
  onOpenSupervisorForm: (prefillDate?: string, prefillProjectId?: string) => void;
  onEditLog: (log: DailyLogEntry) => void;
  onDeleteLog: (id: string) => void;
  onGoToBulletins?: (projectId?: string) => void;
  onOpenLogin?: () => void;
  initialViewMode?: 'daily' | 'weekly';
}

export const ProjectDailyReport: React.FC<ProjectDailyReportProps> = ({
  projects,
  dailyLogs,
  bulletins = [],
  selectedProjectId,
  onSelectProjectId,
  selectedDate,
  onSelectDate,
  isAdmin,
  onOpenSupervisorForm,
  onEditLog,
  onDeleteLog,
  onGoToBulletins,
  onOpenLogin,
  initialViewMode = 'daily',
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>(initialViewMode);
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [selectedViolationDetail, setSelectedViolationDetail] = useState<ViolationReport | null>(null);
  const [showLastWeekPreview, setShowLastWeekPreview] = useState(false);

  // Current real-world date configured for the project (Ngày 16/10/2026)
  const TODAY_STR = '2026-10-16';

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Relevant active bulletins for current project or all
  const activeBulletinsForProject = bulletins.filter(
    (b) => b.isActive && (selectedProjectId === 'all' || b.projectId === selectedProjectId || b.projectId === 'all')
  );

  // Filter logs for selected project and date (Bỏ tính năng lọc nhà thầu theo yêu cầu)
  const filteredLogs = dailyLogs
    .filter((log) => (selectedProjectId === 'all' ? true : log.projectId === selectedProjectId))
    .filter((log) => log.date === selectedDate);

  // Team resources for selected date
  let trenchTeams = 0;
  let drillingTeams = 0;
  let weatherStoppedTeams = 0;
  let obstacleStoppedTeams = 0;
  let violationsCountToday = 0;

  filteredLogs.forEach((log) => {
    if (log.violationReport?.hasViolation) {
      violationsCountToday += 1;
    }
    const res = log.resources.toLowerCase();
    if (res.includes('nghỉ do mưa')) {
      weatherStoppedTeams += 1;
    } else if (res.includes('vướng')) {
      obstacleStoppedTeams += 1;
    } else {
      if (res.includes('đào')) {
        const match = res.match(/(\d+)\s*đội đào/);
        trenchTeams += match ? parseInt(match[1]) : 1;
      }
      if (res.includes('khoan')) {
        const match = res.match(/(\d+)\s*đội khoan/);
        drillingTeams += match ? parseInt(match[1]) : 1;
      }
    }
  });

  const totalActiveTeams = trenchTeams + drillingTeams;

  // Totals calculations
  const totalExcavation = filteredLogs.reduce((sum, r) => sum + (r.excavationTodayM || 0), 0);
  const totalChambersToday = filteredLogs.reduce((sum, r) => sum + (r.chambersPouredToday || 0), 0);
  const totalCumTrench = filteredLogs.reduce((sum, r) => sum + (r.cumulativeTrenchM || 0), 0);
  const totalContractTrench = filteredLogs.reduce((sum, r) => sum + (r.contractTrenchM || 0), 0);
  const trenchRate =
    totalContractTrench > 0 ? Math.round((totalCumTrench / totalContractTrench) * 100) : 0;
  const totalCumChambers = filteredLogs.reduce((sum, r) => sum + (r.cumulativeChambers || 0), 0);
  const totalContractChambers = filteredLogs.reduce((sum, r) => sum + (r.contractChambers || 0), 0);

  // Check today unsubmitted projects
  const todayLogs = dailyLogs.filter((l) => l.date === TODAY_STR);
  const reportedProjectIdsToday = new Set(todayLogs.map((l) => l.projectId));
  const unsubmittedProjectsToday = projects.filter((p) => !reportedProjectIdsToday.has(p.id));

  const handleCopyZalo = () => {
    const text = generateZaloReportText(
      filteredLogs,
      selectedDate,
      currentProject?.name || 'Toàn bộ dự án ngầm hóa',
      currentProject?.investor || 'FPT Telecom & Điện lực'
    );
    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  const handleExport = () => {
    exportDailyLogsToCsv(
      filteredLogs,
      selectedDate,
      currentProject?.name || 'Toàn bộ dự án ngầm hóa',
      currentProject?.investor || 'FPT Telecom & Điện lực'
    );
  };

  const handleActionRequiresAdmin = (actionFn: () => void) => {
    if (isAdmin) {
      actionFn();
    } else if (onOpenLogin) {
      onOpenLogin();
    }
  };

  // Calendar matrix generator for October 2026
  const daysInMonth = 31;
  const startDayOfWeek = 4; // Thursday = 4
  const calendarCells: Array<{ day: number | null; dateStr: string | null }> = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push({ day: null, dateStr: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    calendarCells.push({ day, dateStr: `2026-10-${dayStr}` });
  }

  // Get status for each date on calendar
  const getDateStatus = (dateStr: string) => {
    const dayLogs = dailyLogs
      .filter((l) => (selectedProjectId === 'all' ? true : l.projectId === selectedProjectId))
      .filter((l) => l.date === dateStr);

    if (dayLogs.length === 0) return { status: 'none', label: 'Chưa có báo cáo', count: 0, hasViolation: false };

    const hasRainStop = dayLogs.some((l) => l.resources.toLowerCase().includes('nghỉ do mưa'));
    const hasObstacle = dayLogs.some((l) => l.resources.toLowerCase().includes('vướng'));
    const hasViolation = dayLogs.some((l) => l.violationReport?.hasViolation);
    const hasActiveWork = dayLogs.some(
      (l) => l.excavationTodayM > 0 || l.chambersPouredToday > 0 || l.resources.includes('đội')
    );

    if (hasActiveWork && !hasRainStop) {
      return { status: 'working', label: 'Có thi công', count: dayLogs.length, hasViolation };
    }
    if (hasRainStop) {
      return { status: 'rain', label: 'Nghỉ mưa bão', count: dayLogs.length, hasViolation };
    }
    if (hasObstacle) {
      return { status: 'obstacle', label: 'Nghỉ vướng', count: dayLogs.length, hasViolation };
    }
    return { status: 'off', label: 'Nghỉ', count: dayLogs.length, hasViolation };
  };

  // --- WEEKS LIST DATA (DANH SÁCH CÁC TUẦN THI CÔNG ĐỂ XEM LỊCH SỬ CÁC ĐỘI) ---
  const WEEKS_LIST = [
    {
      id: 'w42',
      name: 'Tuần 42: 12/10/2026 – 18/10/2026 (Tuần hiện tại)',
      shortLabel: 'Tuần 42 (Tuần này)',
      isCurrent: true,
      days: [
        { label: 'T2 (12/10)', date: '2026-10-12' },
        { label: 'T3 (13/10)', date: '2026-10-13' },
        { label: 'T4 (14/10)', date: '2026-10-14' },
        { label: 'T5 (15/10)', date: '2026-10-15' },
        { label: 'T6 (16/10)', date: '2026-10-16', isToday: true },
        { label: 'T7 (17/10)', date: '2026-10-17' },
        { label: 'CN (18/10)', date: '2026-10-18' },
      ],
    },
    {
      id: 'w41',
      name: 'Tuần 41: 05/10/2026 – 11/10/2026',
      shortLabel: 'Tuần 41 (Tuần trước)',
      isCurrent: false,
      days: [
        { label: 'T2 (05/10)', date: '2026-10-05' },
        { label: 'T3 (06/10)', date: '2026-10-06' },
        { label: 'T4 (07/10)', date: '2026-10-07' },
        { label: 'T5 (08/10)', date: '2026-10-08' },
        { label: 'T6 (09/10)', date: '2026-10-09' },
        { label: 'T7 (10/10)', date: '2026-10-10' },
        { label: 'CN (11/10)', date: '2026-10-11' },
      ],
    },
    {
      id: 'w40',
      name: 'Tuần 40: 28/09/2026 – 04/10/2026',
      shortLabel: 'Tuần 40',
      isCurrent: false,
      days: [
        { label: 'T2 (28/09)', date: '2026-09-28' },
        { label: 'T3 (29/09)', date: '2026-09-29' },
        { label: 'T4 (30/09)', date: '2026-09-30' },
        { label: 'T5 (01/10)', date: '2026-10-01' },
        { label: 'T6 (02/10)', date: '2026-10-02' },
        { label: 'T7 (03/10)', date: '2026-10-03' },
        { label: 'CN (04/10)', date: '2026-10-04' },
      ],
    },
    {
      id: 'w39',
      name: 'Tuần 39: 21/09/2026 – 27/09/2026',
      shortLabel: 'Tuần 39',
      isCurrent: false,
      days: [
        { label: 'T2 (21/09)', date: '2026-09-21' },
        { label: 'T3 (22/09)', date: '2026-09-22' },
        { label: 'T4 (23/09)', date: '2026-09-23' },
        { label: 'T5 (24/09)', date: '2026-09-24' },
        { label: 'T6 (25/09)', date: '2026-09-25' },
        { label: 'T7 (26/09)', date: '2026-09-26' },
        { label: 'CN (27/09)', date: '2026-09-27' },
      ],
    },
  ];

  const [selectedWeekId, setSelectedWeekId] = useState<string>('w42');
  const activeWeek = WEEKS_LIST.find((w) => w.id === selectedWeekId) || WEEKS_LIST[0];

  const isSelectedDateFuture = selectedDate > TODAY_STR;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Project Dropdown Selector & Control Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Chọn Dự Án Ngầm Xem Báo Cáo:
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => onSelectProjectId(e.target.value)}
                className="px-3.5 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden min-w-[260px] shadow-2xs"
              >
                <option value="all">★ Tất Cả Dự Án Ngầm ({projects.length} Dự Án)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.totalLengthM.toLocaleString()}m)
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle: Báo cáo ngày vs Danh sách tuần */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Chế Độ Báo Cáo:
              </label>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'daily'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Báo Cáo Ngày & Lịch Tháng
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'weekly'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Tra Cứu Danh Sách Các Tuần</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons with Admin separation & Future Date restriction */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {isSelectedDateFuture ? (
              <div
                className="px-3.5 py-2 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl border border-slate-200 cursor-not-allowed select-none"
                title="Ngày này chưa đến thời điểm thi công, nút cập nhật báo cáo bị ẩn"
              >
                Chưa Đến Ngày ({selectedDate.split('-').reverse().join('/')})
              </div>
            ) : isAdmin ? (
              <button
                onClick={() =>
                  onOpenSupervisorForm(
                    selectedDate,
                    selectedProjectId !== 'all' ? selectedProjectId : undefined
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Cập Nhật Báo Cáo Ngày (ADMIN)</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all"
                title="Đăng nhập tài khoản Quản trị để cập nhật số liệu nhật ký"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Đăng nhập Admin để cập nhật</span>
              </button>
            )}

            <button
              onClick={handleCopyZalo}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              title="Sao chép báo cáo gửi Zalo cho sếp"
            >
              {copiedZalo ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedZalo ? 'Đã sao chép' : 'Báo Cáo Zalo'}</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Highlight Today status if today (16/10) is not submitted */}
        {unsubmittedProjectsToday.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
              <span>
                CẢNH BÁO HÔM NAY ({TODAY_STR.split('-').reverse().join('/')}): Có{' '}
                <strong className="text-red-700">{unsubmittedProjectsToday.length} dự án</strong> chưa chốt báo cáo nhật ký!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleActionRequiresAdmin(() => {
                    onSelectDate(TODAY_STR);
                    if (unsubmittedProjectsToday[0]) {
                      onSelectProjectId(unsubmittedProjectsToday[0].id);
                    }
                    onOpenSupervisorForm(TODAY_STR, unsubmittedProjectsToday[0]?.id);
                  })
                }
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-xs"
              >
                {isAdmin ? 'Nhập báo cáo hôm nay ngay' : 'Đăng nhập Admin để nhập'}
              </button>
            </div>
          </div>
        )}

        {/* Project Specific Bulletin Banner */}
        {activeBulletinsForProject.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            {activeBulletinsForProject.map((b) => (
              <div
                key={b.id}
                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  b.severity === 'critical'
                    ? 'bg-red-50/90 border-red-200 text-red-950'
                    : b.severity === 'warning'
                    ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                    : 'bg-blue-50/90 border-blue-200 text-blue-950'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      b.severity === 'critical'
                        ? 'text-red-600'
                        : b.severity === 'warning'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <div>
                    <div className="font-bold flex flex-wrap items-center gap-2">
                      <span>THÔNG BÁO HIỆN TRƯỜNG: {b.title}</span>
                      {b.documentRefNumber && (
                        <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border">
                          📄 {b.documentRefNumber}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-slate-800 leading-relaxed">{b.content}</p>
                  </div>
                </div>

                {onGoToBulletins && (
                  <button
                    onClick={() => onGoToBulletins(b.projectId)}
                    className="text-[11px] font-bold underline shrink-0 hover:opacity-80"
                  >
                    Xem hồ sơ
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: TRA CỨU DANH SÁCH CÁC TUẦN (XEM LỊCH SỬ THI CÔNG CỦA CÁC ĐỘI) */}
      {viewMode === 'weekly' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Tra Cứu Lịch Sử Thi Công Theo Danh Sách Các Tuần
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn tuần từ danh sách hoặc dùng nút chuyển tuần để xem lại toàn bộ tình hình hoạt động của các đội thi công, khối lượng đào và ngày nghỉ bão lũ.
                </p>
              </div>

              {/* Week Selector Dropdown & Stepper Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const idx = WEEKS_LIST.findIndex((w) => w.id === selectedWeekId);
                    if (idx < WEEKS_LIST.length - 1) {
                      setSelectedWeekId(WEEKS_LIST[idx + 1].id);
                    }
                  }}
                  disabled={selectedWeekId === WEEKS_LIST[WEEKS_LIST.length - 1].id}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  title="Chuyển về tuần trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Tuần trước</span>
                </button>

                <select
                  value={selectedWeekId}
                  onChange={(e) => setSelectedWeekId(e.target.value)}
                  className="px-3.5 py-2 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden shadow-2xs"
                >
                  {WEEKS_LIST.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const idx = WEEKS_LIST.findIndex((w) => w.id === selectedWeekId);
                    if (idx > 0) {
                      setSelectedWeekId(WEEKS_LIST[idx - 1].id);
                    }
                  }}
                  disabled={selectedWeekId === WEEKS_LIST[0].id}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  title="Chuyển sang tuần sau"
                >
                  <span>Tuần sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Display active selected week table */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                  LỊCH TRÌNH: {activeWeek.name}
                </span>
                {activeWeek.isCurrent && (
                  <span className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-md border border-blue-200 w-fit">
                    Hôm nay: Thứ 6, ngày 16/10/2026
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 min-w-[210px] border-r border-slate-200">Dự Án / Nhà Thầu</th>
                      {activeWeek.days.map((d) => (
                        <th
                          key={d.date}
                          className={`py-2 px-2 text-center min-w-[115px] border-r border-slate-200 ${
                            d.isToday ? 'bg-amber-100 text-amber-950 border-x-2 border-amber-400 font-black' : ''
                          }`}
                        >
                          <div>{d.label}</div>
                          {d.isToday && (
                            <span className="inline-block bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase mt-0.5 shadow-2xs">
                              HÔM NAY (16)
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {projects.map((proj) => {
                      return (
                        <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 border-r border-slate-200 font-semibold">
                            <div className="text-slate-900 font-bold">{proj.name}</div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              {proj.contractor}
                            </div>
                            <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                              Tiến độ: {proj.completedLengthM}/{proj.totalLengthM}m ({Math.round((proj.completedLengthM/proj.totalLengthM)*100)}%)
                            </div>
                          </td>

                          {activeWeek.days.map((d) => {
                            const dayLogs = dailyLogs.filter(
                              (l) => l.projectId === proj.id && l.date === d.date
                            );
                            const log = dayLogs[0];
                            const isToday = d.isToday;
                            const isFuture = d.date > TODAY_STR;

                            if (isToday) {
                              if (!log) {
                                return (
                                  <td
                                    key={d.date}
                                    className="p-2 border-r border-slate-200 bg-red-50/80 border-x-2 border-amber-400 text-center"
                                  >
                                    <div className="bg-red-100 border border-red-300 p-2 rounded-xl text-center space-y-1">
                                      <span className="text-[10px] font-black text-red-700 block uppercase animate-pulse">
                                        ⚠️ CHƯA BÁO CÁO!
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleActionRequiresAdmin(() => {
                                            onSelectDate(d.date);
                                            onSelectProjectId(proj.id);
                                            onOpenSupervisorForm(d.date, proj.id);
                                          })
                                        }
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold block w-full shadow-2xs"
                                      >
                                        + Nhập ngay
                                      </button>
                                    </div>
                                  </td>
                                );
                              }

                              const hasViol = log.violationReport?.hasViolation;
                              return (
                                <td
                                  key={d.date}
                                  className="p-2 border-r border-slate-200 bg-amber-50/80 border-x-2 border-amber-400 text-center"
                                >
                                  <button
                                    onClick={() => {
                                      onSelectDate(d.date);
                                      onSelectProjectId(proj.id);
                                      setViewMode('daily');
                                    }}
                                    className="w-full text-left bg-white p-2 rounded-xl border border-amber-300 shadow-2xs hover:bg-amber-50/40"
                                  >
                                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-900 mb-0.5">
                                      <span>✓ Đã báo cáo</span>
                                      <span className="font-mono text-blue-700">{log.excavationTodayM}m</span>
                                    </div>
                                    <div className="text-[10px] font-semibold text-slate-800 truncate">
                                      {log.resources}
                                    </div>
                                    {hasViol && (
                                      <span className="mt-1 flex items-center gap-1 bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-300">
                                        <Camera className="w-3 h-3 text-red-600" />
                                        <span>Có biên bản & ảnh vi phạm</span>
                                      </span>
                                    )}
                                  </button>
                                </td>
                              );
                            }

                            // Other days of week
                            if (!log) {
                              return (
                                <td key={d.date} className="p-2 border-r border-slate-200 text-center text-slate-300">
                                  {isFuture ? (
                                    <span className="text-[10px] text-slate-400 italic">Chưa đến ngày</span>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </td>
                              );
                            }

                            const isRain = log.resources.toLowerCase().includes('mưa');
                            const hasViol = log.violationReport?.hasViolation;

                            return (
                              <td key={d.date} className="p-2 border-r border-slate-200 text-center">
                                <button
                                  onClick={() => {
                                    onSelectDate(d.date);
                                    onSelectProjectId(proj.id);
                                    setViewMode('daily');
                                  }}
                                  className={`w-full text-left p-1.5 rounded-lg border text-[10px] transition-all hover:ring-1 hover:ring-blue-500 ${
                                    hasViol
                                      ? 'bg-red-50 border-red-300 text-red-950 ring-1 ring-red-400'
                                      : isRain
                                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <div className="font-semibold truncate">{log.resources}</div>
                                  <div className="font-mono text-[9px] text-slate-500 mt-0.5">
                                    Đào: {log.excavationTodayM}m • Bể: {log.chambersPouredToday}
                                  </div>
                                  {hasViol && (
                                    <div className="text-[9px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
                                      <Camera className="w-3 h-3" />
                                      <span>Biên bản vi phạm</span>
                                    </div>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BÁO CÁO NGÀY (LỊCH THÁNG 10/2026 & BẢNG SỐ LIỆU EXCEL) */}
      {viewMode === 'daily' && (
        <>
          {/* THANH ĐIỀU HƯỚNG & CHUYỂN TUẦN: XEM TUẦN TRƯỚC ĐÃ CÓ THI CÔNG KHÔNG */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>Điều Hướng Lịch Trình Các Tuần</span>
                    <span className="text-[10px] font-semibold bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                      Kiểm tra tuần trước & tuần này
                    </span>
                  </h4>
                  <p className="text-xs text-blue-200/80">
                    Bấm để kiểm tra ngay tuần trước các đội đã thi công ra sao, khối lượng đạt bao nhiêu, có bị dừng do mưa lũ không.
                  </p>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWeekId('w41');
                    setShowLastWeekPreview(true);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                    selectedWeekId === 'w41' && showLastWeekPreview
                      ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-white/60 font-black'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Tuần Trước (05/10 - 11/10)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedWeekId('w42');
                    setShowLastWeekPreview(false);
                    onSelectDate(TODAY_STR);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                    selectedWeekId === 'w42' && !showLastWeekPreview
                      ? 'bg-blue-500 text-white shadow-md ring-2 ring-white/60 font-black'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <span>★ Tuần Này (12/10 - 18/10)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('weekly');
                    setSelectedWeekId('w41');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Xem Chi Tiết Lịch Sử Tuần</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Preview Panel for Previous Week (Tuần 41) */}
            {showLastWeekPreview && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20 text-xs space-y-2.5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2">
                  <div className="font-bold text-amber-300 flex flex-wrap items-center gap-2">
                    <span>📋 TÌNH HÌNH THI CÔNG TUẦN TRƯỚC (05/10/2026 – 11/10/2026):</span>
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-bold">
                      ✓ 5 Ngày Có Thi Công
                    </span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold">
                      ⚠️ 2 Ngày Nghỉ Mưa Bão
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLastWeekPreview(false)}
                    className="text-white/70 hover:text-white text-[11px] underline self-end sm:self-auto"
                  >
                    Đóng tóm tắt
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-blue-100">
                  <div className="bg-black/30 p-2.5 rounded-lg border border-white/10">
                    <span className="text-white font-bold block mb-1">Công ty Minh Ngọc:</span>
                    <span>Thi công 5 ngày (05, 06, 09, 10, 11/10). Đào 580m phui hở, đổ 4 hố ga. Ngày 07-08/10 nghỉ do mưa lớn.</span>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-lg border border-white/10">
                    <span className="text-white font-bold block mb-1">Công ty Thành Phát:</span>
                    <span>Thi công 4 ngày. Khoan ngầm HDD 420m, hoàn trả 350m mặt đường bê tông nhựa.</span>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-lg border border-white/10">
                    <span className="text-white font-bold block mb-1">Hạ Tầng Miền Nam:</span>
                    <span>Hoàn thành đúc 5 hố ga lắp ghép, kéo luồn 1.800m ống HDPE qua mương.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Dạng Lịch Thi Công Tháng 10/2026 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  Lịch Thi Công Tháng 10/2026 (Ngày Hiện Tại: 16/10/2026)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhấp vào ngày bất kỳ để xem số liệu. Ngày có biên bản vi phạm sai thiết kế được làm nổi bật viền đỏ và biểu tượng máy ảnh hiện trường.
                </p>
              </div>

              {/* Calendar Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Có thi công</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-amber-800 font-semibold">Nghỉ mưa bão</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-red-700 font-bold">Có biên bản vi phạm (Ảnh)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span>Chưa có báo cáo</span>
                </span>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-bold text-slate-500 mb-2">
              <div className="text-red-500">CN</div>
              <div>T2</div>
              <div>T3</div>
              <div>T4</div>
              <div>T5</div>
              <div>T6</div>
              <div>T7</div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.dateStr) {
                  return <div key={`empty-${idx}`} className="h-16 sm:h-20 bg-slate-50/40 rounded-xl" />;
                }

                const isSelected = cell.dateStr === selectedDate;
                const dayStatus = getDateStatus(cell.dateStr);
                const isToday = cell.dateStr === TODAY_STR; // Đúng ngày 16!
                const isFuture = cell.dateStr > TODAY_STR; // Chưa đến ngày!
                const hasViolation = dayStatus.hasViolation;

                return (
                  <div
                    key={cell.dateStr}
                    className={`relative h-18 sm:h-22 p-1.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/70 shadow-sm'
                        : hasViolation
                        ? 'border-2 border-red-500 bg-red-100/90 ring-2 ring-red-400 shadow-md animate-pulse/20'
                        : isToday
                        ? 'border-2 border-amber-500 bg-amber-50/40 shadow-xs'
                        : isFuture
                        ? 'border-slate-200/60 bg-slate-50/40 opacity-80'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <button
                        onClick={() => onSelectDate(cell.dateStr!)}
                        className={`text-xs font-bold font-mono ${
                          isSelected
                            ? 'text-blue-900 font-black'
                            : isToday
                            ? 'text-white bg-red-600 px-1.5 py-0.2 rounded-full font-black'
                            : hasViolation
                            ? 'text-red-800 font-black'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.day}
                      </button>

                      {hasViolation ? (
                        <span
                          className="flex items-center gap-0.5 bg-red-600 text-white text-[9px] font-black px-1 py-0.2 rounded shadow-xs"
                          title="CÓ BIÊN BẢN VI PHẠM SAI THIẾT KẾ (KÈM ẢNH CHỤP HIỆN TRƯỜNG)"
                        >
                          <Camera className="w-2.5 h-2.5" />
                          <span>Biên bản</span>
                        </span>
                      ) : dayStatus.status === 'working' ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Có thi công" />
                      ) : dayStatus.status === 'rain' ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Nghỉ do mưa lớn" />
                      ) : dayStatus.status === 'obstacle' ? (
                        <span className="w-2 h-2 rounded-full bg-red-500" title="Vướng mặt bằng" />
                      ) : null}
                    </div>

                    {/* Status Text & Direct Update Link */}
                    <div className="truncate text-[9px] sm:text-[10px]">
                      {hasViolation ? (
                        <button
                          onClick={() => onSelectDate(cell.dateStr!)}
                          className="text-left w-full truncate bg-red-200/80 hover:bg-red-300 text-red-950 font-black px-1 py-0.5 rounded border border-red-300/80 flex items-center justify-between"
                          title="Nhấp để xem biên bản vi phạm và ảnh hiện trường"
                        >
                          <span className="truncate">📋 Sai thiết kế</span>
                          <Camera className="w-2.5 h-2.5 shrink-0 text-red-700" />
                        </button>
                      ) : dayStatus.status === 'working' ? (
                        <button
                          onClick={() => onSelectDate(cell.dateStr!)}
                          className="text-left w-full truncate"
                        >
                          <span className="text-emerald-700 font-semibold block truncate">
                            Thi công ({dayStatus.count})
                          </span>
                        </button>
                      ) : dayStatus.status === 'rain' ? (
                        <button
                          onClick={() => onSelectDate(cell.dateStr!)}
                          className="text-left w-full truncate"
                        >
                          <span className="text-amber-700 font-bold block truncate">Nghỉ mưa bão</span>
                        </button>
                      ) : dayStatus.status === 'none' ? (
                        isFuture ? (
                          /* CHƯA ĐẾN NGÀY: ẨN ĐI NÚT BÁO CÁO */
                          <div className="text-center text-[10px] text-slate-300 select-none py-1">-</div>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectDate(cell.dateStr!);
                              handleActionRequiresAdmin(() => {
                                onOpenSupervisorForm(
                                  cell.dateStr!,
                                  selectedProjectId !== 'all' ? selectedProjectId : undefined
                                );
                              });
                            }}
                            className="w-full text-[9px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-1 py-0.5 rounded text-center truncate block border border-blue-200/60"
                            title="Cập nhật báo cáo cho ngày này đúng nhà thầu đã chọn"
                          >
                            + Báo cáo
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Daily Resource Summary Strip */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  Chi Tiết Ngày: {selectedDate.split('-').reverse().join('/')}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-md">
                  {filteredLogs.length} nhật ký
                </span>
                {selectedDate === TODAY_STR && (
                  <span className="text-xs bg-red-100 text-red-900 font-black px-2 py-0.5 rounded-md border border-red-300">
                    ★ HÔM NAY (16/10)
                  </span>
                )}
                {violationsCountToday > 0 && (
                  <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{violationsCountToday} Biên bản vi phạm thiết kế (Có ảnh)</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-3">
                <span className="font-semibold text-slate-900">
                  Lực lượng huy động:{' '}
                  <strong className="text-blue-600 font-mono text-sm">{totalActiveTeams} đội làm việc</strong>
                </span>
                {weatherStoppedTeams > 0 && (
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {weatherStoppedTeams} đội nghỉ mưa bão
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500">Phân loại đội thi công:</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-medium">
                {trenchTeams} đội đào phui hở
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-medium">
                {drillingTeams} đội khoan ngầm HDD
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-medium">
                Mét đào hôm nay: <strong className="font-mono">{totalExcavation}m</strong>
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-medium">
                Đổ hố ga hôm nay: <strong className="font-mono">{totalChambersToday} bể</strong>
              </span>
            </div>
          </div>

          {/* 4. Daily Progress Excel Spreadsheet */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
            <div className="text-center py-4 px-6 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
                Báo Cáo Khối Lượng Thi Công Tuyến Bão Lũ
              </h2>
              <div className="mt-1 inline-block bg-yellow-300 text-slate-900 font-bold text-sm sm:text-base px-6 py-0.5 rounded-sm shadow-xs border border-yellow-400">
                Ngày {selectedDate.split('-').reverse().join('/')}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-300 w-12">
                      STT
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-300 min-w-[120px]">
                      Nhà Thầu
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-300 min-w-[130px]">
                      Dự Án Ngầm
                    </th>
                    <th rowSpan={2} className="py-2.5 px-4 border-r border-slate-300 min-w-[200px]">
                      Nguồn Lực & Biên Bản Sai Phạm (Kèm Ảnh)
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-300 w-24">
                      KL Đào Phui / Ngày (Mét)
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-300 w-24">
                      Khối Lượng Đổ Hố Ga / Ngày
                    </th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-300 bg-slate-200">
                      Khối Lượng Mương Cáp (Lắp ống)
                    </th>
                    <th colSpan={2} className="py-2 px-2 border-r border-slate-300 bg-slate-200">
                      Khối Lượng Bể Cáp
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 w-20 text-center">
                      Thao tác
                    </th>
                  </tr>

                  <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300 text-center">
                    <th className="py-1.5 px-2.5 border-r border-slate-300 w-20">Lũy Kế (m)</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-300 w-20">KLHĐ (m)</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-300 w-24">Tỉ lệ Hoàn Thành</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-300 w-24">Khối Lượng Bể Cáp</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-300 w-20">KLHĐ (hầm)</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-10 text-slate-400">
                        Chưa có nhật ký cho ngày này.{' '}
                        {isSelectedDateFuture ? (
                          <span className="text-slate-400 italic">
                            (Ngày tương lai chưa đến thời điểm thi công)
                          </span>
                        ) : isAdmin ? (
                          <button
                            onClick={() =>
                              onOpenSupervisorForm(
                                selectedDate,
                                selectedProjectId !== 'all' ? selectedProjectId : undefined
                              )
                            }
                            className="text-blue-600 font-bold underline ml-1 hover:text-blue-800"
                          >
                            + Nhập nhật ký ngay (ADMIN)
                          </button>
                        ) : (
                          <button
                            onClick={onOpenLogin}
                            className="text-blue-600 font-bold underline ml-1 hover:text-blue-800"
                          >
                            🔒 Đăng nhập Admin để nhập nhật ký
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((row, idx) => {
                      const trenchPercent =
                        row.contractTrenchM > 0
                          ? ((row.cumulativeTrenchM / row.contractTrenchM) * 100).toFixed(1)
                          : '0.0';
                      const isRain = row.resources.toLowerCase().includes('mưa');
                      const viol = row.violationReport;

                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-blue-50/30 transition-colors ${
                            viol?.hasViolation
                              ? 'bg-red-50/60 text-red-950'
                              : isRain
                              ? 'bg-amber-50/40 text-amber-900'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-2 text-center border-r border-slate-200 font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-slate-900">
                            {row.contractorName}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800">
                            {row.projectName}
                          </td>
                          <td className="py-2.5 px-4 border-r border-slate-200 space-y-1.5">
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs ${
                                  isRain
                                    ? 'bg-amber-100 text-amber-900 font-semibold'
                                    : 'text-slate-800'
                                }`}
                              >
                                {row.resources}
                              </span>
                            </div>

                            {/* Violation Alert Badge in Table with Photo Thumbnail */}
                            {viol?.hasViolation && (
                              <div className="pt-1 space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedViolationDetail(viol)}
                                  className="w-full text-left bg-red-100 hover:bg-red-200 border border-red-300 text-red-900 p-2 rounded-xl flex items-start justify-between gap-2 transition-colors shadow-2xs"
                                >
                                  <div className="flex items-start gap-1.5 min-w-0">
                                    <FileWarning className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <div className="truncate">
                                      <div className="font-bold font-mono text-[10px] flex items-center gap-1">
                                        <span>{viol.code}:</span>
                                        <span className="text-red-700 uppercase font-black">Biên bản sai phạm</span>
                                      </div>
                                      <div className="text-[10px] text-red-800 font-medium truncate">
                                        {viol.violationTypeLabel}
                                      </div>
                                      <div className="text-[9px] text-red-600 italic truncate mt-0.5">
                                        {viol.description}
                                      </div>
                                    </div>
                                  </div>

                                  {viol.photoUrl && (
                                    <div className="shrink-0 relative group">
                                      <img
                                        src={viol.photoUrl}
                                        alt="Ảnh sai phạm"
                                        className="w-12 h-10 object-cover rounded-lg border-2 border-red-400 group-hover:scale-105 transition-transform"
                                      />
                                      <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow-xs">
                                        <Camera className="w-2.5 h-2.5" />
                                      </span>
                                    </div>
                                  )}
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedViolationDetail(viol)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 transition-colors"
                                  >
                                    <Camera className="w-3 h-3 text-red-600" />
                                    <span>Xem ảnh hiện trường vi phạm</span>
                                  </button>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => onEditLog(row)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                                    >
                                      <Edit3 className="w-3 h-3 text-blue-600" />
                                      <span>Sửa/Bổ sung ảnh</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {row.notes && !viol?.hasViolation && (
                              <div className="text-[10px] text-slate-400">{row.notes}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-200 font-mono">
                            {row.excavationTodayM > 0 ? (
                              <span className="font-bold text-slate-900">{row.excavationTodayM}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-200 font-mono">
                            {row.chambersPouredToday > 0 ? (
                              <span className="font-bold text-slate-900">{row.chambersPouredToday}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-200 font-mono text-slate-700">
                            {row.cumulativeTrenchM.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-200 font-mono text-slate-700">
                            {row.contractTrenchM.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-200 font-mono font-bold text-blue-700">
                            {trenchPercent}%
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-200 font-mono text-slate-700">
                            {row.cumulativeChambers}
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-200 font-mono text-slate-700">
                            {row.contractChambers}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {isAdmin ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => onEditLog(row)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                  title="Chỉnh sửa dòng này"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteLog(row.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px] italic">Chỉ xem</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Totals Row */}
                {filteredLogs.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={4} className="py-2.5 px-4 text-center border-r border-slate-300 uppercase">
                        TỔNG CỘNG
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-300 font-mono">
                        {totalExcavation}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-300 font-mono">
                        {totalChambersToday}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-300 font-mono">
                        {totalCumTrench.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-300 font-mono">
                        {totalContractTrench.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-300 font-mono text-blue-700">
                        {trenchRate}%
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-300 font-mono">
                        {totalCumChambers}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-300 font-mono">
                        {totalContractChambers}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL CHI TIẾT BIÊN BẢN VI PHẠM THIẾT KẾ HIỆN TRƯỜNG */}
      {selectedViolationDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-red-100 mb-4">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <FileWarning className="w-5 h-5" />
                <span>BIÊN BẢN XỬ LÝ VI PHẠM THIẾT KẾ</span>
              </div>
              <button
                onClick={() => setSelectedViolationDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-red-900">
                  <span>Mã: {selectedViolationDetail.code}</span>
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-sans">
                    Hạn xử lý: {selectedViolationDetail.deadlineHours}h
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedViolationDetail.violationTypeLabel}
                </div>
              </div>

              <div>
                <strong className="text-slate-700 block mb-1">Mô tả vi phạm chi tiết:</strong>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                  {selectedViolationDetail.description}
                </p>
              </div>

              <div>
                <strong className="text-slate-700 block mb-1">Yêu cầu biện pháp khắc phục:</strong>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-semibold">
                  {selectedViolationDetail.correctiveAction}
                </p>
              </div>

              {selectedViolationDetail.photoUrl && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-700 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-red-600" />
                      <span>Ảnh chụp hiện trường vi phạm:</span>
                    </strong>
                    <span className="text-[10px] text-slate-400 italic">Chụp bởi KS. Giám sát</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-300 h-52 bg-slate-900 shadow-xs relative group">
                    <img
                      src={selectedViolationDetail.photoUrl}
                      alt="Hiện trường vi phạm"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[11px] font-semibold flex items-center justify-between">
                      <span>Bằng chứng sai phạm thi công hiện trường</span>
                      <a
                        href={selectedViolationDetail.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-[10px] flex items-center gap-1 text-white hover:text-blue-300"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Mở ảnh lớn</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Người lập: <strong>{selectedViolationDetail.supervisorSign}</strong></span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedViolationDetail.status === 'pending_fix' ? 'Đang chờ khắc phục' : 'Đã nghiệm thu lại'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
