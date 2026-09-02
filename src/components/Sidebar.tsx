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
  MessageCircle,
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
        { id: 'comunicados', label: 'Comunicados Generales', icon: Megaphone, category: 'Comunicación' },
        { id: 'reportes', label: 'Reportes PDF / Excel', icon: FileSpreadsheet, category: 'Informes' },
        { id: 'documentacion', label: 'Entregables Técnicos & SQL', icon: Code2, category: 'Sistema' },
        { id: 'seguridad', label: 'Usuarios & Seguridad', icon: ShieldAlert, category: 'Sistema' },
      ];
    } else if (currentRole === 'docente') {
      return [
        { id: 'docente_aulas', label: 'Mis Aulas y Alumnos', icon: Building2, category: 'Docente' },
        { id: 'escaner', label: 'Escanear QR', icon: QrCode, category: 'Docente' },
        { id: 'comunicados', label: 'Comunicados por Aula', icon: Megaphone, category: 'Comunicación' },
        { id: 'mensajes', label: 'Chat con Familias', icon: MessageCircle, category: 'Comunicación' },
        { id: 'reportes', label: 'Reportes de Aula', icon: FileSpreadsheet, category: 'Docente' },
        { id: 'documentacion', label: 'Manual del Docente', icon: BookOpen, category: 'Soporte' },
      ];
    } else {
      // Padre de familia
      return [
        { id: 'padre_hijo', label: 'Asistencia de mi Hijo(a)', icon: UserCheck, category: 'Padre' },
        { id: 'comunicados', label: 'Comunicados para Mí', icon: Megaphone, category: 'Comunicación' },
        { id: 'mensajes', label: 'Chat con Docentes', icon: MessageCircle, category: 'Comunicación' },
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
          className="fixed inset-x-0 top-[68px] bottom-0 bg-slate-950/45 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`app-sidebar fixed md:relative top-[68px] md:top-0 bottom-0 left-0 z-40 bg-slate-900 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-64 translate-x-0 opacity-100'
            : 'w-0 -translate-x-full opacity-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="px-5 pt-6 pb-3 hidden md:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/60">Espacio de trabajo</p>
          <p className="text-sm font-bold text-white capitalize mt-1">Panel {currentRole}</p>
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
                  <p className="px-3 pt-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-100/65">
                    {item.category}
                  </p>
                )}
                <button
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-blue-700 font-bold shadow-lg shadow-blue-950/15'
                      : 'text-blue-50/75 hover:bg-white/10 hover:text-white'
                  }`}
                  id={`nav-item-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-blue-200/70'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer info inside sidebar */}
        <div className="m-3 p-3.5 rounded-2xl bg-white/8 text-[10px] text-blue-100/70">
          <div className="flex items-center justify-between">
            <span>José Sabogal Diéguez (Josdic)</span>
            <span className="text-emerald-400 font-semibold">v1.0 QR</span>
          </div>
        </div>
      </aside>
    </>
  );
};
