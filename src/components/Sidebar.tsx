import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  QrCode,
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  Megaphone,
  FileSpreadsheet,
  Code2,
  ShieldAlert,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentRole, activeTab, setActiveTab } = useApp();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  // Ítems de navegación según el rol
  const getNavItems = () => {
    if (currentRole === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard General', icon: LayoutDashboard, category: 'Principal' },
        { id: 'escaner', label: 'Escáner QR Asistencia', icon: QrCode, category: 'Principal' },
        { id: 'estudiantes', label: 'Gestión Estudiantes', icon: Users, category: 'Administración' },
        { id: 'docentes', label: 'Gestión Docentes', icon: GraduationCap, category: 'Administración' },
        { id: 'padres', label: 'Padres de Familia', icon: UserCheck, category: 'Administración' },
        { id: 'aulas', label: 'Aulas y Grados', icon: Building2, category: 'Administración' },
        { id: 'comunicados', label: 'Comunicados Escolares', icon: Megaphone, category: 'Comunicación' },
        { id: 'reportes', label: 'Reportes PDF / Excel', icon: FileSpreadsheet, category: 'Informes' },
        { id: 'documentacion', label: 'Entregables Técnicos & SQL', icon: Code2, category: 'Sistema' },
        { id: 'seguridad', label: 'Usuarios & Seguridad', icon: ShieldAlert, category: 'Sistema' },
      ];
    } else if (currentRole === 'docente') {
      return [
        { id: 'docente_aulas', label: 'Mis Aulas y Alumnos', icon: Building2, category: 'Docente' },
        { id: 'escaner', label: 'Escanear QR', icon: QrCode, category: 'Docente' },
        { id: 'comunicados', label: 'Publicar Comunicado', icon: Megaphone, category: 'Docente' },
        { id: 'reportes', label: 'Reportes de Aula', icon: FileSpreadsheet, category: 'Docente' },
        { id: 'documentacion', label: 'Manual del Docente', icon: BookOpen, category: 'Soporte' },
      ];
    } else {
      // Padre de familia
      return [
        { id: 'padre_hijo', label: 'Asistencia de mi Hijo(a)', icon: UserCheck, category: 'Padre' },
        { id: 'comunicados', label: 'Comunicados del Colegio', icon: Megaphone, category: 'Padre' },
        { id: 'reportes', label: 'Descargar Reporte PDF', icon: FileSpreadsheet, category: 'Padre' },
        { id: 'documentacion', label: 'Guía de Apoderado', icon: BookOpen, category: 'Soporte' },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-x-0 top-[57px] bottom-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:relative top-[57px] md:top-0 bottom-0 left-0 z-40 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-64 translate-x-0 opacity-100'
            : 'w-0 -translate-x-full opacity-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-4 border-b border-slate-800 hidden md:block">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Panel de Control</p>
          <p className="text-xs font-bold text-slate-200 capitalize">Rol: {currentRole}</p>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showCategoryHeader =
              index === 0 || navItems[index - 1].category !== item.category;

            return (
              <React.Fragment key={item.id}>
                {showCategoryHeader && (
                  <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.category}
                  </p>
                )}
                <button
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  id={`nav-item-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer info inside sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>José Sabogal Diéguez (Josdic)</span>
            <span className="text-emerald-400 font-semibold">v1.0 QR</span>
          </div>
        </div>
      </aside>
    </>
  );
};
