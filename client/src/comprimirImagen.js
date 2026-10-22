// Reduce una foto para que pese como máximo `maxBytes` (3 MB por defecto).
// Si ya pesa menos, se devuelve tal cual. Se hace en el navegador, antes de subirla.

export const MAX_BYTES = 3 * 1024 * 1024;

function aBlob(canvas, calidad) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen'))),
      'image/jpeg',
      calidad
    );
  });
}

export async function comprimirImagen(file, maxBytes = MAX_BYTES) {
  if (!file.type.startsWith('image/') || file.size <= maxBytes) return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file); // respeta la orientación EXIF
  } catch {
    throw new Error('Este formato de imagen no se puede comprimir. Usa una foto JPG o PNG.');
  }

  let escala = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
  let calidad = 0.88;

  for (let intento = 0; intento < 12; intento++) {
    const w = Math.max(1, Math.round(bitmap.width * escala));
    const h = Math.max(1, Math.round(bitmap.height * escala));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; // los PNG con transparencia quedan sobre blanco
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await aBlob(canvas, calidad);
    if (blob.size <= maxBytes) {
      bitmap.close?.();
      const nombre = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
      return new File([blob], nombre, { type: 'image/jpeg', lastModified: Date.now() });
    }
    // Primero baja la calidad, y si no alcanza, reduce las dimensiones
    if (calidad > 0.6) calidad -= 0.1;
    else escala *= 0.8;
  }

  bitmap.close?.();
  throw new Error('No se pudo reducir la imagen a 3 MB. Intenta con otra foto.');
}
