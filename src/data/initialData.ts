import {
  Aula,
  Asistencia,
  Comunicado,
  ConfiguracionHorario,
  Docente,
  Estudiante,
  HistorialAcceso,
  MensajeChat,
  Notificacion,
  Padre,
  UserAccount,
} from '../types';

export const initialConfig: ConfiguracionHorario = {
  horaIngresoNormal: '08:00',
  horaLimiteTardanza: '08:15',
  nombreInstitucion: 'José Sabogal Diéguez (Josdic)',
  direccion: 'Av. Las Flores 456, Lima',
  telefono: '(01) 456-7890',
};

export const initialAulas: Aula[] = [
  {
    id: 'AUL-P1A',
    grado: '1.°',
    seccion: 'A',
    nivel: 'Primaria',
    tutorDocenteId: 'DOC-201',
    tutorNombre: 'Prof. Carmen Rosa Flores',
    capacidad: 30,
  },
  {
    id: 'AUL-P2A',
    grado: '2.°',
    seccion: 'A',
    nivel: 'Primaria',
    tutorDocenteId: 'DOC-202',
    tutorNombre: 'Prof. Luis Alberto Vega',
    capacidad: 30,
  },
  {
    id: 'AUL-S1A',
    grado: '1.°',
    seccion: 'A',
    nivel: 'Secundaria',
    tutorDocenteId: 'DOC-203',
    tutorNombre: 'Prof. Elena Chávez Salas',
    capacidad: 30,
  },
];

export const initialEstudiantes: Estudiante[] = [
  {
    id: 'EST-1001',
    numeroOrden: 1,
    apellidos: 'Álvarez Rojas',
    nombres: 'Mateo',
    dni: '72819301',
    grado: '1.°',
    seccion: 'A',
    nivel: 'Primaria',
    aulaId: 'AUL-P1A',
    nombreApoderado: 'Juan Carlos Álvarez',
    telefonoApoderado: '987654321',
    correoApoderado: 'jalvarez@gmail.com',
    qrCodeData: 'EST-1001',
  },
  {
    id: 'EST-1002',
    numeroOrden: 2,
    apellidos: 'Mendoza Ruiz',
    nombres: 'Valeria',
    dni: '73920412',
    grado: '1.°',
    seccion: 'A',
    nivel: 'Primaria',
    aulaId: 'AUL-P1A',
    nombreApoderado: 'Rosa Elena Ruiz',
    telefonoApoderado: '986123450',
    correoApoderado: 'rruiz@gmail.com',
    qrCodeData: 'EST-1002',
  },
  {
    id: 'EST-1003',
    numeroOrden: 1,
    apellidos: 'Torres Silva',
    nombres: 'Diego',
    dni: '74135520',
    grado: '2.°',
    seccion: 'A',
    nivel: 'Primaria',
    aulaId: 'AUL-P2A',
    nombreApoderado: 'Lucía Silva Pérez',
    telefonoApoderado: '985445566',
    correoApoderado: 'lsilva@gmail.com',
    qrCodeData: 'EST-1003',
  },
  {
    id: 'EST-1004',
    numeroOrden: 1,
    apellidos: 'Rojas Díaz',
    nombres: 'Camila',
    dni: '75246631',
    grado: '1.°',
    seccion: 'A',
    nivel: 'Secundaria',
    aulaId: 'AUL-S1A',
    nombreApoderado: 'Marco Antonio Rojas',
    telefonoApoderado: '984112233',
    correoApoderado: 'mrojas@gmail.com',
    qrCodeData: 'EST-1004',
  },
];

export const initialDocentes: Docente[] = [
  {
    id: 'DOC-201',
    dni: '43111222',
    nombres: 'Carmen Rosa',
    apellidos: 'Flores',
    especialidad: 'Educación Primaria',
    email: 'c.flores@colegio.edu.pe',
    telefono: '981111222',
    aulasAsignadas: ['AUL-P1A'],
  },
  {
    id: 'DOC-202',
    dni: '44222333',
    nombres: 'Luis Alberto',
    apellidos: 'Vega',
    especialidad: 'Educación Primaria',
    email: 'l.vega@colegio.edu.pe',
    telefono: '982222333',
    aulasAsignadas: ['AUL-P2A'],
  },
  {
    id: 'DOC-203',
    dni: '45333444',
    nombres: 'Elena',
    apellidos: 'Chávez Salas',
    especialidad: 'Comunicación',
    email: 'e.chavez@colegio.edu.pe',
    telefono: '983333444',
    aulasAsignadas: ['AUL-S1A'],
  },
];

export const initialPadres: Padre[] = initialEstudiantes.map((estudiante) => ({
  id: `PAD-${estudiante.id}`,
  estudianteDni: estudiante.dni,
  estudianteId: estudiante.id,
  nombrePadre: estudiante.nombreApoderado,
  telefono: estudiante.telefonoApoderado,
  email: estudiante.correoApoderado,
}));

