import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Map,
  FolderPlus,
  ShieldCheck,
  HardHat,
  Menu,
  X,
  ChevronRight,
  PlusCircle,
  Bell,
  AlertTriangle,
  Lock,
} from 'lucide-react';
export type MainNavTab = 'overview' | 'daily-report' | 'gis-map' | 'bulletins' | 'project-management';

interface SidebarProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  activeProjectName?: string;
  totalProjects: number;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenQuickEntry: () => void;
  unsubmittedTodayCount?: number;
  bulletinsCount?: number;
  onOpenLogin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeProjectName,
  totalProjects,
  isAdmin,
  onToggleAdmin,
  isMobileOpen,
  setIsMobileOpen,
  onOpenQuickEntry,
  unsubmittedTodayCount = 0,
  bulletinsCount = 0,
  onOpenLogin,
}) => {
  const navItems = [
    {
      id: 'overview' as MainNavTab,
      label: 'Báo Cáo Tổng Quan',
      sublabel: 'Biểu đồ tiến độ đa dự án & Zalo',
      icon: LayoutDashboard,
      badge: 'Biểu đồ',
    },
    {
      id: 'daily-report' as MainNavTab,
      label: 'Báo Cáo Ngày & Tuần',
      sublabel: 'Lịch trình tuần này, tuần trước & Excel',
      icon: CalendarDays,
      badge: unsubmittedTodayCount > 0 ? `${unsubmittedTodayCount} chưa nộp` : 'Đã chốt',
      badgeAlert: unsubmittedTodayCount > 0,
    },
    {
      id: 'gis-map' as MainNavTab,
      label: 'Bản Đồ Tuyến & Điểm Cua',
      sublabel: 'Mốc đầu, điểm cua uốn & hầm ga',
      icon: Map,
      badge: 'Tọa độ GIS',
    },
    {
      id: 'bulletins' as MainNavTab,
      label: 'Thông Báo & Hồ Sơ Pháp Lý',
      sublabel: 'Thời tiết, tạm dừng thi công, GTVT',
      icon: Bell,
      badge: bulletinsCount > 0 ? `${bulletinsCount} tin` : undefined,
      badgeAmber: true,
    },
    {
      id: 'project-management' as MainNavTab,
      label: 'Tạo Tuyến & Quản Lý Dự Án',
      sublabel: 'Tên DA, CĐT, Nhà thầu, HĐ & Tọa độ',
      icon: FolderPlus,
      badge: 'Cấu hình',
    },
  ];

  const handleNavClick = (tab: MainNavTab) => {
    onSelectTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
            aria-label="Toggle Navigation"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight tracking-tight">INFRA·CABLE</span>
            <span className="text-[10px] text-slate-400 truncate max-w-[170px]">
              {activeProjectName || `${totalProjects} Dự án ngầm`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Role Toggle on Mobile */}
          <button
            onClick={onOpenLogin}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isAdmin ? 'ADMIN' : 'Đăng nhập'}</span>
          </button>

          {isAdmin && (
            <button
              onClick={onOpenQuickEntry}
              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              title="Nhập nhật ký nhanh"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm tracking-widest shadow-md">
                  INF
                </div>
                <div>
                  <h1 className="font-bold text-white text-base leading-none tracking-tight">
                    Hạ Tầng Ngầm Hóa
                  </h1>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Báo Cáo Tiến Độ Hằng Ngày</p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Project Card */}
            <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Đang theo dõi:
              </div>
              <div className="font-bold text-white truncate text-xs mt-0.5" title={activeProjectName}>
                {activeProjectName || 'Tất cả các dự án'}
              </div>
              <div className="text-[11px] text-blue-400 font-mono mt-0.5">
                Tổng cộng {totalProjects} dự án ngầm
              </div>
            </div>
          </div>

          {/* Navigation Links (Ordered strictly as requested) */}
          <nav className="p-3 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Menu Điều Hướng Chính
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/40'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        isActive ? 'bg-white/15 text-white' : 'bg-slate-900 text-slate-400 group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold leading-tight">{item.label}</div>
                      <div
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {item.sublabel}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.badgeAlert
                            ? 'bg-red-500 text-white animate-pulse'
                            : item.badgeAmber
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-white' : 'text-slate-600 opacity-60'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Role Switcher & Action */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 space-y-3">
          {/* Role Status Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Quyền tài khoản:
              </span>
              <button
                onClick={onOpenLogin}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline"
              >
                {isAdmin ? 'Đổi tài khoản' : 'Đăng nhập'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isAdmin ? 'bg-amber-400 ring-2 ring-amber-400/20' : 'bg-slate-400'
                }`}
              />
              <span className="font-bold text-white text-xs">
                {isAdmin ? '👑 Quản Trị Viên (ADMIN)' : '👤 Khách / Nhà Thầu (Chỉ xem)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {isAdmin
                ? 'Được quyền cập nhật nhật ký, lập biên bản, đăng thông báo & tạo dự án.'
                : 'Chỉ tra cứu tiến độ, bản đồ & thông báo. Cần quyền ADMIN để ghi dữ liệu.'}
            </p>
          </div>

          {/* Supervisor / Admin Quick Action */}
          {isAdmin ? (
            <button
              onClick={() => {
                setIsMobileOpen(false);
                onOpenQuickEntry();
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Cập Nhật Nhật Ký Ngày</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsMobileOpen(false);
                onOpenLogin();
              }}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>🔐 Đăng Nhập Admin Cập Nhật</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Sticky Bottom Navigation (Touch-friendly 4-tab thumb bar) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around text-[10px] shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-h-[46px] ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="whitespace-nowrap text-[9px]">{item.label.split(' ')[0]} {item.label.split(' ')[1]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
