import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, XCircle, RefreshCw, Copy, Check, Server, FileCode, AlertCircle } from 'lucide-react';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [dbStatus, setDbStatus] = useState<{
    connected?: boolean;
    message?: string;
    database?: string;
    host?: string;
    error?: string;
    config?: { dbHost: string; dbPort: number; dbUser: string; dbName: string };
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({
        connected: false,
        message: 'No se pudo conectar con el servidor backend Express',
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const envTemplate = `# Variables de Entorno MySQL (.env)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=asistencia_qr_db`;

  const copyEnvToClipboard = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Conexión a Base de Datos MySQL</h3>
              <p className="text-xs text-slate-400">Estado del servidor MySQL y configuración</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
              dbStatus?.connected
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {dbStatus?.connected ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-base">
                  {dbStatus?.connected ? 'MySQL Conectado Exitosamente' : 'MySQL No Conectado'}
                </h4>
                <p className="text-xs opacity-90 mt-1">{dbStatus?.message}</p>
                {dbStatus?.error && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-mono bg-slate-950/60 p-2 rounded text-rose-300 border border-rose-900/40">
                      Detalle: {dbStatus.error}
                    </p>
                    {dbStatus.error.includes('using password: NO') && (
                      <div className="bg-amber-900/40 border border-amber-600/50 p-2.5 rounded-lg text-xs text-amber-200">
                        💡 <strong>Solución:</strong> Tu MySQL requiere contraseña. Abre el archivo <code className="bg-slate-900 px-1 py-0.5 text-emerald-400 font-mono">.env</code> en tu proyecto y pon tu clave real en <code className="bg-slate-900 px-1 py-0.5 text-emerald-400 font-mono">DB_PASSWORD=tu_contraseña</code> (ej: <code className="bg-slate-900 px-1 py-0.5 text-amber-300 font-mono">DB_PASSWORD=admin123</code> o la clave que le diste a MySQL en XAMPP/Workbench).
                      </div>
                    )}
                    {dbStatus.error.includes('Unknown database') && (
                      <div className="bg-amber-900/40 border border-amber-600/50 p-2.5 rounded-lg text-xs text-amber-200">
                        💡 <strong>Solución:</strong> La base de datos no existe. Abre MySQL Workbench o phpMyAdmin y ejecuta el archivo <code className="bg-slate-900 px-1 py-0.5 text-emerald-400 font-mono">database.sql</code> para crear la base de datos y sus tablas.
                      </div>
                    )}
                    {dbStatus.error.includes('ECONNREFUSED') && (
                      <div className="bg-amber-900/40 border border-amber-600/50 p-2.5 rounded-lg text-xs text-amber-200">
                        💡 <strong>Solución:</strong> MySQL no está iniciado en tu computadora. Abre XAMPP o MySQL Workbench e inicia el servicio de MySQL.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={checkStatus}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-400' : ''}`} />
              Recomprobar
            </button>
          </div>

          {/* Pasos para conectar MySQL */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-red-400" />
              Pasos para conectar tu MySQL local (XAMPP / WAMP / Workbench / Docker)
            </h4>

            <ol className="list-decimal list-inside space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <li>
                <strong className="text-white">Crear la base de datos y tablas:</strong>
                <p className="mt-1 ml-5 text-slate-400">
                  Ejecuta el archivo <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded">database.sql</code> (incluido en la raíz del proyecto) en MySQL Workbench, phpMyAdmin o terminal.
                </p>
              </li>

              <li>
                <strong className="text-white">Configurar variables en el archivo .env:</strong>
                <p className="mt-1 ml-5 text-slate-400">
                  Asegúrate de definir las credenciales correctas de MySQL en tu archivo <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded">.env</code>:
                </p>
                <div className="mt-2 ml-5 bg-slate-900 p-3 rounded-lg border border-slate-800 relative group font-mono text-[11px] text-slate-300">
                  <button
                    onClick={copyEnvToClipboard}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors flex items-center gap-1 text-[10px]"
                  >
                    {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedEnv ? 'Copiado' : 'Copiar .env'}
                  </button>
                  <pre>{envTemplate}</pre>
                </div>
              </li>

              <li>
                <strong className="text-white">Iniciar el servidor:</strong>
                <p className="mt-1 ml-5 text-slate-400">
                  Ejecuta en tu consola: <code className="bg-slate-800 text-red-400 px-1.5 py-0.5 rounded">npm run dev</code>
                </p>
              </li>
            </ol>
          </div>

          <div className="bg-red-950/30 border border-red-900/40 p-4 rounded-xl flex items-start gap-3 text-xs text-red-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Modo Híbrido Automático:</span>
              <p className="mt-0.5 text-red-300/80">
                Si MySQL está desactivado o no disponible temporalmente, el sistema funcionará automáticamente en modo local (localStorage) para que nunca dejes de trabajar.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between">
          <a
            href="/database.sql"
            download="database.sql"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            Descargar database.sql
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
