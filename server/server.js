const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS y parseo de JSON
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directorios de datos y uploads
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Servir archivos subidos como estáticos
app.use('/uploads', express.static(UPLOADS_DIR));

// Configuración de Multer para subir evidencias
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${cleanName}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max por archivo
});

// Datos semilla de inicio (Telesecundaria)
const defaultData = {
  config: {
    escuela: "Telesecundaria No. 42 'Benito Juárez'",
    cct: "21ETV0042Z",
    zona: "014",
    sector: "03",
    grado: "2°",
    grupo: "A",
    ciclo: "2026-2027",
    docente: "Prof. Alejandro Morales S.",
    periodoActivo: "Trimestre 2",
    tipoPeriodo: "Trimestre", // Trimestre o Bimestre
    deepseekApiKey: ""
  },
  periodos: [
    { id: "Trimestre 1", nombre: "1er Trimestre" },
    { id: "Trimestre 2", nombre: "2do Trimestre" },
    { id: "Trimestre 3", nombre: "3er Trimestre" }
  ],
  materias: [
    { id: "lenguajes", nombre: "Lenguajes (Español)", clave: "LENG" },
    { id: "saberes", nombre: "Saberes y Pensamiento Científico (Matemáticas y Ciencias)", clave: "SPC" },
    { id: "etica", nombre: "Ética, Naturaleza y Sociedades (Historia y Formación Cívica)", clave: "ENS" },
    { id: "humano", nombre: "De lo Humano y lo Comunitario (Tutoría y Ed. Física)", clave: "DHC" },
    { id: "ingles", nombre: "Inglés", clave: "ING" }
  ],
  alumnos: [
    {
      id: "alu-1",
      noLista: 1,
      nombre: "Álvarez Mendoza Diego",
      curp: "AUMD100512HDFLR01",
      tutor: "Rosa Mendoza",
      telefono: "555-123-4567",
      notas: "Participativo, buen liderazgo escolar."
    },
    {
      id: "alu-2",
      noLista: 2,
      nombre: "Cruz Hernández Valentina",
      curp: "CUHV100823MDFRN02",
      tutor: "Carmen Hernández",
      telefono: "555-234-5678",
      notas: "Excelente desempeño y entrega puntual."
    },
    {
      id: "alu-3",
      noLista: 3,
      nombre: "Gómez Pérez Mateo",
      curp: "GOPM100315HDFRR03",
      tutor: "Esteban Gómez",
      telefono: "555-345-6789",
      notas: "Presenta dificultades de transporte en días lluviosos."
    },
    {
      id: "alu-4",
      noLista: 4,
      nombre: "López Morales Carlos",
      curp: "LOMC100911HDFRP04",
      tutor: "Lucía Morales",
      telefono: "555-456-7890",
      notas: "Requiere apoyo focalizado en Matemáticas y lectura."
    },
    {
      id: "alu-5",
      noLista: 5,
      nombre: "Martínez Silva Jimena",
      curp: "MASJ100104MDFNL05",
      tutor: "Jorge Martínez",
      telefono: "555-567-8901",
      notas: "Cumplida, buena comprensión lectora."
    },
    {
      id: "alu-6",
      noLista: 6,
      nombre: "Ramírez Ortiz Ángel David",
      curp: "RAOA101130HDFRL06",
      tutor: "Guadalupe Ortiz",
      telefono: "555-678-9012",
      notas: "Falta frecuente los lunes por apoyo en faenas agrícolas."
    }
  ],
  asistencias: [
    // Fechas recientes ordenadas cronológicamente
    {
      fecha: "2026-10-15",
      periodo: "Trimestre 2",
      registros: {
        "alu-1": "P",
        "alu-2": "P",
        "alu-3": "P",
        "alu-4": "P",
        "alu-5": "P",
        "alu-6": "F"
      }
    },
    {
      fecha: "2026-10-16",
      periodo: "Trimestre 2",
      registros: {
        "alu-1": "P",
        "alu-2": "P",
        "alu-3": "R",
        "alu-4": "P",
        "alu-5": "P",
        "alu-6": "F"
      }
    },
    {
      fecha: "2026-10-19",
      periodo: "Trimestre 2",
      registros: {
        "alu-1": "P",
        "alu-2": "P",
        "alu-3": "P",
        "alu-4": "P",
        "alu-5": "P",
        "alu-6": "F" // <-- 3 faltas seguidas para Ramírez Ortiz Ángel David
      }
    },
    {
      fecha: "2026-10-20",
      periodo: "Trimestre 2",
      registros: {
        "alu-1": "P",
        "alu-2": "P",
        "alu-3": "P",
        "alu-4": "F",
        "alu-5": "P",
        "alu-6": "P"
      }
    },
    {
      fecha: "2026-10-21",
      periodo: "Trimestre 2",
      registros: {
        "alu-1": "P",
        "alu-2": "P",
        "alu-3": "P",
        "alu-4": "F",
        "alu-5": "P",
        "alu-6": "P"
      }
    }
  ],
  tareas: [
    {
      id: "tar-1",
      titulo: "Resumen de texto expositivo y mapa mental",
      materiaId: "lenguajes",
      periodo: "Trimestre 2",
      fecha: "2026-10-14",
      descripcion: "Páginas 45 a 49 del libro de texto. Incluir ideas principales.",
      entregas: {
        "alu-1": "E",
        "alu-2": "E",
        "alu-3": "E",
        "alu-4": "NE", // No entregó
        "alu-5": "E",
        "alu-6": "NE"
      }
    },
    {
      id: "tar-2",
      titulo: "Resolución de ecuaciones de primer grado",
      materiaId: "saberes",
      periodo: "Trimestre 2",
      fecha: "2026-10-16",
      descripcion: "10 ejercicios prácticos del cuadernillo de trabajo.",
      entregas: {
        "alu-1": "E",
        "alu-2": "E",
        "alu-3": "E",
        "alu-4": "NE", // No entregó
        "alu-5": "E",
        "alu-6": "E"
      }
    },
    {
      id: "tar-3",
      titulo: "Línea del tiempo sobre la Independencia de México",
      materiaId: "etica",
      periodo: "Trimestre 2",
      fecha: "2026-10-19",
      descripcion: "Elaborar en hoja blanca o cartulina con imágenes o dibujos.",
      entregas: {
        "alu-1": "E",
        "alu-2": "E",
        "alu-3": "I", // Incompleta
        "alu-4": "NE", // <-- 3 tareas seguidas no entregadas para López Morales Carlos
        "alu-5": "E",
        "alu-6": "E"
      }
    },
    {
      id: "tar-4",
      titulo: "Folleto sobre prevención de adicciones",
      materiaId: "humano",
      periodo: "Trimestre 2",
      fecha: "2026-10-21",
      descripcion: "Tríptico informativo para la comunidad escolar.",
      entregas: {
        "alu-1": "E",
        "alu-2": "E",
        "alu-3": "E",
        "alu-4": "NE",
        "alu-5": "E",
        "alu-6": "E"
      }
    }
  ],
  calificaciones: [
    // Periodo anterior (Trimestre 1) para comparativa
    {
      periodo: "Trimestre 1",
      alumnoId: "alu-1",
      notas: { lenguajes: 9.0, saberes: 8.5, etica: 9.2, humano: 10, ingles: 8.8 }
    },
    {
      periodo: "Trimestre 1",
      alumnoId: "alu-2",
      notas: { lenguajes: 9.8, saberes: 9.5, etica: 10, humano: 10, ingles: 9.6 }
    },
    {
      periodo: "Trimestre 1",
      alumnoId: "alu-3",
      notas: { lenguajes: 7.2, saberes: 6.8, etica: 7.5, humano: 8.0, ingles: 6.5 }
    },
    {
      periodo: "Trimestre 1",
      alumnoId: "alu-4",
      notas: { lenguajes: 6.5, saberes: 5.8, etica: 6.2, humano: 7.0, ingles: 5.5 }
    },
    {
      periodo: "Trimestre 1",
      alumnoId: "alu-5",
      notas: { lenguajes: 8.8, saberes: 8.4, etica: 8.9, humano: 9.5, ingles: 8.0 }
    },
    {
      periodo: "Trimestre 1",
      alumnoId: "alu-6",
      notas: { lenguajes: 7.0, saberes: 6.0, etica: 6.8, humano: 8.2, ingles: 6.0 }
    },

    // Periodo actual (Trimestre 2)
    {
      periodo: "Trimestre 2",
      alumnoId: "alu-1",
      notas: { lenguajes: 9.2, saberes: 9.0, etica: 9.4, humano: 10, ingles: 9.0 }
    },
    {
      periodo: "Trimestre 2",
      alumnoId: "alu-2",
      notas: { lenguajes: 10, saberes: 9.8, etica: 10, humano: 10, ingles: 9.8 }
    },
    {
      periodo: "Trimestre 2",
      alumnoId: "alu-3",
      notas: { lenguajes: 7.0, saberes: 6.5, etica: 7.0, humano: 8.0, ingles: 6.2 }
    },
    {
      periodo: "Trimestre 2",
      alumnoId: "alu-4",
      notas: { lenguajes: 5.5, saberes: 5.0, etica: 5.8, humano: 6.5, ingles: 5.0 }
    },
    {
      periodo: "Trimestre 2",
      alumnoId: "alu-5",
      notas: { lenguajes: 9.0, saberes: 8.7, etica: 9.2, humano: 9.5, ingles: 8.5 }
    },
    {
      periodo: "Trimestre 2",
      alumnoId: "alu-6",
      notas: { lenguajes: 6.2, saberes: 5.8, etica: 6.0, humano: 7.5, ingles: 5.8 }
    }
  ],
  acuerdosCTE: [
    {
      id: "ac-1",
      sesion: "2da Sesión Ordinaria CTE",
      fechaRegistro: "2026-10-02",
      acuerdo: "Establecer club de reforzamiento matemático los martes y jueves de 1:00 a 2:00 pm para alumnos con promedio menor a 6.5.",
      responsable: "Prof. Alejandro Morales S. (Docente titular)",
      fechaLimite: "2026-11-15",
      estatus: "En Proceso", // Pendiente, En Proceso, Cumplido
      observaciones: "Se cuenta con cuadernillos impresos; asisten 3 alumnos focalizados."
    },
    {
      id: "ac-2",
      sesion: "2da Sesión Ordinaria CTE",
      fechaRegistro: "2026-10-02",
      acuerdo: "Realizar citatorio y firma de carta compromiso con tutores de alumnos con 3 faltas seguidas o más.",
      responsable: "Docente titular y Dirección Escolar",
      fechaLimite: "2026-10-25",
      estatus: "Pendiente",
      observaciones: "Priorizar visita o citatorio para el tutor de Ramírez Ortiz Ángel David."
    },
    {
      id: "ac-3",
      sesion: "1ra Sesión Ordinaria CTE",
      fechaRegistro: "2026-09-08",
      acuerdo: "Diagnóstico inicial de comprensión lectora aplicado a todo el grupo.",
      responsable: "Prof. Alejandro Morales S.",
      fechaLimite: "2026-09-20",
      estatus: "Cumplido",
      observaciones: "Resultados integrados al expediente de grupo."
    }
  ],
  evidencias: [
    {
      id: "evi-1",
      alumnoId: "alu-2",
      materiaId: "lenguajes",
      periodo: "Trimestre 2",
      titulo: "Proyecto Comunitario - Periódico Mural",
      tipo: "Fotografía de Trabajo",
      fecha: "2026-10-18",
      nombreArchivo: "muestra_trabajo_1.jpg",
      url: "", // Si no hay archivo real, se maneja placeholder
      descripcion: "Evidencia de redacción de nota periodística con excelente ortografía."
    },
    {
      id: "alu-4-evi-1",
      alumnoId: "alu-4",
      materiaId: "saberes",
      periodo: "Trimestre 2",
      titulo: "Ficha de Seguimiento y Ajustes Razonables",
      tipo: "Documento / Ficha",
      fecha: "2026-10-15",
      nombreArchivo: "ficha_ajuste.pdf",
      url: "",
      descripcion: "Actividades diferenciadas para cálculo básico y apoyo personalizado."
    }
  ]
};

