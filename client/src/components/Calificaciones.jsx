import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Save, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  GitCompare,
  FileSpreadsheet,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  X,
  Check
} from 'lucide-react';
import { 
  fetchCalificaciones, 
  saveCalificacion, 
  fetchComparativa,
  createMateria,
  updateMateria,
  deleteMateria
} from '../api';
import { exportarCalificacionesExcel } from '../exportarExcel';

export default function Calificaciones({ alumnos, materias, config, onDataChange, periodos }) {
  const [vista, setVista] = useState('captura'); // 'captura' o 'comparativa'
  const [, setCalificaciones] = useState([]);
  const [edicionNotas, setEdicionNotas] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  // Modal de Exportación a Excel con opciones de Sello, Nombre, etc.
  const [modalExcel, setModalExcel] = useState(false);
  const [opcionesExport, setOpcionesExport] = useState({
    incluirDatosEscuela: true,
    incluirNombreDocente: true,
    incluirFirmaDirector: true,
    incluirSelloEscolar: true,
    incluirEstatus: true,
    incluirEstadisticas: true,
    incluirBoleta: true
  });

  // Modal de Gestión Rápida de Materias Personalizadas
  const [modalMaterias, setModalMaterias] = useState(false);
  const [nuevaMateria, setNuevaMateria] = useState({ nombre: '', clave: '' });
  const [editMateriaId, setEditMateriaId] = useState(null);

  // Estados de comparativa
  const [comparativaData, setComparativaData] = useState(null);
  const [periodoAnterior, setPeriodoAnterior] = useState('');

  // Cargar calificaciones del periodo actual
  const cargarCalificaciones = async () => {
    try {
      const data = await fetchCalificaciones(config.periodoActivo);
      setCalificaciones(data);
      const notasMap = {};
      data.forEach(c => {
        notasMap[c.alumnoId] = { ...c.notas };
      });
      setEdicionNotas(notasMap);
    } catch (err) {
      console.error('Error cargando notas:', err);
    }
  };

  useEffect(() => {
    cargarCalificaciones();
  }, [config.periodoActivo]);

  // Manejar cambio en un input de calificación
  const handleNotaChange = (alumnoId, materiaId, valor) => {
    let num = valor === '' ? '' : parseFloat(valor);
    if (num > 10) num = 10;
    if (num < 0) num = 0;

    setEdicionNotas(prev => ({
      ...prev,
      [alumnoId]: {
        ...(prev[alumnoId] || {}),
        [materiaId]: valor === '' ? '' : num
      }
    }));
  };

  // Guardar calificaciones en lote
  const handleGuardarTodas = async () => {
    setGuardando(true);
    try {
      const promesas = alumnos.map(alu => {
        const notasAlumno = edicionNotas[alu.id] || {};
        return saveCalificacion(alu.id, config.periodoActivo, notasAlumno);
      });
      await Promise.all(promesas);
      setMensajeGuardado(true);
      await cargarCalificaciones();
      if (onDataChange) await onDataChange();
      setTimeout(() => setMensajeGuardado(false), 3000);
    } catch (err) {
      alert('Error guardando calificaciones');
    } finally {
      setGuardando(false);
    }
  };

  // Cargar datos de comparativa
  const cargarComparativa = async () => {
    try {
      const data = await fetchComparativa(config.periodoActivo, periodoAnterior || undefined);
      setComparativaData(data);
      if (data.periodoAnterior && !periodoAnterior) {
        setPeriodoAnterior(data.periodoAnterior);
      }
    } catch (err) {
      console.error('Error cargando comparativa:', err);
    }
  };

  useEffect(() => {
    if (vista === 'comparativa') {
      cargarComparativa();
    }
  }, [vista, config.periodoActivo, periodoAnterior]);

  // Cálculo del promedio en tiempo real para un alumno
  const calcularPromedioAlumno = (alumnoId) => {
    const notasAlumno = edicionNotas[alumnoId] || {};
    let suma = 0;
    let cant = 0;
    materias.forEach(mat => {
      const val = parseFloat(notasAlumno[mat.id]);
      if (!isNaN(val)) {
        suma += val;
        cant++;
      }
    });
    return cant > 0 ? (suma / cant).toFixed(1) : '-';
  };

  // Gestión de materias personalizadas (Crear / Editar / Eliminar)
  const handleGuardarMateria = async (e) => {
    e.preventDefault();
    if (!nuevaMateria.nombre.trim()) return;
    try {
      if (editMateriaId) {
        await updateMateria(editMateriaId, nuevaMateria);
      } else {
        await createMateria(nuevaMateria);
      }
      setNuevaMateria({ nombre: '', clave: '' });
      setEditMateriaId(null);
      if (onDataChange) await onDataChange();
    } catch (err) {
      alert('Error al guardar materia');
    }
  };

  const handleEliminarMateria = async (id) => {
    if (!window.confirm('¿Deseas eliminar esta materia?')) return;
    try {
      await deleteMateria(id);
      if (onDataChange) await onDataChange();
    } catch (err) {
      alert('Error al eliminar materia');
    }
  };

  // EXPORTAR CALIFICACIONES A EXCEL (.xlsx interactivo con fórmulas, semáforo, estadísticas y boleta)
  const [exportando, setExportando] = useState(false);
  const exportarExcelBienHecho = async () => {
    setExportando(true);
    try {
      await exportarCalificacionesExcel({
        alumnos,
        materias,
        notas: edicionNotas,
        config,
        opciones: opcionesExport
      });
      setModalExcel(false);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      alert('No se pudo generar el archivo de Excel');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Selector de subvista + Botones de Materias, Excel y Guardar */}
      <div className="cb-card p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#050F1A] flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#0052FF]" />
            <span>Registro y Análisis de Calificaciones</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">
            Personaliza tus materias libremente, captura notas del {config.periodoActivo} y exporta a Excel con diseño oficial.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          {/* Selector Captura vs Comparativa */}
          <div data-tour="cal-vista" className="bg-[#F3F4F6] p-1 rounded-lg grid grid-cols-2 sm:flex items-center gap-1">
            <button
              onClick={() => setVista('captura')}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 ${
                vista === 'captura'
                  ? 'bg-white text-[#0052FF] cb-shadow-level-1'
                  : 'text-[#5B616E] hover:text-[#050F1A]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span>Captura</span>
            </button>
            <button
              onClick={() => setVista('comparativa')}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 ${
                vista === 'comparativa'
                  ? 'bg-[#0052FF] text-white cb-shadow-level-1'
                  : 'text-[#5B616E] hover:text-[#050F1A]'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 shrink-0" />
              <span>Comparativa</span>
            </button>
          </div>

          {/* Botón Gestionar Materias (No predefinidas) */}
          <button data-tour="cal-materias"
            onClick={() => setModalMaterias(true)}
            className="cb-btn-secondary text-xs flex items-center justify-center gap-1.5 px-3.5"
          >
            <BookOpen className="w-4 h-4 text-[#0052FF]" />
            <span>Materias ({materias.length})</span>
          </button>

          {/* Botón Exportar a Excel */}
          <button data-tour="cal-excel"
            onClick={() => setModalExcel(true)}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#05B169] hover:opacity-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar a Excel</span>
          </button>

          {vista === 'captura' && (
            <button data-tour="cal-guardar"
              onClick={handleGuardarTodas}
              disabled={guardando}
              className="cb-btn-primary text-xs flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{guardando ? 'Guardando...' : 'Guardar Calificaciones'}</span>
            </button>
          )}
        </div>
      </div>

      {mensajeGuardado && (
        <div className="bg-[#E6F6EF] border border-[#05B169] text-[#05B169] px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between">
          <span>✓ Calificaciones guardadas exitosamente. El semáforo y los reportes de CTE se recalcularon.</span>
        </div>
      )}

      {/* VISTA 1: CAPTURA DE CALIFICACIONES */}
      {vista === 'captura' && (
        <div className="cb-card overflow-hidden">
          {/* 1A. VISTA MÓVIL POR TARJETA DE ALUMNO (< md) */}
          <div data-tour="cal-tabla" className="md:hidden divide-y divide-[#D1D5DB]">
            {alumnos.map((alumno) => {
              const notasAlumno = edicionNotas[alumno.id] || {};
              const prom = calcularPromedioAlumno(alumno.id);
              const promNum = parseFloat(prom);

              return (
                <div key={alumno.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-[#F3F4F6] text-[#5B616E] font-mono-tabular font-bold text-xs flex items-center justify-center shrink-0">
                        {alumno.noLista}
                      </span>
                      <span className="font-bold text-[#050F1A] text-sm truncate">
                        {alumno.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-[#5B616E]">Prom:</span>
                      <span className={`font-mono-tabular font-bold text-sm px-2.5 py-0.5 rounded-[6px] ${
                        promNum < 6.0 
                          ? 'text-[#DF2935] bg-[#FDECEE]' 
                          : promNum < 7.0 
                          ? 'text-[#B87514] bg-[#FEF6E7]' 
                          : 'text-[#05B169] bg-[#E6F6EF]'
                      }`}>
                        {prom}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {materias.map((mat) => {
                      const valor = notasAlumno[mat.id] !== undefined ? notasAlumno[mat.id] : '';
                      const valorNum = parseFloat(valor);
                      return (
                        <div key={mat.id} className="bg-[#F9FAFB] p-2 rounded-lg border border-[#D1D5DB] flex items-center justify-between gap-2">
                          <label className="text-xs font-medium text-[#5B616E] truncate" title={mat.nombre}>
                            {mat.clave || mat.nombre}
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="5"
                            max="10"
                            placeholder="-"
                            value={valor}
                            onChange={(e) => handleNotaChange(alumno.id, mat.id, e.target.value)}
                            className={`w-16 min-h-[38px] text-center font-mono-tabular font-bold py-1 px-1.5 rounded-md border text-sm transition focus:outline-none focus:border-[#0052FF] ${
                              valorNum < 6.0
                                ? 'border-[#DF2935] bg-[#FDECEE] text-[#DF2935]'
                                : valorNum < 7.0
                                ? 'border-[#F0AD4E] bg-[#FEF6E7] text-[#B87514]'
                                : 'border-[#D1D5DB] bg-white text-[#050F1A]'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 1B. VISTA DE TABLA MATRICIAL PARA TABLET Y LAPTOP (hidden md:block) */}
          <div data-tour="cal-tabla" className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#D1D5DB] text-[#8A919E] uppercase tracking-[0.06em] text-[12px] font-medium">
                  <th className="py-3.5 px-3 w-12 text-center">No.</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Alumno</th>
                  {materias.map((m) => (
                    <th key={m.id} className="py-3.5 px-2 text-center max-w-[130px]" title={m.nombre}>
                      <span className="block truncate font-mono-tabular text-[#050F1A] font-bold">{m.clave || m.nombre.slice(0, 6)}</span>
                      <span className="block truncate text-[10px] font-normal text-[#5B616E] normal-case">{m.nombre}</span>
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-right bg-[#F3F4F6] text-[#050F1A] font-bold">
                    Promedio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1D5DB]">
                {alumnos.map((alumno) => {
                  const notasAlumno = edicionNotas[alumno.id] || {};
                  const prom = calcularPromedioAlumno(alumno.id);
                  const promNum = parseFloat(prom);

                  return (
                    <tr key={alumno.id} className="h-[60px] hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono-tabular font-medium text-[#5B616E] text-sm">
                        {alumno.noLista}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-[#050F1A] text-sm">
                          {alumno.nombre}
                        </div>
                      </td>
                      {materias.map((mat) => {
                        const valor = notasAlumno[mat.id] !== undefined ? notasAlumno[mat.id] : '';
                        const valorNum = parseFloat(valor);
                        return (
                          <td key={mat.id} className="py-2 px-2 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="5"
                              max="10"
                              placeholder="-"
                              value={valor}
                              onChange={(e) => handleNotaChange(alumno.id, mat.id, e.target.value)}
                              className={`w-16 min-h-[40px] text-center font-mono-tabular font-bold py-1 px-1.5 rounded-lg border text-sm transition focus:outline-none focus:border-[#0052FF] focus:ring-3 focus:ring-[#0052FF]/10 ${
                                valorNum < 6.0
                                  ? 'border-[#DF2935] bg-[#FDECEE] text-[#DF2935]'
                                  : valorNum < 7.0
                                  ? 'border-[#F0AD4E] bg-[#FEF6E7] text-[#B87514]'
                                  : 'border-[#D1D5DB] bg-white text-[#050F1A]'
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-4 text-right bg-[#F9FAFB]">
                        <span className={`font-mono-tabular font-bold text-sm px-2.5 py-1 rounded-[6px] inline-block ${
                          promNum < 6.0 
                            ? 'text-[#DF2935] bg-[#FDECEE]' 
                            : promNum < 7.0 
                            ? 'text-[#B87514] bg-[#FEF6E7]' 
                            : 'text-[#05B169] bg-[#E6F6EF]'
                        }`}>
                          {prom}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#F9FAFB] border-t border-[#D1D5DB] text-xs text-[#5B616E] flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span>Escala oficial:</span>
              <span className="font-mono-tabular font-bold text-[#DF2935] bg-[#FDECEE] px-2 py-0.5 rounded">5.0 - 5.9 Reprobatorio</span>
              <span className="font-mono-tabular font-bold text-[#B87514] bg-[#FEF6E7] px-2 py-0.5 rounded">6.0 - 6.9 Regular</span>
              <span className="font-mono-tabular font-bold text-[#05B169] bg-[#E6F6EF] px-2 py-0.5 rounded">7.0 - 10.0 Aprobatorio</span>
            </div>
            <div>
              Al modificar cualquier nota, toca en <b className="text-[#050F1A]">"Guardar Calificaciones"</b>.
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: COMPARATIVA CON EL PERIODO ANTERIOR */}
      {vista === 'comparativa' && (
        <div className="space-y-4">
          <div className="cb-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-[#050F1A]">Comparando:</span>
              <span className="bg-[#0052FF]/10 text-[#0052FF] font-bold px-2.5 py-1 rounded-[6px]">
                {comparativaData?.periodoActual || config.periodoActivo} (Actual)
              </span>
              <span className="text-[#8A919E] font-bold">VS</span>
              <select
                value={periodoAnterior}
                onChange={(e) => setPeriodoAnterior(e.target.value)}
                className="cb-input text-xs font-bold py-1.5 min-h-[38px]"
              >
                {periodos?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-[#5B616E]">
              Muestra variaciones en promedio, asistencia y cumplimiento de tareas.
            </div>
          </div>

          {comparativaData?.deltaGrupal && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="cb-card p-5">
                <span className="text-xs text-[#8A919E] uppercase tracking-[0.06em] font-medium">
                  Cambio en Promedio Grupal
                </span>
                <div className="text-2xl font-bold font-mono-tabular text-[#050F1A] mt-1.5 flex items-center gap-2.5">
                  <span>{comparativaData.resumenActual?.promedioGrupal}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-[6px] font-mono-tabular font-bold flex items-center gap-1 ${
                    comparativaData.deltaGrupal.promedio > 0
                      ? 'bg-[#E6F6EF] text-[#05B169]'
                      : comparativaData.deltaGrupal.promedio < 0
                      ? 'bg-[#FDECEE] text-[#DF2935]'
                      : 'bg-[#F3F4F6] text-[#5B616E]'
                  }`}>
                    {comparativaData.deltaGrupal.promedio > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                    {comparativaData.deltaGrupal.promedio < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                    {comparativaData.deltaGrupal.promedio > 0 ? `+${comparativaData.deltaGrupal.promedio}` : comparativaData.deltaGrupal.promedio}
                  </span>
                </div>
                <span className="text-xs text-[#5B616E] font-mono-tabular block mt-1">
                  Anterior: {comparativaData.resumenAnterior?.promedioGrupal}
                </span>
              </div>

              <div className="cb-card p-5">
                <span className="text-xs text-[#8A919E] uppercase tracking-[0.06em] font-medium">
                  Cambio en Asistencia Grupal
                </span>
                <div className="text-2xl font-bold font-mono-tabular text-[#050F1A] mt-1.5 flex items-center gap-2.5">
                  <span>{comparativaData.resumenActual?.asistenciaGrupal}%</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-[6px] font-mono-tabular font-bold flex items-center gap-1 ${
                    comparativaData.deltaGrupal.asistencia > 0
                      ? 'bg-[#E6F6EF] text-[#05B169]'
                      : comparativaData.deltaGrupal.asistencia < 0
                      ? 'bg-[#FDECEE] text-[#DF2935]'
                      : 'bg-[#F3F4F6] text-[#5B616E]'
                  }`}>
                    {comparativaData.deltaGrupal.asistencia > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                    {comparativaData.deltaGrupal.asistencia < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                    {comparativaData.deltaGrupal.asistencia > 0 ? `+${comparativaData.deltaGrupal.asistencia}%` : `${comparativaData.deltaGrupal.asistencia}%`}
                  </span>
                </div>
                <span className="text-xs text-[#5B616E] font-mono-tabular block mt-1">
                  Anterior: {comparativaData.resumenAnterior?.asistenciaGrupal}%
                </span>
              </div>

              <div className="cb-card p-5">
                <span className="text-xs text-[#8A919E] uppercase tracking-[0.06em] font-medium">
                  Cambio Cumplimiento Tareas
                </span>
                <div className="text-2xl font-bold font-mono-tabular text-[#050F1A] mt-1.5 flex items-center gap-2.5">
                  <span>{comparativaData.resumenActual?.cumplimientoTareasGrupal}%</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-[6px] font-mono-tabular font-bold flex items-center gap-1 ${
                    comparativaData.deltaGrupal.tareas > 0
                      ? 'bg-[#E6F6EF] text-[#05B169]'
                      : comparativaData.deltaGrupal.tareas < 0
                      ? 'bg-[#FDECEE] text-[#DF2935]'
                      : 'bg-[#F3F4F6] text-[#5B616E]'
                  }`}>
                    {comparativaData.deltaGrupal.tareas > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                    {comparativaData.deltaGrupal.tareas < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                    {comparativaData.deltaGrupal.tareas > 0 ? `+${comparativaData.deltaGrupal.tareas}%` : `${comparativaData.deltaGrupal.tareas}%`}
                  </span>
                </div>
                <span className="text-xs text-[#5B616E] font-mono-tabular block mt-1">
                  Anterior: {comparativaData.resumenAnterior?.cumplimientoTareasGrupal}%
                </span>
              </div>
            </div>
          )}

          <div className="cb-card overflow-hidden">
            <div className="md:hidden divide-y divide-[#D1D5DB]">
              {comparativaData?.comparativaAlumnos?.map((item) => {
                const { alumno, actual, anterior, delta } = item;
                return (
                  <div key={alumno.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#050F1A] text-sm">
                        <span className="font-mono-tabular text-[#8A919E] mr-1.5">{alumno.noLista}.</span>
                        {alumno.nombre}
                      </span>
                      {delta.tendencia === 'subio' ? (
                        <span className="inline-flex items-center gap-1 text-[#05B169] font-bold bg-[#E6F6EF] px-2.5 py-0.5 rounded-[6px] text-xs">
                          <TrendingUp className="w-3.5 h-3.5" /> Subió
                        </span>
                      ) : delta.tendencia === 'bajo' ? (
                        <span className="inline-flex items-center gap-1 text-[#DF2935] font-bold bg-[#FDECEE] px-2.5 py-0.5 rounded-[6px] text-xs">
                          <TrendingDown className="w-3.5 h-3.5" /> Bajó
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#5B616E] font-medium bg-[#F3F4F6] px-2.5 py-0.5 rounded-[6px] text-xs">
                          <Minus className="w-3.5 h-3.5" /> Constante
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#F9FAFB] p-2.5 rounded-lg border border-[#D1D5DB] text-xs">
                      <div>
                        <span className="text-[10px] text-[#8A919E] uppercase block">Prom. Ant → Act</span>
                        <span className="font-mono-tabular font-bold text-[#050F1A]">
                          {anterior.promedio} → {actual.promedio}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8A919E] uppercase block">Diferencia</span>
                        <span className={`font-mono-tabular font-bold ${
                          delta.promedio > 0 ? 'text-[#05B169]' : delta.promedio < 0 ? 'text-[#DF2935]' : 'text-[#5B616E]'
                        }`}>
                          {delta.promedio > 0 ? `+${delta.promedio}` : delta.promedio}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8A919E] uppercase block">Asistencia</span>
                        <span className="font-mono-tabular font-bold text-[#050F1A]">
                          {anterior.asistencia}% → {actual.asistencia}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#D1D5DB] text-[#8A919E] uppercase tracking-[0.06em] text-[12px] font-medium">
                    <th className="py-3.5 px-4 w-12 text-center">No.</th>
                    <th className="py-3.5 px-4">Alumno</th>
                    <th className="py-3.5 px-4 text-right">Promedio Anterior</th>
                    <th className="py-3.5 px-4 text-right">Promedio Actual</th>
                    <th className="py-3.5 px-4 text-right">Diferencia</th>
                    <th className="py-3.5 px-4 text-right">Asistencia (Ant → Act)</th>
                    <th className="py-3.5 px-4 text-right">Tendencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1D5DB]">
                  {comparativaData?.comparativaAlumnos?.map((item) => {
                    const { alumno, actual, anterior, delta } = item;
                    return (
                      <tr key={alumno.id} className="h-[60px] hover:bg-[#F9FAFB] transition">
                        <td className="py-3 px-4 text-center font-mono-tabular font-medium text-[#5B616E] text-sm">
                          {alumno.noLista}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#050F1A] text-sm">
                          {alumno.nombre}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-tabular text-[#5B616E] text-sm">
                          {anterior.promedio}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-tabular font-bold text-[#050F1A] text-sm">
                          {actual.promedio}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center gap-1 font-mono-tabular font-bold px-2.5 py-0.5 rounded-[6px] text-xs ${
                            delta.promedio > 0
                              ? 'bg-[#E6F6EF] text-[#05B169]'
                              : delta.promedio < 0
                              ? 'bg-[#FDECEE] text-[#DF2935]'
                              : 'bg-[#F3F4F6] text-[#5B616E]'
                          }`}>
                            {delta.promedio > 0 ? `+${delta.promedio}` : delta.promedio}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono-tabular text-sm text-[#5B616E]">
                          <span>{anterior.asistencia}%</span>
                          <span className="mx-1.5 text-[#8A919E]">→</span>
                          <span className="font-bold text-[#050F1A]">{actual.asistencia}%</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {delta.tendencia === 'subio' ? (
                            <span className="inline-flex items-center gap-1 text-[#05B169] font-bold bg-[#E6F6EF] px-2.5 py-1 rounded-[6px] text-xs">
                              <TrendingUp className="w-3.5 h-3.5" /> Subió
                            </span>
                          ) : delta.tendencia === 'bajo' ? (
                            <span className="inline-flex items-center gap-1 text-[#DF2935] font-bold bg-[#FDECEE] px-2.5 py-1 rounded-[6px] text-xs">
                              <TrendingDown className="w-3.5 h-3.5" /> Bajó
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#5B616E] font-medium bg-[#F3F4F6] px-2.5 py-1 rounded-[6px] text-xs">
                              <Minus className="w-3.5 h-3.5" /> Constante
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EXPORTAR CALIFICACIONES A EXCEL CON OPCIONES (Sello, Nombre, Firmas) */}
      {modalExcel && (
        <div className="fixed inset-0 bg-[#050F1A]/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full cb-shadow-level-3 border border-[#D1D5DB]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-[#050F1A] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#05B169]" />
                <span>Exportar Calificaciones a Excel</span>
              </h3>
              <button
                onClick={() => setModalExcel(false)}
                className="w-8 h-8 rounded-lg text-[#5B616E] hover:bg-[#F3F4F6] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#5B616E] mb-4">
              Se genera un Excel interactivo: si corriges una calificación dentro del archivo, promedios, semáforo, lugares y boletas se recalculan solos. Elige qué incluir:
            </p>

            <div className="space-y-2.5 bg-[#F9FAFB] p-4 rounded-xl border border-[#D1D5DB] text-xs sm:text-sm">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={opcionesExport.incluirDatosEscuela}
                  onChange={(e) => setOpcionesExport({ ...opcionesExport, incluirDatosEscuela: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#0052FF]"
                />
                <span className="text-[#050F1A] font-medium">Incluir nombre de la escuela, CCT, Zona y Grupo</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={opcionesExport.incluirNombreDocente}
                  onChange={(e) => setOpcionesExport({ ...opcionesExport, incluirNombreDocente: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#0052FF]"
                />
                <span className="text-[#050F1A] font-medium">Incluir nombre y firma de la Maestra / Docente</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={opcionesExport.incluirFirmaDirector}
                  onChange={(e) => setOpcionesExport({ ...opcionesExport, incluirFirmaDirector: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#0052FF]"
                />
                <span className="text-[#050F1A] font-medium">Incluir firma de Dirección Escolar</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={opcionesExport.incluirSelloEscolar}
                  onChange={(e) => setOpcionesExport({ ...opcionesExport, incluirSelloEscolar: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#0052FF]"
                />
                <span className="text-[#050F1A] font-medium">Incluir espacio para Sello Oficial</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={opcionesExport.incluirEstatus}
                  onChange={(e) => setOpcionesExport({ ...opcionesExport, incluirEstatus: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#0052FF]"
                />
                <span className="text-[#050F1A] font-medium">Incluir columna de Nivel / Estatus (Aprobatorio/Riesgo)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={opcionesExport.incluirEstadisticas}
                  onChange={(e) => setOpcionesExport({ ...opcionesExport, incluirEstadisticas: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#0052FF]"
                />
                <span className="text-[#050F1A] font-medium">Hoja de Estadísticas (por materia, distribución, cuadro de honor y alumnos en riesgo)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={opcionesExport.incluirBoleta}
                  onChange={(e) => setOpcionesExport({ ...opcionesExport, incluirBoleta: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#0052FF]"
                />
                <span className="text-[#050F1A] font-medium">Boleta Individual interactiva (eliges al alumno de una lista y se llena sola)</span>
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 mt-5 pt-3 border-t border-[#D1D5DB]">
              <button
                type="button"
                onClick={() => setModalExcel(false)}
                className="cb-btn-secondary w-full sm:w-auto text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={exportarExcelBienHecho}
                disabled={exportando}
                className="min-h-[44px] px-5 py-2 rounded-lg bg-[#05B169] hover:opacity-95 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{exportando ? 'Generando Excel...' : 'Descargar Excel Ahora'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GESTIÓN DE MATERIAS PERSONALIZADAS (No predefinidas) */}
      {modalMaterias && (
        <div className="fixed inset-0 bg-[#050F1A]/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full cb-shadow-level-3 border border-[#D1D5DB] my-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-[#050F1A] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0052FF]" />
                <span>Personalizar Materias / Asignaturas</span>
              </h3>
              <button
                onClick={() => {
                  setModalMaterias(false);
                  setEditMateriaId(null);
                  setNuevaMateria({ nombre: '', clave: '' });
                }}
                className="w-8 h-8 rounded-lg text-[#5B616E] hover:bg-[#F3F4F6] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5B616E] mb-4">
              Agrega cualquier materia, taller, campo formativo o disciplina que impartas, o edita/elimina las actuales.
            </p>

            {/* Formulario agregar/editar materia */}
            <form onSubmit={handleGuardarMateria} className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#D1D5DB] mb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#050F1A] mb-1">Nombre de la Materia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Matemáticas, Artes, Laboratorio..."
                    value={nuevaMateria.nombre}
                    onChange={(e) => setNuevaMateria({ ...nuevaMateria, nombre: e.target.value })}
                    className="cb-input w-full text-xs min-h-[38px] py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#050F1A] mb-1">Abreviatura</label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="Ej. MAT"
                    value={nuevaMateria.clave}
                    onChange={(e) => setNuevaMateria({ ...nuevaMateria, clave: e.target.value.toUpperCase() })}
                    className="cb-input w-full text-xs font-mono-tabular min-h-[38px] py-1.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {editMateriaId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditMateriaId(null);
                      setNuevaMateria({ nombre: '', clave: '' });
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-[#5B616E] hover:text-[#050F1A]"
                  >
                    Cancelar edición
                  </button>
                )}
                <button
                  type="submit"
                  className="cb-btn-primary text-xs min-h-[38px] py-1.5 px-4 flex items-center gap-1.5"
                >
                  {editMateriaId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editMateriaId ? 'Actualizar Materia' : 'Agregar Materia'}</span>
                </button>
              </div>
            </form>

            {/* Lista de materias actuales */}
            <div className="max-h-[260px] overflow-y-auto divide-y divide-[#D1D5DB] border border-[#D1D5DB] rounded-xl">
              {materias.map((m) => (
                <div key={m.id} className="p-3 flex items-center justify-between gap-2 hover:bg-[#F9FAFB]">
                  <div className="min-w-0">
                    <span className="font-mono-tabular font-bold text-[11px] bg-[#0052FF]/10 text-[#0052FF] px-2 py-0.5 rounded mr-2">
                      {m.clave || m.nombre.slice(0, 4).toUpperCase()}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-[#050F1A]">{m.nombre}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMateriaId(m.id);
                        setNuevaMateria({ nombre: m.nombre, clave: m.clave || '' });
                      }}
                      className="p-1.5 text-[#5B616E] hover:text-[#0052FF] rounded-md"
                      title="Renombrar materia"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarMateria(m.id)}
                      className="p-1.5 text-[#8A919E] hover:text-[#DF2935] rounded-md"
                      title="Eliminar materia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
