import * as XLSX from 'xlsx';
import { Estudiante, Asistencia } from '../types';

export interface ImportedStudentRow {
  numeroOrden?: number;
  apellidos: string;
  nombres: string;
  dni: string;
  grado: string;
  seccion: string;
  nivel?: 'Primaria' | 'Secundaria';
  nombreApoderado: string;
  telefonoApoderado: string;
  correoApoderado?: string;
}

/**
 * Lee un archivo .xlsx / .csv subido y extrae la lista de estudiantes
 */
export function parseStudentsExcel(file: File): Promise<ImportedStudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const students: ImportedStudentRow[] = rawJson.map((row, index) => {
          // Normalizar nombres de columnas (insensible a mayúsculas/minúsculas o tildes)
          const findKey = (candidates: string[]) => {
            const key = Object.keys(row).find(k => 
              candidates.some(c => k.toLowerCase().trim().includes(c.toLowerCase()))
            );
            return key ? String(row[key]).trim() : '';
          };

          const apellidos = findKey(['apellidos', 'apellido', 'paterno', 'materno']) || `Estudiante ${index + 1}`;
          const nombres = findKey(['nombres', 'nombre']) || `Alumno ${index + 1}`;
          const dni = findKey(['dni', 'documento', 'identificacion']) || `7000${1000 + index}`;
          const grado = findKey(['grado', 'curso']) || '1.°';
          const seccion = findKey(['seccion', 'sección', 'aula']) || 'A';
          const nivelRaw = findKey(['nivel', 'etapa']).toLowerCase();
          const nivel = nivelRaw.includes('secun') ? 'Secundaria' : 'Primaria';
          const nombreApoderado = findKey(['apoderado', 'padre', 'madre', 'tutor']) || 'Padre de Familia';
          const telefonoApoderado = findKey(['telefono', 'teléfono', 'celular', 'movil']) || '+51 900000000';
          const correoApoderado = findKey(['correo', 'email']) || '';
          const numeroOrdenRaw = parseInt(findKey(['orden', 'id', 'numero']), 10);
          const numeroOrden = isNaN(numeroOrdenRaw) ? index + 1 : numeroOrdenRaw;

          return {
            numeroOrden,
            apellidos,
            nombres,
            dni,
            grado,
            seccion,
            nivel,
            nombreApoderado,
            telefonoApoderado,
            correoApoderado
          };
        });

        resolve(students);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exporta reporte de asistencias a formato Excel (.xlsx)
 */