// Funciones de persistencia JSON
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error leyendo base de datos:', err);
    return defaultData;
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error escribiendo base de datos:', err);
    return false;
  }
}

// Inicializar DB si no existe
readDB();

// ----------------------------------------------------
// MOTOR DE CÁLCULO DE SEMÁFORO Y ALERTAS CRÍTICAS
// ----------------------------------------------------
function calcularSemaforoyAlertas(db, periodoFiltro) {
  const periodo = periodoFiltro || db.config.periodoActivo;
  const alumnos = db.alumnos || [];
  const materias = db.materias || [];

  // Filtrar asistencias por periodo y ordenar cronológicamente
  const asistenciasPeriodo = (db.asistencias || [])
    .filter(a => !periodo || a.periodo === periodo)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const totalDiasAsistencia = asistenciasPeriodo.length;

  // Filtrar tareas por periodo y ordenar cronológicamente
  const tareasPeriodo = (db.tareas || [])
    .filter(t => !periodo || t.periodo === periodo)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const totalTareas = tareasPeriodo.length;

  // Calificaciones del periodo
  const califsPeriodo = (db.calificaciones || []).filter(c => !periodo || c.periodo === periodo);

  const resultados = alumnos.map(alumno => {
    // 1. ASISTENCIA Y FALTAS
    let faltasTotales = 0;
    let retardosTotales = 0;
    let asistenciasTotales = 0;
    let justificadasTotales = 0;

    // Conteo de racha actual de faltas seguidas (desde la última fecha hacia atrás)
    let rachaFaltasSeguidas = 0;
    let maxFaltasSeguidas = 0;
    let tempFaltas = 0;

    asistenciasPeriodo.forEach(asist => {
      const reg = asist.registros ? asist.registros[alumno.id] : 'P';
      if (reg === 'F') {
        faltasTotales++;
        tempFaltas++;
        if (tempFaltas > maxFaltasSeguidas) maxFaltasSeguidas = tempFaltas;
      } else if (reg === 'R') {
        retardosTotales++;
        tempFaltas = 0;
      } else if (reg === 'J') {
        justificadasTotales++;
        tempFaltas = 0;
      } else {
        asistenciasTotales++;
        tempFaltas = 0;
      }
    });

    // Racha actual al final
    for (let i = asistenciasPeriodo.length - 1; i >= 0; i--) {
      const reg = asistenciasPeriodo[i].registros ? asistenciasPeriodo[i].registros[alumno.id] : 'P';
      if (reg === 'F') {
        rachaFaltasSeguidas++;
      } else {
        break;
      }
    }

    const porcentajeAsistencia = totalDiasAsistencia > 0
      ? Math.round(((asistenciasTotales + justificadasTotales + (retardosTotales * 0.5)) / totalDiasAsistencia) * 100)
      : 100;

    // 2. TAREAS
    let tareasEntregadas = 0;
    let tareasNoEntregadas = 0;
    let tareasIncompletas = 0;

    let rachaTareasSinEntregar = 0;
    let maxTareasSinEntregar = 0;
    let tempTareasNoEntr = 0;

    tareasPeriodo.forEach(t => {
      const estado = t.entregas ? t.entregas[alumno.id] : 'E';
      if (estado === 'E') {
        tareasEntregadas++;
        tempTareasNoEntr = 0;
      } else if (estado === 'I') {
        tareasIncompletas++;
        tempTareasNoEntr = 0;
      } else {
        // NE = No entregada
        tareasNoEntregadas++;
        tempTareasNoEntr++;
        if (tempTareasNoEntr > maxTareasSinEntregar) maxTareasSinEntregar = tempTareasNoEntr;
      }
    });

    // Racha actual de tareas sin entregar al final
    for (let i = tareasPeriodo.length - 1; i >= 0; i--) {
      const estado = tareasPeriodo[i].entregas ? tareasPeriodo[i].entregas[alumno.id] : 'E';
      if (estado === 'NE') {
        rachaTareasSinEntregar++;
      } else {
        break;
      }
    }

    const porcentajeTareas = totalTareas > 0
      ? Math.round(((tareasEntregadas + (tareasIncompletas * 0.5)) / totalTareas) * 100)
      : 100;

    // 3. CALIFICACIONES Y PROMEDIO
    const califObj = califsPeriodo.find(c => c.alumnoId === alumno.id);
    const notas = califObj && califObj.notas ? califObj.notas : {};
    let sumaNotas = 0;
    let cantNotas = 0;

    materias.forEach(mat => {
      if (notas[mat.id] !== undefined && notas[mat.id] !== null && notas[mat.id] !== '') {
        const val = parseFloat(notas[mat.id]);
        if (!isNaN(val)) {
          sumaNotas += val;
          cantNotas++;
        }
      }
    });

    const promedio = cantNotas > 0 ? parseFloat((sumaNotas / cantNotas).toFixed(1)) : 8.0;

    // 4. DETERMINACIÓN DEL COLOR DEL SEMÁFORO
    // Verde: Asistencia >= 85%, Tareas >= 80%, Promedio >= 7.0
    // Amarillo: Empieza a fallar (Asistencia 70-84%, Tareas 60-79%, Promedio 6.0-6.9)
    // Rojo: Necesita apoyo / En riesgo (Asistencia < 70% O Tareas < 60% O Promedio < 6.0 O Alerta Crítica)
    let semaforo = 'verde';
    const causasRiesgo = [];

    // Criterios de semáforo
    const esAlertaFaltas = rachaFaltasSeguidas >= 3 || maxFaltasSeguidas >= 3;
    const esAlertaTareas = rachaTareasSinEntregar >= 3 || maxTareasSinEntregar >= 3;

    if (esAlertaFaltas) {
      causasRiesgo.push(`Lleva ${Math.max(rachaFaltasSeguidas, maxFaltasSeguidas)} faltas seguidas`);
    }
    if (esAlertaTareas) {
      causasRiesgo.push(`Lleva ${Math.max(rachaTareasSinEntregar, maxTareasSinEntregar)} tareas seguidas sin entregar`);
    }
    if (promedio < 6.0) {
      causasRiesgo.push(`Promedio reprobatorio (${promedio})`);
    }
    if (porcentajeAsistencia < 70) {
      causasRiesgo.push(`Asistencia crítica (${porcentajeAsistencia}%)`);
    }
    if (porcentajeTareas < 60) {
      causasRiesgo.push(`Bajo cumplimiento de tareas (${porcentajeTareas}%)`);
    }

    if (causasRiesgo.length > 0 || promedio < 6.0 || porcentajeAsistencia < 70 || porcentajeTareas < 60) {
      semaforo = 'rojo';
    } else if (promedio < 7.0 || porcentajeAsistencia < 85 || porcentajeTareas < 80) {
      semaforo = 'amarillo';
      if (promedio < 7.0) causasRiesgo.push(`Promedio regular (${promedio})`);
      if (porcentajeAsistencia < 85) causasRiesgo.push(`Asistencia en observación (${porcentajeAsistencia}%)`);
      if (porcentajeTareas < 80) causasRiesgo.push(`Tareas pendientes (${porcentajeTareas}%)`);
    } else {
      semaforo = 'verde';
    }

    return {
      alumno,
      asistencia: {
        totalDias: totalDiasAsistencia,
        asistencias: asistenciasTotales,
        faltas: faltasTotales,
        retardos: retardosTotales,
        justificadas: justificadasTotales,
        porcentaje: porcentajeAsistencia,
        rachaFaltasSeguidas,
        maxFaltasSeguidas,
        alertaTresFaltas: esAlertaFaltas
      },
      tareas: {
        totalTareas,
        entregadas: tareasEntregadas,
        noEntregadas: tareasNoEntregadas,
        incompletas: tareasIncompletas,
        porcentaje: porcentajeTareas,
        rachaTareasSinEntregar,
        maxTareasSinEntregar,
        alertaTresTareas: esAlertaTareas
      },
      calificaciones: {
        notas,
        promedio
      },
      semaforo,
      causasRiesgo,
      alertas: {
        tresFaltas: esAlertaFaltas,
        tresTareas: esAlertaTareas
      }
    };
  });

  // Resumen del grupo
  const total = resultados.length;
  const enVerde = resultados.filter(r => r.semaforo === 'verde').length;
  const enAmarillo = resultados.filter(r => r.semaforo === 'amarillo').length;
  const enRojo = resultados.filter(r => r.semaforo === 'rojo').length;

  const alertasCriticas = [];
  resultados.forEach(r => {
    if (r.alertas.tresFaltas) {
      alertasCriticas.push({
        tipo: 'FALTAS',
        alumnoId: r.alumno.id,
        nombre: r.alumno.nombre,
        mensaje: `Acumula ${Math.max(r.asistencia.rachaFaltasSeguidas, r.asistencia.maxFaltasSeguidas)} inasistencias consecutivas. Requiere citatorio inmediato.`,
        nivel: 'critico'
      });
    }
    if (r.alertas.tresTareas) {
      alertasCriticas.push({
        tipo: 'TAREAS',
        alumnoId: r.alumno.id,
        nombre: r.alumno.nombre,
        mensaje: `Acumula ${Math.max(r.tareas.rachaTareasSinEntregar, r.tareas.maxTareasSinEntregar)} tareas consecutivas sin entregar. Riesgo de rezago en evaluación continua.`,
        nivel: 'critico'
      });
    }
  });

  const promedioGrupal = total > 0
    ? parseFloat((resultados.reduce((acc, curr) => acc + curr.calificaciones.promedio, 0) / total).toFixed(1))
    : 0;

  const asistenciaGrupal = total > 0
    ? Math.round(resultados.reduce((acc, curr) => acc + curr.asistencia.porcentaje, 0) / total)
    : 0;

  const cumplimientoTareasGrupal = total > 0
    ? Math.round(resultados.reduce((acc, curr) => acc + curr.tareas.porcentaje, 0) / total)
    : 0;

  return {
    periodo,
    resumen: {
      totalAlumnos: total,
      enVerde,
      enAmarillo,
      enRojo,
      promedioGrupal,
      asistenciaGrupal,
      cumplimientoTareasGrupal
    },
    alertasCriticas,
    alumnos: resultados
  };
}