export const initialUsuarios: UserAccount[] = [
  {
    id: 'USR-001',
    nombre: 'Lic. Roberto Valdivia (Director)',
    email: 'admin@colegio.edu.pe',
    password: 'admin123',
    rol: 'admin',
    dni: '40998877',
    activo: true,
  },
  ...initialDocentes.map((docente) => ({
    id: `USR-${docente.id}`,
    nombre: `Prof. ${docente.nombres} ${docente.apellidos}`,
    email: docente.email,
    password:
      docente.id === 'DOC-201' ? 'docente123' : docente.id === 'DOC-202' ? 'luis123' : 'elena123',
    rol: 'docente' as const,
    dni: docente.dni,
    assignedAulas: docente.aulasAsignadas,
    activo: true,
  })),
  ...initialEstudiantes.map((estudiante) => ({
    id: `USR-PAD-${estudiante.id}`,
    nombre: `${estudiante.nombreApoderado} (Apoderado de ${estudiante.nombres} ${estudiante.apellidos})`,
    email: estudiante.correoApoderado || `${estudiante.id.toLowerCase()}@padre.colegio.edu.pe`,
    password: estudiante.dni,
    rol: 'padre' as const,
    dni: estudiante.dni,
    estudianteId: estudiante.id,
    activo: true,
  })),
];

export const initialAsistencias: Asistencia[] = [];

export const initialComunicados: Comunicado[] = [
  {
    id: 'COM-DEMO-001',
    titulo: 'Bienvenida a la comunidad educativa',
    descripcion: 'Damos la bienvenida a las familias. Los avisos oficiales se publicarán únicamente en esta plataforma.',
    fecha: '2026-09-02 08:00',
    autor: 'Lic. Roberto Valdivia (Director)',
    autorId: 'USR-001',
    autorRol: 'Administrador',
    alcance: 'colegio',
    aulaDestino: 'Todo el colegio',
    nivelDestino: 'Todos',
  },
  {
    id: 'COM-DEMO-002',
    titulo: 'Reunión de familias de 1.° A',
    descripcion: 'Se convoca a las familias del aula para coordinar las actividades del mes.',
    fecha: '2026-09-02 09:15',
    autor: 'Prof. Carmen Rosa Flores',
    autorId: 'USR-DOC-201',
    autorRol: 'Docente',
    alcance: 'aula',
    aulaId: 'AUL-P1A',
    aulaDestino: 'Primaria 1.° “A”',
    nivelDestino: 'Primaria',
  },
];

export const initialNotificaciones: Notificacion[] = initialEstudiantes.flatMap((estudiante) => {
  const general: Notificacion = {
    id: `NOT-DEMO-GEN-${estudiante.id}`,
    estudianteId: estudiante.id,
    padreId: `PAD-${estudiante.id}`,
    usuarioDestinoId: `USR-PAD-${estudiante.id}`,
    comunicadoId: 'COM-DEMO-001',
    titulo: 'Bienvenida a la comunidad educativa',
    mensaje: 'Los avisos oficiales se publicarán únicamente dentro de esta plataforma.',
    fechaHora: '2026-09-02 08:00:00',
    leida: false,
    tipo: 'comunicado',
    canal: 'App',
  };
  if (estudiante.aulaId !== 'AUL-P1A') return [general];
  return [
    general,
    {
      id: `NOT-DEMO-AUL-${estudiante.id}`,
      estudianteId: estudiante.id,
      padreId: `PAD-${estudiante.id}`,
      usuarioDestinoId: `USR-PAD-${estudiante.id}`,
      comunicadoId: 'COM-DEMO-002',
      titulo: 'Reunión de familias de 1.° A',
      mensaje: 'Se convoca a las familias del aula para coordinar las actividades del mes.',
      fechaHora: '2026-09-02 09:15:00',
      leida: false,
      tipo: 'comunicado',
      canal: 'App',
    },
  ];
});

export const initialMensajesChat: MensajeChat[] = [
  {
    id: 'MSG-DEMO-001',
    docenteUsuarioId: 'USR-DOC-201',
    padreUsuarioId: 'USR-PAD-EST-1002',
    estudianteId: 'EST-1002',
    remitenteId: 'USR-DOC-201',
    remitenteRol: 'docente',
    contenido: 'Buenos días, quería felicitar a Valeria por su participación en clase.',
    fechaHora: '2026-09-02 10:20:00',
    leido: false,
  },
  {
    id: 'MSG-DEMO-002',
    docenteUsuarioId: 'USR-DOC-201',
    padreUsuarioId: 'USR-PAD-EST-1002',
    estudianteId: 'EST-1002',
    remitenteId: 'USR-PAD-EST-1002',
    remitenteRol: 'padre',
    contenido: 'Muchas gracias, profesora. Estaremos atentos a las próximas actividades.',
    fechaHora: '2026-09-02 10:28:00',
    leido: true,
  },
];

export const initialHistorialAccesos: HistorialAcceso[] = [];
