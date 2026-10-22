// Edge Function "drive": guarda las fotos de evidencias en el Google Drive del administrador.
//
// La app NUNCA habla con Google ni conoce sus claves: habla con esta función, que usa un
// permiso (refresh token) guardado como secreto en Supabase. Los maestros no tienen acceso
// a Drive; solo ven sus propias fotos a través de esta función.
//
//   POST (multipart)  → sube una foto/PDF (máx. 3 MB) y devuelve su id de Drive
//   POST {accion:"firmar", ids:[...]} → devuelve enlaces temporales (1 h) para ver las fotos
//   POST {accion:"borrar", id}        → borra una foto (solo si es del maestro que lo pide)
//   GET  ?id&exp&sig                  → entrega la imagen si el enlace firmado es válido
//
// Secretos necesarios (Supabase → Edge Functions → Secrets):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
//   (opcional) LINK_SECRET: texto aleatorio para firmar los enlaces
// Supabase ya aporta SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.

export const MAX_BYTES = 3 * 1024 * 1024;
export const VIGENCIA_ENLACE_S = 3600;
const NOMBRE_RAIZ = 'SIGE-Tele-Evidencias';
const MIME_CARPETA = 'application/vnd.google-apps.folder';
const API = 'https://www.googleapis.com/drive/v3';
const API_SUBIDA = 'https://www.googleapis.com/upload/drive/v3';

export interface Tablas {
  leerCarpeta(userId: string): Promise<string | null>;
  guardarCarpeta(userId: string, folderId: string): Promise<void>;
  leerRaiz(): Promise<string | null>;
  guardarRaiz(folderId: string): Promise<void>;
}

export interface Deps {
  env(clave: string): string | undefined;
  fetch: typeof fetch;
  /** Devuelve el usuario dueño del token de sesión, o null si no es válido */
  usuarioDeToken(jwt: string): Promise<{ id: string } | null>;
  /** De los ids de Drive dados, cuáles tiene el maestro en su tabla de evidencias (respeta RLS) */
  idsPermitidos(jwt: string, ids: string[]): Promise<string[]>;
  tablas: Tablas;
  ahora(): number; // milisegundos
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

class ErrorHttp extends Error {
  estado: number;
  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.estado = estado;
  }
}

const json = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, 'Content-Type': 'application/json' } });

