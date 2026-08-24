import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useApp } from '../../context/AppContext';
import { QrCode, X, Camera, CheckCircle2, AlertTriangle, RefreshCw, Volume2, Sparkles, User, Search } from 'lucide-react';
import { Asistencia } from '../../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const {
    registerAttendanceViaQR,
    estudiantes,
    asistencias,
    soundEnabled
  } = useApp();

  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean;
    message: string;
    asistencia?: Asistencia;
  } | null>(null);

  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'simulator'>('camera');
  const [scannerError, setScannerError] = useState<string | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const lastScanTimeRef = useRef<{ [code: string]: number }>({});

  // Reproductor sintetizado de sonidos (AudioContext)
  const playAudioBeep = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // Tono doble de éxito (Chime alto)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Buzzer de advertencia o duplicado
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.error('Audio play error', e);
    }
  };

  // Inicializar HTML5-QRCode scanner cuando el modal está abierto
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      const scannerId = 'qr-reader-container';
      const element = document.getElementById(scannerId);

      if (!element) return;

      try {
        const scanner = new Html5QrcodeScanner(
          scannerId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            showTorchButtonIfSupported: true
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            handleProcessQR(decodedText);
          },
          (errorMessage) => {
            // Ignorar errores de frame no leídos
          }
        );

        scannerRef.current = scanner;
        setScannerError(null);
      } catch (err: any) {
        console.error('Error iniciando scanner:', err);
        setScannerError('No se pudo acceder a la cámara o el permiso fue denegado.');
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  const handleProcessQR = (qrCode: string) => {
    const now = Date.now();
    const lastTime = lastScanTimeRef.current[qrCode] || 0;
    // Ignorar lecturas repetidas de la cámara en un intervalo menor a 4 segundos
    if (now - lastTime < 4000) {
      return;
    }
    lastScanTimeRef.current[qrCode] = now;

    const res = registerAttendanceViaQR(qrCode);
    setLastScanResult(res);

    if (res.success) {
      playAudioBeep('success');
    } else {
      playAudioBeep('error');
    }
  };

  if (!isOpen) return null;

  const filteredStudents = estudiantes.filter(e =>
    `${e.nombres} ${e.apellidos} ${e.dni} ${e.id}`.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Módulo Lector de Asistencia QR
              </h3>
              <p className="text-xs text-slate-400">
                Escané la tarjeta del estudiante o seleccione uno en el simulador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'camera'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Cámara en Vivo
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Simulador Rápido QR ({estudiantes.length} alumnos)
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Scanner Feedback Banner */}
          {lastScanResult && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                lastScanResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              {lastScanResult.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold text-sm leading-tight mb-1">{lastScanResult.message}</p>
                {lastScanResult.asistencia && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Hora Entrada</span>
                      <span className="font-mono font-bold text-white">{lastScanResult.asistencia.hora}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Estado</span>
                      <span className="font-bold text-emerald-300">{lastScanResult.asistencia.estado}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nivel y Grado</span>
                      <span className="font-semibold text-slate-200">
                        {lastScanResult.asistencia.nivel} {lastScanResult.asistencia.grado} "{lastScanResult.asistencia.seccion}"
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Notificación</span>
                      <span className="font-medium text-emerald-400">Enviada a Apoderado</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center justify-center">
              {scannerError ? (
                <div className="p-6 text-center max-w-md bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-200">{scannerError}</p>
                  <p className="text-xs text-slate-400">
                    Asegúrese de otorgar permisos de cámara o utilice la pestaña "Simulador Rápido QR".
                  </p>
                  <button
                    onClick={() => setActiveTab('simulator')}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500"
                  >
                    Usar Simulador Rápido QR
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 shadow-inner">
                  <div id="qr-reader-container" className="rounded-xl overflow-hidden"></div>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Apunte la cámara al código QR impreso en el Carnet Estudiantil
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIMULATOR (1-CLICK TEST) */}
          {activeTab === 'simulator' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar estudiante por DNI, Nombre o Grado..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredStudents.map(st => {
                  const hoy = new Date().toISOString().split('T')[0];
                  const registrado = asistencias.find(a => a.estudianteId === st.id && a.fecha === hoy);

                  return (
                    <div
                      key={st.id}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                          {st.fotoUrl ? (
                            <img src={st.fotoUrl} alt={st.nombres} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400 m-2" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200 leading-tight">
                            {st.apellidos}, {st.nombres}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {st.nivel} {st.grado} "{st.seccion}" • DNI: {st.dni}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleProcessQR(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          registrado
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        {registrado ? ' Ya Marcar' : '⚡ Escanear QR'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Lector en tiempo real activo</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Cerrar Escáner
          </button>
        </div>
      </div>
    </div>
  );
};
