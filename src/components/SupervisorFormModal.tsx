import React, { useState, useEffect } from 'react';
import { DailyLogEntry, UndergroundProject, ViolationReport } from '../types/undergrounding';
import {
  X,
  Camera,
  HardHat,
  AlertTriangle,
  FileWarning,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';

interface SupervisorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<DailyLogEntry, 'id'>) => void;
  projects: UndergroundProject[];
  editingLog?: DailyLogEntry | null;
  defaultDate?: string;
  defaultProjectId?: string;
}

export const SupervisorFormModal: React.FC<SupervisorFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projects,
  editingLog,
  defaultDate,
  defaultProjectId,
}) => {
  const [date, setDate] = useState<string>(
    editingLog?.date || defaultDate || '2026-10-16'
  );
  const [projectId, setProjectId] = useState<string>(
    editingLog?.projectId || defaultProjectId || projects[0]?.id || ''
  );

  const currentProject = projects.find((p) => p.id === projectId) || projects[0];

  const [contractorName, setContractorName] = useState<string>(
    editingLog?.contractorName || currentProject?.contractor || 'Minh Ngọc'
  );

  // Sync when defaultProjectId or defaultDate change
  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
      const proj = projects.find((p) => p.id === defaultProjectId);
      if (proj) {
        setContractorName(proj.contractor);
      }
    }
  }, [defaultProjectId]);

  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate]);

  // Resource status
  const [resourceType, setResourceType] = useState<'normal' | 'weather_stopped' | 'obstacle_stopped'>(
    editingLog?.stoppageReason ? 'weather_stopped' : 'normal'
  );
  const [customResource, setCustomResource] = useState<string>(
    editingLog?.resources || '1 đội đào + 1 đội khoan'
  );
  const [excavationToday, setExcavationToday] = useState<number>(editingLog?.excavationTodayM || 0);
  const [chambersToday, setChambersToday] = useState<number>(editingLog?.chambersPouredToday || 0);
  const [pipeLaidToday, setPipeLaidToday] = useState<number>(editingLog?.pipeLaidTodayM || 0);
  const [restoredToday, setRestoredToday] = useState<number>(editingLog?.restoredTodayM || 0);
  const [stoppageReason, setStoppageReason] = useState<string>(
    editingLog?.stoppageReason || 'Nghỉ do mưa lớn theo chỉ đạo PCTT'
  );
  const [supervisorName, setSupervisorName] = useState<string>(
    editingLog?.supervisorName || 'KS. Nguyễn Văn Hùng'
  );
  const [notes, setNotes] = useState<string>(editingLog?.notes || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    editingLog?.photoUrl || '/src/assets/images/underground_conduit_hdpe_1792057789393.jpg'
  );

  // --- VIOLATION REPORT / BIÊN BẢN XỬ LÝ SAI BẢN VẼ THIẾT KẾ ---
  const [hasViolation, setHasViolation] = useState<boolean>(
    !!editingLog?.violationReport?.hasViolation
  );
  const [violationCode, setViolationCode] = useState<string>(
    editingLog?.violationReport?.code || `BB-XL-${Date.now().toString().slice(-4)}/2026`
  );
  const [violationType, setViolationType] = useState<ViolationReport['violationType']>(
    editingLog?.violationReport?.violationType || 'sai_ban_ve_thiet_ke'
  );
  const [violationDescription, setViolationDescription] = useState<string>(
    editingLog?.violationReport?.description || ''
  );
  const [violationCorrectiveAction, setViolationCorrectiveAction] = useState<string>(
    editingLog?.violationReport?.correctiveAction || ''
  );
  const [violationPhotoUrl, setViolationPhotoUrl] = useState<string>(
    editingLog?.violationReport?.photoUrl || '/src/assets/images/cable_manhole_vault_1792057790898.jpg'
  );
  const [deadlineHours, setDeadlineHours] = useState<number>(
    editingLog?.violationReport?.deadlineHours || 24
  );
  const [violationStatus, setViolationStatus] = useState<ViolationReport['status']>(
    editingLog?.violationReport?.status || 'pending_fix'
  );

  if (!isOpen) return null;

  // Compute estimated cumulative
  const prevCumTrench = editingLog
    ? editingLog.cumulativeTrenchM - (editingLog.pipeLaidTodayM || 0)
    : currentProject?.completedLengthM || 1200;
  const prevCumChambers = editingLog
    ? editingLog.cumulativeChambers - (editingLog.chambersPouredToday || 0)
    : currentProject?.completedChambers || 15;

  const finalCumTrench = prevCumTrench + (Number(pipeLaidToday) || Number(excavationToday) || 0);
  const finalCumChambers = prevCumChambers + (Number(chambersToday) || 0);

  const handleProjectSelect = (newProjectId: string) => {
    setProjectId(newProjectId);
    const proj = projects.find((p) => p.id === newProjectId);
    if (proj) {
      setContractorName(proj.contractor);
    }
  };

  const getViolationTypeLabel = (type: ViolationReport['violationType']) => {
    switch (type) {
      case 'sai_ban_ve_thiet_ke':
        return 'Thi công sai bản vẽ thiết kế kỹ thuật duyệt';
      case 'sai_do_sau_ranh':
        return 'Sai cao độ / không đạt độ sâu chôn ống ngầm (-1.2m)';
      case 'sai_tim_tuyen':
        return 'Đào sai tim tuyến / lấn chiếm hành lang công trình khác';
      case 'sai_quy_cach_ho_ga':
        return 'Bể cáp thi công sai quy cách kích thước hoặc cốt thép';
      case 'chua_hoan_tra_mat_bang':
        return 'Chưa hoàn trả mặt bằng / thảm nhựa tạm gây nguy hiểm';
      case 'mat_an_toan_gt':
      default:
        return 'Không đảm bảo an toàn giao thông / thiếu biển cảnh báo rào chắn';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalResource = customResource;
    if (resourceType === 'weather_stopped') {
      finalResource = 'Nghỉ do mưa lớn';
    } else if (resourceType === 'obstacle_stopped') {
      finalResource = 'Nghỉ do vướng mặt bằng';
    }

    let violationReportData: ViolationReport | undefined = undefined;
    if (hasViolation) {
      violationReportData = {
        id: editingLog?.violationReport?.id || `viol-${Date.now()}`,
        hasViolation: true,
        code: violationCode,
        violationType,
        violationTypeLabel: getViolationTypeLabel(violationType),
        description: violationDescription,
        correctiveAction: violationCorrectiveAction,
        photoUrl: violationPhotoUrl,
        deadlineHours: Number(deadlineHours),
        status: violationStatus,
        supervisorSign: supervisorName,
      };
    }

    const payload: Omit<DailyLogEntry, 'id'> = {
      stt: editingLog?.stt || 1,
      date,
      contractorName,
      projectId: currentProject?.id || 'prj-hl-vt',
      projectName: currentProject?.name || 'Ngầm hóa tuyến',
      resources: finalResource,
      excavationTodayM: Number(excavationToday) || 0,
      chambersPouredToday: Number(chambersToday) || 0,
      pipeLaidTodayM: Number(pipeLaidToday) || 0,
      restoredTodayM: Number(restoredToday) || 0,
      cumulativeTrenchM: finalCumTrench,
      contractTrenchM: currentProject?.totalLengthM || 2500,
      cumulativeChambers: finalCumChambers,
      contractChambers: currentProject?.totalChambers || 30,
      stoppageReason: resourceType !== 'normal' ? stoppageReason : undefined,
      supervisorName,
      photoUrl: photoPreview || undefined,
      notes,
      violationReport: violationReportData,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {editingLog ? 'Chỉnh Sửa Báo Cáo Ngày' : 'Cập Nhật Nhật Ký & Tiến Độ Hằng Ngày (ADMIN)'}
              </h2>
              <p className="text-xs text-slate-300">
                Ghi nhận số lượng đội thi công, mét đào, hố ga và lập biên bản nếu thi công sai thiết kế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Date & Project & Contractor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ngày Báo Cáo:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Dự Án Ngầm Hóa:</label>
              <select
                value={projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Nhà Thầu Thi Công:</label>
              <input
                type="text"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                title="Tự động đồng bộ theo dự án đã chọn để tránh mất thời gian chọn lại"
                required
              />
            </div>
          </div>

          {/* Row 2: Resources & Construction Teams */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-900 block">
              Nguồn Lực / Đội Thi Công Trong Ngày:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                  resourceType === 'normal'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="resourceType"
                  checked={resourceType === 'normal'}
                  onChange={() => setResourceType('normal')}
                  className="text-blue-600"
                />
                <span>Có thi công</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                  resourceType === 'weather_stopped'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="resourceType"
                  checked={resourceType === 'weather_stopped'}
                  onChange={() => setResourceType('weather_stopped')}
                  className="text-amber-600"
                />
                <span>Nghỉ mưa bão / lũ</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                  resourceType === 'obstacle_stopped'
                    ? 'bg-red-50 border-red-400 text-red-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="resourceType"
                  checked={resourceType === 'obstacle_stopped'}
                  onChange={() => setResourceType('obstacle_stopped')}
                  className="text-red-600"
                />
                <span>Nghỉ vướng mặt bằng</span>
              </label>
            </div>

            {resourceType === 'normal' ? (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mô tả đội thi công hôm nay:
                </label>
                <input
                  type="text"
                  value={customResource}
                  onChange={(e) => setCustomResource(e.target.value)}
                  placeholder="VD: 1 đội đào + 1 đội khoan ngầm HDD"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>
            ) : (
              <div>
                <label className="block text-amber-900 font-semibold mb-1">
                  Lý do ngưng thi công chi tiết:
                </label>
                <input
                  type="text"
                  value={stoppageReason}
                  onChange={(e) => setStoppageReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-medium"
                  required
                />
              </div>
            )}
          </div>

          {/* Row 3: Daily Output Volumes */}
          <div>
            <span className="font-bold text-slate-900 block mb-2">
              Khối lượng hoàn thành trong ngày:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Đào phui ngày (m):
                </label>
                <input
                  type="number"
                  min="0"
                  value={excavationToday}
                  onChange={(e) => setExcavationToday(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Lắp ống ngày (m):
                </label>
                <input
                  type="number"
                  min="0"
                  value={pipeLaidToday}
                  onChange={(e) => setPipeLaidToday(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Đổ hố ga ngày (hầm):
                </label>
                <input
                  type="number"
                  min="0"
                  value={chambersToday}
                  onChange={(e) => setChambersToday(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Hoàn trả thảm (m):
                </label>
                <input
                  type="number"
                  min="0"
                  value={restoredToday}
                  onChange={(e) => setRestoredToday(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* SECTION: BIÊN BẢN HIỆN TRƯỜNG (LÀM SAI HOẶC KHÔNG ĐÚNG BẢN VẼ THIẾT KẾ) */}
          <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-red-600" />
                <span className="font-extrabold text-sm text-red-950 uppercase tracking-tight">
                  Lập Biên Bản Hiện Trường (Sai Bản Vẽ Thiết Kế / Vi Phạm)
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasViolation}
                  onChange={(e) => setHasViolation(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="font-bold text-xs text-red-700">Có lập biên bản xử lý</span>
              </label>
            </div>

            {hasViolation && (
              <div className="space-y-3 pt-2 border-t border-red-200 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-red-900 font-bold mb-1">
                      Mã Số Biên Bản Xử Lý:
                    </label>
                    <input
                      type="text"
                      required={hasViolation}
                      value={violationCode}
                      onChange={(e) => setViolationCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl font-mono font-bold text-red-950"
                      placeholder="BB-XL/2026/014"
                    />
                  </div>

                  <div>
                    <label className="block text-red-900 font-bold mb-1">
                      Loại Vi Phạm Kỹ Thuật:
                    </label>
                    <select
                      value={violationType}
                      onChange={(e) => setViolationType(e.target.value as ViolationReport['violationType'])}
                      className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl font-semibold text-slate-900"
                    >
                      <option value="sai_ban_ve_thiet_ke">Thi công sai bản vẽ thiết kế kỹ thuật duyệt</option>
                      <option value="sai_do_sau_ranh">Sai cao độ / không đạt độ sâu rãnh cáp (-1.2m)</option>
                      <option value="sai_tim_tuyen">Đào sai tim tuyến / vi phạm hạ tầng ngầm khác</option>
                      <option value="sai_quy_cach_ho_ga">Bể cáp sai kích thước hình học hoặc nắp bể</option>
                      <option value="chua_hoan_tra_mat_bang">Chưa hoàn trả mặt bằng / thảm nhựa tạm</option>
                      <option value="mat_an_toan_gt">Không đảm bảo an toàn giao thông / thiếu rào chắn</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-red-900 font-bold mb-1">
                    Ghi Chú & Mô Tả Chi Tiết Sai Phạm: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required={hasViolation}
                    value={violationDescription}
                    onChange={(e) => setViolationDescription(e.target.value)}
                    placeholder="Mô tả cụ thể vị trí lý trình Km..., lỗi thi công không đúng bản vẽ thiết kế (ví dụ: đặt ống cạn -0.8m so với thiết kế -1.2m, lệch tim 40cm)..."
                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-red-900 font-bold mb-1">
                    Biện Pháp Xử Lý & Yêu Cầu Khắc Phục: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={hasViolation}
                    value={violationCorrectiveAction}
                    onChange={(e) => setViolationCorrectiveAction(e.target.value)}
                    placeholder="VD: Yêu cầu nhà thầu đào hạ sâu đúng cao độ thiết kế, tạm ngưng nghiệm thu đoạn mương này..."
                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-red-900 font-bold mb-1">
                      Thời Hạn Khắc Phục (Giờ):
                    </label>
                    <select
                      value={deadlineHours}
                      onChange={(e) => setDeadlineHours(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl font-semibold text-slate-900"
                    >
                      <option value={24}>Khắc phục trong 24 giờ</option>
                      <option value={48}>Khắc phục trong 48 giờ</option>
                      <option value={72}>Khắc phục trong 72 giờ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-red-900 font-bold mb-1">
                      Tình Trạng Xử Lý:
                    </label>
                    <select
                      value={violationStatus}
                      onChange={(e) => setViolationStatus(e.target.value as ViolationReport['status'])}
                      className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl font-bold text-red-800"
                    >
                      <option value="pending_fix">Đang chờ nhà thầu sửa chữa / khắc phục</option>
                      <option value="fixed">Đã khắc phục đúng thiết kế</option>
                      <option value="rejected_acceptance">Từ chối nghiệm thu dứt khoát</option>
                    </select>
                  </div>
                </div>

                {/* Photo of Violation with Camera Capture / File Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-red-900 font-bold flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-red-600" />
                      <span>Chụp Ảnh / Hình Ảnh Hiện Trường Sai Phạm:</span>
                    </label>
                    <span className="text-[10px] text-red-600 font-medium italic">
                      Hỗ trợ chụp trực tiếp từ camera điện thoại
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Chụp Ảnh Camera / Tải File</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setViolationPhotoUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setViolationPhotoUrl('/src/assets/images/cable_manhole_vault_1792057789517.jpg')
                        }
                        className="px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-[10px] font-bold text-red-800 hover:bg-red-100"
                      >
                        Mẫu: Sai cốt hố ga
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setViolationPhotoUrl('/src/assets/images/underground_conduit_hdpe_1792057789393.jpg')
                        }
                        className="px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-[10px] font-bold text-red-800 hover:bg-red-100"
                      >
                        Mẫu: Đặt ống sai tim
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setViolationPhotoUrl('/src/assets/images/asphalt_road_restoration_1792057789394.jpg')
                        }
                        className="px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-[10px] font-bold text-red-800 hover:bg-red-100"
                      >
                        Mẫu: Chưa thảm nhựa tạm
                      </button>
                    </div>

                    <input
                      type="text"
                      value={violationPhotoUrl}
                      onChange={(e) => setViolationPhotoUrl(e.target.value)}
                      placeholder="Hoặc dán URL ảnh / Data URL tại đây..."
                      className="w-full px-3 py-1.5 bg-white border border-red-300 rounded-xl text-xs font-mono"
                    />

                    {violationPhotoUrl && (
                      <div className="flex items-start gap-3 p-2 bg-red-100/60 rounded-xl border border-red-300">
                        <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-red-400 shrink-0 bg-slate-900 shadow-xs">
                          <img
                            src={violationPhotoUrl}
                            alt="Ảnh vi phạm hiện trường"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-red-900/80 text-white text-[9px] text-center font-bold py-0.5">
                            Ảnh hiện trường
                          </span>
                        </div>
                        <div className="text-xs text-red-950 flex-1">
                          <div className="font-bold flex items-center justify-between">
                            <span>Đã đính kèm ảnh bằng chứng sai phạm</span>
                            <button
                              type="button"
                              onClick={() => setViolationPhotoUrl('')}
                              className="text-red-700 hover:text-red-900 underline text-[10px]"
                            >
                              Gỡ ảnh
                            </button>
                          </div>
                          <p className="text-[11px] text-red-800 mt-1">
                            Hình ảnh sẽ được thể hiện trực tiếp trên báo cáo ngày và làm nổi bật ngày có biên bản vi phạm trên lịch thi công.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Supervisor & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Kỹ sư / Giám sát hiện trường:
              </label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Ghi chú hiện trường:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Nghiệm thu đệm cát, che chắn an toàn ban đêm"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-xs transition-all"
            >
              {editingLog ? 'Cập Nhật' : 'Lưu Báo Cáo Ngày & Biên Bản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
