import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DatabaseStatusModal } from './DatabaseStatusModal';
import {
  QrCode,
  Bell,
  UserCheck,
  Shield,
  GraduationCap,
  Users,
  Menu,
  X,
  Volume2,
  VolumeX,
  LogOut,
  ChevronDown,
  Database,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const {
    currentUser,
    currentRole,
    switchRole,
    notificaciones,
    setIsScannerModalOpen,
    soundEnabled,
    setSoundEnabled,
    config,
    markNotificationAsRead,
    logout,
    theme,
    toggleTheme
  } = useApp();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotificationsPopover, setShowNotificationsPopover] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  return (
    <header className="app-navbar sticky top-0 z-50 bg-white text-slate-900 border-b border-slate-200/80">
      <div className="px-4 py-3 sm:px-6 flex items-center justify-between min-h-[68px]">
        {/* Left: Mobile Drawer Button & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2.5 rounded-xl hover:bg-blue-50 text-slate-500 focus:outline-none transition-colors"
            title="Menú de navegación"
            id="btn-toggle-sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                {config.nombreInstitucion}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Sistema de Asistencia Estudiantil por QR
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* MySQL Database Status Button */}
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-blue-400 border border-slate-700/80 text-xs font-semibold transition-colors"
            title="Estado de conexión MySQL"
            id="btn-db-status"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">MySQL</span>
          </button>

          {/* Quick QR Scanner Trigger Button (Suspendido para Apoderados) */}
          {currentRole !== 'padre' && (
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all transform hover:scale-[1.02] active:scale-95"
              id="btn-open-scanner"
            >
              <QrCode className="w-4 h-4 animate-pulse" />
              <span className="hidden xs:inline">Escanear QR</span>
            </button>
          )}

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-colors text-slate-300 ${
              soundEnabled ? 'hover:bg-slate-800' : 'bg-slate-800/80 text-slate-500'
            }`}
            title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
            id="btn-toggle-sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-colors text-slate-300 hover:bg-slate-800 border border-slate-800"
            title={theme === 'dark' ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
            id="btn-toggle-theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsPopover(!showNotificationsPopover)}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 relative transition-colors"
              title="Notificaciones"
              id="btn-notifications-bell"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotificationsPopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-slate-100 text-xs">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">Notificaciones Recientes</span>
                  <span className="text-[11px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} nuevas
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notificaciones.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">Sin notificaciones por el momento</div>
                  ) : (
                    notificaciones.slice(0, 6).map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 hover:bg-slate-800/60 transition-colors cursor-pointer ${
                          !n.leida ? 'bg-blue-950/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
                          <span>{n.titulo}</span>
                          <span className="text-[10px] font-normal text-slate-400">{n.fechaHora.split(' ')[1]}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{n.mensaje}</p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                            Canal: {n.canal}
                          </span>
                          {!n.leida && <span className="text-blue-400 font-semibold">• Marcar como leída</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-slate-800"
              id="btn-role-switcher"
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-2 ring-blue-500/40"
              />
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{currentUser.name}</p>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-slate-400 capitalize">{currentRole}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Profile Info Dropdown Menu */}
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-3 px-4 z-50 text-slate-200 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/50"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium capitalize">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span>Rol: {currentRole === 'admin' ? 'Administrador' : currentRole === 'docente' ? 'Docente' : 'Apoderado'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs text-rose-400 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 transition-colors font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DatabaseStatusModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
    </header>
  );
};
