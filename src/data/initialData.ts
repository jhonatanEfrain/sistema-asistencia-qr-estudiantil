import { Aula, Estudiante, Docente, Padre, Asistencia, Comunicado, Notificacion, HistorialAcceso, ConfiguracionHorario, UserAccount } from '../types';

export const initialConfig: ConfiguracionHorario = {
  horaIngresoNormal: '08:00',
  horaLimiteTardanza: '08:15',
  nombreInstitucion: 'José Sabogal Diéguez (Josdic)',
  direccion: 'Av. Las Flores 456, Lima',
  telefono: '(01) 456-7890'
};

export const initialUsuarios: UserAccount[] = [
  {
    id: 'USR-001',
    nombre: 'Lic. Roberto Valdivia (Director)',
    email: 'admin@colegio.edu.pe',
    password: 'admin123',
    rol: 'admin',
    dni: '40998877',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    activo: true
  },
  {
    id: 'USR-002',
    nombre: 'Prof. Carmen Rosa Flores',
    email: 'c.flores@colegio.edu.pe',
    password: 'docente123',
    rol: 'docente',
    dni: '41238901',
    assignedAulas: ['AUL-P1A', 'AUL-P2A'],
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    activo: true
  }
];

export const initialAulas: Aula[] = [
  { id: 'AUL-P1A', grado: '1.°', seccion: 'A', nivel: 'Primaria', tutorNombre: 'Prof. Carmen Rosa Flores', tutorDocenteId: 'DOC-201', capacidad: 30 },
  { id: 'AUL-P2A', grado: '2.°', seccion: 'A', nivel: 'Primaria', tutorNombre: 'Prof. Carmen Rosa Flores', tutorDocenteId: 'DOC-201', capacidad: 30 },
  { id: 'AUL-P3A', grado: '3.°', seccion: 'A', nivel: 'Primaria', capacidad: 30 },
  { id: 'AUL-P4A', grado: '4.°', seccion: 'A', nivel: 'Primaria', capacidad: 30 },
  { id: 'AUL-P5A', grado: '5.°', seccion: 'A', nivel: 'Primaria', capacidad: 30 },
  { id: 'AUL-P6A', grado: '6.°', seccion: 'A', nivel: 'Primaria', capacidad: 30 },
  { id: 'AUL-S1A', grado: '1.°', seccion: 'A', nivel: 'Secundaria', capacidad: 35 },
  { id: 'AUL-S2A', grado: '2.°', seccion: 'A', nivel: 'Secundaria', capacidad: 35 },
  { id: 'AUL-S3A', grado: '3.°', seccion: 'A', nivel: 'Secundaria', capacidad: 35 },
  { id: 'AUL-S4A', grado: '4.°', seccion: 'A', nivel: 'Secundaria', capacidad: 35 },
  { id: 'AUL-S5A', grado: '5.°', seccion: 'A', nivel: 'Secundaria', capacidad: 35 },
];

export const initialEstudiantes: Estudiante[] = [];

export const initialDocentes: Docente[] = [
  {
    id: 'DOC-201',
    dni: '41238901',
    nombres: 'Carmen Rosa',
    apellidos: 'Flores Silva',
    especialidad: 'Tutoría Primaria',
    email: 'c.flores@colegio.edu.pe',
    telefono: '+51 988112233',
    aulasAsignadas: ['AUL-P1A', 'AUL-P2A']
  }
];

export const initialPadres: Padre[] = [];

export const initialAsistencias: Asistencia[] = [];

// Generar fecha de hoy en formato local YYYY-MM-DD
const getTodayStr = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const initialComunicados: Comunicado[] = [
  {
    id: 'COM-01',
    titulo: 'Reunión General de Padres de Familia - Primaria',
    descripcion: 'Se cita a todos los apoderados del nivel Primaria a la asamblea informativa del primer trimestre este viernes a las 17:00 hrs.',
    fecha: getTodayStr(1) + ' 10:30',
    autor: 'Dirección Académica',
    autorRol: 'Administrador',
    aulaDestino: 'Todas Primaria',
    nivelDestino: 'Primaria'
  },
  {
    id: 'COM-02',
    titulo: 'Feria de Ciencias y Tecnología 2026',
    descripcion: 'Estimados alumnos de Secundaria: Se abren las inscripciones para la presentación de proyectos científicos institucionales.',
    fecha: getTodayStr(0) + ' 09:15',
    autor: 'Prof. Carlos Mendoza',
    autorRol: 'Docente Tutor',
    aulaDestino: '1.° Secundaria',
    nivelDestino: 'Secundaria'
  }
];

export const initialNotificaciones: Notificacion[] = [
  {
    id: 'NOT-001',
    estudianteId: 'EST-1001',
    padreId: 'PAD-301',
    titulo: 'Asistencia Registrada',
    mensaje: 'Su hijo(a) Mateo Alejandro ingresó a la institución a las 07:48:12 hrs.',
    fechaHora: getTodayStr(0) + ' 07:48:12',
    leida: false,
    canal: 'WhatsApp'
  },
  {
    id: 'NOT-002',
    estudianteId: 'EST-1006',
    padreId: 'PAD-302',
    titulo: 'Asistencia Registrada',
    mensaje: 'Su hijo(a) Diego Fernando ingresó a la institución a las 07:50:05 hrs.',
    fechaHora: getTodayStr(0) + ' 07:50:05',
    leida: true,
    canal: 'App'
  }
];

export const initialHistorialAccesos: HistorialAcceso[] = [
  {
    id: 'LOG-001',
    usuario: 'Administrador Principal',
    rol: 'admin',
    fechaHora: getTodayStr(0) + ' 07:30:00',
    ip: '192.168.1.10',
    accion: 'Inicio de sesión exitoso'
  },
  {
    id: 'LOG-002',
    usuario: 'Prof. Carmen Rosa Flores',
    rol: 'docente',
    fechaHora: getTodayStr(0) + ' 07:35:12',
    ip: '192.168.1.25',
    accion: 'Apertura de panel de asistencia de aula 1.° Primaria'
  }
];
