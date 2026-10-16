/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar, MainNavTab } from './components/Sidebar';
import { WeatherWarningBanner } from './components/WeatherWarningBanner';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ProjectDailyReport } from './components/ProjectDailyReport';
import { GisMap } from './components/GisMap';
import { BulletinsBoard } from './components/BulletinsBoard';
import { ProjectManagement } from './components/ProjectManagement';
import { SupervisorFormModal } from './components/SupervisorFormModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import {
  INITIAL_PROJECTS,
  INITIAL_DAILY_LOGS,
  INITIAL_BULLETINS,
} from './data/initialData';
import { UndergroundProject, DailyLogEntry, CableChamber, SiteBulletin } from './types/undergrounding';

export default function App() {
  // Ngày hiện tại được cấu hình đúng ngày 16 (16/10/2026) theo yêu cầu
  const TODAY_STR = '2026-10-16';

  const [currentTab, setCurrentTab] = useState<MainNavTab>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR); // Mặc định báo cáo là báo cáo cho ngày hiện tại (ngày 16)
  const [isAdmin, setIsAdmin] = useState<boolean>(true); // Khởi tạo quyền Admin (có thể đăng xuất hoặc đăng nhập lại dễ dàng)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Core Data States
  const [projects, setProjects] = useState<UndergroundProject[]>(INITIAL_PROJECTS);
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>(INITIAL_DAILY_LOGS);
  const [bulletins, setBulletins] = useState<SiteBulletin[]>(INITIAL_BULLETINS);

  // Calculate today unsubmitted project count
  const todayLogs = dailyLogs.filter((l) => l.date === TODAY_STR);
  const reportedProjectIdsToday = new Set(todayLogs.map((l) => l.projectId));
  const unsubmittedTodayCount = projects.filter((p) => !reportedProjectIdsToday.has(p.id)).length;
  const activeBulletinsCount = bulletins.filter((b) => b.isActive).length;

  // Supervisor / Admin Field Form Modal
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLogEntry | null>(null);

  // Daily Log Handlers
  const handleSaveLog = (entryData: Omit<DailyLogEntry, 'id'>) => {
    if (editingLog) {
      setDailyLogs((prev) =>
        prev.map((item) => (item.id === editingLog.id ? { ...entryData, id: editingLog.id } : item))
      );
      setEditingLog(null);
    } else {
      const newEntry: DailyLogEntry = {
        ...entryData,
        id: `log-${Date.now()}`,
        stt: dailyLogs.filter((l) => l.date === entryData.date).length + 1,
      };
      setDailyLogs((prev) => [newEntry, ...prev]);

      // Update project completed metrics
      setProjects((prev) =>
        prev.map((p) =>
          p.id === entryData.projectId
            ? {
                ...p,
                completedLengthM: entryData.cumulativeTrenchM,
                completedChambers: entryData.cumulativeChambers,
              }
            : p
        )
      );
    }
  };

  const handleDeleteLog = (id: string) => {
    setDailyLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleEditLog = (log: DailyLogEntry) => {
    setEditingLog(log);
    setIsSupervisorModalOpen(true);
  };

  const handleOpenSupervisorForm = (prefillDate?: string, prefillProjectId?: string) => {
    if (prefillDate) setSelectedDate(prefillDate);
    if (prefillProjectId && prefillProjectId !== 'all') setSelectedProjectId(prefillProjectId);
    setEditingLog(null);
    setIsSupervisorModalOpen(true);
  };

  // Bulletin Handlers
  const handleAddBulletin = (newB: SiteBulletin) => {
    setBulletins((prev) => [newB, ...prev]);
  };

  const handleUpdateBulletin = (updB: SiteBulletin) => {
    setBulletins((prev) => prev.map((b) => (b.id === updB.id ? updB : b)));
  };

  const handleDeleteBulletin = (id: string) => {
    setBulletins((prev) => prev.filter((b) => b.id !== id));
  };

  // GIS Handlers
  const handleAddChamber = (projectId: string, chamber: CableChamber) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              chambers: [...p.chambers, chamber],
              completedChambers: p.completedChambers + 1,
            }
          : p
      )
    );
  };

  // Project Handlers
  const handleAddProject = (newProject: UndergroundProject) => {
    setProjects((prev) => [...prev, newProject]);
  };

  const handleUpdateProject = (updatedProject: UndergroundProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProjectId === projectId) {
      setSelectedProjectId('all');
    }
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans flex flex-col lg:flex-row antialiased">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeProjectName={activeProject?.name}
        totalProjects={projects.length}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onOpenQuickEntry={() => handleOpenSupervisorForm(TODAY_STR)}
        unsubmittedTodayCount={unsubmittedTodayCount}
        bulletinsCount={activeBulletinsCount}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Weather alert banner (collapsible) */}
        <WeatherWarningBanner currentReportDate={selectedDate} />

        {/* Viewport Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {/* TAB 1: BÁO CÁO TỔNG QUAN (Biểu đồ tiến độ đa dự án, 1-Click Zalo, Phiếu báo cáo tinh gọn) */}
          {currentTab === 'overview' && (
            <OverviewDashboard
              projects={projects}
              dailyLogs={dailyLogs}
              bulletins={bulletins}
              currentDate={selectedDate}
              onGoToDailyReport={(projectId) => {
                if (projectId) setSelectedProjectId(projectId);
                setCurrentTab('daily-report');
              }}
              onGoToWeeklyReport={() => {
                setCurrentTab('daily-report');
              }}
              onGoToBulletins={(projectId) => {
                if (projectId) setSelectedProjectId(projectId);
                setCurrentTab('bulletins');
              }}
            />
          )}

          {/* TAB 2: BÁO CÁO NGÀY & TUẦN (Danh sách các tuần tra cứu lịch sử, Lịch tháng 10, nổi bật ngày 16, bảng Excel) */}
          {currentTab === 'daily-report' && (
            <ProjectDailyReport
              projects={projects}
              dailyLogs={dailyLogs}
              bulletins={bulletins}
              selectedProjectId={selectedProjectId}
              onSelectProjectId={setSelectedProjectId}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              isAdmin={isAdmin}
              onOpenSupervisorForm={handleOpenSupervisorForm}
              onEditLog={handleEditLog}
              onDeleteLog={handleDeleteLog}
              onGoToBulletins={(projectId) => {
                if (projectId) setSelectedProjectId(projectId);
                setCurrentTab('bulletins');
              }}
              onOpenLogin={() => setIsLoginModalOpen(true)}
            />
          )}

          {/* TAB 3: BẢN ĐỒ TUYẾN & ĐIỂM CUA UỐN (Leaflet Map, mốc bắt đầu, góc cua, kết thúc) */}
          {currentTab === 'gis-map' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Bản Đồ Tuyến & Các Điểm Cua Uốn Tuyến Ngầm
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hiển thị mốc bắt đầu 🏁, các góc cua uốn theo lòng đường ↪ và điểm kết thúc 🎯 để biết tuyến ngầm đi đến đâu.
                  </p>
                </div>
              </div>

              <GisMap
                projects={projects}
                selectedProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
                onSelectProject={(id) => setSelectedProjectId(id)}
                onAddChamber={handleAddChamber}
              />
            </div>
          )}

          {/* TAB 4: THÔNG BÁO & CẢNH BÁO HỒ SƠ PHÁP LÝ (Tin tức mưa bão, tạm dừng thi công, giấy phép Sở GTVT) */}
          {currentTab === 'bulletins' && (
            <BulletinsBoard
              bulletins={bulletins}
              projects={projects}
              onAddBulletin={handleAddBulletin}
              onUpdateBulletin={handleUpdateBulletin}
              onDeleteBulletin={handleDeleteBulletin}
              onSelectProjectDetail={(projectId) => {
                setSelectedProjectId(projectId);
                setCurrentTab('daily-report');
              }}
              isAdmin={isAdmin}
              filterInitialProjectId={selectedProjectId}
              onOpenLogin={() => setIsLoginModalOpen(true)}
            />
          )}

          {/* TAB 5: TẠO & QUẢN LÝ DỰ ÁN NGẦM HÓA (Đã bỏ gói thầu & liên danh nhà thầu, phân quyền Admin) */}
          {currentTab === 'project-management' && (
            <ProjectManagement
              projects={projects}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onSelectProjectOnMap={(projectId) => {
                setSelectedProjectId(projectId);
                setCurrentTab('gis-map');
              }}
              isAdmin={isAdmin}
              onOpenLogin={() => setIsLoginModalOpen(true)}
            />
          )}
        </main>

        {/* Supervisor / Admin Daily Entry Modal with Violation Report */}
        <SupervisorFormModal
          isOpen={isSupervisorModalOpen}
          onClose={() => {
            setIsSupervisorModalOpen(false);
            setEditingLog(null);
          }}
          onSave={handleSaveLog}
          projects={projects}
          editingLog={editingLog}
          defaultDate={selectedDate}
          defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
        />

        {/* Admin Login Modal */}
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(role) => setIsAdmin(true)}
          isAdmin={isAdmin}
          onLogout={() => setIsAdmin(false)}
        />
      </div>
    </div>
  );
}
