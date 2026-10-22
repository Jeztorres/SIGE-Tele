import { supabase } from './supabase';

// Cliente de la función "drive" de Supabase (supabase/functions/drive).
// La app no habla con Google ni conoce sus claves: la función guarda las fotos en el Drive
// del administrador y entrega enlaces temporales solo de las fotos de cada maestro.

export const driveActivo = import.meta.env.VITE_USAR_DRIVE === 'true';

const URL_FUNCION = `${(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')}/functions/v1/drive`;

async function cabeceras() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
  return { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY };
}

async function llamar(opciones) {
  let res;
  try {
    res = await fetch(URL_FUNCION, opciones);
  } catch {
    throw new Error('No se pudo conectar con el servicio de fotos (Google Drive). Revisa tu internet o que la función "drive" esté publicada en Supabase.');
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || `El servicio de fotos respondió con error ${res.status}.`);
  return datos;
}

// Sube una foto o PDF (máx. 3 MB). Devuelve el id del archivo en Drive.
export async function subirADrive(archivo) {
  const forma = new FormData();
  forma.append('archivo', archivo, archivo.name);
  const datos = await llamar({ method: 'POST', headers: await cabeceras(), body: forma });
  return datos.id;
}

// Pide enlaces temporales (1 hora) para ver las fotos. Devuelve { idDrive: url }.
export async function firmarEnDrive(ids) {
  if (!ids.length) return {};
  const mapa = {};
  for (let i = 0; i < ids.length; i += 150) {
    const lote = ids.slice(i, i + 150);
    const datos = await llamar({
      method: 'POST',
      headers: { ...(await cabeceras()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'firmar', ids: lote })
    });
    Object.assign(mapa, datos.urls || {});
  }
  return mapa;
}

export async function borrarEnDrive(id) {
  await llamar({
    method: 'POST',
    headers: { ...(await cabeceras()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'borrar', id })
  });
}
