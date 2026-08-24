import QRCode from 'qrcode';

/**
 * Genera un código QR en formato Data URL (base64 image PNG)
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H'
    });
    return dataUrl;
  } catch (err) {
    console.error('Error al generar código QR:', err);
    return '';
  }
}

/**
 * Genera un código QR SVG string
 */
export async function generateQRCodeSVG(text: string): Promise<string> {
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    return svg;
  } catch (err) {
    console.error('Error al generar QR SVG:', err);
    return '';
  }
}
