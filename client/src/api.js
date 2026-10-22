import { supabase } from './supabase';
import { calcularSemaforoyAlertas } from './analisis';
import { comprimirImagen, MAX_BYTES } from './comprimirImagen';
import { driveActivo, subirADrive, firmarEnDrive, borrarEnDrive } from './driveApi';

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// Formatea YYYY-MM-DD a "21 de octubre de 2026" (Día, Mes y Año completo, sin cortar)
export function formatearFechaCompleta(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return '';
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    const mesIdx = parseInt(mes, 10) - 1;
    const diaNum = parseInt(dia, 10);
    if (MESES_ES[mesIdx] && !isNaN(diaNum)) {
      return `${diaNum} de ${MESES_ES[mesIdx]} de ${anio}`;
    }
  }
  return fechaStr;
}

// Formatea YYYY-MM-DD a "21/10/2026" (Día/Mes/Año completo con los 4 dígitos del año)
export function formatearFechaDMA(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return '';
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }
  return fechaStr;
}


// ─────────────────────────────────────────────────────────────────────────
// Capa de datos sobre Supabase. Mantiene las mismas funciones (y el mismo
// formato de respuesta) que usaban los componentes con el servidor Express.
// La seguridad la dan las reglas RLS: cada consulta solo ve filas del maestro.
// ─────────────────────────────────────────────────────────────────────────

const BUCKET = 'evidencias';

function db() {
  if (!supabase) throw new Error('Supabase no está configurado (falta el archivo .env.local)');
  return supabase;
}

