import React, { useEffect, useState } from 'react';
import { Estudiante } from '../../types';
import { generateQRCodeDataUrl } from '../../utils/qrUtils';
import { QrCode, User, Download, Printer } from 'lucide-react';
import { generateStudentQRCardsPDF } from '../../utils/pdfGenerator';

interface QRCarnetCardProps {
  estudiante: Estudiante;
}

export const QRCarnetCard: React.FC<QRCarnetCardProps> = ({ estudiante }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    generateQRCodeDataUrl(estudiante.qrCodeData || estudiante.id).then(setQrDataUrl);
  }, [estudiante]);

  return (
    <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl text-white relative overflow-hidden group">
      {/* Decorative top header accent */}
      <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 absolute top-0 left-0" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
            IE
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-tight">
              José Sabogal Diéguez (Josdic)
            </h4>
            <p className="text-[9px] text-slate-400 font-medium">Carnet de Identificación Estudiantil</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          2026
        </span>
      </div>

      {/* Body: QR Code + Student Info */}
      <div className="py-4 flex items-center gap-4">
        {/* QR Code Container */}
        <div className="w-28 h-28 bg-white p-1.5 rounded-2xl shadow-inner shrink-0 flex items-center justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR ${estudiante.id}`} className="w-full h-full object-contain" />
          ) : (
            <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
          )}
        </div>

        {/* Info */}
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-100 truncate leading-tight">
            {estudiante.apellidos}
          </p>
          <p className="text-xs text-blue-400 font-semibold truncate leading-tight mb-2">
            {estudiante.nombres}
          </p>

          <div className="text-[11px] space-y-0.5 text-slate-300">
            <p className="flex items-center gap-1">
              <span className="text-slate-400">ID:</span>
              <span className="font-mono font-bold text-white">{estudiante.id}</span>
            </p>
            <p className="flex items-center gap-1">
              <span className="text-slate-400">DNI:</span>
              <span className="font-medium">{estudiante.dni}</span>
            </p>
            <p className="flex items-center gap-1">
              <span className="text-slate-400">Aula:</span>
              <span className="font-bold text-emerald-400">
                {estudiante.nivel} {estudiante.grado} "{estudiante.seccion}"
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>Apoderado: {estudiante.nombreApoderado.split(' ')[0]}</span>
        <button
          onClick={() => generateStudentQRCardsPDF([estudiante])}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          title="Descargar Carnet PDF"
        >
          <Printer className="w-3 h-3 text-blue-400" />
          <span>Imprimir</span>
        </button>
      </div>
    </div>
  );
};
