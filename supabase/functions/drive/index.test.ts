// Pruebas de la función "drive" con un Google Drive y un Supabase simulados.
// Ejecutar:  node --test supabase/functions/drive/index.test.ts   (Node 23 o superior)
import test from 'node:test';
import assert from 'node:assert/strict';
import { crearManejador, detectarTipo, MAX_BYTES, VIGENCIA_ENLACE_S } from './index.ts';

const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const HTML = new TextEncoder().encode('<html><script>alert(1)</script></html>');

function entorno(opciones: { sinSecretosGoogle?: boolean } = {}) {
  const log: string[] = [];
  const archivos = new Map<string, { mime: string; props: Record<string, string>; padre: string }>();
  const carpetas = new Map<string, string>(); // id → nombre
  const tablaCarpetas = new Map<string, string>();
  let raiz: string | null = null;
  let seq = 0;
  let ahora = 1_700_000_000_000;
  const evidenciasDeUsuario: Record<string, string[]> = { 'jwt-ana': [], 'jwt-beto': [] };

  const base = { SUPABASE_URL: 'https://proy.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'servicio-secreto' };
  const secretos: Record<string, string> = opciones.sinSecretosGoogle
    ? base
    : { ...base, GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'csec', GOOGLE_REFRESH_TOKEN: 'rt' };

  const falsoFetch = async (entrada: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(typeof entrada === 'string' ? entrada : entrada.toString());
    const metodo = init.method || 'GET';
    const cab = new Headers(init.headers);
    log.push(`${metodo} ${url.host}${url.pathname}`);
    if (url.host === 'oauth2.googleapis.com') {
      if (!String(init.body).includes('refresh_token=rt')) return new Response('{}', { status: 400 });
      return Response.json({ access_token: 'tok-google', expires_in: 3600 });
    }
    assert.equal(cab.get('Authorization'), 'Bearer tok-google', 'toda llamada a Drive lleva el token');
    if (url.pathname === '/drive/v3/files' && metodo === 'GET') {
      const q = url.searchParams.get('q') || '';
      const hallada = [...carpetas].find(([, n]) => q.includes(`name='${n}'`));
      return Response.json({ files: hallada ? [{ id: hallada[0] }] : [] });
    }
    if (url.pathname === '/drive/v3/files' && metodo === 'POST') {
      const meta = JSON.parse(String(init.body));
      const id = `carpeta${String(++seq).padStart(12, '0')}`;
      carpetas.set(id, meta.name);
      return Response.json({ id });
    }
    if (url.pathname === '/upload/drive/v3/files') {
      const cuerpo = new TextDecoder('latin1').decode(init.body as Uint8Array);
      const meta = JSON.parse(cuerpo.split('\r\n\r\n')[1].split('\r\n--')[0]);
      if (meta.parents[0] === 'carpetaINEXISTENTE') return new Response('{}', { status: 404 });
      const id = `archivo${String(++seq).padStart(12, '0')}`;
      archivos.set(id, { mime: meta.mimeType, props: meta.appProperties, padre: meta.parents[0] });
      return Response.json({ id, size: '10' });
    }
    const m = url.pathname.match(/^\/drive\/v3\/files\/([^/]+)$/);
    if (m) {
      const a = archivos.get(m[1]);
      if (!a) return new Response('{}', { status: 404 });
      if (metodo === 'DELETE') {
        archivos.delete(m[1]);
        return new Response(null, { status: 204 });
      }
      if (url.searchParams.get('alt') === 'media') return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': a.mime } });
      return Response.json({ appProperties: a.props });
    }
    return new Response('{}', { status: 500 });
  };

  const manejador = crearManejador({
    env: (k) => secretos[k],
    fetch: falsoFetch as typeof fetch,
    ahora: () => ahora,
    usuarioDeToken: async (jwt) => (jwt === 'jwt-ana' ? { id: 'aaaaaaaa-1111' } : jwt === 'jwt-beto' ? { id: 'bbbbbbbb-2222' } : null),
    idsPermitidos: async (jwt, ids) => ids.filter((i) => (evidenciasDeUsuario[jwt] || []).includes(i)),
    tablas: {
      leerCarpeta: async (u) => tablaCarpetas.get(u) || null,
      guardarCarpeta: async (u, f) => {
        tablaCarpetas.set(u, f);
      },
      leerRaiz: async () => raiz,
      guardarRaiz: async (f) => {
        raiz = f || null;
      }
    }
  });
  return {
    manejador, log, archivos, carpetas, tablaCarpetas, evidenciasDeUsuario,
    avanzar: (ms: number) => {
      ahora += ms;
    }
  };
}

const subida = (bytes: Uint8Array, jwt: string | null, nombre = 'foto.jpg', tipo = 'image/jpeg') => {
  const f = new FormData();
  f.append('archivo', new File([bytes as BlobPart], nombre, { type: tipo }));
  return new Request('https://proy.supabase.co/functions/v1/drive', {
    method: 'POST',
    body: f,
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
  });
};
const accion = (cuerpo: object, jwt: string | null) =>
  new Request('https://proy.supabase.co/functions/v1/drive', {
    method: 'POST',
    body: JSON.stringify(cuerpo),
    headers: { 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) }
  });

