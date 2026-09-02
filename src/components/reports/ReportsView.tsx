import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Building2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3
} from 'lucide-react';
import { generateAttendancePDFReport } from '../../utils/pdfGenerator';
import { exportAsistenciasToExcel } from '../../utils/excelUtils';

export const ReportsView: React.FC = () => {
  const { asistencias, estudiantes, aulas } = useApp();

  const [reportType, setReportType] = useState<string>('general');
  const [selectedNivel, setSelectedNivel] = useState<string>('Todos');
  const [selectedGrado, setSelectedGrado] = useState<string>('Todos');
  const [selectedAula, setSelectedAula] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filtrado dinámico
  const filteredAsistencias = asistencias.filter(a => {
    const matchesNivel = selectedNivel === 'Todos' || a.nivel === selectedNivel;
    const matchesGrado = selectedGrado === 'Todos' || a.grado === selectedGrado;
    const matchesAula = selectedAula === 'Todos' || a.aulaId === selectedAula;
    const matchesSearch = `${a.estudianteNombre} ${a.dni} ${a.estudianteId}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (startDate && a.fecha < startDate) matchesDate = false;
    if (endDate && a.fecha > endDate) matchesDate = false;

    return matchesNivel && matchesGrado && matchesAula && matchesSearch && matchesDate;
  });

  const total = filteredAsistencias.length;
  const presentes = filteredAsistencias.filter(a => a.estado === 'Presente').length;
  const tardanzas = filteredAsistencias.filter(a => a.estado === 'Tardanza').length;
  const inasistencias = filteredAsistencias.filter(a => a.estado === 'Inasistencia').length;

  const handleExportPDF = () => {
    generateAttendancePDFReport(
      filteredAsistencias,
      `Reporte de Asistencia: ${reportType.toUpperCase()}`,
      `Filtros: Nivel=${selectedNivel}, Grado=${selectedGrado}, Registros=${total}`
    );
  };

  const handleExportExcel = () => {
    exportAsistenciasToExcel(filteredAsistencias, `Reporte_Asistencias_${reportType}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-rose-400" />
            Módulo de Reportes e Informes Consolidados
          </h2>
          <p className="text-xs text-slate-400">
            Exportación de reportes institucionales en PDF y Excel con filtros por fecha, aula y grado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Exportar PDF Oficial</span>
          </button>
        </div>
      </div>

      {/* Tipo de Reporte Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'general', label: '1. Asistencia General' },
          { id: 'aula', label: '2. Asistencia por Aula' },
          { id: 'grado', label: '3. Asistencia por Grado' },
          { id: 'estudiante', label: '4. Por Estudiante' },
          { id: 'mensual', label: '5. Reporte Mensual' },
          { id: 'anual', label: '6. Reporte Anual' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              reportType === tab.id
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Panel */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Nivel Educativo</label>
          <select
            value={selectedNivel}
            onChange={e => {
              const val = e.target.value;
              setSelectedNivel(val);
              if (val === 'Secundaria' && selectedGrado === '6.°') {
                setSelectedGrado('Todos');
              }
            }}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
          >
            <option value="Todos">Todos los Niveles</option>
            <option value="Primaria">Primaria (1.°-6.°)</option>
            <option value="Secundaria">Secundaria (1.°-5.°)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Grado</label>
          <select
            value={selectedGrado}
            onChange={e => setSelectedGrado(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
          >
            <option value="Todos">Todos los Grados</option>
            <option value="1.°">1.° Grado</option>
            <option value="2.°">2.° Grado</option>
            <option value="3.°">3.° Grado</option>
            <option value="4.°">4.° Grado</option>
            <option value="5.°">5.° Grado</option>
            {selectedNivel !== 'Secundaria' && <option value="6.°">6.° Grado</option>}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Fecha Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Fecha Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Buscar Alumno / DNI</label>
          <input
            type="text"
            placeholder="DNI o Nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold">Total Registros:</span>
          <span className="text-base font-extrabold text-white">{total}</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <span className="text-xs text-emerald-400 font-semibold">Presentes:</span>
          <span className="text-base font-extrabold text-emerald-400">{presentes}</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <span className="text-xs text-amber-400 font-semibold">Tardanzas:</span>
          <span className="text-base font-extrabold text-amber-400">{tardanzas}</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <span className="text-xs text-rose-400 font-semibold">Inasistencias:</span>
          <span className="text-base font-extrabold text-rose-400">{inasistencias}</span>
        </div>
      </div>

      {/* Consolidated Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">DNI</th>
                <th className="py-3 px-4">Nivel / Grado</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Hora Lectura</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAsistencias.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron registros de asistencia con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAsistencias.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{a.estudianteNombre}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{a.dni}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {a.nivel} {a.grado} "{a.seccion}"
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{a.fecha}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{a.hora}</td>
                    <td className="py-3 px-4">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