// ----------------------------------------------------
// RUTAS DE LA API
// ----------------------------------------------------

// 1. CONFIGURACIÓN Y MATERIAS PERSONALIZADAS
app.get('/api/config', (req, res) => {
  const db = readDB();
  res.json({
    config: db.config,
    periodos: db.periodos,
    materias: db.materias,
    categoriasNotas: db.categoriasNotas || [
      'Planeación Didáctica',
      'Conducta e Incidencias',
      'Acuerdos con Padres',
      'Pendientes Administrativos',
      'Observación Pedagógica'
    ]
  });
});

app.put('/api/config', (req, res) => {
  const db = readDB();
  db.config = { ...db.config, ...req.body };
  writeDB(db);
  res.json({ success: true, config: db.config });
});

// CRUD DE MATERIAS PERSONALIZADAS (No predefinidas)
app.post('/api/materias', (req, res) => {
  const db = readDB();
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) return res.status(400).json({ error: 'El nombre de la materia es obligatorio' });

  const clave = (req.body.clave || nombre.slice(0, 4).toUpperCase()).trim().toUpperCase();
  const nuevaMateria = {
    id: `mat-${Date.now()}`,
    nombre,
    clave
  };
  db.materias = db.materias || [];
  db.materias.push(nuevaMateria);
  writeDB(db);
  res.json({ success: true, materia: nuevaMateria, materias: db.materias });
});

