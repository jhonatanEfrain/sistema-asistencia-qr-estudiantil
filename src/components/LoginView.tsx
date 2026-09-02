import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GraduationCap,
  Lock,
  Mail,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';

const roles: Array<{
  id: Role;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
  { id: 'docente', label: 'Docente', icon: GraduationCap },
  { id: 'padre', label: 'Apoderado', icon: UserCheck },
];

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
      setEmailOrDni('docente.demo1@colegio.edu.pe');
      setPassword('DocenteDemo123');
    } else {
      setEmailOrDni('familia.demo1@colegio.edu.pe');
      setPassword('82000001');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await login(emailOrDni, password, selectedRole);
      if (!response.success) {
        setErrorMessage(response.error || 'Credenciales incorrectas');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const identityLabel =
    selectedRole === 'padre'
      ? 'Correo, DNI o nombre del estudiante'
      : 'Correo electrónico, DNI o usuario';

  const identityHint =
    selectedRole === 'padre'
      ? 'Puedes ingresar con tu correo, DNI o el nombre de tu hijo(a).'
      : selectedRole === 'docente'
        ? 'Utiliza tu correo institucional asignado.'
        : 'Utiliza las credenciales de administración.';

  return (
    <main className="login-shell min-h-screen flex items-center justify-center px-4 py-6 sm:px-8 sm:py-10">
      <div className="login-panel w-full overflow-hidden bg-white">
        <section className="login-welcome-panel relative overflow-hidden text-white">
          <div className="login-welcome-cut" aria-hidden="true" />
          <div className="login-orb login-orb-one" aria-hidden="true" />
          <div className="login-orb login-orb-two" aria-hidden="true" />
          <div className="login-dot-grid" aria-hidden="true" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-10 p-7 sm:p-10 lg:p-12">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-lg shadow-blue-950/20">
                <QrCode className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-black tracking-tight">JOSDIC</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
                  Asistencia QR
                </p>
              </div>
            </div>

            <div className="max-w-sm space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-50 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Bienvenido
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  Control escolar más simple y seguro
                </h1>
                <p className="max-w-xs text-sm leading-6 text-blue-100/90">
                  Registra, consulta y supervisa la asistencia estudiantil desde un solo lugar.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="login-feature">
                  <ScanLine className="h-5 w-5" />
                  <span>Registro rápido con QR</span>
                </div>
                <div className="login-feature">
                  <BarChart3 className="h-5 w-5" />
                  <span>Indicadores en tiempo real</span>
                </div>
              </div>
            </div>

            <p className="flex items-center gap-2 text-[11px] font-semibold text-blue-100/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Plataforma institucional protegida
            </p>
          </div>
        </section>

        <section className="login-form-panel flex items-center bg-white p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-600">
                  Acceso institucional
                </p>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  Iniciar sesión
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Selecciona tu perfil e ingresa tus credenciales.
                </p>
              </div>

              <div
                className={`login-db-status ${isDbConnected ? 'is-online' : 'is-local'}`}
                title={isDbConnected ? 'MySQL conectado' : 'Modo local'}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                <span>{isDbConnected ? 'En línea' : 'Local'}</span>
              </div>
            </div>

            <div className="mb-6 space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                Tipo de usuario
              </label>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5">
                {roles.map(({ id, label, icon: Icon }) => {
                  const isActive = selectedRole === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleRoleSelect(id)}
                      aria-pressed={isActive}
                      className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-extrabold transition-all sm:text-xs ${
                        isActive
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700"
                >
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="login-identity" className="text-xs font-bold text-slate-700">
                  {identityLabel}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-identity"
                    type="text"
                    required
                    autoComplete="username"
                    value={emailOrDni}
                    onChange={(event) => setEmailOrDni(event.target.value)}
                    placeholder={
                      selectedRole === 'padre'
                        ? 'Ej. correo, DNI o estudiante'
                        : 'Ej. usuario@colegio.edu.pe'
                    }
                    className="login-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                  />
                </div>
                <p className="text-[11px] leading-5 text-slate-400">{identityHint}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="text-xs font-bold text-slate-700">
                    Contraseña
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">Acceso protegido</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="login-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-submit mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-extrabold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'Verificando acceso...' : 'Ingresar al sistema'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-7 border-t border-slate-100 pt-5 text-center">
              <p className="text-[11px] leading-5 text-slate-400">
                I.E. José Sabogal Diéguez · Plataforma de asistencia estudiantil
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
