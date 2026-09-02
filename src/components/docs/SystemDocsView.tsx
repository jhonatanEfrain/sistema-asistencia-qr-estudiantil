import React, { useState } from 'react';
import {
  Code2,
  Database,
  FileCode,
  BookOpen,
  Copy,
  Check,
  Download,
  Layers,
  Sparkles,
  Server,
  FolderTree,
  Terminal,
  Smartphone,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { getCompleteMySQLScript } from '../../utils/sqlGenerator';

export const SystemDocsView: React.FC = () => {
  const [activeDocTab, setActiveDocTab] = useState<string>('sql');
  const [copied, setCopied] = useState(false);

  const mysqlScript = getCompleteMySQLScript();

  const handleCopySQL = () => {
    navigator.clipboard.writeText(mysqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([mysqlScript], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asistencia_qr_db.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Documentación Técnica Oficial
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Entregables Técnicos y Arquitectura del Sistema
          </h2>
          <p className="text-xs text-slate-300">
            Script MySQL DDL, Diagramas ER/Casos de Uso, Manuales y Especificación de la API
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSQL}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Script .SQL</span>
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'sql', label: '1. Script SQL MySQL', icon: Database },
          { id: 'er', label: '2. Modelo ER / MER', icon: Layers },
          { id: 'usecases', label: '3. Casos de Uso & Arquitectura', icon: Server },
          { id: 'folders', label: '4. Estructura de Carpetas', icon: FolderTree },
          { id: 'manuals', label: '5. Manual Instalación / Usuario', icon: BookOpen },
          { id: 'api', label: '6. API REST & Servicios', icon: Terminal },
          { id: 'futuras', label: '7. Mejoras Futuras (WhatsApp & App)', icon: Smartphone },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeDocTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveDocTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SCRIPT SQL */}
      {activeDocTab === 'sql' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Script SQL Completo (MySQL 8.0+)
              </h3>
              <p className="text-xs text-slate-400">
                12 Tablas con Claves Primarias, Foráneas, Índices de Rendimiento y Procedimiento Almacenado
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Script'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-[500px] overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed">
            <pre>{mysqlScript}</pre>
          </div>
        </div>
      )}

      {/* TAB 2: MER DIAGRAM */}
      {activeDocTab === 'er' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-blue-400" />
            Diagrama Entidad-Relación (MER) de la Base de Datos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {[
              {
                table: 'estudiantes',
                pk: 'id (VARCHAR)',
                fk: 'aula_id -> aulas.id, padre_id -> padres.id',
                fields: ['numero_orden', 'apellidos', 'nombres', 'dni', 'estado', 'foto_url']
              },
              {
                table: 'asistencias',
                pk: 'id (BIGINT AUTO_INCREMENT)',
                fk: 'estudiante_id -> estudiantes.id, aula_id -> aulas.id',
                fields: ['fecha (DATE)', 'hora (TIME)', 'estado (Presente/Tardanza)', 'observacion']
              },
              {
                table: 'aulas',
                pk: 'id (VARCHAR)',
                fk: 'grado_id -> grados.id, tutor_docente_id -> docentes.id',
                fields: ['seccion', 'nivel (Primaria/Secundaria)', 'capacidad']
              },
              {
                table: 'docentes',
                pk: 'id (VARCHAR)',
                fk: 'usuario_id -> usuarios.id',
                fields: ['dni', 'nombres', 'apellidos', 'especialidad', 'email', 'telefono']
              },
              {
                table: 'padres',
                pk: 'id (VARCHAR)',
                fk: 'usuario_id -> usuarios.id',
                fields: ['nombres_completos', 'telefono', 'correo', 'direccion']
              },
              {
                table: 'usuarios',
                pk: 'id (INT AUTO_INCREMENT)',
                fk: 'rol_id -> roles.id',
                fields: ['nombre_usuario', 'correo', 'contrasena_hash', 'estado']
              },
              {
                table: 'comunicados',
                pk: 'id (INT AUTO_INCREMENT)',
                fk: 'aula_destino_id -> aulas.id',
                fields: ['titulo', 'descripcion', 'fecha_publicacion', 'autor_nombre', 'nivel_destino']
              },
              {
                table: 'notificaciones',
                pk: 'id (BIGINT AUTO_INCREMENT)',
                fk: 'estudiante_id -> estudiantes.id, padre_id -> padres.id',
                fields: ['titulo', 'mensaje', 'canal (WhatsApp/App)', 'estado_envio']
              },
              {
                table: 'historial_accesos',
                pk: 'id (BIGINT AUTO_INCREMENT)',
                fk: 'Sin FK (Auditoría Desconectada)',
                fields: ['usuario', 'rol', 'ip', 'accion', 'fecha_hora']
              },
            ].map(item => (
              <div key={item.table} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white font-mono text-sm">{item.table}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                    MySQL
                  </span>
                </div>
                <p className="text-slate-400"><strong className="text-blue-400">PK:</strong> {item.pk}</p>
                <p className="text-slate-400"><strong className="text-amber-400">FK:</strong> {item.fk}</p>
                <div className="pt-1 border-t border-slate-900 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">Atributos clave:</span>
                  <p className="font-mono text-[11px]">{item.fields.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USE CASES */}
      {activeDocTab === 'usecases' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-emerald-400" />
            Diagrama de Casos de Uso y Arquitectura Modular
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-blue-400 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Rol: Administrador
              </h4>
              <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                <li>CU01: Importar Padrón de Estudiantes (.xlsx)</li>
                <li>CU02: Generar y Reimprimir Carnets QR</li>
                <li>CU03: Gestión de Docentes y Asignación de Aulas</li>
                <li>CU04: Monitoreo Global de Asistencia en Tiempo Real</li>
                <li>CU05: Exportar Reportes Consolidados (PDF / Excel)</li>
                <li>CU06: Auditoría del Sistema e Historial de Accesos</li>
              </ul>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Rol: Docente / Tutor
              </h4>
              <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                <li>CU07: Iniciar Sesión de Docente</li>
                <li>CU08: Escanear QR en Puerta o Aula</li>
                <li>CU09: Consultar Asistencia de Aulas Asignadas</li>
                <li>CU10: Publicar Comunicados dirigidos a Grado</li>
                <li>CU11: Descargar Reporte de Asistencia de Aula</li>
              </ul>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Rol: Padre de Familia
              </h4>
              <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                <li>CU12: Iniciar Sesión (Nombre Hijo + DNI)</li>
                <li>CU13: Ver Estado de Ingreso del Día (Presente/Tardanza)</li>
                <li>CU14: Recibir Notificación Push / WhatsApp</li>
                <li>CU15: Consultar Comunicados Escolares</li>
                <li>CU16: Descargar Reporte PDF Individual</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FOLDERS STRUCTURE */}
      {activeDocTab === 'folders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FolderTree className="w-4 h-4 text-amber-400" />
            Estructura de Carpetas del Código Fuente
          </h3>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300">
            <pre>{`/
├── package.json                   # Dependencias npm (React 19, Tailwind, QR, PDF, Excel)
├── vite.config.ts                 # Configuración de Vite y alias
├── src/
│   ├── main.tsx                   # Punto de entrada principal
│   ├── App.tsx                    # Componente raíz con layout responsivo
│   ├── index.css                  # Estilos globales Tailwind CSS v4
│   ├── types.ts                   # Interfaces y tipos de TypeScript (Estudiante, Asistencia, etc)
│   ├── context/
│   │   └── AppContext.tsx         # Estado global del sistema y lógica de lectura QR
│   ├── data/
│   │   └── initialData.ts         # Datos de semilla iniciales (Colegio, Aulas, Alumnos, Profes)
│   ├── utils/
│   │   ├── qrUtils.ts             # Generación de QR (DataUrl, SVG)
│   │   ├── excelUtils.ts          # Lectura (.xlsx) con SheetJS y exportación
│   │   ├── pdfGenerator.ts        # Generador de reportes PDF y Carnets QR con jsPDF
│   │   └── sqlGenerator.ts        # Script SQL ejecutable en MySQL 8.0+
│   └── components/
│       ├── Navbar.tsx             # Barra superior responsiva con selector de roles y timbre
│       ├── Sidebar.tsx            # Menú lateral adaptado a celular y desktop
│       ├── scanner/
│       │   ├── QRScannerModal.tsx # Lector de cámara HTML5 y simulador rápido 1-click
│       │   └── QRCarnetCard.tsx   # Carnet Estudiantil con código QR imprimible
│       ├── admin/
│       │   ├── AdminDashboard.tsx # Métricas generales y gráficas de Recharts
│       │   ├── StudentManager.tsx # CRUD Estudiantes con importador Excel
│       │   ├── TeacherManager.tsx # CRUD Docentes
│       │   ├── ParentManager.tsx  # Padrón de apoderados
│       │   ├── ClassroomManager.tsx# Mantenimiento de Aulas Primaria/Secundaria
│       │   └── UserSecurityManager.tsx # Seguridad y auditoría de accesos
│       ├── teacher/
│       │   └── TeacherPortal.tsx  # Portal de Aulas asignadas al docente
│       ├── parent/
│       │   └── ParentPortal.tsx   # Portal del Apoderado con avisos WhatsApp
│       ├── reports/
│       │   └── ReportsView.tsx    # Centro de exportación de informes PDF/Excel
│       └── docs/
│           └── SystemDocsView.tsx # Entregables técnicos y documentación`}</pre>
          </div>
        </div>
      )}

      {/* TAB 5: MANUALS */}
      {activeDocTab === 'manuals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Manual de Instalación y Guía de Usuario
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-sm">🛠️ Manual de Instalación</h4>
              <ol className="list-decimal pl-4 space-y-2">
                <li>
                  <strong>Requisitos:</strong> Node.js v18+, Servidor MySQL 8.0+, Cámara web o lector de código de barras.
                </li>
                <li>
                  <strong>Base de Datos:</strong> Crear base de datos <code className="text-emerald-400">asistencia_qr_db</code> y ejecutar el script en la pestaña SQL.
                </li>
                <li>
                  <strong>Instalar dependencias:</strong> Executar <code className="text-blue-400">npm install</code>.
                </li>
                <li>
                  <strong>Iniciar Entorno:</strong> Ejecutar <code className="text-blue-400">npm run dev</code> y acceder a <code className="text-emerald-400">http://localhost:3000</code>.
                </li>
              </ol>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-sm">📖 Guía de Uso Rápido</h4>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <strong>Lector QR:</strong> Presionar el botón verde "Escanear QR" o usar la opción "Simulador Rápido" para pruebas inmediatas sin cámara.
                </li>
                <li>
                  <strong>Importar Alumnos:</strong> Ir a "Gestión Estudiantes" -&gt; "Importar Excel" y subir un archivo .xlsx con DNI, Grado y Apoderado.
                </li>
                <li>
                  <strong>Imprimir Carnets:</strong> Seleccionar los estudiantes y hacer clic en "Imprimir Carnets QR" para generar el archivo PDF listo para enviar a imprenta.
                </li>
                <li>
                  <strong>Cambio de Roles:</strong> En la barra superior, usar el menú de usuario para probar el panel como Director, Profesor o Apoderado.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REST API */}
      {activeDocTab === 'api' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Especificación de Servicios de la API REST
          </h3>

          <div className="space-y-3 text-xs">
            {[
              {
                method: 'POST',
                endpoint: '/api/asistencia/escaneo-qr',
                desc: 'Registra la entrada de un estudiante mediante la lectura del código QR',
                payload: '{ "codigo_qr": "EST-1001", "dispositivo_id": "CAM_PUERTA_01" }',
                resp: '{ "status": "200", "message": "Asistencia registrada correctamente [Presente]", "hora": "07:48:12" }'
              },
              {
                method: 'GET',
                endpoint: '/api/estudiantes/exportar-excel',
                desc: 'Retorna el padrón escolar de Primaria y Secundaria en formato binario Excel',
                payload: 'Query params: nivel=Primaria&grado=1.°',
                resp: 'File attachment (.xlsx)'
              },
              {
                method: 'POST',
                endpoint: '/api/comunicados/publicar',
                desc: 'Publica un nuevo comunicado escolar para ser notificado a los padres',
                payload: '{ "titulo": "Aviso", "descripcion": "Contenido", "aulaDestino": "1.° Primaria" }',
                resp: '{ "status": "201", "id": "COM-102" }'
              },
            ].map(api => (
              <div key={api.endpoint} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-600 text-white font-mono">
                    {api.method}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{api.endpoint}</span>
                </div>
                <p className="text-slate-300">{api.desc}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-900 p-2 rounded-xl text-slate-400">
                    <span className="text-blue-400 block font-bold">Payload Request:</span>
                    {api.payload}
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl text-slate-400">
                    <span className="text-emerald-400 block font-bold">Response JSON:</span>
                    {api.resp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: FUTURAS MEJORAS */}
      {activeDocTab === 'futuras' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Propuesta de Escalabilidad y Mejoras Futuras
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-emerald-400 text-sm">1. WhatsApp API Oficial</h4>
              <p className="text-slate-300">
                Integración con Twilio o Meta WhatsApp Business Cloud API para envío automático de mensajes de confirmación de asistencia.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-blue-400 text-sm">2. Reconocimiento Facial</h4>
              <p className="text-slate-300">
                Lector alternativo mediante cámara web asistida por Inteligencia Artificial para evitar olvidos de carnets físicos.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-400 text-sm">3. Aplicación Móvil Nativa</h4>
              <p className="text-slate-300">
                App en Flutter / React Native para que los padres reciban notificaciones Push en tiempo real en sus celulares.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
