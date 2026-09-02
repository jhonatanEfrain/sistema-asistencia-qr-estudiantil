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
  }
];

export const initialAulas: Aula[] = [];

export const initialEstudiantes: Estudiante[] = [];

export const initialDocentes: Docente[] = [];

export const initialPadres: Padre[] = [];

export const initialAsistencias: Asistencia[] = [];

export const initialComunicados: Comunicado[] = [];

export const initialNotificaciones: Notificacion[] = [];

export const initialHistorialAccesos: HistorialAcceso[] = [];