test('detecta el tipo real por los primeros bytes', () => {
  assert.equal(detectarTipo(JPG)?.mime, 'image/jpeg');
  assert.equal(detectarTipo(PNG)?.mime, 'image/png');
  assert.equal(detectarTipo(new TextEncoder().encode('%PDF-1.7 ...'))?.mime, 'application/pdf');
  assert.equal(detectarTipo(HTML), null);
});

test('subir: crea carpetas la primera vez y las reutiliza después', async () => {
  const e = entorno();
  const r1 = await e.manejador(subida(JPG, 'jwt-ana'));
  assert.equal(r1.status, 200);
  const { id } = await r1.json();
  assert.match(id, /^archivo/);
  assert.equal(e.carpetas.size, 2, 'raíz + carpeta del maestro');
  assert.ok([...e.carpetas.values()].includes('SIGE-Tele-Evidencias'));
  assert.ok([...e.carpetas.values()].includes('maestro-aaaaaaaa'), 'el nombre solo lleva un fragmento del id, sin datos personales');
  await e.manejador(subida(PNG, 'jwt-ana'));
  assert.equal(e.carpetas.size, 2, 'no vuelve a crear carpetas');
  const r3 = await e.manejador(subida(JPG, 'jwt-beto'));
  assert.equal(r3.status, 200);
  assert.equal(e.carpetas.size, 3, 'cada maestro tiene su propia carpeta');
  const ultimo = [...e.archivos.values()].pop()!;
  assert.equal(ultimo.props.userId, 'bbbbbbbb-2222');
  assert.equal(e.log.filter((l) => l.startsWith('POST oauth2')).length, 1, 'el token de Google se reutiliza');
});

test('subir: rechaza sin sesión, archivos falsos, vacíos o de más de 3 MB', async () => {
  const e = entorno();
  assert.equal((await e.manejador(subida(JPG, null))).status, 401);
  assert.equal((await e.manejador(subida(JPG, 'jwt-falso'))).status, 401);
  assert.equal((await e.manejador(subida(HTML, 'jwt-ana', 'foto.jpg', 'image/jpeg'))).status, 415, 'HTML disfrazado de JPG');
  assert.equal((await e.manejador(subida(new Uint8Array(), 'jwt-ana'))).status, 400);
  const grande = new Uint8Array(MAX_BYTES + 1);
  grande.set(JPG);
  assert.equal((await e.manejador(subida(grande, 'jwt-ana'))).status, 413);
  const justo = new Uint8Array(MAX_BYTES);
  justo.set(JPG);
  assert.equal((await e.manejador(subida(justo, 'jwt-ana'))).status, 200, 'exactamente 3 MB sí pasa');
  assert.equal(e.archivos.size, 1, 'nada rechazado llegó a Drive');
});

test('firmar: solo da enlaces de las fotos del propio maestro', async () => {
  const e = entorno();
  const { id: idAna } = await (await e.manejador(subida(JPG, 'jwt-ana'))).json();
  const { id: idBeto } = await (await e.manejador(subida(JPG, 'jwt-beto'))).json();
  e.evidenciasDeUsuario['jwt-ana'].push(idAna);
  e.evidenciasDeUsuario['jwt-beto'].push(idBeto);

  const { urls } = await (await e.manejador(accion({ accion: 'firmar', ids: [idAna, idBeto] }, 'jwt-ana'))).json();
  assert.ok(urls[idAna], 'Ana recibe el enlace de su foto');
  assert.equal(urls[idBeto], undefined, 'Ana NO recibe el enlace de la foto de Beto');
  assert.equal((await e.manejador(accion({ accion: 'firmar', ids: [idAna] }, null))).status, 401);
  assert.equal((await e.manejador(accion({ accion: 'firmar', ids: ['../../x'] }, 'jwt-ana'))).status, 400);
});

