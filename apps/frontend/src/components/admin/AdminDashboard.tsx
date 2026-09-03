import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  QrCode,
  Calendar,
  Building2,
  ArrowUpRight,
  Zap,
  Check,
  AlertTriangle,
  X,
  Sparkles,
  Search,
  FileSpreadsheet,
  GraduationCap
} from 'lucide-react';
import attendanceHero from '../../assets/attendance-hero.png';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const {
    estudiantes,
    asistencias,
    aulas,
    setIsScannerModalOpen,
    setActiveTab,
    registerAttendanceViaQR,
    latestScanAlert,
    clearLatestScanAlert,
    config
  } = useApp();

  const [quickQrInput, setQuickQrInput] = useState('');
  const [quickScanResult, setQuickScanResult] = useState<{ success: boolean; message: string } | null>(null);

  const getLocalDateStr = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr();
  const todayAsistencias = asistencias.filter(a => {
    if (!a.fecha) return false;
    const cleanFecha = typeof a.fecha === 'string' ? a.fecha.split('T')[0] : '';
    return cleanFecha === todayStr;
  });

  // Sort today's attendance strictly by time descending
  const sortedTodayAsistencias = [...todayAsistencias].sort((a, b) => b.hora.localeCompare(a.hora));

  const totalEstudiantes = estudiantes.length;
  const presentesHoy = todayAsistencias.filter(a => a.estado === 'Presente').length;
  const tardanzasHoy = todayAsistencias.filter(a => a.estado === 'Tardanza').length;
  const totalAsistieron = presentesHoy + tardanzasHoy;
  const inasistenciasHoy = Math.max(0, totalEstudiantes - totalAsistieron);

  const porcentajeAsistencia = totalEstudiantes > 0 ? Math.round((totalAsistieron / totalEstudiantes) * 100) : 0;

  // Quick Scan Handler directly from Dashboard
  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQrInput.trim()) return;

    const res = registerAttendanceViaQR(quickQrInput.trim());
    setQuickScanResult(res);
    setQuickQrInput('');

    setTimeout(() => {
      setQuickScanResult(null);
    }, 6000);
  };

  // Quick simulator trigger button
  const handleQuickSimulate = (code: string) => {
    const res = registerAttendanceViaQR(code);
    setQuickScanResult(res);
    setTimeout(() => {
      setQuickScanResult(null);
    }, 6000);
  };

  // Datos para gráfica de nivel
  const primariaCount = estudiantes.filter(e => e.nivel === 'Primaria').length;
  const secundariaCount = estudiantes.filter(e => e.nivel === 'Secundaria').length;

  const dataNivel = [
    { name: 'Primaria (1.°-6.°)', value: primariaCount, color: '#b91c2e' },
    { name: 'Secundaria (1.°-5.°)', value: secundariaCount, color: '#10b981' }
  ];

  // Datos de asistencia de últimos días
  const last7DaysData = [
    { dia: 'Lun', presentes: 6, tardanzas: 2 },
    { dia: 'Mar', presentes: 7, tardanzas: 1 },
    { dia: 'Mié', presentes: 5, tardanzas: 2 },
    { dia: 'Jue', presentes: 8, tardanzas: 0 },
    { dia: 'Vie (Hoy)', presentes: presentesHoy || 5, tardanzas: tardanzasHoy || 2 }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Live Real-time Scan Notification Alert */}
      {(latestScanAlert || quickScanResult) && (
        <div
          className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between gap-4 animate-bounce-short ${
            (latestScanAlert?.success || quickScanResult?.success)
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-500/20'
              : 'bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              (latestScanAlert?.success || quickScanResult?.success) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {(latestScanAlert?.success || quickScanResult?.success) ? <Check className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">
                  {(latestScanAlert?.success || quickScanResult?.success) ? '⚡ ¡ASISTENCIA REGISTRADA EN TIEMPO REAL!' : '⚠️ REGISTRO RECHAZADO / DUPLICADO'}
                </span>
                <span className="text-[10px] font-mono opacity-70">
                  {latestScanAlert?.timestamp || new Date().toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90">
                {latestScanAlert?.message || quickScanResult?.message}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              clearLatestScanAlert();
              setQuickScanResult(null);
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="dashboard-hero min-h-[280px] border rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <img
          src={attendanceHero}
          alt="Estudiantes registrando su asistencia con código QR"
          className="dashboard-hero-image"
        />
        <div className="dashboard-hero-overlay" />
        <div className="space-y-1 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/15 text-white border border-white/20 backdrop-blur-sm">
              ● Sistema en Vivo
            </span>
            <span className="text-xs text-red-100/85 capitalize">
              Hoy: {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-3">
            Panel de Control Institucional
          </h2>
          <p className="text-xs sm:text-sm text-red-100/90 max-w-lg leading-relaxed">
            Monitoreo en tiempo real de asistencia por código QR para Primaria y Secundaria
          </p>
          <div className="flex flex-wrap gap-3 pt-5">
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white hover:bg-red-50 text-red-700 font-extrabold text-sm shadow-xl shadow-red-950/15 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <QrCode className="w-5 h-5" />
              <span>Abrir escáner QR</span>
            </button>
            <button
              onClick={() => setActiveTab('estudiantes')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-950/20 hover:bg-red-950/30 text-white border border-white/20 font-bold text-sm backdrop-blur-md transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Gestionar estudiantes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main shortcuts inspired by the visual reference */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[
          { id: 'estudiantes', label: 'Estudiantes', detail: 'Matrícula y carnés QR', icon: Users, color: 'from-red-600 to-rose-500' },
          { id: 'docentes', label: 'Docentes', detail: 'Personal y asignaciones', icon: GraduationCap, color: 'from-violet-600 to-purple-500' },
          { id: 'aulas', label: 'Aulas', detail: 'Grados y secciones', icon: Building2, color: 'from-red-600 to-red-500' },
          { id: 'reportes', label: 'Reportes', detail: 'PDF, Excel y métricas', icon: FileSpreadsheet, color: 'from-orange-500 to-rose-500' }
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`shortcut-card group relative overflow-hidden text-left p-4 sm:p-5 rounded-3xl bg-gradient-to-br ${item.color} text-white shadow-lg transition-all hover:-translate-y-1`}
            >
              <span className="absolute -right-7 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-extrabold">{item.label}</p>
                  <p className="text-[11px] text-white/75 mt-1">{item.detail}</p>
                </div>
                <span className="w-10 h-10 rounded-2xl bg-white/18 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <div className="relative mt-5 flex items-center gap-1.5 text-[11px] font-bold text-white/90">
                <span>Abrir módulo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Embedded Quick Scanner Bar on Dashboard */}
      <div className="quick-scan-card p-4 sm:p-5 bg-white border rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Escanear Asistencia Rápida Directamente en el Dashboard
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            Escriba ID, DNI o use simulación de 1-clic
          </span>
        </div>

        <form onSubmit={handleQuickScanSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={quickQrInput}
              onChange={e => setQuickQrInput(e.target.value)}
              placeholder="Ingrese código QR o DNI de alumno (ej: EST-1001 o 72819301)..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-4 py-3 rounded-2xl text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Registrar Asistencia</span>
          </button>
        </form>

        {/* Quick Simulator Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Simular Escaneo Rápido:</span>
          {estudiantes.slice(0, 4).map(st => (
            <button
              type="button"
              key={st.id}
              onClick={() => handleQuickSimulate(st.id)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1"
            >
              <span>{st.nombres.split(' ')[0]} ({st.id})</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Estudiantes */}
        <div className="metric-card p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Alumnos</span>
            <Users className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{totalEstudiantes}</p>
          <p className="text-[11px] text-slate-400 mt-1">Primaria y Secundaria</p>
        </div>

        {/* Presentes Hoy */}
        <div className="metric-card p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Presentes Hoy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{presentesHoy}</p>
          <p className="text-[11px] text-emerald-500/80 mt-1 font-medium">A tiempo hasta las {config.horaIngresoNormal}</p>
        </div>

        {/* Tardanzas */}
        <div className="metric-card p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Tardanzas</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">{tardanzasHoy}</p>
          <p className="text-[11px] text-amber-500/80 mt-1 font-medium">Ingreso después de {config.horaIngresoNormal} hasta {config.horaLimiteTardanza}</p>
        </div>

        {/* Inasistencias */}
        <div className="metric-card p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Inasistencias</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-400">{inasistenciasHoy}</p>
          <p className="text-[11px] text-rose-500/80 mt-1 font-medium">Sin registro de QR</p>
        </div>

        {/* % Asistencia */}
        <div className="metric-card p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">% Asistencia</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-300">{porcentajeAsistencia}%</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${porcentajeAsistencia}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analytics Graphics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Tendencia de Asistencia Semanal</h3>
              <p className="text-xs text-slate-400">Comparativa de alumnos Presentes vs Tardanzas</p>
            </div>
            <button
              onClick={() => setActiveTab('reportes')}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              <span>Ver Reportes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysData}>
                <defs>
                  <linearGradient id="colorPresentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTardanzas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="dia" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="presentes" name="Presentes" stroke="#10b981" fillOpacity={1} fill="url(#colorPresentes)" />
                <Area type="monotone" dataKey="tardanzas" name="Tardanzas" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTardanzas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Level Distribution Pie Chart */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Distribución por Nivel</h3>
            <p className="text-xs text-slate-400">Población estudiantil matriculada</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataNivel}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataNivel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {dataNivel.map(n => (
              <div key={n.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: n.color }} />
                  <span className="text-slate-300 font-medium">{n.name}</span>
                </div>
                <span className="font-bold text-white">{n.value} alumnos</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Recent Scans Stream */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-sm font-bold text-white">Últimos Registros de Asistencia QR en Vivo</h3>
          </div>
          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            + Escanear Nuevo Alumno
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Estudiante</th>
                <th className="py-2.5 px-3">DNI</th>
                <th className="py-2.5 px-3">Nivel / Grado</th>
                <th className="py-2.5 px-3">Hora Entrada</th>
                <th className="py-2.5 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedTodayAsistencias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Aún no hay registros de asistencia para el día de hoy.
                  </td>
                </tr>
              ) : (
                sortedTodayAsistencias.slice(0, 10).map((a, index) => {
                  const isLatest = index === 0;
                  return (
                    <tr
                      key={a.id}
                      className={`transition-colors ${
                        isLatest
                          ? 'bg-emerald-950/30 border-l-4 border-l-emerald-400 font-medium'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-slate-200 flex items-center gap-2">
                        {isLatest && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 animate-pulse">
                            NUEVO
                          </span>
                        )}
                        <span>{a.estudianteNombre}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{a.dni}</td>
                      <td className="py-3 px-3 text-slate-300">
                        {a.nivel} {a.grado} "{a.seccion}"
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-mono font-bold">{a.hora}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            a.estado === 'Presente'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {a.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
