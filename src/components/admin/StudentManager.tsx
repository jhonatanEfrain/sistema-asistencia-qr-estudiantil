import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Estudiante, Nivel } from '../../types';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  QrCode,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Printer,
  Sparkles
} from 'lucide-react';
import { parseStudentsExcel, downloadExcelTemplate, exportAsistenciasToExcel } from '../../utils/excelUtils';
import { generateStudentQRCardsPDF } from '../../utils/pdfGenerator';
import { QRCarnetCard } from '../scanner/QRCarnetCard';

export const StudentManager: React.FC = () => {
  const {
    estudiantes,
    addEstudiante,
    updateEstudiante,
    deleteEstudiante,
    importEstudiantesBatch,
    aulas
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNivel, setSelectedNivel] = useState<string>('Todos');
  const [selectedGrado, setSelectedGrado] = useState<string>('Todos');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Estudiante | null>(null);
  const [previewCarnetStudent, setPreviewCarnetStudent] = useState<Estudiante | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    numeroOrden: 1,
    apellidos: '',
    nombres: '',
    dni: '',
    grado: '1.°',
    seccion: 'A',
    nivel: 'Primaria' as Nivel,
    aulaId: 'AUL-P1A',
    nombreApoderado: '',
    telefonoApoderado: '',
    correoApoderado: ''
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handler para subir archivo Excel
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseStudentsExcel(file);
      if (imported.length === 0) {
        alert('No se encontraron datos válidos en el archivo Excel.');
        return;
      }

      const batchToSave = imported.map(row => {
        const nivel = row.nivel || 'Primaria';
        const prefix = nivel === 'Primaria' ? 'P' : 'S';
        const gClean = row.grado.replace('°', '').replace('.', '');
        const aulaId = `AUL-${prefix}${gClean}${row.seccion}`;

        return {
          numeroOrden: row.numeroOrden || 1,
          apellidos: row.apellidos,
          nombres: row.nombres,
          dni: row.dni,
          grado: row.grado,
          seccion: row.seccion,
          nivel,
          aulaId,
          nombreApoderado: row.nombreApoderado,
          telefonoApoderado: row.telefonoApoderado,
          correoApoderado: row.correoApoderado
        };
      });

      importEstudiantesBatch(batchToSave);
      alert(`¡Se importaron con éxito ${batchToSave.length} estudiantes desde el archivo Excel!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error importando Excel:', err);
      alert('Error al procesar el archivo Excel. Verifique el formato e intente nuevamente.');
    }
  };

  // Guardar nuevo o editado
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apellidos || !formData.nombres || !formData.dni) {
      alert('Por favor complete Apellidos, Nombres y DNI.');
      return;
    }

    const prefix = formData.nivel === 'Primaria' ? 'P' : 'S';
    const gClean = formData.grado.replace('°', '').replace('.', '');
    const computedAulaId = `AUL-${prefix}${gClean}${formData.seccion}`;

    if (editingStudent) {
      updateEstudiante(editingStudent.id, {
        ...formData,
        aulaId: computedAulaId
      });
      alert(`¡Estudiante ${formData.nombres} ${formData.apellidos} actualizado correctamente!`);
      setEditingStudent(null);
    } else {
      addEstudiante({
        ...formData,
        aulaId: computedAulaId
      });
      alert(`¡Estudiante ${formData.nombres} ${formData.apellidos} registrado con éxito en la base de datos!`);
      setIsAddModalOpen(false);
    }

    // Reset
    setFormData({
      numeroOrden: estudiantes.length + 1,
      apellidos: '',
      nombres: '',
      dni: '',
      grado: '1.°',
      seccion: 'A',
      nivel: 'Primaria',
      aulaId: 'AUL-P1A',
      nombreApoderado: '',
      telefonoApoderado: '',
      correoApoderado: ''
    });
  };

  const handleEditClick = (st: Estudiante) => {
    setEditingStudent(st);
    setFormData({
      numeroOrden: st.numeroOrden,
      apellidos: st.apellidos,
      nombres: st.nombres,
      dni: st.dni,
      grado: st.grado,
      seccion: st.seccion,
      nivel: st.nivel,
      aulaId: st.aulaId,
      nombreApoderado: st.nombreApoderado,
      telefonoApoderado: st.telefonoApoderado,
      correoApoderado: st.correoApoderado || ''
    });
  };

  // Filtrado de alumnos
  const filteredStudents = estudiantes.filter(st => {
    const matchesSearch = `${st.apellidos} ${st.nombres} ${st.dni} ${st.id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesNivel = selectedNivel === 'Todos' || st.nivel === selectedNivel;
    const matchesGrado = selectedGrado === 'Todos' || st.grado === selectedGrado;
    return matchesSearch && matchesNivel && matchesGrado;
  });

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Gestión de Estudiantes
          </h2>
          <p className="text-xs text-slate-400">
            Padrón escolar con códigos QR automáticos, importación Excel y carnetización
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Botón Importar Excel */}
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
            title="Importar lista de estudiantes en formato Excel"
            id="btn-import-excel"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Excel</span>
          </button>

          {/* Plantilla Excel */}
          <button
            onClick={downloadExcelTemplate}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            title="Descargar Plantilla Excel de Ejemplo"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Exportar Carnets QR a PDF */}
          <button
            onClick={() => generateStudentQRCardsPDF(filteredStudents)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors"
            title="Imprimir Carnets con Código QR para los estudiantes filtrados"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Carnets QR</span>
          </button>

          {/* Nuevo Estudiante */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Estudiante</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por Apellidos, Nombres, DNI o ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Nivel */}
          <select
            value={selectedNivel}
            onChange={e => {
              const val = e.target.value;
              setSelectedNivel(val);
              if (val === 'Secundaria' && selectedGrado === '6.°') {
                setSelectedGrado('Todos');
              }
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos los Niveles</option>
            <option value="Primaria">Primaria (1.°-6.°)</option>
            <option value="Secundaria">Secundaria (1.°-5.°)</option>
          </select>

          {/* Grado */}
          <select
            value={selectedGrado}
            onChange={e => setSelectedGrado(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos los Grados</option>
            <option value="1.°">1.° Grado</option>
            <option value="2.°">2.° Grado</option>
            <option value="3.°">3.° Grado</option>
            <option value="4.°">4.° Grado</option>
            <option value="5.°">5.° Grado</option>
            {selectedNivel !== 'Secundaria' && <option value="6.°">6.° Grado</option>}
          </select>

          <span className="text-xs text-slate-400 font-medium pl-2">
            {filteredStudents.length} resultados
          </span>
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">N° Orden / ID</th>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">DNI</th>
                <th className="py-3 px-4">Nivel / Grado</th>
                <th className="py-3 px-4">Apoderado / Contacto</th>
                <th className="py-3 px-4 text-center">Código QR</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No se encontraron estudiantes registrados con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(st => (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      #{st.numeroOrden} ({st.id})
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {st.apellidos}, {st.nombres}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{st.dni}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                        {st.nivel} {st.grado} "{st.seccion}"
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{st.nombreApoderado}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{st.telefonoApoderado}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setPreviewCarnetStudent(st)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Ver Carnet</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleEditClick(st)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Editar Datos"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar al estudiante ${st.nombres} ${st.apellidos}?`)) {
                            deleteEstudiante(st.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Eliminar Estudiante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Student */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingStudent ? 'Editar Datos del Estudiante' : 'Registrar Nuevo Estudiante'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Apellidos</label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ej. Perez Garcia"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nombres</label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ej. Juan Carlos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">DNI Estudiante</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={formData.dni}
                    onChange={e => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                    placeholder="70001001"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nivel</label>
                  <select
                    value={formData.nivel}
                    onChange={e => {
                      const newNivel = e.target.value as Nivel;
                      setFormData(prev => ({
                        ...prev,
                        nivel: newNivel,
                        grado: (newNivel === 'Secundaria' && prev.grado === '6.°') ? '1.°' : prev.grado
                      }));
                    }}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Grado y Sección</label>
                  <div className="flex gap-1">
                    <select
                      value={formData.grado}
                      onChange={e => setFormData({ ...formData, grado: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="1.°">1.°</option>
                      <option value="2.°">2.°</option>
                      <option value="3.°">3.°</option>
                      <option value="4.°">4.°</option>
                      <option value="5.°">5.°</option>
                      {formData.nivel === 'Primaria' && <option value="6.°">6.°</option>}
                    </select>
                    <select
                      value={formData.seccion}
                      onChange={e => setFormData({ ...formData, seccion: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="font-bold text-slate-300 mb-2">Datos del Padre o Apoderado</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Nombre Completo del Apoderado</label>
                    <input
                      type="text"
                      required
                      value={formData.nombreApoderado}
                      onChange={e => setFormData({ ...formData, nombreApoderado: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="Ej. Maria Flores Quispe"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Teléfono del apoderado</label>
                    <input
                      type="text"
                      required
                      value={formData.telefonoApoderado}
                      onChange={e => setFormData({ ...formData, telefonoApoderado: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="+51 987654321"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={formData.correoApoderado}
                      onChange={e => setFormData({ ...formData, correoApoderado: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="apoderado@gmail.com"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md"
                >
                  {editingStudent ? 'Actualizar Estudiante' : 'Guardar y Generar QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview Carnet QR */}
      {previewCarnetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-w-md w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Vista Previa de Carnet QR</h3>
              <button
                onClick={() => setPreviewCarnetStudent(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <QRCarnetCard estudiante={previewCarnetStudent} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewCarnetStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
