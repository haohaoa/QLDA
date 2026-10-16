import React, { useState } from 'react';
import { UndergroundProject, RouteCoordinatePoint } from '../types/undergrounding';
import {
  FolderPlus,
  MapPin,
  Plus,
  Trash2,
  Save,
  Check,
  Building,
  HardHat,
  Banknote,
  Calendar,
  Layers,
  CornerDownRight,
  Maximize2,
  Navigation,
  Lock,
} from 'lucide-react';

interface ProjectManagementProps {
  projects: UndergroundProject[];
  onAddProject: (project: UndergroundProject) => void;
  onUpdateProject: (project: UndergroundProject) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProjectOnMap: (projectId: string) => void;
  isAdmin: boolean;
  onOpenLogin?: () => void;
}

export const ProjectManagement: React.FC<ProjectManagementProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onSelectProjectOnMap,
  isAdmin,
  onOpenLogin,
}) => {
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState(`DA-NGAM-${projects.length + 1}`);
  const [investor, setInvestor] = useState('FPT Telecom (FTEL INFMN)');
  const [contractor, setContractor] = useState('Công ty Cổ phần Xây lắp & Viễn thông Minh Ngọc');
  const [contractValueVND, setContractValueVND] = useState<number>(15000000000); // 15 tỷ
  const [startDate, setStartDate] = useState('2026-10-01');
  const [finishDate, setFinishDate] = useState('2026-12-31');
  const [totalLengthM, setTotalLengthM] = useState<number>(2500);
  const [totalChambers, setTotalChambers] = useState<number>(35);
  const [startPointName, setStartPointName] = useState('Nút giao A (Đầu tuyến)');
  const [endPointName, setEndPointName] = useState('Nút giao B (Cuối tuyến)');
  const [currentWorkLocation, setCurrentWorkLocation] = useState('Km 0+000 đến Km 0+300');

  // Coordinates: Start, Turn points, End
  const [startLat, setStartLat] = useState<number>(16.0520);
  const [startLng, setStartLng] = useState<number>(108.2400);
  const [endLat, setEndLat] = useState<number>(16.0590);
  const [endLng, setEndLng] = useState<number>(108.2290);
  const [turnPoints, setTurnPoints] = useState<Array<{ id: string; name: string; lat: number; lng: number }>>([
    {
      id: 'tp-1',
      name: 'Điểm cua 1: Góc ngã tư đường',
      lat: 16.0555,
      lng: 108.2350,
    },
  ]);

  const handleAddTurnPoint = () => {
    const nextIdx = turnPoints.length + 1;
    setTurnPoints([
      ...turnPoints,
      {
        id: `tp-${Date.now()}`,
        name: `Điểm cua ${nextIdx}: Góc cua/ngã rẽ`,
        lat: Number((startLat + (endLat - startLat) * (nextIdx / (turnPoints.length + 2))).toFixed(4)),
        lng: Number((startLng + (endLng - startLng) * (nextIdx / (turnPoints.length + 2))).toFixed(4)),
      },
    ]);
  };

  const handleRemoveTurnPoint = (id: string) => {
    setTurnPoints(turnPoints.filter((p) => p.id !== id));
  };

  const handleUpdateTurnPoint = (id: string, field: 'name' | 'lat' | 'lng', val: any) => {
    setTurnPoints(
      turnPoints.map((p) => (p.id === id ? { ...p, [field]: field === 'name' ? val : Number(val) } : p))
    );
  };

  const resetForm = () => {
    setName('');
    setCode(`DA-NGAM-${projects.length + 1}`);
    setContractValueVND(15000000000);
    setTotalLengthM(2500);
    setTotalChambers(35);
    setStartPointName('Nút giao A (Đầu tuyến)');
    setEndPointName('Nút giao B (Cuối tuyến)');
    setCurrentWorkLocation('Khởi công Km 0+000');
    setTurnPoints([
      {
        id: 'tp-1',
        name: 'Điểm cua 1: Góc ngã tư đường',
        lat: 16.0555,
        lng: 108.2350,
      },
    ]);
    setEditingProjectId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Build ordered points: start -> turns -> end
    const points: RouteCoordinatePoint[] = [
      {
        id: `pt-start-${Date.now()}`,
        name: `Điểm bắt đầu: ${startPointName}`,
        type: 'start',
        lat: Number(startLat),
        lng: Number(startLng),
      },
      ...turnPoints.map((tp) => ({
        id: tp.id,
        name: tp.name,
        type: 'turn' as const,
        lat: Number(tp.lat),
        lng: Number(tp.lng),
      })),
      {
        id: `pt-end-${Date.now()}`,
        name: `Điểm kết thúc: ${endPointName}`,
        type: 'end',
        lat: Number(endLat),
        lng: Number(endLng),
      },
    ];

    if (editingProjectId) {
      const existing = projects.find((p) => p.id === editingProjectId);
      if (existing) {
        const updated: UndergroundProject = {
          ...existing,
          name,
          code,
          investor,
          contractor,
          contractValueVND: Number(contractValueVND),
          startDate,
          finishDate,
          totalLengthM: Number(totalLengthM),
          totalChambers: Number(totalChambers),
          startPointName,
          endPointName,
          currentWorkLocation,
          points,
        };
        onUpdateProject(updated);
        setSavedNotice(`Đã cập nhật dự án: ${name}`);
      }
    } else {
      const newProject: UndergroundProject = {
        id: `prj-${Date.now()}`,
        name,
        code,
        investor,
        contractor,
        contractValueVND: Number(contractValueVND),
        startDate,
        finishDate,
        totalLengthM: Number(totalLengthM),
        totalChambers: Number(totalChambers),
        startPointName,
        endPointName,
        currentWorkLocation,
        completedLengthM: 0,
        completedChambers: 0,
        points,
        chambers: [
          {
            id: `cb-${Date.now()}-1`,
            code: `BC-${code}-01`,
            type: 'Bể cáp kéo tiêu chuẩn (B1)',
            dimensions: '1.8m x 1.2m x 1.4m',
            position: [Number(startLat), Number(startLng)],
            locationDescription: startPointName,
            status: 'planned',
            depthMeters: 1.4,
            manholeCoverType: 'Gang cầu tải trọng 25T',
          },
        ],
        photos: [
          {
            id: `p-${Date.now()}`,
            url: '/src/assets/images/underground_conduit_hdpe_1792057789393.jpg',
            title: `Chuẩn bị mặt bằng thi công ngầm hóa ${name}`,
            location: startPointName,
            date: startDate,
            stage: 'trenching',
            stageLabel: 'Mặt bằng thi công',
            supervisor: 'Kỹ sư trưởng phụ trách',
            notes: 'Đã hoàn tất định vị tuyến ngầm, mốc tọa độ và chuẩn bị máy móc.',
            gpsCoords: `${startLat}°N, ${startLng}°E`,
          },
        ],
      };

      onAddProject(newProject);
      setSavedNotice(`Đã tạo thành công Dự án ngầm: ${name} (${totalLengthM.toLocaleString()}m)`);
    }

    resetForm();
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleEdit = (project: UndergroundProject) => {
    setEditingProjectId(project.id);
    setName(project.name);
    setCode(project.code);
    setInvestor(project.investor);
    setContractor(project.contractor);
    setContractValueVND(project.contractValueVND);
    setStartDate(project.startDate);
    setFinishDate(project.finishDate);
    setTotalLengthM(project.totalLengthM);
    setTotalChambers(project.totalChambers);
    setStartPointName(project.startPointName);
    setEndPointName(project.endPointName);
    setCurrentWorkLocation(project.currentWorkLocation);

    const startPt = project.points.find((p) => p.type === 'start') || project.points[0];
    const endPt = project.points.find((p) => p.type === 'end') || project.points[project.points.length - 1];
    const turns = project.points.filter((p) => p.type === 'turn');

    if (startPt) {
      setStartLat(startPt.lat);
      setStartLng(startPt.lng);
    }
    if (endPt) {
      setEndLat(endPt.lat);
      setEndLng(endPt.lng);
    }
    setTurnPoints(
      turns.map((t) => ({
        id: t.id,
        name: t.name,
        lat: t.lat,
        lng: t.lng,
      }))
    );

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
              <FolderPlus className="w-4 h-4" />
              <span>THIẾT LẬP DỰ ÁN NGẦM HÓA</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Tạo & Quản Lý Dự Án Ngầm Hóa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý danh mục dự án, chủ đầu tư, nhà thầu thi công, giá trị hợp đồng, chiều dài, số hố ga và tọa độ điểm cua trên tuyến.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span>Đang quản lý:</span>
            <strong className="text-blue-600 text-sm">{projects.length} Dự án</strong>
          </div>
        </div>

        {savedNotice && (
          <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Tạo / Cập nhật Dự án (5 columns on desktop) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                {editingProjectId ? 'Cập Nhật Dự Án' : 'Tạo Dự Án Ngầm Mới'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Nhập đầy đủ thông tin để báo cáo hàng ngày cho các sếp.
              </p>
            </div>
            {editingProjectId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline font-semibold"
              >
                Hủy sửa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* 1. Tên dự án & Mã */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Tên Dự Án Ngầm <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="VD: Ngầm hóa tuyến Hoàng Lanh – Vũ Thắng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã Dự Án:</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                  required
                />
              </div>
            </div>

            {/* 2. Chủ đầu tư & Nhà thầu nhận thi công */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Chủ Đầu Tư <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="VD: FPT Telecom (FTEL INFMN)"
                  value={investor}
                  onChange={(e) => setInvestor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nhà Thầu Thi Công <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="VD: Công ty CP Xây lắp Minh Ngọc"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
            </div>

            {/* 3. Giá trị HĐ (VNĐ / Tỷ) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold">Giá Trị Hợp Đồng (VNĐ):</label>
                <span className="font-mono font-bold text-blue-600 text-xs">
                  ≈ {(contractValueVND / 1000000000).toFixed(2)} Tỷ VNĐ
                </span>
              </div>
              <input
                type="number"
                step="100000000"
                min="0"
                value={contractValueVND}
                onChange={(e) => setContractValueVND(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                required
              />
            </div>

            {/* 4. Ngày bắt đầu & Ngày hoàn tất */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ngày Bắt Đầu:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ngày Hoàn Tất:</label>
                <input
                  type="date"
                  value={finishDate}
                  onChange={(e) => setFinishDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>
            </div>

            {/* 5. Chiều dài toàn tuyến & Số lượng hố ga */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Chiều Dài Toàn Tuyến (m):
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalLengthM}
                  onChange={(e) => setTotalLengthM(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Bao Nhiêu Hố Ga (Hầm):
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalChambers}
                  onChange={(e) => setTotalChambers(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* 6. Vị trí đang làm việc hiện trường */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Vị Trí Đang Thi Công Đến Đâu:
              </label>
              <input
                type="text"
                placeholder="VD: Km 1+200 đến Km 1+850 (Đoạn qua ngã tư)"
                value={currentWorkLocation}
                onChange={(e) => setCurrentWorkLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                required
              />
            </div>

            {/* 7. TỌA ĐỘ 2 ĐIỂM ĐẦU - CUỐI & CÁC ĐIỂM CUA / UỐN CONG */}
            <div className="pt-2 border-t border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Tọa Độ Tuyến Ngầm (GIS):</span>
                  <span className="text-[10px] text-slate-500">
                    Điểm đầu, điểm kết thúc và các góc cua/uốn cong để biết tuyến ngầm đi đến đâu.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddTurnPoint}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm Điểm Cua</span>
                </button>
              </div>

              {/* Start Point */}
              <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between text-blue-900 font-bold text-[11px]">
                  <span>🏁 Điểm Bắt Đầu:</span>
                  <input
                    type="text"
                    value={startPointName}
                    onChange={(e) => setStartPointName(e.target.value)}
                    className="px-2 py-0.5 bg-white border border-blue-200 rounded text-xs font-semibold max-w-[170px]"
                    placeholder="Tên nút giao đầu"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Vĩ độ (Lat):</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={startLat}
                      onChange={(e) => setStartLat(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kinh độ (Lng):</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={startLng}
                      onChange={(e) => setStartLng(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Intermediate Turn Points (Điểm cua / uốn cong) */}
              {turnPoints.map((tp, idx) => (
                <div
                  key={tp.id}
                  className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-amber-950 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5 text-amber-600" />
                      Điểm Cua {idx + 1}:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tp.name}
                        onChange={(e) => handleUpdateTurnPoint(tp.id, 'name', e.target.value)}
                        className="px-2 py-0.5 bg-white border border-amber-200 rounded text-xs max-w-[150px]"
                        placeholder="Tên góc cua/ngã rẽ"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTurnPoint(tp.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Xóa điểm cua này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Vĩ độ (Lat):</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={tp.lat}
                        onChange={(e) => handleUpdateTurnPoint(tp.id, 'lat', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Kinh độ (Lng):</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={tp.lng}
                        onChange={(e) => handleUpdateTurnPoint(tp.id, 'lng', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* End Point */}
              <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1.5">
                <div className="flex items-center justify-between text-indigo-900 font-bold text-[11px]">
                  <span>🎯 Điểm Kết Thúc:</span>
                  <input
                    type="text"
                    value={endPointName}
                    onChange={(e) => setEndPointName(e.target.value)}
                    className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-xs font-semibold max-w-[170px]"
                    placeholder="Tên nút giao cuối"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Vĩ độ (Lat):</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={endLat}
                      onChange={(e) => setEndLat(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kinh độ (Lng):</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={endLng}
                      onChange={(e) => setEndLng(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              {isAdmin ? (
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProjectId ? 'Cập Nhật Dự Án' : 'Lưu & Khởi Tạo Dự Án Ngầm'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all border border-slate-700 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>🔐 Đăng Nhập ADMIN Để Tạo / Sửa Dự Án</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right List: Danh sách các dự án ngầm đã tạo (7 columns on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Danh Sách Dự Án Ngầm Hóa ({projects.length} Dự Án)
            </h3>
            <span className="text-xs text-slate-500">Bấm để chỉnh sửa hoặc xem vị trí trên bản đồ</span>
          </div>

          <div className="space-y-4">
            {projects.map((item) => {
              const progressPct =
                item.totalLengthM > 0
                  ? Math.round((item.completedLengthM / item.totalLengthM) * 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 transition-all shadow-xs"
                >
                  {/* Title & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{item.name}</span>
                        <span className="text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {item.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          <strong>Chủ đầu tư:</strong> {item.investor}
                        </span>
                        <span>
                          <strong>Nhà thầu:</strong> {item.contractor}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => onDeleteProject(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Xóa dự án"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block">Giá trị HĐ:</span>
                      <strong className="font-mono text-blue-700 text-sm">
                        {(item.contractValueVND / 1000000000).toFixed(2)} Tỷ
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block">Chiều dài tuyến:</span>
                      <strong className="font-mono text-slate-900 text-sm">
                        {item.totalLengthM.toLocaleString()} m
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block">Số lượng hố ga:</span>
                      <strong className="font-mono text-slate-900 text-sm">
                        {item.completedChambers}/{item.totalChambers} hầm
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block">Thời gian thi công:</span>
                      <span className="font-mono text-slate-700 text-[11px]">
                        {item.startDate.substring(5)} ➔ {item.finishDate.substring(5)}
                      </span>
                    </div>
                  </div>

                  {/* Route points journey (Tuyến ngầm đi đến đâu) */}
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>Lộ trình tuyến ngầm ({item.points.length} mốc tọa độ):</span>
                      <button
                        onClick={() => onSelectProjectOnMap(item.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Xem trên bản đồ</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {item.points.map((pt, idx) => (
                        <React.Fragment key={pt.id}>
                          <span
                            className={`px-2 py-0.5 rounded-md font-medium ${
                              pt.type === 'start'
                                ? 'bg-blue-100 text-blue-900 font-bold'
                                : pt.type === 'end'
                                ? 'bg-indigo-100 text-indigo-900 font-bold'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {pt.type === 'start' ? '🏁' : pt.type === 'end' ? '🎯' : '↪'}{' '}
                            {pt.name}
                          </span>
                          {idx < item.points.length - 1 && (
                            <span className="text-slate-400 font-bold">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="text-[11px] text-amber-900 pt-1">
                      <strong>Hiện trường đang làm:</strong> {item.currentWorkLocation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
