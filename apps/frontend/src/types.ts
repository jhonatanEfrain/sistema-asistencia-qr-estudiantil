export type Role = 'admin' | 'docente' | 'padre';

export type Nivel = 'Primaria' | 'Secundaria';

export type EstadoAsistencia = 'Presente' | 'Tardanza' | 'Inasistencia' | 'Justificado';

export type AlcanceComunicado = 'colegio' | 'aula';

export type TipoNotificacion = 'asistencia' | 'comunicado' | 'mensaje';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  dni?: string;
  avatar?: string;
  assignedAulas?: string[]; // IDs de aulas para docentes
  estudianteId?: string; // Para padres
}

export interface UserAccount {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  rol: Role;
  dni?: string;
  estudianteId?: string;
  assignedAulas?: string[];
  avatar?: string;
  activo?: boolean;
}

export interface Estudiante {
  id: string; // Número de orden / ID único
  numeroOrden: number;
  apellidos: string;
  nombres: string;
  dni: string;
  grado: string; // Ej. "1.°", "2.°", etc.
  seccion: string; // Ej. "A", "B"
  nivel: Nivel;
  aulaId: string;
  nombreApoderado: string;
  telefonoApoderado: string;
  correoApoderado?: string;
  qrCodeData: string;
  fotoUrl?: string;
}

export interface Aula {
  id: string;
  grado: string;
  seccion: string;
  nivel: Nivel;
  tutorDocenteId?: string;
  tutorNombre?: string;
  capacidad: number;
}

export interface Docente {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  email: string;
  telefono: string;
  aulasAsignadas: string[];
}

export interface Padre {
  id: string;
  estudianteDni: string;
  estudianteId: string;
  nombrePadre: string;
  telefono: string;
  email?: string;
}

export interface Asistencia {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  dni: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM:SS
  estado: EstadoAsistencia;
  aulaId: string;
  grado: string;
  seccion: string;
  nivel: Nivel;
  observacion?: string;
}

export interface Comunicado {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string; // YYYY-MM-DD HH:MM
  autor: string;
  autorId: string;
  autorRol: string;
  alcance: AlcanceComunicado;
  aulaId?: string;
  aulaDestino: string; // Ej. "1.° Primaria", "2.° Secundaria", "Todas"
  nivelDestino?: Nivel | 'Todos';
}

export interface Notificacion {
  id: string;
  estudianteId: string;
  padreId?: string;
  usuarioDestinoId?: string;
  comunicadoId?: string;
  titulo: string;
  mensaje: string;
  fechaHora: string;
  leida: boolean;
  tipo: TipoNotificacion;
  canal: 'App';
}

export interface MensajeChat {
  id: string;
  docenteUsuarioId: string;
  padreUsuarioId: string;
  estudianteId: string;
  remitenteId: string;
  remitenteRol: 'docente' | 'padre';
  contenido: string;
  fechaHora: string;
  leido: boolean;
}

export interface HistorialAcceso {
  id: string;
  usuario: string;
  rol: string;
  fechaHora: string;
  ip: string;
  accion: string;
}

export interface ConfiguracionHorario {
  horaIngresoNormal: string; // "08:00"
  horaLimiteTardanza: string; // "08:15"
  nombreInstitucion: string;
  direccion: string;
  telefono: string;
}
