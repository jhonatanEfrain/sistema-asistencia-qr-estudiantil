import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Asistencia, Estudiante } from '../types';
import { generateQRCodeDataUrl } from './qrUtils';

/**
 * Genera y descarga un PDF con el reporte institucional de asistencias
 */
export function generateAttendancePDFReport(
  asistencias: Asistencia[],
  titulo = 'Reporte Oficial de Asistencia Estudiantil',
  filtrosInfo = 'Filtros: Todos los registros'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Cabecera institucional
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('JOSÉ SABOGAL DIÉGUEZ (JOSDIC)', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Sistema de Control y Registro de Asistencia por Código QR', 14, 18);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`, 14, 23);

  // Título del reporte
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(titulo, 14, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(filtrosInfo, 14, 44);

  // Resumen estadístico
  const total = asistencias.length;
  const presentes = asistencias.filter(a => a.estado === 'Presente').length;
  const tardanzas = asistencias.filter(a => a.estado === 'Tardanza').length;
  const inasistencias = asistencias.filter(a => a.estado === 'Inasistencia').length;
  const porcentaje = total > 0 ? Math.round(((presentes + tardanzas) / total) * 100) : 0;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 48, 182, 16, 2, 2, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Total Registros: ${total}   |   Presentes: ${presentes}   |   Tardanzas: ${tardanzas}   |   Inasistencias: ${inasistencias}   |   Efectividad: ${porcentaje}%`, 20, 58);

  // Tabla de asistencias
  const tableRows = asistencias.map((a, i) => [
    (i + 1).toString(),
    a.estudianteId,
    a.estudianteNombre,
    a.dni,
    `${a.nivel} ${a.grado} "${a.seccion}"`,
    a.fecha,
    a.hora,
    a.estado
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['N°', 'ID', 'Estudiante', 'DNI', 'Aula / Grado', 'Fecha', 'Hora', 'Estado']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 55 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 32 },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' }
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 7) {
        const val = data.cell.raw;
        if (val === 'Presente') {
          data.cell.styles.textColor = [22, 101, 52]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Tardanza') {
          data.cell.styles.textColor = [161, 98, 7]; // Yellow/Amber
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Inasistencia') {
          data.cell.styles.textColor = [185, 28, 28]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pageCount} - Documento Oficial generado por Sistema QR Escolar`, 105, 290, { align: 'center' });
  }

  doc.save(`${titulo.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Genera un PDF impreso con las credenciales / Carnets de Estudiantes con sus Códigos QR
 */
export async function generateStudentQRCardsPDF(estudiantes: Estudiante[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const cardsPerPage = 8;
  const cardWidth = 85;
  const cardHeight = 54;
  const startX = 15;
  const startY = 15;
  const gapX = 10;
  const gapY = 12;

  for (let i = 0; i < estudiantes.length; i++) {
    const est = estudiantes[i];
    const pageIndex = Math.floor(i / cardsPerPage);
    const itemOnPage = i % cardsPerPage;

    if (itemOnPage === 0 && i > 0) {
      doc.addPage();
    }

    const col = itemOnPage % 2;
    const row = Math.floor(itemOnPage / 2);

    const x = startX + col * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);

    // Fondo y borde del carnet
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

    // Header del carnet
    doc.setFillColor(15, 23, 42); // Navy Dark
    doc.roundedRect(x, y, cardWidth, 12, 3, 3, 'F');
    doc.rect(x, y + 8, cardWidth, 4, 'F'); // llenar esquina inferior del header

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('JOSÉ SABOGAL DIÉGUEZ (JOSDIC)', x + cardWidth / 2, y + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('CARNET DE IDENTIFICACIÓN ESTUDIANTIL', x + cardWidth / 2, y + 10, { align: 'center' });

    // Código QR en imagen
    const qrDataUrl = await generateQRCodeDataUrl(est.qrCodeData || est.id);
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', x + 5, y + 15, 30, 30);
    }

    // Datos del Estudiante
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const fullName = `${est.apellidos}, ${est.nombres}`;
    const truncatedName = fullName.length > 25 ? fullName.substring(0, 23) + '...' : fullName;
    doc.text(truncatedName, x + 38, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`ID: ${est.id}`, x + 38, y + 23);
    doc.text(`DNI: ${est.dni}`, x + 38, y + 27);
    doc.text(`Nivel: ${est.nivel}`, x + 38, y + 31);
    doc.text(`Grado: ${est.grado} "${est.seccion}"`, x + 38, y + 35);
    doc.text(`Apoderado: ${est.nombreApoderado}`, x + 38, y + 39);

    // Footer del carnet
    doc.setFillColor(226, 232, 240);
    doc.rect(x, y + cardHeight - 6, cardWidth, 6, 'F');
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('Acreditación escolar para lectura de asistencia vía QR', x + cardWidth / 2, y + cardHeight - 2, { align: 'center' });
  }

  doc.save(`Carnets_Estudiantiles_QR_${new Date().toISOString().slice(0, 10)}.pdf`);
}
