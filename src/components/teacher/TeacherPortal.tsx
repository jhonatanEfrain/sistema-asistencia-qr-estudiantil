import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Megaphone,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  QrCode,
  Send,
  Building2,
  Users
} from 'lucide-react';
import { generateAttendancePDFReport } from '../../utils/pdfGenerator';
import { exportAsistenciasToExcel } from '../../utils/excelUtils';

export const TeacherPortal: React.FC = () => {
  const {
    currentUser,
    aulas,
    estudiantes,
    asistencias,
    addComunicado,
    addManualAsistencia,
    setIsScannerModalOpen,
    activeTab,
    setActiveTab
  } = useApp();

  const assignedAulas = currentUser.assignedAulas || ['AUL-P1A', 'AUL-P2A'];
  const [selectedAulaId, setSelectedAulaId] = useState<string>(assignedAulas[0] || 'AUL-P1A');

  const teacherAssignedAulaObjs = aulas.filter(a => assignedAulas.includes(a.id));

  // Comunicado Form
  const [isComunicadoModalOpen, setIsComunicadoModalOpen] = useState(false);
  const [comTitulo, setComTitulo] = useState('');
  const [comDescripcion, setComDescripcion] = useState('');
  const defaultTargetLabel = teacherAssignedAulaObjs.length > 0
    ? `${teacherAssignedAulaObjs[0].nivel} ${teacherAssignedAulaObjs[0].grado} "${teacherAssignedAulaObjs[0].seccion}"`
    : '1.° A Primaria';
  const [comTargetGrade, setComTargetGrade] = useState(defaultTargetLabel);

  const selectedAula = aulas.find(a => a.id === selectedAulaId) || aulas[0];
  const todayStr = new Date().toISOString().split('T')[0];

  // Estudiantes del aula seleccionada
  const aulaEstudiantes = estudiantes.filter(e =>
    e.aulaId === selectedAulaId || (e.nivel === selectedAula.nivel && e.grado === selectedAula.grado && e.seccion === selectedAula.seccion)
  );

  const handlePostComunicado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comTitulo || !comDescripcion) return;

    addComunicado({
      titulo: comTitulo,
      descripcion: comDescripcion,
      autor: currentUser.name,
      autorId: currentUser.id,
      autorRol: 'Docente',
      alcance: 'aula',
      aulaId: selectedAula.id,
      aulaDestino: comTargetGrade,
      nivelDestino: selectedAula.nivel
    });

    alert('¡Comunicado publicado correctamente para los padres de familia!');
    setComTitulo('');
    setComDescripcion('');
    setIsComunicadoModalOpen(false);
  };

  const isComunicadoView = activeTab === 'comunicados';

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Portal del Docente Tutor
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Bienvenido, {currentUser.name}
          </h2>
          <p className="text-xs text-slate-400">
            {isComunicadoView
              ? 'Módulo de publicación y gestión de comunicados para los apoderados'
              : 'Gestión de asistencia de sus aulas asignadas y registro de alumnos'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isComunicadoView ? (
            <button
              onClick={() => setActiveTab('comunicados')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <Megaphone className="w-4 h-4" />
              <span>Nuevo Comunicado</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('docente_aulas')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>Ver Mis Aulas y Alumnos</span>
            </button>
          )}

          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Escanear QR</span>
          </button>
        </div>
      </div>

      {isComunicadoView ? (
        /* VISTA DEDICADA: PUBLICAR & GESTIONAR COMUNICADOS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de publicación */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Megaphone className="w-4 h-4 text-amber-400" />
              Redactar y Publicar Comunicado
            </h3>

            <form onSubmit={handlePostComunicado} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Título del Comunicado</label>
                <input
                  type="text"
                  required
                  value={comTitulo}
                  onChange={e => setComTitulo(e.target.value)}
                  placeholder="Ej. Reunión de Apoderados / Tarea Especial"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Dirigido a (Secciones Asignadas):
                </label>
                <select
                  value={comTargetGrade}
                  onChange={e => setComTargetGrade(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  {teacherAssignedAulaObjs.length > 0 ? (
                    teacherAssignedAulaObjs.map(a => {
                      const label = `${a.nivel} ${a.grado} "${a.seccion}"`;
                      return (
                        <option key={a.id} value={label}>
                          {label}
                        </option>
                      );
                    })
                  ) : (
                    <option value="Sección Asignada">Sección Asignada</option>
                  )}
                </select>
                <p className="text-[10px] text-amber-400/80 mt-1 italic">
                  * Como docente, solo puede publicar comunicados a sus secciones asignadas. Los comunicados generales son emitidos por el administrador.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descripción o Mensaje Detallado</label>
                <textarea
                  rows={5}
                  required
                  value={comDescripcion}
                  onChange={e => setComDescripcion(e.target.value)}
                  placeholder="Escriba el comunicado detallado que será notificado a los padres..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all pt-2"
              >
                <Send className="w-4 h-4" />
                <span>Publicar Comunicado Oficial</span>
              </button>
            </form>
          </div>

          {/* Historial de comunicados emitidos */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Megaphone className="w-4 h-4 text-emerald-400" />
              Historial de Comunicados Emitidos por la Institución
            </h3>

            <div className="space-y-3">
              {useApp().comunicados.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No hay comunicados registrados. Utilice el formulario para publicar el primero.
                </div>
              ) : (
                useApp().comunicados.map(c => (
                  <div key={c.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-amber-400 flex items-center gap-2">
                        <Megaphone className="w-3.5 h-3.5" />
                        {c.titulo}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{c.fecha}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.descripcion}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                      <span>Destino: <strong className="text-slate-200">{c.aulaDestino} ({c.nivelDestino})</strong></span>
                      <span>Emisor: <strong className="text-slate-200">{c.autor} ({c.autorRol})</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DEDICADA: MIS AULAS Y REGISTRO DE ASISTENCIA */
        <>
          {/* Selector de Aula Asignada */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-400">Mis Aulas Asignadas:</span>
            {assignedAulas.map(aId => {
              const aObj = aulas.find(a => a.id === aId);
              const isSelected = selectedAulaId === aId;

              return (
                <button
                  key={aId}
                  onClick={() => setSelectedAulaId(aId)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {aObj ? `${aObj.nivel} ${aObj.grado} "${aObj.seccion}"` : aId}
                </button>
              );
            })}
          </div>

          {/* Classroom Student Attendance List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Asistencia de Hoy: {selectedAula.nivel} {selectedAula.grado} "{selectedAula.seccion}"
                </h3>
                <p className="text-xs text-slate-400">
                  Fecha: {todayStr} • Total alumnos: {aulaEstudiantes.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const aulaAsis = asistencias.filter(a => a.aulaId === selectedAulaId && a.fecha === todayStr);
                    generateAttendancePDFReport(
                      aulaAsis,
                      `Reporte de Aula ${selectedAula.grado} "${selectedAula.seccion}" - ${selectedAula.nivel}`,
                      `Docente: ${currentUser.name}`
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                  Exportar PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">N° Orden</th>
                    <th className="py-2.5 px-3">Estudiante</th>
                    <th className="py-2.5 px-3">DNI</th>
                    <th className="py-2.5 px-3">Hora Entrada</th>
                    <th className="py-2.5 px-3">Estado Asistencia</th>
                    <th className="py-2.5 px-3 text-right">Marcar Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {aulaEstudiantes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No hay alumnos registrados en esta aula. El administrador puede agregarlos desde Gestión de Estudiantes o Importar desde Excel.
                      </td>
                    </tr>
                  ) : (
                    aulaEstudiantes.map(st => {
                      const asisRecord = asistencias.find(a => a.estudianteId === st.id && a.fecha === todayStr);

                      return (
                        <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-bold text-blue-400">#{st.numeroOrden}</td>
                          <td className="py-3 px-3 font-bold text-white">{st.apellidos}, {st.nombres}</td>
                          <td className="py-3 px-3 text-slate-400 font-mono">{st.dni}</td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                            {asisRecord ? asisRecord.hora : '-'}
                          </td>
                          <td className="py-3 px-3">
                            {asisRecord ? (
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  asisRecord.estado === 'Presente'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {asisRecord.estado}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Sin Registro
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {!asisRecord && (
                              <button
                                onClick={() => {
                                  const now = new Date().toTimeString().split(' ')[0];
                                  addManualAsistencia({
                                    estudianteId: st.id,
                                    estudianteNombre: `${st.apellidos}, ${st.nombres}`,
                                    dni: st.dni,
                                    fecha: todayStr,
                                    hora: now,
                                    estado: 'Presente',
                                    aulaId: selectedAulaId,
                                    grado: selectedAula.grado,
                                    seccion: selectedAula.seccion,
                                    nivel: selectedAula.nivel,
                                    observacion: 'Registro manual por docente'
                                  });
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold"
                              >
                                + Marcar Presente
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Publicar Comunicado (Acceso Rápido) */}
      {isComunicadoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-lg">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              Publicar Comunicado Escolar
            </h3>
            <form onSubmit={handlePostComunicado} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Título del Comunicado</label>
                <input
                  type="text"
                  required
                  value={comTitulo}
                  onChange={e => setComTitulo(e.target.value)}
                  placeholder="Ej. Reunión de Apoderados / Tarea Especial"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Dirigido a:</label>
                <select
                  value={comTargetGrade}
                  onChange={e => setComTargetGrade(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  <option value="1.° Primaria">1.° Primaria</option>
                  <option value="2.° Primaria">2.° Primaria</option>
                  <option value="3.° Primaria">3.° Primaria</option>
                  <option value="4.° Primaria">4.° Primaria</option>
                  <option value="5.° Primaria">5.° Primaria</option>
                  <option value="6.° Primaria">6.° Primaria</option>
                  <option value="1.° Secundaria">1.° Secundaria</option>
                  <option value="2.° Secundaria">2.° Secundaria</option>
                  <option value="3.° Secundaria">3.° Secundaria</option>
                  <option value="4.° Secundaria">4.° Secundaria</option>
                  <option value="5.° Secundaria">5.° Secundaria</option>
                  <option value="Todas Primaria">Todas Primaria</option>
                  <option value="Todas Secundaria">Todas Secundaria</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descripción / Contenido</label>
                <textarea
                  rows={4}
                  required
                  value={comDescripcion}
                  onChange={e => setComDescripcion(e.target.value)}
                  placeholder="Escriba aquí los detalles del comunicado para los apoderados..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsComunicadoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar Ahora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
