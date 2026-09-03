import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck, ShieldCheck, Key, Phone, Mail, User } from 'lucide-react';

export const ParentManager: React.FC = () => {
  const { padres, estudiantes } = useApp();

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-amber-400" />
          Módulo de Padres y Apoderados
        </h2>
        <p className="text-xs text-slate-400">
          Credenciales de acceso para la consulta de asistencias de sus hijos
        </p>
      </div>

      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200">
        <p className="font-bold flex items-center gap-1.5 mb-1">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Mecanismo de Autenticación Inicial para Padres:
        </p>
        <p>
          • <strong>Usuario:</strong> Nombre Completo de su Hijo(a)
          <br />• <strong>Contraseña Inicial:</strong> DNI del Estudiante (8 dígitos)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {padres.map(padre => {
          const hijo = estudiantes.find(e => e.id === padre.estudianteId || e.dni === padre.estudianteDni);

          return (
            <div key={padre.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  ID: {padre.id}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{padre.nombrePadre}</h3>
                <p className="text-xs text-slate-400">Apoderado Responsable</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-red-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Estudiante Asoc: {hijo ? `${hijo.nombres} ${hijo.apellidos}` : 'No Asignado'}</span>
                </p>
                {hijo && (
                  <p className="text-[11px] text-slate-400 pl-5">
                    {hijo.nivel} {hijo.grado} "{hijo.seccion}" • DNI: {hijo.dni}
                  </p>
                )}
              </div>

              <div className="text-xs text-slate-300 space-y-1 pt-1">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{padre.telefono}</span>
                </p>
                {padre.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{padre.email}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
