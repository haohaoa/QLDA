import React, { useState } from 'react';
import { UndergroundProject, DailyLogEntry, SiteBulletin } from '../types/undergrounding';
import {
  BarChart3,
  TrendingUp,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  HardHat,
  Share2,
} from 'lucide-react';

interface OverviewDashboardProps {
  projects: UndergroundProject[];
  dailyLogs: DailyLogEntry[];
  bulletins: SiteBulletin[];
  currentDate: string;
  onGoToDailyReport: (projectId: string) => void;
  onGoToWeeklyReport: () => void;
  onGoToBulletins: (projectId?: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  projects,
  dailyLogs,
  bulletins,
  currentDate,
  onGoToDailyReport,
  onGoToWeeklyReport,
  onGoToBulletins,
}) => {
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Compute aggregate system metrics
  const totalSystemLengthM = projects.reduce((sum, p) => sum + p.totalLengthM, 0);
  const totalCompletedLengthM = projects.reduce((sum, p) => sum + p.completedLengthM, 0);
  const totalTargetChambers = projects.reduce((sum, p) => sum + p.totalChambers, 0);
  const totalCompletedChambers = projects.reduce((sum, p) => sum + p.completedChambers, 0);
  const totalContractValue = projects.reduce((sum, p) => sum + p.contractValueVND, 0);

  const overallLengthPercent =
    totalSystemLengthM > 0 ? Math.round((totalCompletedLengthM / totalSystemLengthM) * 100) : 0;
  const overallChamberPercent =
    totalTargetChambers > 0 ? Math.round((totalCompletedChambers / totalTargetChambers) * 100) : 0;

  // Check today's submission status for projects
  const todayLogs = dailyLogs.filter((l) => l.date === currentDate);
  const reportedProjectIds = new Set(todayLogs.map((l) => l.projectId));
  const unsubmittedProjects = projects.filter((p) => !reportedProjectIds.has(p.id));

  // Zalo dispatch copy
  const handleCopyZalo = () => {
    let text = `📊 BÁO CÁO NHANH TIẾN ĐỘ NGẦM HÓA CHO LÃNH ĐẠO\n`;
    text += `📅 Ngày báo cáo: ${currentDate}\n`;
    text += `💰 Tổng quy mô: ${(totalContractValue / 1000000000).toFixed(1)} Tỷ VNĐ (${projects.length} Dự án)\n`;
    text += `⚡ Tiến độ mương cáp toàn hệ thống: ${totalCompletedLengthM.toLocaleString()}/${totalSystemLengthM.toLocaleString()} m (${overallLengthPercent}%)\n`;
    text += `☵ Hố ga hoàn tất: ${totalCompletedChambers}/${totalTargetChambers} hầm (${overallChamberPercent}%)\n`;
    text += `------------------------------------\n`;
    text += `📋 TIẾN ĐỘ TỪNG DỰ ÁN:\n`;

    projects.forEach((p, idx) => {
      const pct = p.totalLengthM > 0 ? Math.round((p.completedLengthM / p.totalLengthM) * 100) : 0;
      const chPct = p.totalChambers > 0 ? Math.round((p.completedChambers / p.totalChambers) * 100) : 0;
      text += `${idx + 1}. ${p.name}\n`;
      text += `   • Nhà thầu: ${p.contractor}\n`;
      text += `   • Mương cáp: ${p.completedLengthM.toLocaleString()}/${p.totalLengthM.toLocaleString()} m (${pct}%)\n`;
      text += `   • Hố ga: ${p.completedChambers}/${p.totalChambers} hầm (${chPct}%)\n`;
      text += `   • Hiện trường: ${p.currentWorkLocation}\n`;

      const projectBulletins = bulletins.filter((b) => b.isActive && (b.projectId === p.id || b.projectId === 'all'));
      if (projectBulletins.length > 0) {
        text += `   ⚠️ Chú ý: ${projectBulletins[0].title} (${projectBulletins[0].documentRefNumber || 'Hồ sơ pháp lý'})\n`;
      }
    });

    if (unsubmittedProjects.length > 0) {
      text += `------------------------------------\n`;
      text += `🚨 CẢNH BÁO HÔM NAY (${currentDate}): Có ${unsubmittedProjects.length} tuyến chưa chốt số liệu: ${unsubmittedProjects.map(p => p.name).join(', ')}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar with Direct Fast Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>TỔNG QUAN TIẾN ĐỘ ĐA DỰ ÁN</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Biểu Đồ Tiến Độ & Báo Cáo Điều Hành
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            So sánh trực quan tiến độ tất cả dự án bằng biểu đồ thanh, tinh gọn không hình ảnh rườm rà.
          </p>
        </div>

        {/* Action buttons: Zalo & Export Image/Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyZalo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Sao chép tóm tắt định dạng nhanh gửi Zalo các sếp"
          >
            {copiedZalo ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedZalo ? 'Đã Sao Chép Zalo!' : 'Báo Cáo Zalo (1-Click)'}</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            title="Xem & Chụp hình phiếu báo cáo lãnh đạo"
          >
            <Printer className="w-4 h-4" />
            <span>Chụp / In Phiếu Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* 2. Today Unsubmitted Warning Banner (Nổi bật nếu hôm nay chưa báo cáo) */}
      {unsubmittedProjects.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-200" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-2">
                <span>HÔM NAY ({currentDate.split('-').reverse().join('/')}): CÓ {unsubmittedProjects.length} DỰ ÁN CHƯA BÁO CÁO!</span>
                <span className="bg-white text-red-600 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                  Chưa chốt số liệu
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                Các tuyến chưa gửi báo cáo ngày hôm nay:{' '}
                <strong>{unsubmittedProjects.map((p) => p.name).join(', ')}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => onGoToDailyReport(unsubmittedProjects[0]?.id)}
            className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-sm whitespace-nowrap self-start sm:self-auto"
          >
            Nhập Báo Cáo Ngay
          </button>
        </div>
      )}

      {/* 3. Executive KPI Metric Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Tổng Giá Trị Hợp Đồng
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {(totalContractValue / 1000000000).toFixed(2)}{' '}
            <span className="text-xs font-sans font-semibold text-slate-500">Tỷ VNĐ</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {projects.length} dự án ngầm trọng điểm
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Tổng Mương Cáp Hoàn Thành
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-600">
            {overallLengthPercent}%
          </div>
          <span className="text-[11px] text-slate-600 mt-1 block font-mono">
            {totalCompletedLengthM.toLocaleString()} / {totalSystemLengthM.toLocaleString()} m
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Tổng Hố Ga / Bể Cáp Xong
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
            {overallChamberPercent}%
          </div>
          <span className="text-[11px] text-slate-600 mt-1 block font-mono">
            {totalCompletedChambers} / {totalTargetChambers} hầm
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Bảng Tin & Pháp Lý
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600">
            {bulletins.filter((b) => b.isActive).length}{' '}
            <span className="text-xs font-sans font-semibold text-slate-500">thông báo</span>
          </div>
          <button
            onClick={() => onGoToBulletins()}
            className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold mt-1 block text-left"
          >
            Xem bảng tin hiện trường
          </button>
        </div>
      </div>

      {/* 4. MULTI-PROJECT PROGRESS COMPARISON CHARTS (Hiển thị cùng lúc nhiều dự án bằng biểu đồ) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: So Sánh Chiều Dài Mương Cáp Ngầm Hóa (Mét) & % Hoàn Thành */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Biểu Đồ Tiến Độ Mương Cáp (% & Mét Hoàn Thành)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                So sánh tiến độ thực hiện mương cáp ngầm của tất cả các dự án
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50 px-2.5 py-1 rounded-lg">
              {overallLengthPercent}% Toàn Hệ Thống
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {projects.map((p) => {
              const pct = p.totalLengthM > 0 ? Math.round((p.completedLengthM / p.totalLengthM) * 100) : 0;
              const hasBulletin = bulletins.some((b) => b.isActive && (b.projectId === p.id || b.projectId === 'all'));

              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[280px]">
                        {p.name}
                      </span>
                      {hasBulletin && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Có thông báo/hồ sơ xin phép" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-slate-500 text-[11px]">
                        {p.completedLengthM.toLocaleString()} / {p.totalLengthM.toLocaleString()} m
                      </span>
                      <span className="font-bold text-blue-600 w-11 text-right">{pct}%</span>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart with gradient */}
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: So Sánh Số Lượng Hố Ga / Bể Cáp Hoàn Tất */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Biểu Đồ Khối Lượng Hố Ga / Bể Cáp (Hầm)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Số hố ga đã đổ bê tông & nghiệm thu so với mục tiêu
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 font-mono bg-emerald-50 px-2.5 py-1 rounded-lg">
              {overallChamberPercent}% Toàn Hệ Thống
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {projects.map((p) => {
              const chPct = p.totalChambers > 0 ? Math.round((p.completedChambers / p.totalChambers) * 100) : 0;

              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[280px]">
                      {p.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-slate-500 text-[11px]">
                        {p.completedChambers} / {p.totalChambers} hầm
                      </span>
                      <span className="font-bold text-emerald-600 w-11 text-right">{chPct}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                      style={{ width: `${Math.min(chPct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Clean Tabular Summary of All Projects with Active Bulletins (Hiển thị thông báo lên chi tiết dự án) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Bảng Tổng Hợp Chi Tiết Dự Án & Hồ Sơ Thông Báo Hiện Trường
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gồm nhà thầu thi công, giá trị hợp đồng, vị trí hiện trường và thông báo pháp lý/tạm ngưng.
            </p>
          </div>

          <button
            onClick={onGoToWeeklyReport}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <span>Xem lịch trình tiến độ tuần ➔</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {projects.map((proj) => {
            const pct = proj.totalLengthM > 0 ? Math.round((proj.completedLengthM / proj.totalLengthM) * 100) : 0;
            const chPct = proj.totalChambers > 0 ? Math.round((proj.completedChambers / proj.totalChambers) * 100) : 0;

            // Relevant bulletins for this project
            const relevantBulletins = bulletins.filter(
              (b) => b.isActive && (b.projectId === proj.id || b.projectId === 'all')
            );

            return (
              <div key={proj.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">{proj.name}</span>
                      <span className="text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {proj.code}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span>
                        <strong>CĐT:</strong> {proj.investor}
                      </span>
                      <span>
                        <strong>Nhà thầu:</strong> {proj.contractor}
                      </span>
                      <span>
                        <strong>Giá trị HĐ:</strong>{' '}
                        <strong className="text-blue-700 font-mono">
                          {(proj.contractValueVND / 1000000000).toFixed(2)} Tỷ VNĐ
                        </strong>
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      <strong>Hiện trường đang làm:</strong> {proj.currentWorkLocation}
                    </div>
                  </div>

                  {/* Metrics and Action */}
                  <div className="flex flex-wrap items-center gap-4 self-start lg:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Mương cáp</span>
                      <span className="font-mono font-bold text-blue-600 text-sm">
                        {proj.completedLengthM.toLocaleString()}m ({pct}%)
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Hố ga</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        {proj.completedChambers}/{proj.totalChambers} ({chPct}%)
                      </span>
                    </div>

                    <button
                      onClick={() => onGoToDailyReport(proj.id)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <span>Báo cáo ngày</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Display active bulletin directly on project card if any */}
                {relevantBulletins.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {relevantBulletins.map((b) => (
                      <div
                        key={b.id}
                        className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                          b.severity === 'critical'
                            ? 'bg-red-50/80 border-red-200 text-red-950'
                            : b.severity === 'warning'
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                            : 'bg-blue-50/80 border-blue-200 text-blue-950'
                        }`}
                      >
                        <div className="flex items-start gap-2">
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
                              <span>{b.title}</span>
                              {b.documentRefNumber && (
                                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border shadow-2xs">
                                  📄 {b.documentRefNumber}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-slate-800 leading-relaxed">{b.content}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => onGoToBulletins(proj.id)}
                          className="text-[11px] font-bold underline shrink-0 hover:opacity-80"
                        >
                          Chi tiết hồ sơ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Clean Printable / Screenshot Executive Card Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 text-slate-900 border border-slate-300 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900 uppercase">
                  Phiếu Báo Cáo Tiến Độ Ngầm Hóa (Executive Summary)
                </h3>
                <p className="text-xs text-slate-500">Ngày chốt số liệu: {currentDate}</p>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-800 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">Tổng Hợp Đồng:</span>
                  <strong className="text-sm font-mono text-slate-900">
                    {(totalContractValue / 1000000000).toFixed(2)} Tỷ
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tiến Độ Mương:</span>
                  <strong className="text-sm font-mono text-blue-600">
                    {totalCompletedLengthM.toLocaleString()}m ({overallLengthPercent}%)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Hố Ga Hoàn Tất:</span>
                  <strong className="text-sm font-mono text-emerald-600">
                    {totalCompletedChambers}/{totalTargetChambers} ({overallChamberPercent}%)
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Bảng tổng hợp tiến độ các dự án:</span>
                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="p-2 border border-slate-200">Dự án</th>
                      <th className="p-2 border border-slate-200">Nhà thầu</th>
                      <th className="p-2 border border-slate-200 text-right">Mương (m)</th>
                      <th className="p-2 border border-slate-200 text-right">%</th>
                      <th className="p-2 border border-slate-200 text-right">Hố ga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const pct = p.totalLengthM > 0 ? Math.round((p.completedLengthM / p.totalLengthM) * 100) : 0;
                      return (
                        <tr key={p.id}>
                          <td className="p-2 border border-slate-200 font-bold">{p.name}</td>
                          <td className="p-2 border border-slate-200">{p.contractor}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono">
                            {p.completedLengthM}/{p.totalLengthM}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-mono font-bold text-blue-600">
                            {pct}%
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-mono">
                            {p.completedChambers}/{p.totalChambers}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>In / Xuất PDF</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