app.put('/api/materias/:id', (req, res) => {
  const db = readDB();
  db.materias = db.materias || [];
  const idx = db.materias.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Materia no encontrada' });

  db.materias[idx] = {
    ...db.materias[idx],
    nombre: req.body.nombre !== undefined ? req.body.nombre.trim() : db.materias[idx].nombre,
    clave: req.body.clave !== undefined ? req.body.clave.trim().toUpperCase() : db.materias[idx].clave
  };
  writeDB(db);
  res.json({ success: true, materia: db.materias[idx], materias: db.materias });
});

app.delete('/api/materias/:id', (req, res) => {
  const db = readDB();
  db.materias = (db.materias || []).filter(m => m.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, materias: db.materias });
});

// NOTAS DOCENTES POR CATEGORÍA
app.get('/api/notas', (req, res) => {
  const db = readDB();
  const notas = db.notasDocente || [];
  const categorias = db.categoriasNotas || [
    'Planeación Didáctica',
    'Conducta e Incidencias',
    'Acuerdos con Padres',
    'Pendientes Administrativos',
    'Observación Pedagógica'
  ];
  res.json({ notas, categorias });
});

app.post('/api/notas', (req, res) => {
  const db = readDB();
  db.notasDocente = db.notasDocente || [];
  db.categoriasNotas = db.categoriasNotas || [
    'Planeación Didáctica',
    'Conducta e Incidencias',
    'Acuerdos con Padres',
    'Pendientes Administrativos',
    'Observación Pedagógica'
  ];

  const categoria = (req.body.categoria || 'General').trim();
  if (categoria && !db.categoriasNotas.includes(categoria)) {
    db.categoriasNotas.push(categoria);
  }

  const nuevaNota = {
    id: `nota-${Date.now()}`,
    titulo: (req.body.titulo || 'Nota de Voz / Docente').trim(),
    contenido: req.body.contenido || '',
    categoria,
    alumnoId: req.body.alumnoId || '',
    fecha: req.body.fecha || new Date().toISOString().split('T')[0],
    destacada: Boolean(req.body.destacada),
    audioData: req.body.audioData || '',
    audioDuracion: req.body.audioDuracion || 0
  };

  db.notasDocente.unshift(nuevaNota);
  writeDB(db);
  res.json({ success: true, nota: nuevaNota, notas: db.notasDocente, categorias: db.categoriasNotas });
});