test('enlace firmado: entrega la imagen, vence y no se puede alterar', async () => {
  const e = entorno();
  const { id } = await (await e.manejador(subida(JPG, 'jwt-ana'))).json();
  e.evidenciasDeUsuario['jwt-ana'].push(id);
  const { urls } = await (await e.manejador(accion({ accion: 'firmar', ids: [id] }, 'jwt-ana'))).json();
  const enlace = urls[id] as string;

  const ok = await e.manejador(new Request(enlace));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('Content-Type'), 'image/jpeg');
  assert.equal(ok.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.deepEqual([...new Uint8Array(await ok.arrayBuffer())], [1, 2, 3]);

  const alterado = new URL(enlace);
  alterado.searchParams.set('sig', alterado.searchParams.get('sig')!.replace(/.$/, (c) => (c === '0' ? '1' : '0')));
  assert.equal((await e.manejador(new Request(alterado))).status, 403, 'firma alterada');
  const otroId = new URL(enlace);
  otroId.searchParams.set('id', 'archivo999999999999');
  assert.equal((await e.manejador(new Request(otroId))).status, 403, 'firma de otro archivo');
  const sinFirma = new URL(enlace);
  sinFirma.searchParams.delete('sig');
  assert.equal((await e.manejador(new Request(sinFirma))).status, 400);

  e.avanzar((VIGENCIA_ENLACE_S + 5) * 1000);
  assert.equal((await e.manejador(new Request(enlace))).status, 403, 'enlace vencido');
});

test('enlace firmado: nunca entrega un tipo peligroso como página', async () => {
  const e = entorno();
  const { id } = await (await e.manejador(subida(JPG, 'jwt-ana'))).json();
  e.archivos.get(id)!.mime = 'text/html'; // por si alguien lo cambiara dentro de Drive
  e.evidenciasDeUsuario['jwt-ana'].push(id);
  const { urls } = await (await e.manejador(accion({ accion: 'firmar', ids: [id] }, 'jwt-ana'))).json();
  const r = await e.manejador(new Request(urls[id]));
  assert.equal(r.headers.get('Content-Type'), 'application/octet-stream');
});

test('borrar: solo el dueño puede borrar su archivo', async () => {
  const e = entorno();
  const { id } = await (await e.manejador(subida(JPG, 'jwt-ana'))).json();
  assert.equal((await e.manejador(accion({ accion: 'borrar', id }, 'jwt-beto'))).status, 403);
  assert.ok(e.archivos.has(id), 'el archivo sigue ahí');
  assert.equal((await e.manejador(accion({ accion: 'borrar', id }, null))).status, 401);
  assert.equal((await e.manejador(accion({ accion: 'borrar', id }, 'jwt-ana'))).status, 200);
  assert.ok(!e.archivos.has(id), 'el dueño sí lo borró');
  assert.equal((await e.manejador(accion({ accion: 'borrar', id }, 'jwt-ana'))).status, 200, 'borrar dos veces no falla');
});

test('si alguien borró la carpeta del maestro en Drive, se recrea sola', async () => {
  const e = entorno();
  await e.manejador(subida(JPG, 'jwt-ana'));
  e.tablaCarpetas.set('aaaaaaaa-1111', 'carpetaINEXISTENTE'); // la tabla apunta a una carpeta que ya no existe
  const r = await e.manejador(subida(PNG, 'jwt-ana'));
  assert.equal(r.status, 200);
  assert.notEqual(e.tablaCarpetas.get('aaaaaaaa-1111'), 'carpetaINEXISTENTE', 'guardó la carpeta nueva');
});

test('configuración incompleta: mensajes claros y CORS', async () => {
  const e = entorno({ sinSecretosGoogle: true });
  const r = await e.manejador(subida(JPG, 'jwt-ana'));
  assert.equal(r.status, 500);
  assert.match((await r.json()).error, /GOOGLE_CLIENT_ID/);
  const pre = await e.manejador(new Request('https://proy.supabase.co/functions/v1/drive', { method: 'OPTIONS' }));
  assert.equal(pre.status, 204);
  assert.ok(pre.headers.get('Access-Control-Allow-Headers')!.includes('authorization'));
  assert.equal((await e.manejador(new Request('https://proy.supabase.co/functions/v1/drive', { method: 'PUT' }))).status, 405);
});
