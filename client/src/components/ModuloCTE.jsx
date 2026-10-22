import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Calendar, 
  UserCheck,
  FolderCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  fetchCteReporte, 
  fetchAcuerdosCTE, 
  createAcuerdoCTE, 
  updateAcuerdoCTE, 
  deleteAcuerdoCTE,
  formatearFechaCompleta
} from '../api';
import Membrete from './Membrete';

export default function ModuloCTE({ config }) {
  const [reporte, setReporte] = useState(null);
  const [acuerdos, setAcuerdos] = useState([]);
  const [filtroAcuerdos, setFiltroAcuerdos] = useState('todos');
  const [, setCargando] = useState(true);
  const [modalNuevoAcuerdo, setModalNuevoAcuerdo] = useState(false);

  // Opciones personalizables para incluir o quitar Sello, Nombre, Firmas, Membrete al exportar/imprimir
  const [opcionesImpresion, setOpcionesImpresion] = useState({
    incluirMembrete: true,
    incluirDocente: true,
    incluirDireccion: true,
    incluirSello: true
  });

  // Formulario nuevo acuerdo
  const [nuevoForm, setNuevoForm] = useState({
    sesion: 'Sesión Ordinaria CTE',
    acuerdo: '',
    responsable: config?.docente || 'Docente titular',
    fechaLimite: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estatus: 'Pendiente',
    observaciones: ''
  });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [rep, acs] = await Promise.all([
        fetchCteReporte(config.periodoActivo),
        fetchAcuerdosCTE()
      ]);
      setReporte(rep);
      setAcuerdos(acs);
    } catch (err) {
      console.error('Error cargando datos de CTE:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [config.periodoActivo]);

  const handleCrearAcuerdo = async (e) => {
    e.preventDefault();
    if (!nuevoForm.acuerdo.trim()) return;

    try {
      await createAcuerdoCTE(nuevoForm);
      setModalNuevoAcuerdo(false);
      setNuevoForm({
        sesion: 'Sesión Ordinaria CTE',
        acuerdo: '',
        responsable: config?.docente || 'Docente titular',
        fechaLimite: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estatus: 'Pendiente',
        observaciones: ''
      });
      await cargarDatos();
    } catch (err) {
      alert('Error creando acuerdo de CTE');
    }
  };

  const handleCambiarEstatus = async (id, nuevoEstatus) => {
    try {
      await updateAcuerdoCTE(id, { estatus: nuevoEstatus });
      await cargarDatos();
    } catch (err) {
      alert('Error actualizando estatus');
    }
  };

  const handleEliminarAcuerdo = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este acuerdo?')) return;
    try {
      await deleteAcuerdoCTE(id);
      await cargarDatos();
    } catch (err) {
      alert('Error eliminando acuerdo');
    }
  };

  const imprimirReporte = () => {
    window.print();
  };

  const acuerdosFiltrados = acuerdos.filter(a => {
    if (filtroAcuerdos === 'todos') return true;
    return a.estatus === filtroAcuerdos;
  });

  const acuerdosPendientes = acuerdos.filter(a => a.estatus !== 'Cumplido').length;

  return (
    <div className="space-y-6">
      {/* 1. BARRA PRINCIPAL: BOTÓN REPORTE CTE EN 1 CLIC */}
      <div className="cb-card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#0052FF]/10 text-[#0052FF] font-bold text-[11px] tracking-wider uppercase px-2.5 py-0.5 rounded-[6px]">
              Módulo Oficial CTE
            </span>
            <span className="text-xs text-[#5B616E]">Consejo Técnico Escolar</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#050F1A] mt-1.5">
            Reporte Ejecutivo de Grupo & Acuerdos
          </h2>
          <p className="text-xs sm:text-sm text-[#5B616E] mt-1 max-w-2xl">
            Obtén al instante el concentrado oficial con asistencia, promedios, alumnos en riesgo y evidencias, listo para presentar ante el colectivo y supervisión.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2.5 shrink-0">
          <button data-tour="cte-nuevo-acuerdo"
            onClick={() => setModalNuevoAcuerdo(true)}
            className="cb-btn-secondary text-xs flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#0052FF]" />
            <span>Registrar Acuerdo CTE</span>
          </button>

          <button data-tour="cte-imprimir"
            onClick={imprimirReporte}
            className="cb-btn-primary text-xs flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Reporte CTE (1 Clic)</span>
          </button>
        </div>
      </div>

      {/* BARRA DE OPCIONES DE EXPORTACIÓN / IMPRESIÓN (Sello, Nombre, Firmas, Membrete) */}
      <div data-tour="cte-opciones" className="cb-card p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <span className="text-xs font-bold text-[#050F1A]">
          Elementos a incluir al exportar / imprimir:
        </span>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-[#5B616E] hover:text-[#050F1A]">
            <input
              type="checkbox"
              checked={opcionesImpresion.incluirMembrete}
              onChange={(e) => setOpcionesImpresion({ ...opcionesImpresion, incluirMembrete: e.target.checked })}
              className="w-4 h-4 accent-[#0052FF] rounded"
            />
            <span>Membrete y Datos de Escuela</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium text-[#5B616E] hover:text-[#050F1A]">
            <input
              type="checkbox"
              checked={opcionesImpresion.incluirDocente}
              onChange={(e) => setOpcionesImpresion({ ...opcionesImpresion, incluirDocente: e.target.checked })}
              className="w-4 h-4 accent-[#0052FF] rounded"
            />
            <span>Nombre y Firma de la Maestra(o)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium text-[#5B616E] hover:text-[#050F1A]">
            <input
              type="checkbox"
              checked={opcionesImpresion.incluirDireccion}
              onChange={(e) => setOpcionesImpresion({ ...opcionesImpresion, incluirDireccion: e.target.checked })}
              className="w-4 h-4 accent-[#0052FF] rounded"
            />
            <span>Firma de Dirección</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium text-[#5B616E] hover:text-[#050F1A]">
            <input
              type="checkbox"
              checked={opcionesImpresion.incluirSello}
              onChange={(e) => setOpcionesImpresion({ ...opcionesImpresion, incluirSello: e.target.checked })}
              className="w-4 h-4 accent-[#0052FF] rounded"
            />
            <span>Sello Oficial</span>
          </label>
        </div>
      </div>

      {/* 2. FORMATO OFICIAL IMPRIMIBLE DE CTE (VISIBLE EN PANTALLA E IMPRESIÓN) */}
      <div className="cb-card p-4 sm:p-6 md:p-8 print:p-0 print:border-none print:shadow-none">
        {/* Membrete Escolar Oficial (Opcional, editable en Ajustes) */}
        {opcionesImpresion.incluirMembrete && (
          <Membrete
            titulo="Reporte de Diagnóstico y Seguimiento Escolar para CTE"
            membrete={config?.membrete || reporte?.membrete}
            items={[
              { etiqueta: 'Escuela', valor: config?.escuela || reporte?.escuela },
              { etiqueta: 'C.C.T.', valor: config?.cct || reporte?.cct, tipo: 'mono' },
              { etiqueta: 'Zona', valor: config?.zona || reporte?.zona, tipo: 'mono' },
              { etiqueta: 'Grado y Gpo', valor: `${config?.grado} "${config?.grupo}"`, tipo: 'azul' },
              { etiqueta: 'Periodo', valor: config?.periodoActivo || reporte?.periodo, tipo: 'azul' },
              { etiqueta: 'Ciclo', valor: config?.ciclo || reporte?.ciclo, tipo: 'mono' }
            ]}
          />
        )}

        {/* Resumen Cuantitativo del Grupo */}
        <div data-tour="cte-resumen" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-medium text-[#8A919E] uppercase tracking-[0.06em] block">Promedio del Grupo</span>
            <div className="text-2xl font-bold font-mono-tabular text-[#050F1A] mt-1">
              {reporte?.resumen?.promedioGrupal || '0.0'}
            </div>
            <span className="text-[11px] text-[#5B616E]">Escala 5 - 10</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-medium text-[#8A919E] uppercase tracking-[0.06em] block">Asistencia Grupal</span>
            <div className="text-2xl font-bold font-mono-tabular text-[#050F1A] mt-1">
              {reporte?.resumen?.asistenciaGrupal || 0}%
            </div>
            <span className="text-[11px] text-[#5B616E]">Meta: 85%</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-medium text-[#8A919E] uppercase tracking-[0.06em] block">Cumplimiento Tareas</span>
            <div className="text-2xl font-bold font-mono-tabular text-[#050F1A] mt-1">
              {reporte?.resumen?.cumplimientoTareasGrupal || 0}%
            </div>
            <span className="text-[11px] text-[#5B616E]">Formativa</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-medium text-[#8A919E] uppercase tracking-[0.06em] block">Semáforo Grupal</span>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-xs font-mono-tabular font-bold text-[#05B169] bg-[#E6F6EF] px-2 py-0.5 rounded">
                🟢 {reporte?.resumen?.enVerde}
              </span>
              <span className="text-xs font-mono-tabular font-bold text-[#B87514] bg-[#FEF6E7] px-2 py-0.5 rounded">
                🟡 {reporte?.resumen?.enAmarillo}
              </span>
              <span className="text-xs font-mono-tabular font-bold text-[#DF2935] bg-[#FDECEE] px-2 py-0.5 rounded">
                🔴 {reporte?.resumen?.enRojo}
              </span>
            </div>
            <span className="text-[11px] text-[#5B616E] font-mono-tabular mt-1 block">
              Total: {reporte?.resumen?.totalAlumnos} alumnos
            </span>
          </div>
        </div>

        {/* Sección: Alumnos que Requieren Mayor Apoyo (Semáforo Rojo y Amarillo) */}
        <div data-tour="cte-prioritarios" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="font-bold text-sm text-[#050F1A] uppercase tracking-[0.04em] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#DF2935] shrink-0" />
              <span>Focalización: Alumnos que Requieren Mayor Apoyo Pedagógico</span>
            </h3>
            <span className="text-xs font-mono-tabular font-bold text-[#DF2935] bg-[#FDECEE] px-2.5 py-1 rounded-[6px] self-start sm:self-auto">
              {reporte?.alumnosPrioritarios?.length || 0} alumno(s) en atención prioritaria
            </span>
          </div>

          <div className="border border-[#D1D5DB] rounded-xl overflow-hidden">
            {/* Vista móvil (solo en pantalla < md, oculta al imprimir para que siempre imprima la tabla oficial) */}
            <div className="md:hidden print:hidden divide-y divide-[#D1D5DB]">
              {reporte?.alumnosPrioritarios?.map((item) => {
                const { alumno, asistencia, tareas, calificaciones, semaforo, causasRiesgo, alertas } = item;
                return (
                  <div key={alumno.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#050F1A] text-sm">
                          <span className="font-mono-tabular text-[#8A919E] mr-1">{alumno.noLista}.</span>
                          {alumno.nombre}
                        </div>
                        <div className="text-xs text-[#5B616E]">Tutor: {alumno.tutor || 'No registrado'}</div>
                      </div>
                      {semaforo === 'rojo' ? (
                        <span className="bg-[#FDECEE] text-[#DF2935] font-bold text-xs px-2 py-0.5 rounded-[6px]">
                          🔴 ROJO
                        </span>
                      ) : (
                        <span className="bg-[#FEF6E7] text-[#B87514] font-bold text-xs px-2 py-0.5 rounded-[6px]">
                          🟡 AMARILLO
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#F9FAFB] p-2.5 rounded-lg border border-[#D1D5DB] text-xs font-mono-tabular">
                      <div>Asist: <b>{asistencia.porcentaje}%</b></div>
                      <div>Tareas: <b>{tareas.porcentaje}%</b></div>
                      <div>Prom: <b>{calificaciones.promedio}</b></div>
                    </div>

                    <div className="text-xs space-y-1">
                      {alertas.tresFaltas && (
                        <div className="text-[#DF2935] font-bold">• Acumula 3+ faltas continuas ({asistencia.faltas} en total)</div>
                      )}
                      {alertas.tresTareas && (
                        <div className="text-[#B87514] font-bold">• Acumula 3+ tareas seguidas sin entregar</div>
                      )}
                      {causasRiesgo.map((c, i) => (
                        <div key={i} className="text-[#5B616E]">• {c}</div>
                      ))}
                    </div>

                    <div className="text-xs p-2.5 rounded-lg bg-[#F9FAFB] border border-[#D1D5DB] text-[#050F1A]">
                      <b>Intervención: </b>
                      {semaforo === 'rojo'
                        ? 'Citatorio urgente con tutor, firma de carta compromiso y cuadernillo de recuperación.'
                        : 'Monitoreo de tareas y tutoría entre pares.'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista Tabla (Tablet, Laptop e Impresión) */}
            <div className="hidden md:block print:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#D1D5DB] text-[#8A919E] font-medium uppercase tracking-[0.06em] text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center">No.</th>
                    <th className="py-2.5 px-3">Nombre del Alumno</th>
                    <th className="py-2.5 px-2 text-center">Nivel</th>
                    <th className="py-2.5 px-2 text-right">Asist.</th>
                    <th className="py-2.5 px-2 text-right">Tareas</th>
                    <th className="py-2.5 px-2 text-right">Prom.</th>
                    <th className="py-2.5 px-3">Causas de Rezago / Alertas</th>
                    <th className="py-2.5 px-3">Estrategia Docente / Intervención CTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1D5DB]">
                  {reporte?.alumnosPrioritarios?.map((item) => {
                    const { alumno, asistencia, tareas, calificaciones, semaforo, causasRiesgo, alertas } = item;
                    return (
                      <tr key={alumno.id} className={semaforo === 'rojo' ? 'bg-[#FDECEE]/25' : 'bg-[#FEF6E7]/20'}>
                        <td className="py-3 px-3 text-center font-mono-tabular font-medium text-[#5B616E]">
                          {alumno.noLista}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#050F1A]">{alumno.nombre}</div>
                          <div className="text-[11px] text-[#5B616E]">Tutor: {alumno.tutor || 'No registrado'}</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {semaforo === 'rojo' ? (
                            <span className="bg-[#FDECEE] text-[#DF2935] font-bold text-[11px] px-2 py-0.5 rounded-[6px]">
                              🔴 ROJO
                            </span>
                          ) : (
                            <span className="bg-[#FEF6E7] text-[#B87514] font-bold text-[11px] px-2 py-0.5 rounded-[6px]">
                              🟡 AMARILLO
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-mono-tabular font-bold text-[#050F1A]">
                          {asistencia.porcentaje}%
                        </td>
                        <td className="py-3 px-2 text-right font-mono-tabular font-bold text-[#050F1A]">
                          {tareas.porcentaje}%
                        </td>
                        <td className="py-3 px-2 text-right font-mono-tabular font-bold text-[#050F1A]">
                          {calificaciones.promedio}
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            {alertas.tresFaltas && (
                              <div className="text-[#DF2935] font-bold text-[11px]">
                                • Acumula 3+ faltas continuas ({asistencia.faltas} en total)
                              </div>
                            )}
                            {alertas.tresTareas && (
                              <div className="text-[#B87514] font-bold text-[11px]">
                                • Acumula 3+ tareas seguidas sin entregar
                              </div>
                            )}
                            {causasRiesgo.map((c, i) => (
                              <div key={i} className="text-[#5B616E] text-[11px]">• {c}</div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-[#050F1A]">
                          {semaforo === 'rojo' ? (
                            <span className="font-medium text-[#DF2935]">
                              Citatorio urgente con tutor, firma de carta compromiso, cuadernillo de recuperación y actividades diferenciadas.
                            </span>
                          ) : (
                            <span className="text-[#5B616E]">
                              Monitoreo de tareas y tutoría entre pares para regularizar comprensión.
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {(!reporte?.alumnosPrioritarios || reporte.alumnosPrioritarios.length === 0) && (
                    <tr>
                      <td colSpan="8" className="py-6 text-center text-[#5B616E] text-xs">
                        Excelente noticia: Todo el grupo se encuentra en Semáforo Verde actualmente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resumen de Evidencias Integradas */}
        <div className="mb-8 p-4 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <FolderCheck className="w-5 h-5 text-[#05B169] shrink-0" />
            <span className="font-bold text-[#050F1A]">
              Carpeta de Evidencias de Aprendizaje del Periodo:
            </span>
          </div>
          <div className="font-mono-tabular font-bold text-[#050F1A]">
            {reporte?.totalEvidencias || 0} archivos/fotografías registradas para justificación y supervisión
          </div>
        </div>

        {/* Firmas oficiales para entrega en CTE y Supervisión (Condicionales según elección de la maestra) */}
        {(opcionesImpresion.incluirDocente || opcionesImpresion.incluirDireccion || opcionesImpresion.incluirSello) && (
          <div data-tour="cte-firmas" className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 sm:pt-10 text-center text-xs">
            {opcionesImpresion.incluirDocente && (
              <div>
                <div className="border-b border-[#D1D5DB] pb-1.5 mb-2">
                  <span className="font-bold text-[#050F1A]">{config?.docente || reporte?.docente}</span>
                </div>
                <span className="text-[#5B616E] font-medium">Docente Titular de Grupo</span>
              </div>
            )}

            {opcionesImpresion.incluirDireccion && (
              <div>
                <div className="border-b border-[#D1D5DB] pb-1.5 mb-2">
                  <span className="font-bold text-[#050F1A]">Dirección de la Telesecundaria</span>
                </div>
                <span className="text-[#5B616E] font-medium">Firma y Validación Directiva</span>
              </div>
            )}

            {opcionesImpresion.incluirSello && (
              <div>
                <div className="border-b border-[#D1D5DB] pb-1.5 mb-2 h-6"></div>
                <span className="text-[#5B616E] font-medium">Sello Oficial de la Institución</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BITÁCORA DE ACUERDOS DEL CTE (CON RESPONSABLE, FECHA Y SEGUIMIENTO) */}
      <div data-tour="cte-bitacora" className="cb-card p-4 sm:p-6 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D1D5DB] pb-4 mb-4">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-[#050F1A] flex items-center gap-2 flex-wrap">
              <UserCheck className="w-5 h-5 text-[#0052FF]" />
              <span>Bitácora de Acuerdos y Compromisos del CTE</span>
              {acuerdosPendientes > 0 && (
                <span className="bg-[#FEF6E7] text-[#B87514] font-mono-tabular font-bold text-xs px-2.5 py-0.5 rounded-[6px]">
                  {acuerdosPendientes} pendiente{acuerdosPendientes > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">
              Registra los compromisos fijados en las sesiones con responsable y fecha límite.
            </p>
          </div>

          {/* Filtros de estatus */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setFiltroAcuerdos('todos')}
              className={`min-h-[38px] px-3 py-1.5 text-xs rounded-lg font-bold transition whitespace-nowrap ${
                filtroAcuerdos === 'todos' ? 'bg-[#0052FF] text-white' : 'bg-[#F3F4F6] text-[#5B616E]'
              }`}
            >
              Todos (<span className="font-mono-tabular">{acuerdos.length}</span>)
            </button>
            <button
              onClick={() => setFiltroAcuerdos('Pendiente')}
              className={`min-h-[38px] px-3 py-1.5 text-xs rounded-lg font-bold transition whitespace-nowrap ${
                filtroAcuerdos === 'Pendiente' ? 'bg-[#F0AD4E] text-[#050F1A]' : 'bg-[#FEF6E7] text-[#B87514]'
              }`}
            >
              Pendientes (<span className="font-mono-tabular">{acuerdos.filter(a => a.estatus === 'Pendiente').length}</span>)
            </button>
            <button
              onClick={() => setFiltroAcuerdos('En Proceso')}
              className={`min-h-[38px] px-3 py-1.5 text-xs rounded-lg font-bold transition whitespace-nowrap ${
                filtroAcuerdos === 'En Proceso' ? 'bg-[#0052FF] text-white' : 'bg-[#0052FF]/10 text-[#0052FF]'
              }`}
            >
              En Proceso (<span className="font-mono-tabular">{acuerdos.filter(a => a.estatus === 'En Proceso').length}</span>)
            </button>
            <button
              onClick={() => setFiltroAcuerdos('Cumplido')}
              className={`min-h-[38px] px-3 py-1.5 text-xs rounded-lg font-bold transition whitespace-nowrap ${
                filtroAcuerdos === 'Cumplido' ? 'bg-[#05B169] text-white' : 'bg-[#E6F6EF] text-[#05B169]'
              }`}
            >
              Cumplidos (<span className="font-mono-tabular">{acuerdos.filter(a => a.estatus === 'Cumplido').length}</span>)
            </button>
          </div>
        </div>

        {/* Lista de Acuerdos */}
        <div className="space-y-3">
          {acuerdosFiltrados.map((item) => {
            const esVencido = new Date(item.fechaLimite) < new Date() && item.estatus !== 'Cumplido';

            return (
              <div 
                key={item.id} 
                className={`p-4 rounded-xl border transition ${
                  item.estatus === 'Cumplido'
                    ? 'border-[#05B169]/40 bg-[#E6F6EF]/20'
                    : esVencido
                    ? 'border-[#DF2935] bg-[#FDECEE]/20'
                    : 'border-[#D1D5DB] bg-white hover:border-[#0052FF]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs mb-1.5">
                      <span className="font-bold text-[#050F1A] bg-[#F3F4F6] px-2.5 py-0.5 rounded-[6px]">
                        {item.sesion}
                      </span>
                      <span className="text-[#8A919E] font-medium">
                        Reg: {formatearFechaCompleta(item.fechaRegistro)}
                      </span>
                      {esVencido && (
                        <span className="bg-[#FDECEE] text-[#DF2935] font-bold text-[11px] px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> FECHA LÍMITE VENCIDA
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-[#050F1A] text-sm mt-1">
                      {item.acuerdo}
                    </h4>

                    {item.observaciones && (
                      <p className="text-xs text-[#5B616E] mt-1.5 bg-[#F9FAFB] p-2.5 rounded-lg border border-[#D1D5DB]">
                        <b className="text-[#050F1A]">Observaciones:</b> {item.observaciones}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-[#5B616E] mt-2.5 flex-wrap">
                      <span>Responsable: <b className="text-[#050F1A]">{item.responsable}</b></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#8A919E]" />
                        Límite: <b className={esVencido ? 'text-[#DF2935]' : 'text-[#050F1A]'}>{formatearFechaCompleta(item.fechaLimite)}</b>
                      </span>
                    </div>
                  </div>

                  {/* Acciones y cambio de estatus */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D1D5DB]">
                    <select
                      value={item.estatus}
                      onChange={(e) => handleCambiarEstatus(item.id, e.target.value)}
                      className={`min-h-[40px] text-xs font-bold rounded-lg px-3 py-1.5 border transition cursor-pointer ${
                        item.estatus === 'Cumplido'
                          ? 'border-[#05B169] bg-[#E6F6EF] text-[#05B169]'
                          : item.estatus === 'En Proceso'
                          ? 'border-[#0052FF] bg-[#0052FF]/10 text-[#0052FF]'
                          : 'border-[#F0AD4E] bg-[#FEF6E7] text-[#B87514]'
                      }`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Cumplido">✓ Cumplido</option>
                    </select>

                    <button
                      onClick={() => handleEliminarAcuerdo(item.id)}
                      className="min-h-[40px] min-w-[40px] text-[#8A919E] hover:text-[#DF2935] hover:bg-[#FDECEE] rounded-lg flex items-center justify-center transition"
                      title="Eliminar acuerdo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {acuerdosFiltrados.length === 0 && (
            <div className="text-center py-8 text-[#8A919E] text-xs sm:text-sm">
              No hay acuerdos registrados con este filtro.
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Acuerdo CTE */}
      {modalNuevoAcuerdo && (
        <div className="fixed inset-0 bg-[#050F1A]/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full cb-shadow-level-3 border border-[#D1D5DB]">
            <h3 className="font-bold text-lg text-[#050F1A] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#0052FF]" />
              <span>Registrar Acuerdo o Compromiso de CTE</span>
            </h3>

            <form onSubmit={handleCrearAcuerdo} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Sesión de CTE *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 2da Sesión Ordinaria CTE"
                  value={nuevoForm.sesion}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, sesion: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Acuerdo / Acción Específica *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Ej. Diseñar cuadernillo de apoyo en operaciones básicas para los 3 alumnos focalizados..."
                  value={nuevoForm.acuerdo}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, acuerdo: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">Responsable *</label>
                  <input
                    type="text"
                    required
                    placeholder="Profesor de grupo / Colectivo"
                    value={nuevoForm.responsable}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, responsable: e.target.value })}
                    className="cb-input w-full"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">Fecha Límite *</label>
                  <input
                    type="date"
                    required
                    value={nuevoForm.fechaLimite}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, fechaLimite: e.target.value })}
                    className="cb-input w-full font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Observaciones / Recursos necesarios</label>
                <input
                  type="text"
                  placeholder="Ej. Se solicitará apoyo de libros a dirección escolar."
                  value={nuevoForm.observaciones}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, observaciones: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-[#D1D5DB]">
                <button
                  type="button"
                  onClick={() => setModalNuevoAcuerdo(false)}
                  className="cb-btn-secondary w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cb-btn-primary w-full sm:w-auto"
                >
                  Guardar Acuerdo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
