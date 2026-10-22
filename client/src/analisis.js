// Motor de semáforo y alertas. Es la misma lógica que tenía el servidor Express,
// ahora corre en el navegador sobre los datos del maestro que inició sesión.

export function calcularSemaforoyAlertas(db, periodoFiltro) {
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
