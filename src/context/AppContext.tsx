import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  User,
  Role,
  UserAccount,
  Estudiante,
  Aula,
  Docente,
  Padre,
  Asistencia,
  Comunicado,
  Notificacion,
  HistorialAcceso,
  ConfiguracionHorario,
  EstadoAsistencia
} from '../types';
import {
  initialConfig,
  initialUsuarios,
  initialAulas,
  initialEstudiantes,
  initialDocentes,
  initialPadres,
  initialAsistencias,
  initialComunicados,
  initialNotificaciones,
  initialHistorialAccesos
} from '../data/initialData';

export interface ScanAlert {
  id: string;
  success: boolean;
  message: string;
  asistencia?: Asistencia;
  estudiante?: Estudiante;
  timestamp: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentRole: Role;
  switchRole: (role: Role) => void;
  login: (emailOrDni: string, password?: string, role?: Role) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isDbConnected: boolean;
  checkDbConnection: () => Promise<void>;

  activeTab: string;
  setActiveTab: (tab: string) => void;

  // App Data
  config: ConfiguracionHorario;
  updateConfig: (newConfig: Partial<ConfiguracionHorario>) => void;
  usuarios: UserAccount[];
  aulas: Aula[];
  estudiantes: Estudiante[];
  docentes: Docente[];
  padres: Padre[];
  asistencias: Asistencia[];
  comunicados: Comunicado[];
  notificaciones: Notificacion[];
  historialAccesos: HistorialAcceso[];

  // User Accounts Actions
  addUsuario: (usuario: Omit<UserAccount, 'id'>) => void;
  updateUsuario: (id: string, updated: Partial<UserAccount>) => void;
  deleteUsuario: (id: string) => void;

  // Actions
  addEstudiante: (estudiante: Omit<Estudiante, 'id' | 'qrCodeData'>) => void;
  updateEstudiante: (id: string, updated: Partial<Estudiante>) => void;
  deleteEstudiante: (id: string) => void;
  importEstudiantesBatch: (estudiantesBatch: Array<Omit<Estudiante, 'id' | 'qrCodeData'>>) => void;

  addDocente: (docente: Omit<Docente, 'id'>) => void;
  importDocentesBatch: (batch: Array<Omit<Docente, 'id'>>) => Array<{ email: string; password: string; nombre: string }>;
  addPadre: (padre: Omit<Padre, 'id'>) => void;
  addAula: (aula: Omit<Aula, 'id'>) => void;

  registerAttendanceViaQR: (qrData: string) => { success: boolean; message: string; asistencia?: Asistencia };
  addManualAsistencia: (asistencia: Omit<Asistencia, 'id'>) => void;

  addComunicado: (comunicado: Omit<Comunicado, 'id' | 'fecha'>) => void;
  markNotificationAsRead: (id: string) => void;