function ok({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

async function uid() {
  const { data } = await db().auth.getSession();
  const id = data?.session?.user?.id;
  if (!id) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
  return id;
}

const nuevoId = (prefijo) => `${prefijo}-${crypto.randomUUID().slice(0, 12)}`;
const hoy = () => new Date().toISOString().split('T')[0];

const CATEGORIAS_DEFAULT = [
  'Planeación Didáctica',
  'Conducta e Incidencias',
  'Acuerdos con Padres',
  'Pendientes Administrativos',
  'Observación Pedagógica'
];

// ───────── Conversión entre filas de la base de datos y objetos de la app ─────────

const configDeFila = (f) => ({
  escuela: f.escuela,
  cct: f.cct,
  zona: f.zona,
  sector: f.sector,
  grado: f.grado,
  grupo: f.grupo,
  ciclo: f.ciclo,
  docente: f.docente,
  periodoActivo: f.periodo_activo,
  tipoPeriodo: f.tipo_periodo,
  membrete: f.membrete || {}
});

const CONFIG_COLUMNAS = {
  escuela: 'escuela', cct: 'cct', zona: 'zona', sector: 'sector', grado: 'grado', grupo: 'grupo',
  ciclo: 'ciclo', docente: 'docente', periodoActivo: 'periodo_activo', tipoPeriodo: 'tipo_periodo',
  membrete: 'membrete'
};

const alumnoDeFila = (f) => ({
  ...(f.extra || {}),
  id: f.id,
  noLista: f.no_lista,
  nombre: f.nombre,
  curp: f.curp,
  tutor: f.tutor,
  telefono: f.telefono,
  notas: f.notas
});

const ALUMNO_CAMPOS = ['nombre', 'curp', 'tutor', 'telefono', 'notas'];
function alumnoAFila(a) {
  const fila = {};
  const extra = {};
  Object.entries(a).forEach(([k, v]) => {
    if (k === 'id' || k === 'noLista') return;
    if (ALUMNO_CAMPOS.includes(k)) fila[k] = v ?? '';
    else extra[k] = v;
  });
  if (Object.keys(extra).length) fila.extra = extra;
  return fila;
}

const tareaDeFila = (f) => ({
  id: f.id,
  titulo: f.titulo,
  materiaId: f.materia_id,
  periodo: f.periodo,
  fecha: f.fecha,
  descripcion: f.descripcion,
  entregas: f.entregas || {}
});

const acuerdoDeFila = (f) => ({
  id: f.id,
  sesion: f.sesion,
  fechaRegistro: f.fecha_registro,
  acuerdo: f.acuerdo,
  responsable: f.responsable,
  fechaLimite: f.fecha_limite,
  estatus: f.estatus,
  observaciones: f.observaciones
});

const notaDeFila = (f) => ({
  id: f.id,
  titulo: f.titulo,
  contenido: f.contenido,
  categoria: f.categoria,
  alumnoId: f.alumno_id,
  fecha: f.fecha,
  destacada: f.destacada,
  audioData: f.audio_data,
  audioDuracion: Number(f.audio_duracion) || 0
});

const evidenciaDeFila = (f) => ({
  id: f.id,
  alumnoId: f.alumno_id,
  materiaId: f.materia_id,
  periodo: f.periodo,
  titulo: f.titulo,
  tipo: f.tipo,
  fecha: f.fecha,
  descripcion: f.descripcion,
  nombreOriginal: f.nombre_original,
  mimetype: f.mimetype,
  tamanio: Number(f.tamanio) || 0,
  ruta: f.ruta || '',
  url: ''
});

// ───────── Carga de todos los datos del maestro (formato del antiguo db.json) ─────────

async function cargarDB() {
  const c = db();
  const [cfg, per, mat, alu, asi, tar, cal, acu, evi] = await Promise.all([
    c.from('configuracion').select('*').maybeSingle(),
    c.from('periodos').select('*').order('orden'),
    c.from('materias').select('*').order('orden').order('id'),
    c.from('alumnos').select('*').order('no_lista'),
    c.from('asistencias').select('*').order('fecha'),
    c.from('tareas').select('*').order('creado'),
    c.from('calificaciones').select('*'),
    c.from('acuerdos_cte').select('*').order('creado', { ascending: false }),
    c.from('evidencias').select('*').order('creado', { ascending: false })
  ]);

  let cfgFila = ok(cfg);
  if (!cfgFila) {
    // Cuenta creada antes de instalar el esquema: se le siembran sus datos iniciales
    ok(await c.rpc('asegurar_perfil'));
    cfgFila = ok(await c.from('configuracion').select('*').single());
    const [per2, mat2] = await Promise.all([
      c.from('periodos').select('*').order('orden'),
      c.from('materias').select('*').order('orden')
    ]);
    return armarDB(cfgFila, ok(per2), ok(mat2), [], [], [], [], [], []);
  }

  return armarDB(cfgFila, ok(per), ok(mat), ok(alu), ok(asi), ok(tar), ok(cal), ok(acu), ok(evi));
}

function armarDB(cfgFila, per, mat, alu, asi, tar, cal, acu, evi) {
  return {
    config: configDeFila(cfgFila),
    categoriasNotas: cfgFila.categorias_notas?.length ? cfgFila.categorias_notas : CATEGORIAS_DEFAULT,
    periodos: per.map(p => ({ id: p.id, nombre: p.nombre })),
    materias: mat.map(m => ({ id: m.id, nombre: m.nombre, clave: m.clave })),
    alumnos: alu.map(alumnoDeFila),
    asistencias: asi.map(a => ({ fecha: a.fecha, periodo: a.periodo, registros: a.registros || {} })),
    tareas: tar.map(tareaDeFila),
    calificaciones: cal.map(c => ({ alumnoId: c.alumno_id, periodo: c.periodo, notas: c.notas || {} })),
    acuerdosCTE: acu.map(acuerdoDeFila),
    evidencias: evi.map(evidenciaDeFila)
  };
}

async function periodoActivo() {
  const f = ok(await db().from('configuracion').select('periodo_activo').maybeSingle());
  return f?.periodo_activo || '';
}

// ───────── Configuración, periodos y materias ─────────

export async function fetchConfig() {
  const d = await cargarDB();
  return {
    config: d.config,
    periodos: d.periodos,
    materias: d.materias,
    categoriasNotas: d.categoriasNotas
  };
}

export async function updateConfig(config) {
  const cambios = {};
  Object.entries(CONFIG_COLUMNAS).forEach(([clave, col]) => {
    if (config[clave] !== undefined) cambios[col] = config[clave];
  });
  const id = await uid();
  if (Object.keys(cambios).length) {
    ok(await db().from('configuracion').update(cambios).eq('user_id', id));
  }
  const fila = ok(await db().from('configuracion').select('*').single());
  return { success: true, config: configDeFila(fila) };
}

export async function createMateria(materia) {
  const nombre = (materia.nombre || '').trim();
  if (!nombre) throw new Error('El nombre de la materia es obligatorio');
  const clave = (materia.clave || nombre.slice(0, 4)).trim().toUpperCase();
  const actuales = ok(await db().from('materias').select('orden').order('orden', { ascending: false }).limit(1));
  const nueva = {
    user_id: await uid(),
    id: nuevoId('mat'),
    nombre,
    clave,
    orden: (actuales[0]?.orden || 0) + 1
  };
  ok(await db().from('materias').insert(nueva));
  return { success: true, materia: { id: nueva.id, nombre, clave } };
}

export async function updateMateria(id, materia) {
  const cambios = {};
  if (materia.nombre !== undefined) cambios.nombre = materia.nombre.trim();
  if (materia.clave !== undefined) cambios.clave = materia.clave.trim().toUpperCase();
  if (Object.keys(cambios).length) {
    ok(await db().from('materias').update(cambios).eq('id', id));
  }
  return { success: true };
}

export async function deleteMateria(id) {
  ok(await db().from('materias').delete().eq('id', id));
  return { success: true };
}

// ───────── Alumnos ─────────

export async function fetchAlumnos() {
  const filas = ok(await db().from('alumnos').select('*').order('no_lista'));
  return filas.map(alumnoDeFila);
}

export async function createAlumno(alumno) {
  const ultimo = ok(await db().from('alumnos').select('no_lista').order('no_lista', { ascending: false }).limit(1));
  const fila = {
    user_id: await uid(),
    id: nuevoId('alu'),
    no_lista: (ultimo[0]?.no_lista || 0) + 1,
    ...alumnoAFila(alumno)
  };
  ok(await db().from('alumnos').insert(fila));
  return { success: true, alumno: alumnoDeFila({ ...fila, extra: fila.extra }) };
}

export async function updateAlumno(id, alumno) {
  ok(await db().from('alumnos').update(alumnoAFila(alumno)).eq('id', id));
  return { success: true };
}

export async function deleteAlumno(id) {
  // Las calificaciones del alumno se borran solas (ON DELETE CASCADE)
  ok(await db().from('alumnos').delete().eq('id', id));
  return { success: true };
}

// ───────── Asistencias ─────────

export async function fetchAsistencias(fecha, periodo) {
  if (fecha) {
    const fila = ok(await db().from('asistencias').select('*').eq('fecha', fecha).maybeSingle());
    if (fila) return { fecha: fila.fecha, periodo: fila.periodo, registros: fila.registros || {} };
    return { fecha, periodo: periodo || (await periodoActivo()), registros: {} };
  }
  return fetchHistorialAsistencias(periodo);
}

export async function fetchHistorialAsistencias(periodo) {
  const per = periodo || (await periodoActivo());
  let q = db().from('asistencias').select('*').order('fecha');
  if (per) q = q.eq('periodo', per);
  return ok(await q).map(a => ({ fecha: a.fecha, periodo: a.periodo, registros: a.registros || {} }));
}

export async function saveAsistencias(fecha, periodo, registros) {
  if (!fecha) throw new Error('La fecha es obligatoria');
  ok(await db().rpc('guardar_asistencia', {
    p_fecha: fecha,
    p_periodo: periodo || (await periodoActivo()),
    p_registros: registros || {}
  }));
  return { success: true, fecha, registros };
}

export async function deleteAsistenciaFecha(fecha) {
  ok(await db().from('asistencias').delete().eq('fecha', fecha));
  return { success: true };
}

// ───────── Notas del docente ─────────

async function listarNotas() {
  const [filas, cfg] = await Promise.all([
    db().from('notas_docente').select('*').order('creado', { ascending: false }),
    db().from('configuracion').select('categorias_notas').maybeSingle()
  ]);
  const cats = ok(cfg)?.categorias_notas;
  return {
    notas: ok(filas).map(notaDeFila),
    categorias: cats?.length ? cats : CATEGORIAS_DEFAULT
  };
}

async function registrarCategoria(categoria) {
  if (!categoria) return;
  const cfg = ok(await db().from('configuracion').select('categorias_notas').maybeSingle());
  const cats = cfg?.categorias_notas?.length ? cfg.categorias_notas : CATEGORIAS_DEFAULT;
  if (!cats.includes(categoria)) {
    ok(await db().from('configuracion').update({ categorias_notas: [...cats, categoria] }).eq('user_id', await uid()));
  }
}

export async function fetchNotas() {
  return listarNotas();
}

export async function createNota(nota) {
  const categoria = (nota.categoria || 'General').trim();
  await registrarCategoria(categoria);
  ok(await db().from('notas_docente').insert({
    user_id: await uid(),
    id: nuevoId('nota'),
    titulo: (nota.titulo || 'Nota de Voz / Docente').trim(),
    contenido: nota.contenido || '',
    categoria,
    alumno_id: nota.alumnoId || '',
    fecha: nota.fecha || hoy(),
    destacada: Boolean(nota.destacada),
    audio_data: nota.audioData || '',
    audio_duracion: nota.audioDuracion || 0
  }));
  return { success: true, ...(await listarNotas()) };
}

export async function updateNota(id, nota) {
  const cambios = {};
  if (nota.titulo !== undefined) cambios.titulo = nota.titulo;
  if (nota.contenido !== undefined) cambios.contenido = nota.contenido;
  if (nota.categoria !== undefined) {
    cambios.categoria = nota.categoria.trim();
    await registrarCategoria(cambios.categoria);
  }
  if (nota.alumnoId !== undefined) cambios.alumno_id = nota.alumnoId || '';
  if (nota.fecha !== undefined) cambios.fecha = nota.fecha;
  if (nota.destacada !== undefined) cambios.destacada = Boolean(nota.destacada);
  if (nota.audioData !== undefined) cambios.audio_data = nota.audioData || '';
  if (nota.audioDuracion !== undefined) cambios.audio_duracion = nota.audioDuracion || 0;
  if (Object.keys(cambios).length) {
    ok(await db().from('notas_docente').update(cambios).eq('id', id));
  }
  return { success: true, ...(await listarNotas()) };
}

export async function deleteNota(id) {
  ok(await db().from('notas_docente').delete().eq('id', id));
  return { success: true, ...(await listarNotas()) };
}

// ───────── Tareas ─────────

export async function fetchTareas(periodo) {
  const per = periodo || (await periodoActivo());
  let q = db().from('tareas').select('*').order('creado');
  if (per) q = q.eq('periodo', per);
  return ok(await q).map(tareaDeFila);
}

export async function createTarea(tarea) {
  let materiaId = tarea.materiaId;
  if (!materiaId) {
    const m = ok(await db().from('materias').select('id').order('orden').limit(1));
    materiaId = m[0]?.id || '';
  }
  const fila = {
    user_id: await uid(),
    id: nuevoId('tar'),
    titulo: tarea.titulo || 'Nueva Tarea',
    materia_id: materiaId,
    periodo: tarea.periodo || (await periodoActivo()),
    fecha: tarea.fecha || hoy(),
    descripcion: tarea.descripcion || '',
    entregas: tarea.entregas || {}
  };
  ok(await db().from('tareas').insert(fila));
  return { success: true, tarea: tareaDeFila(fila) };
}

export async function deleteTarea(id) {
  ok(await db().from('tareas').delete().eq('id', id));
  return { success: true };
}

export async function saveEntregasTarea(tareaId, entregas) {
  ok(await db().rpc('guardar_entregas', { p_tarea: tareaId, p_entregas: entregas || {} }));
  const fila = ok(await db().from('tareas').select('*').eq('id', tareaId).maybeSingle());
  return { success: true, tarea: fila ? tareaDeFila(fila) : null };
}

// ───────── Calificaciones ─────────

export async function fetchCalificaciones(periodo) {
  const per = periodo || (await periodoActivo());
  let q = db().from('calificaciones').select('*');
  if (per) q = q.eq('periodo', per);
  return ok(await q).map(c => ({ alumnoId: c.alumno_id, periodo: c.periodo, notas: c.notas || {} }));
}

export async function saveCalificacion(alumnoId, periodo, notas) {
  if (!alumnoId || !periodo) throw new Error('Faltan parámetros requeridos');
  ok(await db().rpc('guardar_calificacion', { p_alumno: alumnoId, p_periodo: periodo, p_notas: notas || {} }));
  return { success: true, alumnoId, periodo };
}

// ───────── Semáforo, comparativa y reportes (se calculan en el navegador) ─────────

export async function fetchSemaforo(periodo) {
  const d = await cargarDB();
  return calcularSemaforoyAlertas(d, periodo || d.config.periodoActivo);
}

export async function fetchComparativa(actual, anterior) {
  const d = await cargarDB();
  const actualPeriodo = actual || d.config.periodoActivo;

  let anteriorPeriodo = anterior;
  if (!anteriorPeriodo) {
    const idx = d.periodos.findIndex(p => p.id === actualPeriodo);
    anteriorPeriodo = idx > 0 ? d.periodos[idx - 1].id : (d.periodos[0]?.id || actualPeriodo);
  }

  const analisisActual = calcularSemaforoyAlertas(d, actualPeriodo);
  const analisisAnterior = calcularSemaforoyAlertas(d, anteriorPeriodo);

  const comparativaAlumnos = analisisActual.alumnos.map(itemActual => {
    const itemAnt = analisisAnterior.alumnos.find(a => a.alumno.id === itemActual.alumno.id);
    const promActual = itemActual.calificaciones.promedio;
    const promAnterior = itemAnt ? itemAnt.calificaciones.promedio : promActual;
    const deltaPromedio = parseFloat((promActual - promAnterior).toFixed(1));

    const asisActual = itemActual.asistencia.porcentaje;
    const asisAnterior = itemAnt ? itemAnt.asistencia.porcentaje : asisActual;

    const tarActual = itemActual.tareas.porcentaje;
    const tarAnterior = itemAnt ? itemAnt.tareas.porcentaje : tarActual;

    return {
      alumno: itemActual.alumno,
      actual: { promedio: promActual, asistencia: asisActual, tareas: tarActual, semaforo: itemActual.semaforo },
      anterior: {
        promedio: promAnterior,
        asistencia: asisAnterior,
        tareas: tarAnterior,
        semaforo: itemAnt ? itemAnt.semaforo : 'verde'
      },
      delta: {
        promedio: deltaPromedio,
        asistencia: asisActual - asisAnterior,
        tareas: tarActual - tarAnterior,
        tendencia: deltaPromedio > 0 ? 'subio' : deltaPromedio < 0 ? 'bajo' : 'igual'
      }
    };
  });

  return {
    periodoActual: actualPeriodo,
    periodoAnterior: anteriorPeriodo,
    resumenActual: analisisActual.resumen,
    resumenAnterior: analisisAnterior.resumen,
    deltaGrupal: {
      promedio: parseFloat((analisisActual.resumen.promedioGrupal - analisisAnterior.resumen.promedioGrupal).toFixed(1)),
      asistencia: analisisActual.resumen.asistenciaGrupal - analisisAnterior.resumen.asistenciaGrupal,
      tareas: analisisActual.resumen.cumplimientoTareasGrupal - analisisAnterior.resumen.cumplimientoTareasGrupal
    },
    comparativaAlumnos
  };
}

export async function fetchCteReporte(periodo) {
  const d = await cargarDB();
  const per = periodo || d.config.periodoActivo;
  const analisis = calcularSemaforoyAlertas(d, per);

  const alumnosPrioritarios = analisis.alumnos
    .filter(a => a.semaforo === 'rojo' || a.semaforo === 'amarillo')
    .sort((a) => (a.semaforo === 'rojo' ? -1 : 1));

  return {
    fechaEmision: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
    escuela: d.config.escuela,
    cct: d.config.cct,
    zona: d.config.zona,
    gradoGrupo: `${d.config.grado} "${d.config.grupo}"`,
    docente: d.config.docente,
    ciclo: d.config.ciclo,
    periodo: per,
    membrete: d.config.membrete,
    resumen: analisis.resumen,
    alertasCriticas: analisis.alertasCriticas,
    alumnosPrioritarios,
    todosAlumnos: analisis.alumnos,
    acuerdos: d.acuerdosCTE,
    totalEvidencias: d.evidencias.filter(e => !per || e.periodo === per).length
  };
}

// ───────── Acuerdos del CTE ─────────

export async function fetchAcuerdosCTE() {
  const filas = ok(await db().from('acuerdos_cte').select('*').order('creado', { ascending: false }));
  return filas.map(acuerdoDeFila);
}

export async function createAcuerdoCTE(acuerdo) {
  let responsable = acuerdo.responsable;
  if (!responsable) {
    responsable = ok(await db().from('configuracion').select('docente').maybeSingle())?.docente || '';
  }
  const fila = {
    user_id: await uid(),
    id: nuevoId('ac'),
    sesion: acuerdo.sesion || 'Sesión Ordinaria CTE',
    fecha_registro: acuerdo.fechaRegistro || hoy(),
    acuerdo: acuerdo.acuerdo || '',
    responsable,
    fecha_limite: acuerdo.fechaLimite || '',
    estatus: acuerdo.estatus || 'Pendiente',
    observaciones: acuerdo.observaciones || ''
  };
  ok(await db().from('acuerdos_cte').insert(fila));
  return { success: true, acuerdo: acuerdoDeFila(fila) };
}

export async function updateAcuerdoCTE(id, acuerdo) {
  const mapa = {
    sesion: 'sesion', fechaRegistro: 'fecha_registro', acuerdo: 'acuerdo', responsable: 'responsable',
    fechaLimite: 'fecha_limite', estatus: 'estatus', observaciones: 'observaciones'
  };
  const cambios = {};
  Object.entries(mapa).forEach(([k, col]) => {
    if (acuerdo[k] !== undefined) cambios[col] = acuerdo[k];
  });
  if (Object.keys(cambios).length) {
    ok(await db().from('acuerdos_cte').update(cambios).eq('id', id));
  }
  return { success: true };
}

export async function deleteAcuerdoCTE(id) {
  ok(await db().from('acuerdos_cte').delete().eq('id', id));
  return { success: true };
}

// ───────── Evidencias (fotos) ─────────
// Los archivos pueden estar en dos lugares, y la columna `ruta` dice cuál:
//   "drive:<id>"  → Google Drive del administrador, a través de la función "drive"
//   otra cosa     → bucket privado de Supabase Storage (fotos anteriores / modo sin Drive)
// Las fotos nuevas van a Drive cuando VITE_USAR_DRIVE=true. En ambos casos el resto de la app
// recibe una URL temporal (1 hora) en `evidencia.url` y no se entera de dónde está el archivo.

const PREFIJO_DRIVE = 'drive:';
const esDrive = (ruta) => typeof ruta === 'string' && ruta.startsWith(PREFIJO_DRIVE);

async function subirArchivo(file, rutaBase) {
  if (driveActivo) return PREFIJO_DRIVE + (await subirADrive(file));
  const ext = (file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] || '').toLowerCase();
  const limpio = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'archivo';
  const ruta = `${rutaBase}/${Date.now()}_${limpio}${ext}`;
  const { error } = await db().storage.from(BUCKET).upload(ruta, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return ruta;
}

async function urlsDeArchivos(rutas) {
  const todas = [...new Set(rutas.filter(Boolean))];
  const mapa = {};

  const enDrive = todas.filter(esDrive);
  const enStorage = todas.filter((r) => !esDrive(r));

  if (enStorage.length) {
    const { data, error } = await db().storage.from(BUCKET).createSignedUrls(enStorage, 3600);
    if (error) throw new Error(error.message);
    (data || []).forEach(d => { if (d.signedUrl) mapa[d.path] = d.signedUrl; });
  }

  if (enDrive.length) {
    try {
      const urls = await firmarEnDrive(enDrive.map((r) => r.slice(PREFIJO_DRIVE.length)));
      enDrive.forEach((r) => {
        const u = urls[r.slice(PREFIJO_DRIVE.length)];
        if (u) mapa[r] = u;
      });
    } catch (err) {
      // Si Drive falla, la lista de evidencias se sigue mostrando (sin las miniaturas)
      console.warn('No se pudieron obtener las fotos de Drive:', err.message);
    }
  }
  return mapa;
}

async function borrarArchivo(ruta) {
  if (!ruta) return;
  try {
    if (esDrive(ruta)) {
      await borrarEnDrive(ruta.slice(PREFIJO_DRIVE.length));
    } else {
      const { error } = await db().storage.from(BUCKET).remove([ruta]);
      if (error) throw new Error(error.message);
    }
  } catch (err) {
    console.warn('No se pudo borrar el archivo:', err.message);
  }
}

async function enriquecerEvidencias(filas) {
  const [alu, mat, urls] = await Promise.all([
    db().from('alumnos').select('id,nombre'),
    db().from('materias').select('id,nombre'),
    urlsDeArchivos(filas.map(f => f.ruta))
  ]);
  const alumnos = Object.fromEntries(ok(alu).map(a => [a.id, a.nombre]));
  const materias = Object.fromEntries(ok(mat).map(m => [m.id, m.nombre]));
  return filas.map(f => ({
    ...evidenciaDeFila(f),
    url: urls[f.ruta] || '',
    alumnoNombre: alumnos[f.alumno_id] || 'Sin alumno',
    materiaNombre: materias[f.materia_id] || 'General'
  }));
}

export async function fetchEvidencias(params = {}) {
  let q = db().from('evidencias').select('*').order('creado', { ascending: false });
  const valido = (v) => v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null' && v !== 'todos';
  if (valido(params.alumnoId)) q = q.eq('alumno_id', params.alumnoId);
  if (valido(params.materiaId)) q = q.eq('materia_id', params.materiaId);
  if (valido(params.periodo)) q = q.eq('periodo', params.periodo);
  return enriquecerEvidencias(ok(await q));
}

export async function uploadEvidencia(formData) {
  const userId = await uid();
  let archivo = formData.get('archivo');
  const dataUrl = formData.get('dataUrl');

  if (!(archivo instanceof File) && dataUrl) {
    const blob = await (await fetch(dataUrl)).blob();
    archivo = new File([blob], `${formData.get('titulo') || 'evidencia'}.jpg`, { type: blob.type || 'image/jpeg' });
  }
  if (!(archivo instanceof File)) archivo = null;

  let ruta = null;
  if (archivo) {
    if (archivo.type.startsWith('image/')) {
      archivo = await comprimirImagen(archivo, MAX_BYTES);
    } else if (archivo.size > MAX_BYTES) {
      throw new Error('El archivo pesa más de 3 MB. Solo las fotos se comprimen automáticamente.');
    }
    ruta = await subirArchivo(archivo, userId);
  }

  const fila = {
    user_id: userId,
    id: nuevoId('evi'),
    alumno_id: formData.get('alumnoId') || '',
    materia_id: formData.get('materiaId') || '',
    periodo: formData.get('periodo') || (await periodoActivo()),
    titulo: (formData.get('titulo') || 'Evidencia fotográfica').trim(),
    tipo: formData.get('tipo') || 'Fotografía de Libreta / Trabajo',
    fecha: formData.get('fecha') || hoy(),
    descripcion: formData.get('descripcion') || '',
    nombre_original: archivo ? archivo.name : '',
    mimetype: archivo ? archivo.type : '',
    tamanio: archivo ? archivo.size : 0,
    ruta
  };

  const { error } = await db().from('evidencias').insert(fila);
  if (error) {
    await borrarArchivo(ruta); // no dejar archivos huérfanos
    throw new Error(error.message);
  }
  const [evidencia] = await enriquecerEvidencias([fila]);
  return { success: true, evidencia };
}

export async function deleteEvidencia(id) {
  const fila = ok(await db().from('evidencias').select('ruta').eq('id', id).maybeSingle());
  ok(await db().from('evidencias').delete().eq('id', id));
  await borrarArchivo(fila?.ruta);
  return { success: true };
}

// ───────── Expediente individual ─────────

export async function fetchExpedienteAlumno(alumnoId) {
  const d = await cargarDB();
  const alumno = d.alumnos.find(a => a.id === alumnoId);
  if (!alumno) throw new Error('Alumno no encontrado');

  const analisis = calcularSemaforoyAlertas(d, d.config.periodoActivo);
  const filas = ok(await db().from('evidencias').select('*').eq('alumno_id', alumnoId).order('creado', { ascending: false }));
  const evidencias = await enriquecerEvidencias(filas);

  return {
    escuela: d.config.escuela,
    cct: d.config.cct,
    gradoGrupo: `${d.config.grado} "${d.config.grupo}"`,
    ciclo: d.config.ciclo,
    docente: d.config.docente,
    membrete: d.config.membrete,
    alumno,
    estadoActual: analisis.alumnos.find(a => a.alumno.id === alumnoId),
    evidencias,
    historialCalificaciones: d.calificaciones.filter(c => c.alumnoId === alumnoId)
  };
}

// ───────── Respaldo y restauración ─────────
// El respaldo usa el mismo formato JSON de la versión anterior (db.json), así que
// también sirve para importar los datos viejos. Las fotos no forman parte del respaldo.

export async function descargarRespaldo() {
  const d = await cargarDB();
  const notas = await listarNotas();
  const respaldo = {
    config: d.config,
    periodos: d.periodos,
    materias: d.materias,
    alumnos: d.alumnos,
    asistencias: d.asistencias,
    tareas: d.tareas,
    calificaciones: d.calificaciones,
    acuerdosCTE: d.acuerdosCTE,
    notasDocente: notas.notas,
    categoriasNotas: notas.categorias
  };
  const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `respaldo_telesecundaria_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function restaurarRespaldo(respaldo) {
  if (!respaldo || !respaldo.config || !Array.isArray(respaldo.alumnos)) {
    throw new Error('Formato de respaldo inválido');
  }
  ok(await db().rpc('restaurar_respaldo', { p: respaldo }));
  return { success: true };
}
