import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Users, GraduationCap, CheckCircle2 } from 'lucide-react';

export const ClassroomManager: React.FC = () => {
  const { aulas, estudiantes, docentes } = useApp();

  const primariaAulas = aulas.filter(a => a.nivel === 'Primaria');
  const secundariaAulas = aulas.filter(a => a.nivel === 'Secundaria');

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-400" />
          Aulas y Grados Institucionales
        </h2>
        <p className="text-xs text-slate-400">
          Estructura académica organizada por niveles educativo Primaria (1.°-6.°) y Secundaria (1.°-5.°)
        </p>
      </div>

      {/* Primaria */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          Nivel Primaria (1.° a 6.° Grado)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {primariaAulas.map(aula => {
            const countAlumnos = estudiantes.filter(e => e.aulaId === aula.id || (e.nivel === 'Primaria' && e.grado === aula.grado && e.seccion === aula.seccion)).length;
            const assignedDocente = docentes.find(d => d.aulasAsignadas?.includes(aula.id) || d.id === aula.tutorDocenteId);
            const tutorDisplayName = assignedDocente 
              ? `Prof. ${assignedDocente.nombres} ${assignedDocente.apellidos}`
              : null;

            return (
              <div key={aula.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-sm hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Aula {aula.grado} "{aula.seccion}"
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{aula.id}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200">
                    Tutor: {tutorDisplayName ? (
                      <span className="text-emerald-400">{tutorDisplayName}</span>
                    ) : (
                      <span className="text-slate-500 italic font-normal">Por asignar</span>
                    )}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      {countAlumnos} alumnos
                    </span>
                    <span>Capacidad: {aula.capacidad} max</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secundaria */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Nivel Secundaria (1.° a 5.° Grado)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {secundariaAulas.map(aula => {
            const countAlumnos = estudiantes.filter(e => e.aulaId === aula.id || (e.nivel === 'Secundaria' && e.grado === aula.grado && e.seccion === aula.seccion)).length;
            const assignedDocente = docentes.find(d => d.aulasAsignadas?.includes(aula.id) || d.id === aula.tutorDocenteId);
            const tutorDisplayName = assignedDocente 
              ? `Prof. ${assignedDocente.nombres} ${assignedDocente.apellidos}`
              : null;

            return (
              <div key={aula.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-sm hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Aula {aula.grado} "{aula.seccion}"
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{aula.id}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200">
                    Tutor: {tutorDisplayName ? (
                      <span className="text-emerald-400">{tutorDisplayName}</span>
                    ) : (
                      <span className="text-slate-500 italic font-normal">Por asignar</span>
                    )}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      {countAlumnos} alumnos
                    </span>
                    <span>Capacidad: {aula.capacidad} max</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
