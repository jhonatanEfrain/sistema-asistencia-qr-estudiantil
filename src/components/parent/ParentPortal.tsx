import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  Megaphone,
  MessageSquare,
  Send,
  Calendar,
  ShieldCheck,
  Download,
  Bell
} from 'lucide-react';
import { generateAttendancePDFReport } from '../../utils/pdfGenerator';

export const ParentPortal: React.FC = () => {
  const {
    currentUser,
    estudiantes,
    asistencias,
    comunicados,
    notificaciones,
    activeTab,
    setActiveTab
  } = useApp();

  // Buscar el estudiante hijo asociado a este apoderado
  const childId = currentUser.estudianteId;
  const child = estudiantes.find(e =>
    (childId && e.id === childId) ||
    (currentUser.dni && e.dni === currentUser.dni) ||
    (e.correoApoderado && e.correoApoderado.toLowerCase() === currentUser.email?.toLowerCase()) ||
    (currentUser.name && currentUser.name.includes(e.nombres))
  ) || estudiantes[0] || {
    id: 'EST-NONE',
    nombres: 'Estudiante',
    apellidos: 'No Asignado',
    dni: '-',
    grado: '-',
    seccion: '-',
    nivel: 'Primaria',
    aulaId: '-',
    nombreApoderado: currentUser.name,
    telefonoApoderado: '-',
    correoApoderado: currentUser.email,
    qrCodeData: '-',
    fotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200'
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const childAsistencias = asistencias.filter(a => a.estudianteId === child.id || a.dni === child.dni);
  const todayEntry = childAsistencias.find(a => a.fecha === todayStr);

  // NOTIFICACIONES EXCLUSIVAS DEL HIJO(A)
  const childNotifs = notificaciones.filter(n =>
    n.estudianteId === child.id ||
    (n.mensaje && (n.mensaje.includes(child.nombres) || n.mensaje.includes(child.apellidos)))
  );

  const childComs = comunicados.filter(c =>
    c.aulaDestino.includes(child.grado) ||
    c.nivelDestino === child.nivel ||
    c.aulaDestino.includes('Todas') ||
    c.aulaDestino.includes('General')
  );

  const isComunicadoView = activeTab === 'comunicados';

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      {/* Banner del Apoderado */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Portal del Padre de Familia
          </span>
          <h2 className="text-xl font-bold text-white">
            Bienvenido, {currentUser.name}
          </h2>
          <p className="text-xs text-slate-300">
            {isComunicadoView
              ? `Comunicados escolares e información institucional para ${child.nombres} ${child.apellidos}`
              : `Monitoreo en tiempo real de la asistencia de su menor hijo(a) ${child.nombres}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isComunicadoView ? (
            <button
              onClick={() => setActiveTab('comunicados')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <Megaphone className="w-4 h-4" />
              <span>Ver Comunicados</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('padre_hijo')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Ver Asistencia del Hijo(a)</span>
            </button>
          )}

          <button
            onClick={() => {
              generateAttendancePDFReport(
                childAsistencias,
                `Reporte de Asistencia Estudiantil - ${child.nombres} ${child.apellidos}`,
                `Apoderado: ${currentUser.name}`
              );
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-md transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {isComunicadoView ? (
        /* VISTA DEDICADA: COMUNICADOS DEL COLEGIO & NOTIFICACIONES DEL HIJO */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Comunicados del Colegio */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Megaphone className="w-4 h-4 text-amber-400" />
              Comunicados Oficiales del Colegio ({child.nivel} {child.grado} "{child.seccion}")
            </h3>

            <div className="space-y-3">
              {childComs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No hay comunicados publicados para la sección de su hijo(a) en este momento.
                </div>
              ) : (
                childComs.map(c => (
                  <div key={c.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-amber-400 flex items-center gap-2">
                        <Megaphone className="w-3.5 h-3.5" />
                        {c.titulo}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{c.fecha}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.descripcion}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-900">
                      <span>Para: <strong className="text-slate-200">{c.aulaDestino}</strong></span>
                      <span>Publicado por: <strong className="text-slate-200">{c.autor} ({c.autorRol})</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notificaciones específicas del Hijo(a) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bell className="w-4 h-4 text-blue-400" />
              Notificaciones Exclusivas de {child.nombres}
            </h3>

            <div className="space-y-3">
              {childNotifs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No hay notificaciones registradas únicamente para {child.nombres}.
                </div>
              ) : (
                childNotifs.map(n => (
                  <div key={n.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-400">
                      <span>{n.titulo}</span>
                      <span className="text-slate-500 font-mono">{n.fechaHora}</span>
                    </div>
                    <p className="text-xs text-slate-200">{n.mensaje}</p>
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-400 font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Canal: Notificación de la App</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DEDICADA: ASISTENCIA DE MI HIJO(A) */
        <>
          {/* Child Information Card & Today Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Child Profile Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={child.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200'}
                  alt={child.nombres}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/30"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">{child.nombres} {child.apellidos}</h3>
                  <p className="text-xs font-semibold text-emerald-400">
                    {child.nivel} {child.grado} "{child.seccion}"
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">DNI: {child.dni} • ID: {child.id}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-300">
                <p><span className="text-slate-400">Aula Asignada:</span> {child.aulaId}</p>
                <p><span className="text-slate-400">Apoderado:</span> {child.nombreApoderado}</p>
                <p><span className="text-slate-400">Correo Notif:</span> {child.correoApoderado || '-'}</p>
              </div>
            </div>

            {/* Today's Live Attendance Status Card */}
            <div className="md:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Estado de Asistencia para Hoy ({todayStr})
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Sistema QR Institucional
                </span>
              </div>

              {todayEntry ? (
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    todayEntry.estado === 'Presente'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  }`}
                >
                  {todayEntry.estado === 'Presente' ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-10 h-10 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-base">
                      Su hijo(a) ingresó a la institución a las {todayEntry.hora} hrs
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Estado Registrado: <strong className="text-white font-mono">{todayEntry.estado}</strong> •
                      Lectura de código QR efectuada con éxito en puerta principal.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex items-center gap-4">
                  <XCircle className="w-10 h-10 text-rose-400 shrink-0" />
                  <div>
                    <p className="font-bold text-base">Pendiente de ingreso para el día de hoy</p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Aún no se registra lectura de código QR para el alumno en la jornada de hoy.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Canal de avisos oficiales:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Notificaciones integradas en la App
                </span>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Historial Completo de Ingresos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Hora Exacta</th>
                    <th className="py-2.5 px-3">Nivel / Grado</th>
                    <th className="py-2.5 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {childAsistencias.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                        Aún no se registraron ingresos en el sistema para este estudiante.
                      </td>
                    </tr>
                  ) : (
                    childAsistencias.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{a.fecha}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{a.hora}</td>
                        <td className="py-2.5 px-3 text-slate-300">{a.nivel} {a.grado} "{a.seccion}"</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.estado === 'Presente'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {a.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