  // Theme & UI helpers
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isScannerModalOpen: boolean;
  setIsScannerModalOpen: (open: boolean) => void;
  latestScanAlert: ScanAlert | null;
  clearLatestScanAlert: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Autenticación de Usuario
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('asistencia_auth') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('asistencia_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'USR-001',
      name: 'Lic. Roberto Valdivia (Director)',
      email: 'admin@colegio.edu.pe',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    };
  });

  const [currentRole, setCurrentRole] = useState<Role>(currentUser.role || 'admin');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  // Estados de datos principales con persistencia en localStorage
  const [config, setConfig] = useState<ConfiguracionHorario>(() => {
    try {
      const saved = localStorage.getItem('asistencia_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialConfig;
  });

  const [usuarios, setUsuarios] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('asistencia_usuarios');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialUsuarios;
  });

  const [aulas, setAulas] = useState<Aula[]>(() => {
    try {
      const saved = localStorage.getItem('asistencia_aulas');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialAulas;
  });

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>(() => {
    try {
      const saved = localStorage.getItem('asistencia_estudiantes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialEstudiantes;
  });

  const [docentes, setDocentes] = useState<Docente[]>(() => {
    try {
      const saved = localStorage.getItem('asistencia_docentes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialDocentes;
  });

  const [padres, setPadres] = useState<Padre[]>(() => {
    try {
      const saved = localStorage.getItem('asistencia_padres');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialPadres;
  });

  const [asistencias, setAsistencias] = useState<Asistencia[]>(() => {
    try {
      const saved = localStorage.getItem('asistencia_asistencias');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialAsistencias;
  });

  const [comunicados, setComunicados] = useState<Comunicado[]>(() => {
    try {
      const saved = localStorage.getItem('asistencia_comunicados');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialComunicados;
  });

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() => {
    try {
      const saved = localStorage.getItem('asistencia_notificaciones');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialNotificaciones;
  });

  const [historialAccesos, setHistorialAccesos] = useState<HistorialAcceso[]>(initialHistorialAccesos);

  // Guardar automáticamente cambios en localStorage
  useEffect(() => {
    try { localStorage.setItem('asistencia_estudiantes', JSON.stringify(estudiantes)); } catch (e) {}
  }, [estudiantes]);

  useEffect(() => {
    try { localStorage.setItem('asistencia_docentes', JSON.stringify(docentes)); } catch (e) {}
  }, [docentes]);

  useEffect(() => {
    try { localStorage.setItem('asistencia_asistencias', JSON.stringify(asistencias)); } catch (e) {}
  }, [asistencias]);

  useEffect(() => {
    try { localStorage.setItem('asistencia_aulas', JSON.stringify(aulas)); } catch (e) {}
  }, [aulas]);

  useEffect(() => {
    try { localStorage.setItem('asistencia_padres', JSON.stringify(padres)); } catch (e) {}
  }, [padres]);

  useEffect(() => {
    try { localStorage.setItem('asistencia_usuarios', JSON.stringify(usuarios)); } catch (e) {}
  }, [usuarios]);

  useEffect(() => {
    try { localStorage.setItem('asistencia_comunicados', JSON.stringify(comunicados)); } catch (e) {}
  }, [comunicados]);

  useEffect(() => {
    try { localStorage.setItem('asistencia_notificaciones', JSON.stringify(notificaciones)); } catch (e) {}
  }, [notificaciones]);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('asistencia_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('asistencia_theme', next);
      return next;
    });
  };

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [latestScanAlert, setLatestScanAlert] = useState<ScanAlert | null>(null);

  // Cache síncrono para bloqueo instantáneo de duplicados
  const scannedRecordsRef = useRef<Set<string>>(new Set());

  const clearLatestScanAlert = () => setLatestScanAlert(null);

  // Helper para fecha local en formato YYYY-MM-DD
  const getLocalDateStr = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sincronizar cache de asistencias escaneadas
  useEffect(() => {
    const set = new Set<string>();
    const today = getLocalDateStr();
    asistencias.forEach(a => {
      const cleanFecha = typeof a.fecha === 'string' ? a.fecha.split('T')[0] : today;
      if (a.estudianteId && cleanFecha) {
        set.add(`${a.estudianteId}_${cleanFecha}`);
      }
    });
    scannedRecordsRef.current = set;
  }, [asistencias]);

  // Verificar estado de conexión a MySQL y sincronizar datos
  const checkDbConnection = async () => {
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      if (data.connected) {
        setIsDbConnected(true);
        fetchBackendData();
      } else {
        setIsDbConnected(false);
      }
    } catch (e) {
      setIsDbConnected(false);
    }
  };

  // Cargar todos los datos desde MySQL
  const fetchBackendData = async () => {
    try {
      const [estRes, asisRes, docRes, padRes, aulRes, comRes, notRes, cfgRes, usrRes] = await Promise.all([
        fetch('/api/estudiantes').then(r => r.json()).catch(() => null),
        fetch('/api/asistencias').then(r => r.json()).catch(() => null),
        fetch('/api/docentes').then(r => r.json()).catch(() => null),
        fetch('/api/padres').then(r => r.json()).catch(() => null),
        fetch('/api/aulas').then(r => r.json()).catch(() => null),
        fetch('/api/comunicados').then(r => r.json()).catch(() => null),
        fetch('/api/notificaciones').then(r => r.json()).catch(() => null),
        fetch('/api/config').then(r => r.json()).catch(() => null),
        fetch('/api/usuarios').then(r => r.json()).catch(() => null),
      ]);

      if (estRes?.connected && Array.isArray(estRes.data) && estRes.data.length > 0) setEstudiantes(estRes.data);
      if (asisRes?.connected && Array.isArray(asisRes.data) && asisRes.data.length > 0) setAsistencias(asisRes.data);
      if (docRes?.connected && Array.isArray(docRes.data) && docRes.data.length > 0) setDocentes(docRes.data);
      if (padRes?.connected && Array.isArray(padRes.data) && padRes.data.length > 0) setPadres(padRes.data);
      if (aulRes?.connected && Array.isArray(aulRes.data) && aulRes.data.length > 0) setAulas(aulRes.data);
      if (comRes?.connected && Array.isArray(comRes.data) && comRes.data.length > 0) setComunicados(comRes.data);
      if (notRes?.connected && Array.isArray(notRes.data) && notRes.data.length > 0) setNotificaciones(notRes.data);
      if (cfgRes?.connected && cfgRes.data) setConfig(cfgRes.data);
      if (usrRes?.connected && Array.isArray(usrRes.data) && usrRes.data.length > 0) setUsuarios(usrRes.data);
    } catch (err) {
      console.error('Error cargando datos de MySQL:', err);
    }
  };

  useEffect(() => {
    checkDbConnection();
  }, []);

  // Login de Usuario Avanzado (Búsqueda por usuario, email, DNI o nombre del alumno)
  const login = async (emailOrDni: string, password?: string, role?: Role) => {
    const selectedRole = role || 'admin';
    try {
      // Intentar primero autenticar con el backend MySQL
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrDni, password, role: selectedRole })
      });
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        setCurrentRole(data.user.role);
        setIsAuthenticated(true);
        localStorage.setItem('asistencia_auth', 'true');
        localStorage.setItem('asistencia_user', JSON.stringify(data.user));
        setActiveTab(data.user.role === 'admin' ? 'dashboard' : data.user.role === 'docente' ? 'docente_aulas' : 'padre_hijo');
        return { success: true };
      }
    } catch (e) {
      console.warn('Backend login fallback used');
    }

    // Fallback local login si MySQL no tiene aún ese usuario o no está activo
    const cleanInput = emailOrDni.trim().toLowerCase();

    // 1. Buscar en lista local de cuentas de usuario
    const matchedAccount = usuarios.find(u =>
      (u.email.toLowerCase() === cleanInput || (u.dni && u.dni === cleanInput) || u.id.toLowerCase() === cleanInput) &&
      (!role || u.rol === role)
    );

    if (matchedAccount) {
      if (matchedAccount.password && password && matchedAccount.password !== password) {
        return { success: false, error: 'Contraseña incorrecta' };
      }
      const userToSet: User = {
        id: matchedAccount.id,
        name: matchedAccount.nombre,
        email: matchedAccount.email,
        role: matchedAccount.rol,
        dni: matchedAccount.dni,
        estudianteId: matchedAccount.estudianteId,
        assignedAulas: matchedAccount.assignedAulas,
        avatar: matchedAccount.avatar
      };
      setCurrentUser(userToSet);
      setCurrentRole(userToSet.role);
      setIsAuthenticated(true);
      localStorage.setItem('asistencia_auth', 'true');
      localStorage.setItem('asistencia_user', JSON.stringify(userToSet));
      setActiveTab(userToSet.role === 'admin' ? 'dashboard' : userToSet.role === 'docente' ? 'docente_aulas' : 'padre_hijo');
      return { success: true };
    }

    // 2. Si no encontró cuenta formal, buscar en estudiantes por nombre, DNI, o correo de apoderado
    const matchedStudent = estudiantes.find(e =>
      e.id.toLowerCase() === cleanInput ||
      e.dni === cleanInput ||
      (e.correoApoderado && e.correoApoderado.toLowerCase() === cleanInput) ||
      `${e.nombres} ${e.apellidos}`.toLowerCase().includes(cleanInput) ||
      `${e.apellidos} ${e.nombres}`.toLowerCase().includes(cleanInput) ||
      e.nombreApoderado.toLowerCase().includes(cleanInput)
    );

    if (matchedStudent) {
      if (password && password.trim() !== matchedStudent.dni.trim()) {
        return { success: false, error: 'Contraseña incorrecta. Para ingresar como Apoderado, la contraseña debe ser el número de DNI de su menor hijo.' };
      }
      const userToSet: User = {
        id: `USR-PAD-${matchedStudent.id}`,
        name: `${matchedStudent.nombreApoderado || 'Apoderado'} (Padre de ${matchedStudent.nombres} ${matchedStudent.apellidos})`,
        email: matchedStudent.correoApoderado || `${matchedStudent.id.toLowerCase()}@padre.colegio.edu.pe`,
        role: 'padre',
        dni: matchedStudent.dni,
        estudianteId: matchedStudent.id,
        avatar: matchedStudent.fotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
      };
      setCurrentUser(userToSet);
      setCurrentRole('padre');
      setIsAuthenticated(true);
      localStorage.setItem('asistencia_auth', 'true');
      localStorage.setItem('asistencia_user', JSON.stringify(userToSet));
      setActiveTab('padre_hijo');
      return { success: true };
    }

    return { success: false, error: 'No se encontró ninguna cuenta ni alumno registrado con esa información' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('asistencia_auth');
    localStorage.removeItem('asistencia_user');
  };

  // Cambiar rol dinámico dentro de la sesión
  const switchRole = (newRole: Role) => {
    setCurrentRole(newRole);
    if (newRole === 'admin') {
      setCurrentUser(prev => ({ ...prev, role: 'admin', name: 'Lic. Roberto Valdivia (Director)' }));
      setActiveTab('dashboard');
    } else if (newRole === 'docente') {
      setCurrentUser(prev => ({ ...prev, role: 'docente', name: 'Prof. Carmen Rosa Flores', assignedAulas: ['AUL-P1A', 'AUL-P2A'] }));
      setActiveTab('docente_aulas');
    } else if (newRole === 'padre') {
      setCurrentUser(prev => ({ ...prev, role: 'padre', name: 'Juan Carlos Alvarez (Apoderado)', estudianteId: 'EST-1001', dni: '72819301' }));
      setActiveTab('padre_hijo');
    }
  };

  const updateConfig = (newConfig: Partial<ConfiguracionHorario>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    if (isDbConnected) {
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(console.error);
    }
  };

  // Agregar Estudiante
  const addEstudiante = (data: Omit<Estudiante, 'id' | 'qrCodeData'>) => {
    const nextNum = estudiantes.length + 1001;
    const newId = `EST-${nextNum}`;
    const newEst: Estudiante = {
      ...data,
      id: newId,
      qrCodeData: newId
    };
    setEstudiantes(prev => [newEst, ...prev]);

    fetch('/api/estudiantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEst)
    }).catch(err => console.warn('Sync POST /api/estudiantes fallback:', err));
  };

  // Modificar Estudiante
  const updateEstudiante = (id: string, updated: Partial<Estudiante>) => {
    setEstudiantes(prev => {
      const list = prev.map(est => est.id === id ? { ...est, ...updated } : est);
      const target = list.find(e => e.id === id);
      if (target) {
        fetch('/api/estudiantes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(target)
        }).catch(err => console.warn('Sync POST /api/estudiantes fallback:', err));
      }
      return list;
    });
  };

  // Eliminar Estudiante
  const deleteEstudiante = (id: string) => {
    setEstudiantes(prev => prev.filter(est => est.id !== id));
    fetch(`/api/estudiantes/${id}`, { method: 'DELETE' }).catch(err => console.warn('Sync DELETE fallback:', err));
  };

  // Importar Lote de Estudiantes
  const importEstudiantesBatch = (batch: Array<Omit<Estudiante, 'id' | 'qrCodeData'>>) => {
    const startNum = estudiantes.length + 1001;
    const newStudents: Estudiante[] = batch.map((item, index) => {
      const id = `EST-${startNum + index}`;
      return {
        ...item,
        id,
        qrCodeData: id
      };
    });
    setEstudiantes(prev => [...newStudents, ...prev]);

    newStudents.forEach(st => {
      fetch('/api/estudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(st)
      }).catch(err => console.warn('Batch sync fallback:', err));
    });
  };

  // Docentes
  const addDocente = (data: Omit<Docente, 'id'>) => {
    const newId = `DOC-${docentes.length + 201}`;
    const newDoc: Docente = { ...data, id: newId };
    setDocentes(prev => [newDoc, ...prev]);

    // Auto-generate password based on first name
    const firstNameClean = data.nombres.split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const autoPassword = `${firstNameClean || 'docente'}123`;

    // Create corresponding user account
    const newAccount: UserAccount = {
      id: `USR-${newId}`,
      nombre: `Prof. ${data.nombres} ${data.apellidos}`,
      email: data.email,
      password: autoPassword,
      rol: 'docente',
      dni: data.dni,
      assignedAulas: data.aulasAsignadas,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      activo: true
    };
    setUsuarios(prev => [...prev, newAccount]);

    // Update aulas state so tutorNombre and tutorDocenteId are assigned
    setAulas(prevAulas => {
      return prevAulas.map(aula => {
        if (data.aulasAsignadas.includes(aula.id)) {
          return {
            ...aula,
            tutorDocenteId: newId,
            tutorNombre: `Prof. ${data.nombres} ${data.apellidos}`
          };
        }
        return aula;
      });
    });

    if (isDbConnected) {
      fetch('/api/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      }).catch(console.error);
      fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      }).catch(console.error);
    }
  };

  // Importar Lote de Docentes desde Excel
  const importDocentesBatch = (batch: Array<Omit<Docente, 'id'>>) => {
    const startNum = docentes.length + 201;
    const createdCredentials: Array<{ email: string; password: string; nombre: string }> = [];

    const newDocs: Docente[] = batch.map((item, index) => {
      const newId = `DOC-${startNum + index}`;

      // Auto-generate password based on first name
      const firstNameClean = item.nombres.split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
      const autoPassword = `${firstNameClean || 'docente'}123`;

      createdCredentials.push({
        email: item.email,
        password: autoPassword,
        nombre: `Prof. ${item.nombres} ${item.apellidos}`
      });

      // Create user account for login
      const newAccount: UserAccount = {
        id: `USR-${newId}`,
        nombre: `Prof. ${item.nombres} ${item.apellidos}`,
        email: item.email,
        password: autoPassword,
        rol: 'docente',
        dni: item.dni,
        assignedAulas: item.aulasAsignadas,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        activo: true
      };

      setUsuarios(prev => {
        const exists = prev.some(u => u.email.toLowerCase() === item.email.toLowerCase());
        return exists ? prev.map(u => u.email.toLowerCase() === item.email.toLowerCase() ? newAccount : u) : [...prev, newAccount];
      });

      // Update tutor on assigned aulas
      setAulas(prevAulas => {
        return prevAulas.map(aula => {
          if (item.aulasAsignadas.includes(aula.id)) {
            return {
              ...aula,
              tutorDocenteId: newId,
              tutorNombre: `Prof. ${item.nombres} ${item.apellidos}`
            };
          }
          return aula;
        });
      });

      return {
        ...item,
        id: newId
      };
    });

    setDocentes(prev => [...newDocs, ...prev]);

    if (isDbConnected) {
      newDocs.forEach(doc => {
        fetch('/api/docentes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc)
        }).catch(console.error);
      });
    }

    return createdCredentials;
  };

  // Padres
  const addPadre = (data: Omit<Padre, 'id'>) => {
    const newId = `PAD-${padres.length + 301}`;
    const newPad: Padre = { ...data, id: newId };
    setPadres(prev => [newPad, ...prev]);
    if (isDbConnected) {
      fetch('/api/padres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPad)
      }).catch(console.error);
    }
  };

  // Aulas
  const addAula = (data: Omit<Aula, 'id'>) => {
    const prefix = data.nivel === 'Primaria' ? 'P' : 'S';
    const newId = `AUL-${prefix}${data.grado.replace('°', '').replace('.', '')}${data.seccion}`;
    const newAula: Aula = { ...data, id: newId };
    setAulas(prev => [...prev, newAula]);
  };

  // REGISTRO DE ASISTENCIA VÍA QR (STRICT DUPLICATE PREVENTION)
  const registerAttendanceViaQR = (qrData: string) => {
    const cleanedCode = qrData.trim();
    const est = estudiantes.find(e => e.id === cleanedCode || e.qrCodeData === cleanedCode || e.dni === cleanedCode);

    if (!est) {
      const errRes = {
        success: false,
        message: `El código QR escaneado ("${cleanedCode}") no corresponde a ningún estudiante registrado.`
      };
      setLatestScanAlert({
        id: `ALERT-${Date.now()}`,
        success: false,
        message: errRes.message,
        timestamp: new Date().toLocaleTimeString()
      });
      return errRes;
    }

    const now = new Date();
    const todayStr = getLocalDateStr(now);
    const scanKey = `${est.id}_${todayStr}`;

    // 1. Verificación en cache síncrono
    const isAlreadyScannedInRef = scannedRecordsRef.current.has(scanKey);

    // 2. Verificación en estado de asistencias
    const yaRegistro = asistencias.find(a => {
      const aFecha = typeof a.fecha === 'string' ? a.fecha.split('T')[0] : '';
      return a.estudianteId === est.id && (aFecha === todayStr || a.fecha === todayStr);
    });

    if (isAlreadyScannedInRef || yaRegistro) {
      const horaInfo = yaRegistro ? ` a las ${yaRegistro.hora}` : '';
      const dupRes = {
        success: false,
        message: `⚠️ ATENCIÓN: El estudiante ${est.apellidos}, ${est.nombres} YA registró su asistencia el día de hoy (${todayStr})${horaInfo}.`
      };
      setLatestScanAlert({
        id: `ALERT-${Date.now()}`,
        success: false,
        message: dupRes.message,
        estudiante: est,
        timestamp: new Date().toLocaleTimeString()
      });
      return dupRes;
    }

    // REGISTRAR INMEDIATAMENTE en la ref síncrona para bloquear lecturas de cámara subsecuentes
    scannedRecordsRef.current.add(scanKey);

    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');
    const currentS = String(now.getSeconds()).padStart(2, '0');
    const currentTimeStr = `${currentH}:${currentM}:${currentS}`;

    // Calcular estado (Presente o Tardanza)
    const [normH, normM] = config.horaLimiteTardanza.split(':').map(Number);
    const limitMinutes = normH * 60 + normM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const estado: EstadoAsistencia = currentMinutes <= limitMinutes ? 'Presente' : 'Tardanza';

    const nuevaAsistencia: Asistencia = {
      id: `ASI-${Date.now()}`,
      estudianteId: est.id,
      estudianteNombre: `${est.apellidos}, ${est.nombres}`,
      dni: est.dni,
      fecha: todayStr,
      hora: currentTimeStr,
      estado,
      aulaId: est.aulaId,
      grado: est.grado,
      seccion: est.seccion,
      nivel: est.nivel
    };

    setAsistencias(prev => [nuevaAsistencia, ...prev]);

    // Enviar a la base de datos MySQL
    if (isDbConnected) {
      fetch('/api/asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaAsistencia)
      }).catch(console.error);
    }

    // Generar Notificación para Apoderado
    const notif: Notificacion = {
      id: `NOT-${Date.now()}`,
      estudianteId: est.id,
      titulo: `Asistencia Registrada (${estado})`,
      mensaje: `Su hijo(a) ${est.nombres} ${est.apellidos} ingresó a la institución a las ${currentTimeStr} hrs [${estado}].`,
      fechaHora: `${todayStr} ${currentTimeStr}`,
      leida: false,
      canal: 'WhatsApp'
    };

    setNotificaciones(prev => [notif, ...prev]);
    if (isDbConnected) {
      fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif)
      }).catch(console.error);
    }

    const successRes = {
      success: true,
      message: `✅ Asistencia registrada correctamente: ${est.nombres} ${est.apellidos} (${estado}) - ${currentTimeStr}`,
      asistencia: nuevaAsistencia
    };

    setLatestScanAlert({
      id: `ALERT-${Date.now()}`,
      success: true,
      message: successRes.message,
      asistencia: nuevaAsistencia,
      estudiante: est,
      timestamp: currentTimeStr
    });

    return successRes;
  };

  // Gestión de Usuarios Acceso
  const addUsuario = (data: Omit<UserAccount, 'id'>) => {
    const newId = `USR-${String(usuarios.length + 1).padStart(3, '0')}`;
    const newUser: UserAccount = { ...data, id: newId, activo: true };
    setUsuarios(prev => [...prev, newUser]);
    if (isDbConnected) {
      fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(console.error);
    }
  };

  const updateUsuario = (id: string, updated: Partial<UserAccount>) => {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    const target = usuarios.find(u => u.id === id);
    if (target && isDbConnected) {
      fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, ...updated })
      }).catch(console.error);
    }
  };

  const deleteUsuario = (id: string) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
    if (isDbConnected) {
      fetch(`/api/usuarios/${id}`, { method: 'DELETE' }).catch(console.error);
    }
  };

  // Asistencia manual
  const addManualAsistencia = (data: Omit<Asistencia, 'id'>) => {
    const newAsis: Asistencia = {
      ...data,
      id: `ASI-${Date.now()}`
    };
    setAsistencias(prev => [newAsis, ...prev]);
    if (isDbConnected) {
      fetch('/api/asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsis)
      }).catch(console.error);
    }
  };

  // Comunicados
  const addComunicado = (data: Omit<Comunicado, 'id' | 'fecha'>) => {
    const dateStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5);
    const newCom: Comunicado = {
      ...data,
      id: `COM-${Date.now()}`,
      fecha: dateStr
    };
    setComunicados(prev => [newCom, ...prev]);
    if (isDbConnected) {
      fetch('/api/comunicados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCom)
      }).catch(console.error);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    if (isDbConnected) {
      fetch(`/api/notificaciones/${id}/read`, { method: 'PUT' }).catch(console.error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        setCurrentUser,
        currentRole,
        switchRole,
        login,
        logout,
        isDbConnected,
        checkDbConnection,
        activeTab,
        setActiveTab,
        config,
        updateConfig,
        usuarios,
        aulas,
        estudiantes,
        docentes,
        padres,
        asistencias,
        comunicados,
        notificaciones,
        historialAccesos,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        addEstudiante,
        updateEstudiante,
        deleteEstudiante,
        importEstudiantesBatch,
        addDocente,
        importDocentesBatch,
        addPadre,
        addAula,
        registerAttendanceViaQR,
        addManualAsistencia,
        addComunicado,
        markNotificationAsRead,
        theme,
        toggleTheme,
        soundEnabled,
        setSoundEnabled,
        isScannerModalOpen,
        setIsScannerModalOpen,
        latestScanAlert,
        clearLatestScanAlert
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe ser usado dentro de un AppProvider');
  return context;
};