export function exportAsistenciasToExcel(
  asistencias: Asistencia[],
  filename = 'Reporte_Asistencias.xlsx'
) {
  const dataToExport = asistencias.map((a, index) => ({
    'N°': index + 1,
    'ID Estudiante': a.estudianteId,
    'Estudiante': a.estudianteNombre,
    'DNI': a.dni,
    'Fecha': a.fecha,
    'Hora Exacta': a.hora,
    'Estado': a.estado,
    'Nivel': a.nivel,
    'Grado': a.grado,
    'Sección': a.seccion,
    'Aula ID': a.aulaId,
    'Observaciones': a.observacion || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias');

  // Ancho automático de columnas
  const max_width = dataToExport.reduce((w, r) => Math.max(w, String(r['Estudiante']).length), 10);
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 15 }, { wch: max_width + 4 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 20 }
  ];

  XLSX.writeFile(workbook, filename);
}

export interface ImportedTeacherRow {
  dni: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  email: string;
  telefono: string;
  aulasAsignadas: string[];
  rawAulasStr?: string;
}

/**
 * Lee un archivo .xlsx / .csv subido y extrae la lista de docentes
 */
export function parseTeachersExcel(file: File): Promise<ImportedTeacherRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const teachers: ImportedTeacherRow[] = rawJson.map((row, index) => {
          const findKey = (candidates: string[]) => {
            const key = Object.keys(row).find(k =>
              candidates.some(c => k.toLowerCase().trim().includes(c.toLowerCase()))
            );
            return key ? String(row[key]).trim() : '';
          };

          const dni = findKey(['dni', 'documento', 'identificacion']) || `4000${1000 + index}`;
          const apellidos = findKey(['apellidos', 'apellido', 'paterno']) || `Docente ${index + 1}`;
          const nombres = findKey(['nombres', 'nombre']) || `Profesor ${index + 1}`;
          const especialidad = findKey(['especialidad', 'materia', 'curso', 'cargo']) || 'Tutor / Docente';
          const email = findKey(['correo', 'email', 'institucional']) || `${nombres.toLowerCase().replace(/\s+/g, '')}@colegio.edu.pe`;
          const telefono = findKey(['telefono', 'teléfono', 'celular', 'movil']) || '+51 987654321';
          const rawAulas = findKey(['aulas', 'aula', 'grado', 'seccion', 'sección', 'asignadas', 'tutoria']);

          // Normalizar aulas asignadas a IDs de aula (ej. "1.° A Primaria, 2.° A Primaria" -> ["AUL-P1A", "AUL-P2A"])
          let aulasAsignadas: string[] = [];
          if (rawAulas) {
            const items = rawAulas.split(/[,;\n]+/);
            items.forEach(item => {
              const clean = item.trim();
              if (!clean) return;
              const isSec = clean.toLowerCase().includes('sec');
              const prefix = isSec ? 'S' : 'P';
              const matchG = clean.match(/([1-6])/);
              const matchS = clean.match(/([A-Da-d])/);
              const g = matchG ? matchG[1] : '1';
              const s = matchS ? matchS[1].toUpperCase() : 'A';
              const aId = `AUL-${prefix}${g}${s}`;
              if (!aulasAsignadas.includes(aId)) {
                aulasAsignadas.push(aId);
              }
            });
          }

          if (aulasAsignadas.length === 0) {
            aulasAsignadas = ['AUL-P1A'];
          }

          return {
            dni,
            nombres,
            apellidos,
            especialidad,
            email,
            telefono,
            aulasAsignadas,
            rawAulasStr: rawAulas || '1.° A Primaria'
          };
        });

        resolve(teachers);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exporta plantilla de Excel para importación de docentes
 */
export function downloadTeacherExcelTemplate() {
  const templateData = [
    {
      'DNI': '41920381',
      'Apellidos': 'Flores Gutierrez',
      'Nombres': 'Carmen Rosa',
      'Especialidad': 'Tutoría Primaria',
      'Correo Institucional': 'c.flores@colegio.edu.pe',
      'Teléfono': '+51 988112233',
      'Aulas Asignadas': '1.° A Primaria, 2.° A Primaria'
    },
    {
      'DNI': '42819022',
      'Apellidos': 'Morales Santos',
      'Nombres': 'Marco Antonio',
      'Especialidad': 'Matemáticas / Tutoría Secundaria',
      'Correo Institucional': 'm.morales@colegio.edu.pe',
      'Teléfono': '+51 977223344',
      'Aulas Asignadas': '1.° A Secundaria, 2.° A Secundaria'
    },
    {
      'DNI': '43901283',
      'Apellidos': 'Quispe Huaman',
      'Nombres': 'Maria Elena',
      'Especialidad': 'Comunicación Primaria',
      'Correo Institucional': 'm.quispe@colegio.edu.pe',
      'Teléfono': '+51 966334455',
      'Aulas Asignadas': '3.° A Primaria'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Docentes_Ejemplo');
  XLSX.writeFile(workbook, 'Plantilla_Docentes_Ejemplo.xlsx');
}

/**
 * Exporta plantilla de Excel para importación de estudiantes
 */
export function downloadExcelTemplate() {
  const templateData = [
    {
      'N° Orden': 1,
      'Apellidos': 'Alvarez Garcia',
      'Nombres': 'Mateo Alejandro',
      'DNI': '72819301',
      'Grado': '1.°',
      'Sección': 'A',
      'Nivel': 'Primaria',
      'Nombre Apoderado': 'Juan Carlos Alvarez',
      'Teléfono Apoderado': '+51 987654321',
      'Correo Apoderado': 'jalvarez@gmail.com'
    },
    {
      'N° Orden': 2,
      'Apellidos': 'Benitez Quispe',
      'Nombres': 'Sofia Valentina',
      'DNI': '73920182',
      'Grado': '1.°',
      'Sección': 'A',
      'Nivel': 'Primaria',
      'Nombre Apoderado': 'Maria Elena Quispe',
      'Teléfono Apoderado': '+51 912345678',
      'Correo Apoderado': 'mquispe@gmail.com'
    },
    {
      'N° Orden': 3,
      'Apellidos': 'Castillo Huaman',
      'Nombres': 'Gabriel Andres',
      'DNI': '74102938',
      'Grado': '2.°',
      'Sección': 'A',
      'Nivel': 'Primaria',
      'Nombre Apoderado': 'Luis Castillo',
      'Teléfono Apoderado': '+51 923456789',
      'Correo Apoderado': 'lcastillo@hotmail.com'
    },
    {
      'N° Orden': 4,
      'Apellidos': 'Flores Gutierrez',
      'Nombres': 'Diego Fernando',
      'DNI': '77491028',
      'Grado': '1.°',
      'Sección': 'A',
      'Nivel': 'Secundaria',
      'Nombre Apoderado': 'Fernando Flores',
      'Teléfono Apoderado': '+51 956789012',
      'Correo Apoderado': 'fflores@gmail.com'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes_Ejemplo');
  XLSX.writeFile(workbook, 'Plantilla_Estudiantes_Ejemplo.xlsx');
}
