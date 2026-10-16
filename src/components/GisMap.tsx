import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { UndergroundProject, CableChamber, RouteCoordinatePoint } from '../types/undergrounding';
import { Layers, MapPin, Plus, Navigation, CornerDownRight, CheckCircle2, Building, Banknote } from 'lucide-react';

interface GisMapProps {
  projects: UndergroundProject[];
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onAddChamber?: (projectId: string, chamber: CableChamber) => void;
}

export const GisMap: React.FC<GisMapProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddChamber,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeProjectId, setActiveProjectId] = useState<string>(
    selectedProjectId || projects[0]?.id || ''
  );
  const [selectedPoint, setSelectedPoint] = useState<RouteCoordinatePoint | null>(null);
  const [selectedChamber, setSelectedChamber] = useState<CableChamber | null>(null);
  const [isAddingChamberMode, setIsAddingChamberMode] = useState<boolean>(false);

  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    if (selectedProjectId) {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = currentProject?.points[0]
        ? [currentProject.points[0].lat, currentProject.points[0].lng]
        : [16.0528, 108.2384];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Voyager tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (isAddingChamberMode && onAddChamber && currentProject) {
          const newChamber: CableChamber = {
            id: `cb-${Date.now()}`,
            code: `BC-${currentProject.code}-${Math.floor(10 + Math.random() * 90)}`,
            type: 'Bể cáp kéo tiêu chuẩn (B1)',
            dimensions: '1.8m x 1.2m x 1.4m',
            position: [Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))],
            locationDescription: `Tọa độ: [${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}] - ${currentProject.name}`,
            status: 'pouring',
            depthMeters: 1.4,
            manholeCoverType: 'Gang cầu tải trọng 25T',
          };
          onAddChamber(currentProject.id, newChamber);
          setSelectedChamber(newChamber);
          setIsAddingChamberMode(false);
        }
      });
    }
  }, []);

  // Sync cursor mode
  useEffect(() => {
    if (!mapContainerRef.current) return;
    mapContainerRef.current.style.cursor = isAddingChamberMode ? 'crosshair' : '';
  }, [isAddingChamberMode]);

  // Render Routes, Turn points, and Chambers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();

    // Fly to current project
    if (currentProject && currentProject.points.length > 0) {
      const firstPt = currentProject.points[0];
      map.flyTo([firstPt.lat, firstPt.lng], 15, { duration: 1 });
    }

    // Render all projects
    projects.forEach((proj) => {
      const isCurrent = proj.id === activeProjectId;
      const polylineCoords = proj.points.map((pt) => [pt.lat, pt.lng] as [number, number]);

      // Route Polyline
      const line = L.polyline(polylineCoords, {
        color: isCurrent ? '#2563eb' : '#94a3b8',
        weight: isCurrent ? 6 : 4,
        opacity: isCurrent ? 0.95 : 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      });

      line.on('click', () => {
        setActiveProjectId(proj.id);
        if (onSelectProject) onSelectProject(proj.id);
      });

      line.bindTooltip(
        `<strong>${proj.name}</strong><br/>Nhà thầu: ${proj.contractor}<br/>Chiều dài: ${proj.totalLengthM.toLocaleString()}m`,
        { sticky: true }
      );

      layersGroup.addLayer(line);

      // Render Points (Start, Turns, End)
      proj.points.forEach((pt, idx) => {
        const isStart = pt.type === 'start';
        const isEnd = pt.type === 'end';
        const isTurn = pt.type === 'turn';

        const pointIcon = L.divIcon({
          className: 'custom-point-icon',
          html: `
            <div style="
              width: ${isTurn ? 24 : 28}px;
              height: ${isTurn ? 24 : 28}px;
              background-color: ${isStart ? '#2563eb' : isEnd ? '#4f46e5' : '#f59e0b'};
              border: 2px solid #ffffff;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 11px;
              font-weight: bold;
              border-radius: ${isTurn ? '4px' : '50%'};
              cursor: pointer;
            ">
              ${isStart ? '🏁' : isEnd ? '🎯' : '↪'}
            </div>
          `,
          iconSize: [isTurn ? 24 : 28, isTurn ? 24 : 28],
          iconAnchor: [isTurn ? 12 : 14, isTurn ? 12 : 14],
        });

        const marker = L.marker([pt.lat, pt.lng], { icon: pointIcon });

        marker.on('click', () => {
          setSelectedPoint(pt);
          setSelectedChamber(null);
          setActiveProjectId(proj.id);
        });

        marker.bindTooltip(
          `<strong>${pt.name}</strong><br/>${
            isTurn ? `Góc cua ${idx}: Tuyến ngầm uốn theo lòng đường` : isStart ? 'Mốc bắt đầu tuyến ngầm' : 'Mốc kết thúc tuyến ngầm'
          }<br/>[${pt.lat}, ${pt.lng}]`,
          { sticky: true }
        );

        layersGroup.addLayer(marker);
      });

      // Render Chambers
      proj.chambers.forEach((cb) => {
        const isSelected = selectedChamber?.id === cb.id;

        const chamberIcon = L.divIcon({
          className: 'custom-chamber-icon',
          html: `
            <div style="
              width: ${isSelected ? 24 : 18}px;
              height: ${isSelected ? 24 : 18}px;
              background-color: ${cb.status === 'completed' ? '#16a34a' : '#f59e0b'};
              border: 2px solid #ffffff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 9px;
              font-weight: bold;
              border-radius: 3px;
              cursor: pointer;
            ">
              ☵
            </div>
          `,
          iconSize: [isSelected ? 24 : 18, isSelected ? 24 : 18],
          iconAnchor: [isSelected ? 12 : 9, isSelected ? 12 : 9],
        });

        const marker = L.marker(cb.position, { icon: chamberIcon });

        marker.on('click', () => {
          setSelectedChamber(cb);
          setSelectedPoint(null);
          setActiveProjectId(proj.id);
        });

        marker.bindTooltip(
          `<strong>Hố ga: ${cb.code}</strong> (${cb.type})<br/>${cb.locationDescription}<br/>Kích thước: ${cb.dimensions}`,
          { sticky: true }
        );

        layersGroup.addLayer(marker);
      });
    });
  }, [projects, activeProjectId, selectedChamber]);

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label className="font-bold text-slate-700 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-blue-600" />
            Chọn Tuyến Xem Tọa Độ:
          </label>
          <select
            value={activeProjectId}
            onChange={(e) => {
              setActiveProjectId(e.target.value);
              setSelectedPoint(null);
              setSelectedChamber(null);
              if (onSelectProject) onSelectProject(e.target.value);
            }}
            className="px-3.5 py-1.5 font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-600"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.totalLengthM.toLocaleString()}m - {p.points.length} mốc tọa độ)
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsAddingChamberMode(!isAddingChamberMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
            isAddingChamberMode
              ? 'bg-amber-600 text-white animate-pulse'
              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingChamberMode ? 'Nhấp chọn vị trí hố ga trên map...' : 'Thêm Hố Ga Lên Bản Đồ'}</span>
        </button>
      </div>

      {/* Main Map & Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Viewport */}
        <div className="lg:col-span-3 relative bg-slate-100 rounded-2xl border border-slate-300 overflow-hidden shadow-xs h-[560px]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Interactive Legend Overlay */}
          <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-md border border-slate-200 text-[11px] max-w-[260px] pointer-events-auto">
            <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span>Chú Giải Tuyến Ngầm</span>
              <Layers className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  🏁
                </span>
                <span className="text-slate-700">Điểm bắt đầu tuyến</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px]">
                  ↪
                </span>
                <span className="text-slate-800 font-semibold">Điểm cua / uốn góc ngã rẽ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  🎯
                </span>
                <span className="text-slate-700">Điểm kết thúc tuyến</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <span className="w-4 h-4 rounded-xs bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">
                  ☵
                </span>
                <span className="text-slate-700">Hố ga / Bể cáp kỹ thuật</span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-400">
              * Nhấp vào đường hoặc điểm cua để xem vị trí chi tiết.
            </div>
          </div>
        </div>

        {/* Sidebar Inspector Panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between text-xs space-y-4 shadow-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-3">
              Thông Số Tuyến & Mốc Cua
            </h3>

            {/* Current Project Summary Card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-3 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm">{currentProject.name}</div>
              <div className="text-[11px] text-slate-600">
                <strong>Chủ đầu tư:</strong> {currentProject.investor}
              </div>
              <div className="text-[11px] text-slate-600">
                <strong>Nhà thầu:</strong> {currentProject.contractor}
              </div>
              <div className="text-[11px] text-blue-700 font-mono font-bold">
                Giá trị HĐ: {(currentProject.contractValueVND / 1000000000).toFixed(2)} Tỷ VNĐ
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Chiều dài:</span>
                  <span className="font-bold text-slate-900">{currentProject.totalLengthM.toLocaleString()} m</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Hố ga mục tiêu:</span>
                  <span className="font-bold text-slate-900">{currentProject.totalChambers} hầm</span>
                </div>
              </div>
            </div>

            {/* Selected Turn Point Detail */}
            {selectedPoint ? (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1.5">
                <div className="font-bold text-amber-950 flex items-center justify-between">
                  <span>{selectedPoint.name}</span>
                  <span className="text-[10px] font-mono text-amber-700 font-bold uppercase">
                    {selectedPoint.type}
                  </span>
                </div>
                <div className="text-slate-700 space-y-0.5">
                  <div>
                    <span className="text-slate-500">Tọa độ GPS:</span>{' '}
                    <span className="font-mono font-bold">
                      [{selectedPoint.lat}, {selectedPoint.lng}]
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Ý nghĩa:</span>{' '}
                    <span>
                      {selectedPoint.type === 'turn'
                        ? 'Điểm bẻ góc ngầm theo hướng quy hoạch tuyến đường.'
                        : selectedPoint.type === 'start'
                        ? 'Mốc xuất phát phui đào.'
                        : 'Mốc hoàn thiện tuyến.'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="w-full py-1 text-center text-slate-500 hover:text-slate-800 text-[11px] underline"
                >
                  Bỏ chọn điểm
                </button>
              </div>
            ) : selectedChamber ? (
              /* Selected Chamber Detail */
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>Hố ga: {selectedChamber.code}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    {selectedChamber.status === 'completed' ? 'Đã xong' : 'Đang đổ bê tông'}
                  </span>
                </div>
                <div className="text-slate-700 space-y-0.5">
                  <div>
                    <span className="text-slate-500">Loại:</span> {selectedChamber.type}
                  </div>
                  <div>
                    <span className="text-slate-500">Kích thước:</span>{' '}
                    <span className="font-mono">{selectedChamber.dimensions}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Nắp đan:</span> {selectedChamber.manholeCoverType}
                  </div>
                  <div>
                    <span className="text-slate-500">Vị trí:</span> {selectedChamber.locationDescription}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChamber(null)}
                  className="w-full py-1 text-center text-slate-500 hover:text-slate-800 text-[11px] underline"
                >
                  Bỏ chọn hố ga
                </button>
              </div>
            ) : (
              /* List of turn points for this route */
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block text-[11px]">
                  Danh sách góc cua / uốn tuyến ({currentProject.points.length} điểm):
                </span>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {currentProject.points.map((pt, idx) => (
                    <div
                      key={pt.id}
                      onClick={() => setSelectedPoint(pt)}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200 flex items-center justify-between transition-colors"
                    >
                      <div className="truncate">
                        <span className="font-medium text-slate-800 truncate block">{pt.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {pt.lat}, {pt.lng}
                        </span>
                      </div>
                      <span className="text-xs shrink-0">
                        {pt.type === 'start' ? '🏁' : pt.type === 'end' ? '🎯' : '↪'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] text-blue-900">
            <strong>Báo cáo cho sếp:</strong> Nhìn vào bản đồ sẽ thấy rõ tuyến cáp ngầm đi từ đâu, uốn qua các điểm cua góc đường nào và tới đâu!
          </div>
        </div>
      </div>
    </div>
  );
};
