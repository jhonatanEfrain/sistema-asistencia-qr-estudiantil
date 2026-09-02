import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { QRScannerModal } from './components/scanner/QRScannerModal';
import { LoginView } from './components/LoginView';

// Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentManager } from './components/admin/StudentManager';
import { TeacherManager } from './components/admin/TeacherManager';
import { ParentManager } from './components/admin/ParentManager';
import { ClassroomManager } from './components/admin/ClassroomManager';
import { UserSecurityManager } from './components/admin/UserSecurityManager';

import { TeacherPortal } from './components/teacher/TeacherPortal';
import { ParentPortal } from './components/parent/ParentPortal';
import { ReportsView } from './components/reports/ReportsView';
import { SystemDocsView } from './components/docs/SystemDocsView';

const MainAppContent: React.FC = () => {
  const {
    isAuthenticated,
    activeTab,
    setActiveTab,
    isScannerModalOpen,
    setIsScannerModalOpen,
    currentRole,
    theme
  } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleCloseScanner = () => {
    setIsScannerModalOpen(false);
    if (activeTab === 'escaner') {
      const fallbackTab = currentRole === 'docente' ? 'docente_aulas' : currentRole === 'padre' ? 'padre_hijo' : 'dashboard';
      setActiveTab(fallbackTab);
    }
  };

  // Render view depending on activeTab
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'estudiantes':
        return <StudentManager />;
      case 'docentes':
        return <TeacherManager />;
      case 'padres':
        return <ParentManager />;
      case 'aulas':
        return <ClassroomManager />;
      case 'seguridad':
        return <UserSecurityManager />;

      case 'docente_aulas':
        return <TeacherPortal />;
      case 'padre_hijo':
        return <ParentPortal />;

      case 'reportes':
        return <ReportsView />;
      case 'documentacion':
        return <SystemDocsView />;

      case 'comunicados':
        return currentRole === 'padre' ? <ParentPortal /> : <TeacherPortal />;

      case 'escaner':
        return <AdminDashboard />;

      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className={`app-shell min-h-screen font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200 ${
      theme === 'light' ? 'theme-light text-slate-900' : 'theme-dark text-slate-100'
    }`}>
      <div className="app-frame min-h-screen md:min-h-[calc(100vh-3rem)] flex flex-col overflow-hidden">
        <Navbar
          isOpen={isSidebarOpen}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="flex-1 flex overflow-hidden min-h-0">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main className="app-content flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {renderActiveView()}
          </main>
        </div>
      </div>

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerModalOpen || activeTab === 'escaner'}
        onClose={handleCloseScanner}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