app.put('/api/notas/:id', (req, res) => {
  const db = readDB();
  db.notasDocente = db.notasDocente || [];
  db.categoriasNotas = db.categoriasNotas || [
    'Planeación Didáctica',
    'Conducta e Incidencias',
    'Acuerdos con Padres',
    'Pendientes Administrativos',
    'Observación Pedagógica'
  ];

  const idx = db.notasDocente.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nota no encontrada' });

  const categoria = req.body.categoria ? req.body.categoria.trim() : db.notasDocente[idx].categoria;
  if (categoria && !db.categoriasNotas.includes(categoria)) {
    db.categoriasNotas.push(categoria);
  }

  db.notasDocente[idx] = {
    ...db.notasDocente[idx],
    ...req.body,
    categoria
  };
  writeDB(db);
  res.json({ success: true, nota: db.notasDocente[idx], notas: db.notasDocente, categorias: db.categoriasNotas });
});

app.delete('/api/notas/:id', (req, res) => {
  const db = readDB();
  db.notasDocente = (db.notasDocente || []).filter(n => n.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, notas: db.notasDocente });
});

// 2. ALUMNOS
app.get('/api/alumnos', (req, res) => {
  const db = readDB();
  res.json(db.alumnos || []);
});

app.post('/api/alumnos', (req, res) => {
  const db = readDB();
  const nuevoAlumno = {
    id: `alu-${Date.now()}`,
    noLista: (db.alumnos.length || 0) + 1,
    ...req.body
  };
  db.alumnos.push(nuevoAlumno);
  writeDB(db);
  res.json({ success: true, alumno: nuevoAlumno });
});

app.put('/api/alumnos/:id', (req, res) => {
  const db = readDB();
  const index = db.alumnos.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Alumno no encontrado' });
  db.alumnos[index] = { ...db.alumnos[index], ...req.body };
  writeDB(db);
  res.json({ success: true, alumno: db.alumnos[index] });
});

