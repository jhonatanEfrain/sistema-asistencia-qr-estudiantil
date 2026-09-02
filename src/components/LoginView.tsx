import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, GraduationCap, UserCheck, Lock, Mail, ArrowRight, QrCode, Sparkles } from 'lucide-react';
import { Role } from '../types';

export const LoginView: React.FC = () => {
  const { login, isDbConnected } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [emailOrDni, setEmailOrDni] = useState('admin@colegio.edu.pe');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'admin') {
      setEmailOrDni('admin@colegio.edu.pe');
      setPassword('admin123');
    } else if (role === 'docente') {
      setEmailOrDni('c.flores@colegio.edu.pe');
      setPassword('docente123');
    } else {
      setEmailOrDni('jalvarez@gmail.com');
      setPassword('padre123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(emailOrDni, password, selectedRole);
      if (!res.success) {
        setErrorMessage(res.error || 'Credenciales incorrectas');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell min-h-screen text-slate-900 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-950/20 rounded-full blur-3xl pointer-events-none" />

      <div className="login-card w-full max-w-md bg-white border border-white/70 rounded-[2rem] shadow-2xl p-6 sm:p-8 z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/20 mb-2">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            José Sabogal Diéguez (Josdic)
          </h1>
          <p className="text-xs text-slate-400">
            Sistema Inteligente de Control de Asistencia Escolar QR
          </p>
        </div>

        {/* Database Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-400 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            Base de Datos:
          </span>
          <span className={`font-semibold ${isDbConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isDbConnected ? 'MySQL Conectado' : 'Modo Local / Fallback'}
          </span>
        </div>

        {/* Role Quick Selector Tabs */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Seleccionar Rol de Ingreso:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                selectedRole === 'admin'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('docente')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                selectedRole === 'docente'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-xs font-bold">Docente</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('padre')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                selectedRole === 'padre'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-xs font-bold">Apoderado</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              {selectedRole === 'padre'
                ? 'Correo de Apoderado, DNI o Nombre del Hijo(a)'
                : 'Correo Electrónico, DNI o Usuario'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={emailOrDni}
                onChange={e => setEmailOrDni(e.target.value)}
                placeholder={
                  selectedRole === 'padre'
                    ? 'ej: jalvarez@gmail.com, Mateo, o DNI 72819301'
                    : 'ej: admin@colegio.edu.pe o 40998877'
                }
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {selectedRole === 'padre'
                ? '💡 Apoderados: Pueden ingresar con su correo, DNI, o escribiendo el nombre de su hijo(a) (ej: "Mateo Alvarez" o "72819301").'
                : selectedRole === 'docente'
                ? '💡 Docentes: Ingrese con su correo institucional (ej: "c.flores@colegio.edu.pe").'
                : '💡 Administrador: Ingrese con su correo (ej: "admin@colegio.edu.pe").'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Verificando...</span>
            ) : (
              <>
                <span>Ingresar como {selectedRole.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Helper */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Portal Institucional de Control de Asistencia para Directivos, Docentes y Apoderados.
          </p>
        </div>
      </div>
    </div>
  );
};
