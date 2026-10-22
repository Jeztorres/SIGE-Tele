// Membrete editable de los documentos (reporte del CTE, expediente del alumno y Excel).

export const MEMBRETE_DEFAULT = {
  encabezado: 'Secretaría de Educación Pública • Subsistema de Telesecundarias',
  lema: '',
  pie: '',
  logoIzq: '',
  logoIzqRatio: 1,
  logoDer: '',
  logoDerRatio: 1,
  color: '#050F1A'
};

export const COLORES_MEMBRETE = [
  { nombre: 'Negro', valor: '#050F1A' },
  { nombre: 'Azul', valor: '#0052FF' },
  { nombre: 'Verde', valor: '#05724A' },
  { nombre: 'Guinda', valor: '#7A1F3D' },
  { nombre: 'Gris', valor: '#5B616E' }
];

// Une lo guardado por el maestro con los valores por defecto
export function unirMembrete(guardado) {
  const m = { ...MEMBRETE_DEFAULT, ...(guardado || {}) };
  if (typeof m.encabezado !== 'string') m.encabezado = MEMBRETE_DEFAULT.encabezado;
  return m;
}

// Lee un logo, lo reduce (máx. 320 px de alto) y lo devuelve como imagen incrustada.
// Se guarda dentro de la configuración, así que debe pesar poco.
export function procesarLogo(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Elige un archivo de imagen (PNG, JPG o SVG).'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_ALTO = 320;
      const MAX_ANCHO = 640;
      const base = Math.min(1, MAX_ALTO / (img.naturalHeight || MAX_ALTO), MAX_ANCHO / (img.naturalWidth || MAX_ANCHO));
      let escala = base;
      for (let intento = 0; intento < 6; intento++) {
        const w = Math.max(1, Math.round((img.naturalWidth || 200) * escala));
        const h = Math.max(1, Math.round((img.naturalHeight || 200) * escala));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        // PNG conserva la transparencia; si pesa demasiado se reduce más
        const dataUrl = canvas.toDataURL('image/png');
        if (dataUrl.length <= 220 * 1024) {
          resolve({ src: dataUrl, ratio: w / h });
          return;
        }
        escala *= 0.75;
      }
      reject(new Error('El logo es demasiado pesado. Prueba con una imagen más sencilla.'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}
