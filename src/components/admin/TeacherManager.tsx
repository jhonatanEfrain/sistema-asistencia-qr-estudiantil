import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Docente } from '../../types';
import { GraduationCap, UserPlus, Search, Building2, Mail, Phone, Edit2, CheckCircle2, Upload, Download, Key, X } from 'lucide-react';
import { parseTeachersExcel, downloadTeacherExcelTemplate } from '../../utils/excelUtils';

export const TeacherManager: React.FC = () => {
  const { docentes, addDocente, importDocentesBatch, usuarios, aulas } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [importedCredentialsModal, setImportedCredentialsModal] = useState<Array<{ email: string; password: string; nombre: string }> | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    especialidad: 'Tutoría Primaria',
    email: '',
    telefono: '',
    aulasAsignadas: ['AUL-P1A']
  });

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseTeachersExcel(file);
      if (imported.length === 0) {
        alert('No se encontraron docentes válidos en el archivo Excel.');
        return;
      }

      const batchToSave = imported.map(row => ({
        dni: row.dni,
        nombres: row.nombres,
        apellidos: row.apellidos,
        especialidad: row.especialidad,
        email: row.email,
        telefono: row.telefono,
        aulasAsignadas: row.aulasAsignadas
      }));

      const creds = importDocentesBatch(batchToSave);
      setImportedCredentialsModal(creds);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error importando docentes Excel:', err);
      alert('Error al procesar el archivo Excel de docentes. Verifique el formato e intente nuevamente.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombres || !formData.apellidos || !formData.dni) return;
    addDocente(formData);
    setIsAddModalOpen(false);
    setFormData({
      dni: '',
      nombres: '',
      apellidos: '',
      especialidad: 'Tutoría Primaria',
      email: '',
      telefono: '',
      aulasAsignadas: ['AUL-P1A']
    });
  };

  const filtered = docentes.filter(d =>
    `${d.nombres} ${d.apellidos} ${d.dni} ${d.especialidad}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
            Gestión de Docentes y Tutores
          </h2>
          <p className="text-xs text-slate-400">
            Mantenimiento del cuerpo docente, importación Excel y asignación automática de aulas y credenciales
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs border border-slate-700 transition-colors"
            title="Importar docentes desde Excel"
            id="btn-import-docentes-excel"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Docentes Excel</span>
          </button>

          <button
            onClick={downloadTeacherExcelTemplate}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            title="Descargar Plantilla Excel de Docentes"
            id="btn-download-docentes-template"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
            id="btn-add-docente"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Registrar Docente</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar docente por Nombre, DNI o Especialidad..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(doc => {
          const matchedUser = usuarios.find(u => u.email.toLowerCase() === doc.email.toLowerCase() || (u.dni && u.dni === doc.dni));
          return (
            <div key={doc.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-sm hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ID: {doc.id}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">
                    Prof. {doc.nombres} {doc.apellidos}
                  </h3>
                  <p className="text-xs text-slate-400">{doc.especialidad}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doc.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doc.telefono}</span>
                </p>
                {matchedUser && (
                  <p className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] pt-1">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Clave Acceso: <strong>{matchedUser.password || '123456'}</strong></span>
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 mb-1">Aulas Asignadas:</p>
                <div className="flex flex-wrap gap-1">
                  {doc.aulasAsignadas.map(aId => {
                    const aulaObj = aulas.find(a => a.id === aId);
                    return (
                      <span key={aId} className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded-md text-[10px] font-bold border border-slate-700">
                        {aulaObj ? `${aulaObj.nivel} ${aulaObj.grado} "${aulaObj.seccion}"` : aId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal confirmation for imported docentes */}
      {importedCredentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Docentes Importados Exitosamente
              </h3>
              <button
                onClick={() => setImportedCredentialsModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Se han registrado los docentes en la base de datos y se han asignado automáticamente sus aulas y credenciales de acceso:
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950 p-3 text-xs space-y-2">
              {importedCredentialsModal.map((cred, idx) => (
                <div key={idx} className="pt-2 first:pt-0">
                  <p className="font-bold text-white">{cred.nombre}</p>
                  <p className="text-slate-400">Correo: <span className="font-mono text-emerald-400">{cred.email}</span></p>
                  <p className="text-slate-400">Contraseña asignada: <span className="font-mono text-amber-400">{cred.password}</span></p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setImportedCredentialsModal(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md">
            <h3 className="text-base font-bold text-white mb-4">Registrar Nuevo Docente</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nombres</label>
                <input
                  type="text"
                  required
                  value={formData.nombres}
                  onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Apellidos</label>
                <input
                  type="text"
                  required
                  value={formData.apellidos}
                  onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">DNI</label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={e => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Especialidad</label>
                  <input
                    type="text"
                    required
                    value={formData.especialidad}
                    onChange={e => setFormData({ ...formData, especialidad: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Correo Institucional</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Teléfono</label>
                <input
                  type="text"
                  required
                  value={formData.telefono}
                  onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Guardar y Crear Acceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