// ── Tipo real del archivo según sus primeros bytes (no se confía en lo que diga el navegador) ──
export function detectarTipo(b: Uint8Array): { mime: string; ext: string } | null {
  const empieza = (...bytes: number[]) => bytes.every((v, i) => b[i] === v);
  if (empieza(0xff, 0xd8, 0xff)) return { mime: 'image/jpeg', ext: 'jpg' };
  if (empieza(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: 'image/png', ext: 'png' };
  if (empieza(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  if (empieza(0x25, 0x50, 0x44, 0x46)) return { mime: 'application/pdf', ext: 'pdf' };
  return null;
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');

async function firmaHmac(secreto: string, mensaje: string): Promise<string> {
  const llave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', llave, new TextEncoder().encode(mensaje)));
}

function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const idValido = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{10,80}$/.test(id);

export function crearManejador(d: Deps) {
  let tokenGoogle: { valor: string; expira: number } | null = null;

  const secretoEnlaces = () => {
    const s = d.env('LINK_SECRET') || d.env('SUPABASE_SERVICE_ROLE_KEY');
    if (!s) throw new ErrorHttp(500, 'La función no tiene secreto para firmar enlaces (LINK_SECRET).');
    return s;
  };

  async function accessToken(): Promise<string> {
    if (tokenGoogle && tokenGoogle.expira > d.ahora() + 60_000) return tokenGoogle.valor;
    const id = d.env('GOOGLE_CLIENT_ID');
    const secreto = d.env('GOOGLE_CLIENT_SECRET');
    const refresco = d.env('GOOGLE_REFRESH_TOKEN');
    if (!id || !secreto || !refresco) {
      throw new ErrorHttp(500, 'Faltan los secretos de Google (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN).');
    }
    const r = await d.fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: id, client_secret: secreto, refresh_token: refresco, grant_type: 'refresh_token' })
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok || !datos.access_token) {
      throw new ErrorHttp(502, 'Google rechazó las credenciales. Genera de nuevo el GOOGLE_REFRESH_TOKEN (¿la app de Google está en modo Producción?).');
    }
    tokenGoogle = { valor: datos.access_token, expira: d.ahora() + (Number(datos.expires_in) || 3600) * 1000 };
    return tokenGoogle.valor;
  }

  async function drive(ruta: string, init: RequestInit = {}, base = API): Promise<Response> {
    const token = await accessToken();
    const cab = new Headers(init.headers);
    cab.set('Authorization', `Bearer ${token}`);
    return d.fetch(`${base}${ruta}`, { ...init, headers: cab });
  }

  async function crearCarpeta(nombre: string, padre?: string): Promise<string> {
    const r = await drive('/files?fields=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nombre, mimeType: MIME_CARPETA, ...(padre ? { parents: [padre] } : {}) })
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok || !datos.id) throw new ErrorHttp(502, 'No se pudo crear la carpeta en Drive.');
    return datos.id as string;
  }

  async function carpetaRaiz(): Promise<string> {
    const guardada = await d.tablas.leerRaiz();
    if (guardada) return guardada;
    const q = encodeURIComponent(`name='${NOMBRE_RAIZ}' and mimeType='${MIME_CARPETA}' and 'root' in parents and trashed=false`);
    const r = await drive(`/files?q=${q}&fields=files(id)&spaces=drive`);
    const datos = await r.json().catch(() => ({}));
    const id = datos.files?.[0]?.id || (await crearCarpeta(NOMBRE_RAIZ));
    await d.tablas.guardarRaiz(id);
    return id;
  }

  async function carpetaDelMaestro(userId: string): Promise<string> {
    const guardada = await d.tablas.leerCarpeta(userId);
    if (guardada) return guardada;
    // El nombre no lleva datos personales: solo un fragmento del identificador del maestro
    const id = await crearCarpeta(`maestro-${userId.slice(0, 8)}`, await carpetaRaiz());
    await d.tablas.guardarCarpeta(userId, id);
    return id;
  }

  async function autenticar(req: Request): Promise<{ id: string; jwt: string }> {
    const cab = req.headers.get('Authorization') || '';
    const jwt = cab.startsWith('Bearer ') ? cab.slice(7).trim() : '';
    const usuario = jwt ? await d.usuarioDeToken(jwt) : null;
    if (!usuario) throw new ErrorHttp(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
    return { id: usuario.id, jwt };
  }

  // ── Subir ──
  async function subir(req: Request): Promise<Response> {
    const usuario = await autenticar(req);
    const declarado = Number(req.headers.get('Content-Length') || 0);
    if (declarado > MAX_BYTES + 64 * 1024) throw new ErrorHttp(413, 'El archivo pesa más de 3 MB.');

    const forma = await req.formData().catch(() => null);
    const archivo = forma?.get('archivo');
    if (!(archivo instanceof File)) throw new ErrorHttp(400, 'No se recibió ningún archivo.');
    if (archivo.size > MAX_BYTES) throw new ErrorHttp(413, 'El archivo pesa más de 3 MB.');
    if (archivo.size === 0) throw new ErrorHttp(400, 'El archivo está vacío.');

    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const tipo = detectarTipo(bytes);
    if (!tipo) throw new ErrorHttp(415, 'Solo se permiten fotos (JPG, PNG, WebP) o PDF.');

    const nombre = `evi_${crypto.randomUUID()}.${tipo.ext}`;
    const metadatos = {
      name: nombre,
      mimeType: tipo.mime,
      appProperties: { app: 'sige-tele', userId: usuario.id }
    };

    const intentar = async (carpeta: string) => {
      const limite = `sige${crypto.randomUUID().replace(/-/g, '')}`;
      const enc = new TextEncoder();
      const cabeza = enc.encode(
        `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ ...metadatos, parents: [carpeta] })}\r\n` +
          `--${limite}\r\nContent-Type: ${tipo.mime}\r\n\r\n`
      );
      const cola = enc.encode(`\r\n--${limite}--`);
      const cuerpo = new Uint8Array(cabeza.length + bytes.length + cola.length);
      cuerpo.set(cabeza, 0);
      cuerpo.set(bytes, cabeza.length);
      cuerpo.set(cola, cabeza.length + bytes.length);
      return drive(
        '/files?uploadType=multipart&fields=id,size',
        { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${limite}` }, body: cuerpo },
        API_SUBIDA
      );
    };

    let carpeta = await carpetaDelMaestro(usuario.id);
    let r = await intentar(carpeta);
    if (r.status === 404) {
      // La carpeta guardada ya no existe en Drive (alguien la borró): se vuelve a crear
      const raiz = await crearCarpeta(NOMBRE_RAIZ);
      await d.tablas.guardarRaiz(raiz);
      carpeta = await crearCarpeta(`maestro-${usuario.id.slice(0, 8)}`, raiz);
      await d.tablas.guardarCarpeta(usuario.id, carpeta);
      r = await intentar(carpeta);
    }
    const datos = await r.json().catch(() => ({}));
    if (!r.ok || !datos.id) throw new ErrorHttp(502, 'Drive no aceptó el archivo. Inténtalo de nuevo.');
    return json({ id: datos.id, tamanio: archivo.size, mime: tipo.mime });
  }

  // ── Firmar enlaces temporales ──
  async function firmar(usuario: { jwt: string }, ids: unknown): Promise<Response> {
    if (!Array.isArray(ids) || ids.length > 200 || !ids.every(idValido)) throw new ErrorHttp(400, 'Lista de archivos no válida.');
    const permitidos = new Set(await d.idsPermitidos(usuario.jwt, ids));
    const secreto = secretoEnlaces();
    const base = `${(d.env('SUPABASE_URL') || '').replace(/\/$/, '')}/functions/v1/drive`;
    const exp = Math.floor(d.ahora() / 1000) + VIGENCIA_ENLACE_S;
    const urls: Record<string, string> = {};
    for (const id of ids) {
      if (!permitidos.has(id)) continue; // si no es suyo, simplemente no se le da enlace
      urls[id] = `${base}?id=${encodeURIComponent(id)}&exp=${exp}&sig=${await firmaHmac(secreto, `${id}.${exp}`)}`;
    }
    return json({ urls });
  }

  // ── Borrar ──
  async function borrar(usuario: { id: string }, id: unknown): Promise<Response> {
    if (!idValido(id)) throw new ErrorHttp(400, 'Archivo no válido.');
    const meta = await drive(`/files/${id}?fields=appProperties`);
    if (meta.status === 404) return json({ ok: true }); // ya no existe
    const datos = await meta.json().catch(() => ({}));
    if (!meta.ok || datos.appProperties?.userId !== usuario.id) throw new ErrorHttp(403, 'Ese archivo no es tuyo.');
    const r = await drive(`/files/${id}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 404) throw new ErrorHttp(502, 'No se pudo borrar el archivo de Drive.');
    return json({ ok: true });
  }

  // ── Entregar la imagen (enlace firmado) ──
  async function entregar(url: URL): Promise<Response> {
    const id = url.searchParams.get('id') || '';
    const exp = Number(url.searchParams.get('exp') || 0);
    const sig = url.searchParams.get('sig') || '';
    if (!idValido(id) || !exp || !sig) throw new ErrorHttp(400, 'Enlace no válido.');
    if (exp * 1000 < d.ahora()) throw new ErrorHttp(403, 'El enlace venció. Recarga la página.');
    const esperada = await firmaHmac(secretoEnlaces(), `${id}.${exp}`);
    if (!iguales(esperada, sig)) throw new ErrorHttp(403, 'Enlace no válido.');

    const r = await drive(`/files/${id}?alt=media`);
    if (r.status === 404) throw new ErrorHttp(404, 'La foto ya no existe.');
    if (!r.ok || !r.body) throw new ErrorHttp(502, 'No se pudo leer la foto de Drive.');
    const tipoDrive = r.headers.get('Content-Type') || '';
    const seguro = /^(image\/(jpeg|png|webp)|application\/pdf)/.test(tipoDrive) ? tipoDrive.split(';')[0] : 'application/octet-stream';
    return new Response(r.body, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': seguro,
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
        'Cache-Control': 'private, max-age=3000'
      }
    });
  }

  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      const url = new URL(req.url);
      if (req.method === 'GET') return await entregar(url);
      if (req.method !== 'POST') throw new ErrorHttp(405, 'Método no permitido.');

      const tipoCuerpo = req.headers.get('Content-Type') || '';
      if (tipoCuerpo.startsWith('multipart/form-data')) return await subir(req);

      const usuario = await autenticar(req);
      const cuerpo = await req.json().catch(() => ({}));
      if (cuerpo.accion === 'firmar') return await firmar(usuario, cuerpo.ids);
      if (cuerpo.accion === 'borrar') return await borrar(usuario, cuerpo.id);
      throw new ErrorHttp(400, 'Acción no reconocida.');
    } catch (e) {
      if (e instanceof ErrorHttp) return json({ error: e.message }, e.estado);
      console.error('Error en la función drive:', e);
      return json({ error: 'Error interno de la función.' }, 500);
    }
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Conexión real con Supabase (solo corre dentro de Supabase; no en las pruebas)
// ───────────────────────────────────────────────────────────────────────────
// deno-lint-ignore no-explicit-any
const G = globalThis as any;
if (G.Deno && typeof G.Deno.serve === 'function') {
  const { createClient } = await import('npm:@supabase/supabase-js@2');
  const env = (k: string) => G.Deno.env.get(k);
  const urlSupabase = env('SUPABASE_URL')!;
  const anon = env('SUPABASE_ANON_KEY')!;
  const servicio = createClient(urlSupabase, env('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  const tablas: Tablas = {
    async leerCarpeta(userId) {
      const { data } = await servicio.from('drive_carpetas').select('folder_id').eq('user_id', userId).maybeSingle();
      return data?.folder_id || null;
    },
    async guardarCarpeta(userId, folderId) {
      await servicio.from('drive_carpetas').upsert({ user_id: userId, folder_id: folderId });
    },
    async leerRaiz() {
      const { data } = await servicio.from('drive_ajustes').select('valor').eq('clave', 'raiz').maybeSingle();
      return data?.valor || null;
    },
    async guardarRaiz(folderId) {
      await servicio.from('drive_ajustes').upsert({ clave: 'raiz', valor: folderId });
    }
  };

  const manejador = crearManejador({
    env,
    fetch: fetch.bind(globalThis),
    ahora: () => Date.now(),
    tablas,
    async usuarioDeToken(jwt) {
      const { data, error } = await servicio.auth.getUser(jwt);
      return error || !data?.user ? null : { id: data.user.id };
    },
    async idsPermitidos(jwt, ids) {
      // Consulta con la sesión del maestro: las reglas RLS solo dejan ver sus propias evidencias
      const comoMaestro = createClient(urlSupabase, anon, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false }
      });
      const { data } = await comoMaestro.from('evidencias').select('ruta').in('ruta', ids.map((i) => `drive:${i}`));
      return (data || []).map((f: { ruta: string }) => f.ruta.slice('drive:'.length));
    }
  });

  G.Deno.serve(manejador);
}