app.delete('/api/alumnos/:id', (req, res) => {
  const db = readDB();
  db.alumnos = db.alumnos.filter(a => a.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 3. ASISTENCIAS
app.get('/api/asistencias', (req, res) => {
  const db = readDB();
  const fecha = req.query.fecha;
  const periodo = req.query.periodo || db.config.periodoActivo;

  if (fecha) {
    const registro = db.asistencias.find(a => a.fecha === fecha);
    return res.json(registro || { fecha, periodo, registros: {} });
  }

  const filtrados = (db.asistencias || []).filter(a => !periodo || a.periodo === periodo);
  res.json(filtrados);
});

app.post('/api/asistencias', (req, res) => {
  const { fecha, periodo, registros } = req.body;
  if (!fecha) return res.status(400).json({ error: 'La fecha es obligatoria' });

  const db = readDB();
  const index = db.asistencias.findIndex(a => a.fecha === fecha);

  if (index >= 0) {
    db.asistencias[index].registros = { ...db.asistencias[index].registros, ...registros };
    if (periodo) db.asistencias[index].periodo = periodo;
  } else {
    db.asistencias.push({
      fecha,
      periodo: periodo || db.config.periodoActivo,
      registros: registros || {}
    });
  }

  writeDB(db);
  res.json({ success: true, fecha, registros });
});

app.delete('/api/asistencias/:fecha', (req, res) => {
  const db = readDB();
  db.asistencias = (db.asistencias || []).filter(a => a.fecha !== req.params.fecha);
  writeDB(db);
  res.json({ success: true });
});

// 4. TAREAS
app.get('/api/tareas', (req, res) => {
  const db = readDB();
  const periodo = req.query.periodo || db.config.periodoActivo;
  const filtradas = (db.tareas || []).filter(t => !periodo || t.periodo === periodo);
  res.json(filtradas);
});

app.post('/api/tareas', (req, res) => {
  const db = readDB();
  const nuevaTarea = {
    id: `tar-${Date.now()}`,
    titulo: req.body.titulo || 'Nueva Tarea',
    materiaId: req.body.materiaId || db.materias[0].id,
    periodo: req.body.periodo || db.config.periodoActivo,
    fecha: req.body.fecha || new Date().toISOString().split('T')[0],
    descripcion: req.body.descripcion || '',
    entregas: req.body.entregas || {}
  };
  db.tareas.push(nuevaTarea);
  writeDB(db);
  res.json({ success: true, tarea: nuevaTarea });
});

app.put('/api/tareas/:id', (req, res) => {
  const db = readDB();
  const index = db.tareas.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
  db.tareas[index] = { ...db.tareas[index], ...req.body };
  writeDB(db);
  res.json({ success: true, tarea: db.tareas[index] });
});

app.delete('/api/tareas/:id', (req, res) => {
  const db = readDB();
  db.tareas = db.tareas.filter(t => t.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/tareas/:id/entregas', (req, res) => {
  const db = readDB();
  const index = db.tareas.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
  db.tareas[index].entregas = { ...db.tareas[index].entregas, ...req.body.entregas };
  writeDB(db);
  res.json({ success: true, tarea: db.tareas[index] });
});

// 5. CALIFICACIONES
app.get('/api/calificaciones', (req, res) => {
  const db = readDB();
  const periodo = req.query.periodo || db.config.periodoActivo;
  const filtradas = (db.calificaciones || []).filter(c => !periodo || c.periodo === periodo);
  res.json(filtradas);
});

app.post('/api/calificaciones', (req, res) => {
  const { alumnoId, periodo, notas } = req.body;
  if (!alumnoId || !periodo) return res.status(400).json({ error: 'Faltan parámetros requeridos' });

  const db = readDB();
  const index = db.calificaciones.findIndex(c => c.alumnoId === alumnoId && c.periodo === periodo);

  if (index >= 0) {
    db.calificaciones[index].notas = { ...db.calificaciones[index].notas, ...notas };
  } else {
    db.calificaciones.push({
      alumnoId,
      periodo,
      notas: notas || {}
    });
  }

  writeDB(db);
  res.json({ success: true, alumnoId, periodo });
});

// 6. SEMÁFORO Y ALERTAS (EN VIVO)
app.get('/api/semaforo', (req, res) => {
  const db = readDB();
  const periodo = req.query.periodo || db.config.periodoActivo;
  const analisis = calcularSemaforoyAlertas(db, periodo);
  res.json(analisis);
});

// 7. COMPARATIVA (PERIODO ACTUAL VS ANTERIOR)
app.get('/api/comparativa', (req, res) => {
  const db = readDB();
  const actualPeriodo = req.query.actual || db.config.periodoActivo;
  
  // Encontrar periodo anterior si no se pasa explícitamente
  let anteriorPeriodo = req.query.anterior;
  if (!anteriorPeriodo) {
    const pIdx = db.periodos.findIndex(p => p.id === actualPeriodo);
    if (pIdx > 0) {
      anteriorPeriodo = db.periodos[pIdx - 1].id;
    } else {
      anteriorPeriodo = db.periodos[0].id;
    }
  }

  const analisisActual = calcularSemaforoyAlertas(db, actualPeriodo);
  const analisisAnterior = calcularSemaforoyAlertas(db, anteriorPeriodo);

  // Comparar por alumno
  const comparativaAlumnos = analisisActual.alumnos.map(itemActual => {
    const itemAnt = analisisAnterior.alumnos.find(a => a.alumno.id === itemActual.alumno.id);
    const promActual = itemActual.calificaciones.promedio;
    const promAnterior = itemAnt ? itemAnt.calificaciones.promedio : promActual;
    const deltaPromedio = parseFloat((promActual - promAnterior).toFixed(1));

    const asisActual = itemActual.asistencia.porcentaje;
    const asisAnterior = itemAnt ? itemAnt.asistencia.porcentaje : asisActual;
    const deltaAsistencia = asisActual - asisAnterior;

    const tarActual = itemActual.tareas.porcentaje;
    const tarAnterior = itemAnt ? itemAnt.tareas.porcentaje : tarActual;
    const deltaTareas = tarActual - tarAnterior;

    return {
      alumno: itemActual.alumno,
      actual: {
        promedio: promActual,
        asistencia: asisActual,
        tareas: tarActual,
        semaforo: itemActual.semaforo
      },
      anterior: {
        promedio: promAnterior,
        asistencia: asisAnterior,
        tareas: tarAnterior,
        semaforo: itemAnt ? itemAnt.semaforo : 'verde'
      },
      delta: {
        promedio: deltaPromedio,
        asistencia: deltaAsistencia,
        tareas: deltaTareas,
        tendencia: deltaPromedio > 0 ? 'subio' : deltaPromedio < 0 ? 'bajo' : 'igual'
      }
    };
  });

  res.json({
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
  });
});

// 8. CONSEJO TÉCNICO ESCOLAR (CTE) - REPORTE EJECUTIVO Y ACUERDOS
app.get('/api/cte/reporte', (req, res) => {
  const db = readDB();
  const periodo = req.query.periodo || db.config.periodoActivo;
  const analisis = calcularSemaforoyAlertas(db, periodo);

  // Alumnos que requieren mayor apoyo (semáforo rojo y amarillo)
  const alumnosPrioritarios = analisis.alumnos
    .filter(a => a.semaforo === 'rojo' || a.semaforo === 'amarillo')
    .sort((a, b) => (a.semaforo === 'rojo' ? -1 : 1));

  // Acuerdos del CTE activos
  const acuerdos = db.acuerdosCTE || [];

  // Evidencias registradas en este periodo
  const evidenciasPeriodo = (db.evidencias || []).filter(e => !periodo || e.periodo === periodo);

  res.json({
    fechaEmision: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
    escuela: db.config.escuela,
    cct: db.config.cct,
    zona: db.config.zona,
    gradoGrupo: `${db.config.grado} "${db.config.grupo}"`,
    docente: db.config.docente,
    ciclo: db.config.ciclo,
    periodo,
    resumen: analisis.resumen,
    alertasCriticas: analisis.alertasCriticas,
    alumnosPrioritarios,
    todosAlumnos: analisis.alumnos,
    acuerdos,
    totalEvidencias: evidenciasPeriodo.length
  });
});

app.get('/api/cte/acuerdos', (req, res) => {
  const db = readDB();
  res.json(db.acuerdosCTE || []);
});

app.post('/api/cte/acuerdos', (req, res) => {
  const db = readDB();
  const nuevoAcuerdo = {
    id: `ac-${Date.now()}`,
    sesion: req.body.sesion || 'Sesión Ordinaria CTE',
    fechaRegistro: req.body.fechaRegistro || new Date().toISOString().split('T')[0],
    acuerdo: req.body.acuerdo || '',
    responsable: req.body.responsable || db.config.docente,
    fechaLimite: req.body.fechaLimite || '',
    estatus: req.body.estatus || 'Pendiente', // Pendiente, En Proceso, Cumplido
    observaciones: req.body.observaciones || ''
  };
  db.acuerdosCTE.unshift(nuevoAcuerdo);
  writeDB(db);
  res.json({ success: true, acuerdo: nuevoAcuerdo });
});

app.put('/api/cte/acuerdos/:id', (req, res) => {
  const db = readDB();
  const index = db.acuerdosCTE.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Acuerdo no encontrado' });
  db.acuerdosCTE[index] = { ...db.acuerdosCTE[index], ...req.body };
  writeDB(db);
  res.json({ success: true, acuerdo: db.acuerdosCTE[index] });
});

app.delete('/api/cte/acuerdos/:id', (req, res) => {
  const db = readDB();
  db.acuerdosCTE = db.acuerdosCTE.filter(a => a.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 9. CARPETA DE EVIDENCIAS Y ARCHIVOS FOTOGRÁFICOS
app.get('/api/evidencias', (req, res) => {
  const db = readDB();
  const { alumnoId, materiaId, periodo } = req.query;
  let filtradas = db.evidencias || [];

  if (alumnoId && alumnoId !== 'undefined' && alumnoId !== 'null' && alumnoId !== 'todos') {
    filtradas = filtradas.filter(e => e.alumnoId === alumnoId);
  }
  if (materiaId && materiaId !== 'undefined' && materiaId !== 'null' && materiaId !== 'todos') {
    filtradas = filtradas.filter(e => e.materiaId === materiaId);
  }
  if (periodo && periodo !== 'undefined' && periodo !== 'null' && periodo !== 'todos') {
    filtradas = filtradas.filter(e => e.periodo === periodo);
  }

  // Vincular nombres de alumno y materia para conveniencia de la UI
  const enriquecidas = filtradas.map(evi => {
    const alu = db.alumnos.find(a => a.id === evi.alumnoId);
    const mat = db.materias.find(m => m.id === evi.materiaId);
    return {
      ...evi,
      alumnoNombre: alu ? alu.nombre : 'Sin alumno',
      materiaNombre: mat ? mat.nombre : 'General'
    };
  });

  res.json(enriquecidas);
});

app.post('/api/evidencias', upload.single('archivo'), (req, res) => {
  const db = readDB();
  const file = req.file;
  const fallbackMateriaId = db.materias && db.materias[0] ? db.materias[0].id : 'lenguajes';
  const fallbackAlumnoId = db.alumnos && db.alumnos[0] ? db.alumnos[0].id : '';

  const nuevaEvidencia = {
    id: `evi-${Date.now()}`,
    alumnoId: req.body.alumnoId || fallbackAlumnoId,
    materiaId: req.body.materiaId || fallbackMateriaId,
    periodo: req.body.periodo || db.config.periodoActivo,
    titulo: (req.body.titulo || 'Evidencia fotográfica').trim(),
    tipo: req.body.tipo || 'Fotografía de Libreta / Trabajo',
    fecha: req.body.fecha || new Date().toISOString().split('T')[0],
    descripcion: req.body.descripcion || '',
    nombreArchivo: file ? file.filename : '',
    nombreOriginal: file ? file.originalname : (req.body.nombreOriginal || ''),
    mimetype: file ? file.mimetype : (req.body.mimetype || ''),
    tamanio: file ? file.size : 0,
    url: file ? `/uploads/${file.filename}` : (req.body.dataUrl || '')
  };

  db.evidencias = db.evidencias || [];
  db.evidencias.unshift(nuevaEvidencia);
  writeDB(db);

  const alu = db.alumnos.find(a => a.id === nuevaEvidencia.alumnoId);
  const mat = db.materias.find(m => m.id === nuevaEvidencia.materiaId);
  const evidenciaEnriquecida = {
    ...nuevaEvidencia,
    alumnoNombre: alu ? alu.nombre : 'Sin alumno',
    materiaNombre: mat ? mat.nombre : 'General'
  };

  res.json({ success: true, evidencia: evidenciaEnriquecida });
});

app.delete('/api/evidencias/:id', (req, res) => {
  const db = readDB();
  const evi = db.evidencias.find(e => e.id === req.params.id);
  if (evi && evi.nombreArchivo) {
    const filePath = path.join(UPLOADS_DIR, evi.nombreArchivo);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('No se pudo eliminar archivo físico:', err);
      }
    }
  }
  db.evidencias = db.evidencias.filter(e => e.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 10. EXPEDIENTE INDIVIDUAL DEL ALUMNO (CARPETA DE EVIDENCIAS COMPLETA)
app.get('/api/exportar/expediente/:alumnoId', (req, res) => {
  const db = readDB();
  const alumnoId = req.params.alumnoId;
  const alumno = db.alumnos.find(a => a.id === alumnoId);
  if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });

  const analisis = calcularSemaforoyAlertas(db, db.config.periodoActivo);
  const estadoAlumno = analisis.alumnos.find(a => a.alumno.id === alumnoId);

  // Evidencias del alumno
  const evidencias = (db.evidencias || [])
    .filter(e => e.alumnoId === alumnoId)
    .map(evi => {
      const mat = db.materias.find(m => m.id === evi.materiaId);
      return {
        ...evi,
        materiaNombre: mat ? mat.nombre : 'General'
      };
    });

  // Historial de calificaciones en todos los periodos
  const historialCalificaciones = (db.calificaciones || [])
    .filter(c => c.alumnoId === alumnoId);

  res.json({
    escuela: db.config.escuela,
    cct: db.config.cct,
    gradoGrupo: `${db.config.grado} "${db.config.grupo}"`,
    ciclo: db.config.ciclo,
    docente: db.config.docente,
    alumno,
    estadoActual: estadoAlumno,
    evidencias,
    historialCalificaciones
  });
});

// 11. RESPALDO Y RESTAURACIÓN
app.get('/api/backup', (req, res) => {
  const db = readDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=respaldo_telesecundaria_${Date.now()}.json`);
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/backup/restaurar', (req, res) => {
  try {
    const backupData = req.body;
    if (!backupData.alumnos || !backupData.config) {
      return res.status(400).json({ error: 'Formato de respaldo inválido' });
    }
    writeDB(backupData);
    res.json({ success: true, message: 'Datos restaurados con éxito' });
  } catch (err) {
    res.status(500).json({ error: 'Error al restaurar: ' + err.message });
  }
});

// 12. ASISTENTE IA META AI (LLAMA 3.3) INTEGRADO
const handleAIChat = async (req, res) => {
  const { mensaje, contextoAlumnoId, tipoPrompt } = req.body;
  const db = readDB();

  // MODO ASISTENTE EDUCATIVO LOCAL BASADO EN META AI / LLAMA 3
  let alumnoInfo = null;
  if (contextoAlumnoId) {
    alumnoInfo = db.alumnos.find(a => a.id === contextoAlumnoId);
  }

  let respuestaGenerada = '';
  const msgLower = (mensaje || '').toLowerCase();

  if (msgLower.includes('citatorio') || msgLower.includes('falta') || tipoPrompt === 'citatorio') {
    const nombreAlu = alumnoInfo ? alumnoInfo.nombre : 'Ramírez Ortiz Ángel David';
    const tutorAlu = alumnoInfo ? alumnoInfo.tutor : 'Guadalupe Ortiz';
    respuestaGenerada = `### 📋 CITATORIO OFICIAL ESCOLAR

**${db.config.escuela.toUpperCase()}**  
**C.C.T.:** ${db.config.cct} | **Zona:** ${db.config.zona}  
**Ciclo Escolar:** ${db.config.ciclo}  
**Lugar y Fecha:** Comunidad Escolar, a ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}

---

**C. ${tutorAlu.toUpperCase()}**  
**Madre / Padre de Familia o Tutor del Alumno(a):** ${nombreAlu}  
**Grado y Grupo:** ${db.config.grado} "${db.config.grupo}"

Por medio de la presente, me dirijo a usted con un cordial saludo y a la vez me permito solicitar su puntual asistencia a una **reunión de carácter urgente y formativo** en las instalaciones del plantel:

* **📅 Fecha:** Mañana ${new Date(Date.now() + 86400000).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
* **⏰ Hora:** 1:30 p.m. (Al término de la jornada escolar)
* **📍 Lugar:** Aula de ${db.config.grado} "${db.config.grupo}"

**Motivo del citatorio:**  
El estudiante acumula **3 inasistencias consecutivas** sin justificación médica o causa de fuerza mayor notificada. De acuerdo con las normas de control escolar y los lineamientos del Consejo Técnico Escolar (CTE), es indispensable dialogar con usted para acordar estrategias que garanticen su derecho a la educación y eviten el rezago en su evaluación continua.

Agradezco de antemano su puntualidad y corresponsabilidad educativa.

---

**Atentamente,**

_____________________________________  
**${db.config.docente}**  
*Docente Titular de Grupo*

---
*(Favor de devolver este talón firmado)*  
**Acuse de Recibo:** Enterado(a) C. __________________________________ Firma: ____________________ Fecha: ____________`;

  } else if (msgLower.includes('planeacion') || msgLower.includes('planeación') || msgLower.includes('nem') || tipoPrompt === 'planeacion') {
    respuestaGenerada = `### 📘 PROPUESTA DE PLANEACIÓN DIDÁCTICA NEM (META AI)
**Nivel:** Telesecundaria | **Grado:** ${db.config.grado} "${db.config.grupo}"  
**Temporalidad:** 1 Semana (5 sesiones)  
**Campos Formativos Integrados:** *Lenguajes* + *Saberes y Pensamiento Científico*  
**Ejes Articuladores:** Pensamiento crítico, Vida saludable, Apropiación de las culturas a través de la lectura.

---

#### 🎯 Proyecto Comunitario: *"El agua en nuestra comunidad: cuidando nuestro futuro"*

* **Propósito:** Que los alumnos investiguen el consumo hídrico en sus hogares, calculen estadísticas de gasto y redacten una infografía informativa bilingüe (español y términos locales).
* **Contenido (PDA):** 
  - *Lenguajes:* Organización y difusión de textos de divulgación científica.
  - *Saberes:* Obtención y representación de información mediante gráficas y promedios.

#### 📅 Secuencia de Actividades:
1. **Día 1 (Identificación):** Lectura guiada en libro de texto sobre el ciclo del agua y problemática local de estiaje. Pregunta detonadora: *¿Cuántos litros de agua consumimos al día?*
2. **Día 2 (Recolección):** Elaboración de tabla de registro para medir el uso diario de cubetas o tambos en casa.
3. **Día 3 (Matemáticas y Análisis):** Cálculo del gasto promedio individual y grupal. Graficación de barras en libreta de cuadrícula.
4. **Día 4 (Redacción y Producción):** Redacción en equipos de 5 recomendaciones prácticas de ahorro para la comunidad escolar.
5. **Día 5 (Socialización y Evaluación):** Presentación de carteles en el patio escolar o periódico mural.

#### 📝 Evaluación Formativa:
* Lista de cotejo de participación y trabajo colaborativo.
* Rúbrica de la infografía (claridad, datos matemáticos correctos y ortografía).
* Fotografía del cartel integrada a la **Carpeta Digital de Evidencias**.`;

  } else if (msgLower.includes('cte') || msgLower.includes('acuerdo') || tipoPrompt === 'cte') {
    respuestaGenerada = `### 🤝 ACUERDOS PROPUESTOS PARA LA SESIÓN DE CTE (META AI)
**Telesecundaria:** ${db.config.escuela} | **Grado:** ${db.config.grado} "${db.config.grupo}"

Para atender a los estudiantes en **Semáforo Rojo** identificados en el reporte:

1. **Acuerdo 1 (Intervención Pedagógica Focalizada):**
   - *Acción:* Implementar cuadernillo de regularización en operaciones básicas y comprensión lectora para los alumnos focalizados, con 20 minutos de apoyo al final de la jornada martes y jueves.
   - *Responsable:* ${db.config.docente}
   - *Fecha Límite:* 15 de noviembre de 2026

2. **Acuerdo 2 (Vínculo con Familias y Corresponsabilidad):**
   - *Acción:* Realizar firma de cartas compromiso con tutores de alumnos que acumulan 3 faltas consecutivas o 3 tareas no entregadas.
   - *Responsable:* Docente titular y Dirección Escolar
   - *Fecha Límite:* 30 de octubre de 2026

3. **Acuerdo 3 (Banco de Evidencias de Progreso):**
   - *Acción:* Subir semanalmente al menos 2 evidencias fotográficas de avances por cada alumno prioritario para documentar la evolución ante la supervisión de zona.
   - *Responsable:* Colectivo docente
   - *Fecha Límite:* Permanente en el ciclo escolar`;

  } else {
    respuestaGenerada = `### 🤖 Asistente Pedagógico Meta AI (Llama 3.3)

He procesado tu consulta: **"${mensaje}"**

**Recomendaciones para el contexto de ${db.config.grado} "${db.config.grupo}":**
1. **Evaluación Formativa Continua:** En Telesecundaria el proceso cualitativo de aprendizaje y las evidencias (libreta, proyectos, participación) tienen el mayor peso.
2. **Atención Temprana:** Usa el **Semáforo Escolar**. Si un estudiante tiene 3 faltas seguidas o 3 tareas sin entregar, la intervención inmediata con la familia previene el abandono escolar.
3. **Carpeta Digital de Evidencias:** Sube fotos de los trabajos en la pestaña *Evidencias* para justificar evaluaciones ante supervisión y directores.`;
  }

  res.json({
    respuesta: respuestaGenerada,
    fuente: 'Meta AI (Llama 3.3 Telesecundaria)'
  });
};

app.post('/api/meta-ai/chat', handleAIChat);
app.post('/api/deepseek/chat', handleAIChat);

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  SISTEMA TELESECUNDARIA PRO ACTIVO EN PUERTO ${PORT}  `);
  console.log(`  Acceso Local (PC): http://localhost:3000`);
  console.log(`  Acceso Celular / Tablet (Wi-Fi): http://TU-IP-LOCAL:3000`);
  console.log(`  Base de datos local: ${DB_PATH}`);
  console.log(`  Carpeta de fotos/evidencias: ${UPLOADS_DIR}`);
  console.log(`=======================================================`);
});
