import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Check, 
  X, 
  Clock, 
  FileCheck, 
  AlertTriangle, 
  Save, 
  CheckCheck,
  Phone,
  History,
  Eye,
  Trash2
} from 'lucide-react';
import { 
  fetchAsistencias, 
  fetchHistorialAsistencias, 
  saveAsistencias, 
  deleteAsistenciaFecha,
  formatearFechaCompleta,
  formatearFechaDMA
} from '../api';

export default function Asistencia({ alumnos, config, onDataChange, semaforoData }) {
  const [subVista, setSubVista] = useState('diario'); // 'diario' o 'historial'
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [registros, setRegistros] = useState({});
  const [historialFechas, setHistorialFechas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  const cargarHistorial = async () => {
    try {
      const lista = await fetchHistorialAsistencias(config.periodoActivo);
      if (Array.isArray(lista)) {
        const ordenada = [...lista].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setHistorialFechas(ordenada);
      }
    } catch (err) {
      console.error('Error cargando historial de asistencias:', err);
    }
  };

  // Cargar registro de la fecha seleccionada
  useEffect(() => {
    async function load() {
      try {
        const [data] = await Promise.all([
          fetchAsistencias(fecha, config.periodoActivo),
          cargarHistorial()
        ]);
        if (data && data.registros && Object.keys(data.registros).length > 0) {
          setRegistros(data.registros);
        } else {
          const inicial = {};
          alumnos.forEach(a => {
            inicial[a.id] = 'P';
          });
          setRegistros(inicial);
        }
      } catch (err) {
        console.error('Error cargando asistencia:', err);
      }
    }
    load();
  }, [fecha, config.periodoActivo, alumnos]);

  const setEstado = (alumnoId, estado) => {
    setRegistros(prev => ({
      ...prev,
      [alumnoId]: estado
    }));
  };

  const marcarTodosPresentes = () => {
    const nuevos = {};
    alumnos.forEach(a => {
      nuevos[a.id] = 'P';
    });
    setRegistros(nuevos);
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await saveAsistencias(fecha, config.periodoActivo, registros);
      setMensajeGuardado(true);
      await cargarHistorial();
      if (onDataChange) onDataChange();
      setTimeout(() => setMensajeGuardado(false), 3000);
    } catch (err) {
      alert('Error al guardar asistencia');
    } finally {
      setGuardando(false);
    }
  };

  const handleSeleccionarFechaAnterior = (fechaHist) => {
    setFecha(fechaHist);
    setSubVista('diario');
  };

  const handleEliminarFecha = async (fechaEliminar) => {
    if (!window.confirm(`¿Deseas eliminar el pase de lista del día ${fechaEliminar}?`)) return;
    try {
      await deleteAsistenciaFecha(fechaEliminar);
      await cargarHistorial();
      if (onDataChange) onDataChange();
    } catch (err) {
      alert('Error al eliminar registro de asistencia');
    }
  };

  // Conteo del día actual
  const presentes = Object.values(registros).filter(v => v === 'P').length;
  const faltas = Object.values(registros).filter(v => v === 'F').length;
  const retardos = Object.values(registros).filter(v => v === 'R').length;
  const justificadas = Object.values(registros).filter(v => v === 'J').length;

  // Fechas ordenadas cronológicamente para la matriz
  const fechasCronologicas = [...historialFechas].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  return (
    <div className="space-y-5">
      {/* Barra superior de control y selector de vista (Pase del Día vs Pases de Lista Anteriores) */}
      <div className="cb-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0052FF]/10 text-[#0052FF] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#050F1A] text-base sm:text-lg leading-tight">
                Control de Asistencia Escolar
              </h2>
              <span className="text-xs text-[#5B616E]">
                Registra el pase de lista diario o consulta listas de días anteriores
              </span>
            </div>
          </div>
        </div>

        {/* Selector de pestaña: Pase Diario vs Historial de Listas Anteriores */}
        <div data-tour="asist-vista" className="bg-[#F3F4F6] p-1 rounded-lg grid grid-cols-2 sm:flex items-center gap-1 self-stretch sm:self-auto">
          <button
            onClick={() => setSubVista('diario')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 ${
              subVista === 'diario'
                ? 'bg-white text-[#0052FF] cb-shadow-level-1'
                : 'text-[#5B616E] hover:text-[#050F1A]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Pase de Lista</span>
          </button>

          <button
            onClick={() => setSubVista('historial')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 ${
              subVista === 'historial'
                ? 'bg-[#0052FF] text-white cb-shadow-level-1'
                : 'text-[#5B616E] hover:text-[#050F1A]'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>Listas Anteriores ({historialFechas.length})</span>
          </button>
        </div>
      </div>

      {/* SUBVISTA 1: PASE DE LISTA DEL DÍA (O DE UNA FECHA SELECCIONADA) */}
      {subVista === 'diario' && (
        <>
          {/* Barra de fecha activa + acceso rápido a fechas anteriores */}
          <div data-tour="asist-fecha" className="cb-card p-4 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold text-[#050F1A] uppercase tracking-wider">
                  Fecha seleccionada:
                </span>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="cb-input font-mono-tabular text-sm font-bold flex-1 sm:flex-initial"
                />
                <button
                  onClick={() => setFecha(new Date().toISOString().split('T')[0])}
                  className="cb-btn-secondary text-xs px-3.5"
                >
                  Ir a Hoy
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2.5">
                <button
                  onClick={marcarTodosPresentes}
                  className="cb-btn-secondary text-xs flex items-center justify-center gap-2"
                >
                  <CheckCheck className="w-4 h-4 text-[#05B169]" />
                  <span>Marcar Todos Presentes</span>
                </button>

                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="cb-btn-primary text-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{guardando ? 'Guardando...' : 'Guardar Pase de Lista'}</span>
                </button>
              </div>
            </div>

            {/* Tira rápida de pases de lista anteriores para cambiar con 1 clic */}
            {historialFechas.length > 0 && (
              <div className="pt-3 border-t border-[#D1D5DB] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-[#8A919E] uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> Días registrados:
                </span>
                {historialFechas.map((item) => {
                  const esActiva = item.fecha === fecha;
                  const regs = item.registros || {};
                  const numFaltas = Object.values(regs).filter(v => v === 'F').length;
                  return (
                    <button
                      key={item.fecha}
                      onClick={() => setFecha(item.fecha)}
                      className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 border ${
                        esActiva
                          ? 'bg-[#0052FF] border-[#0052FF] text-white'
                          : 'bg-[#F9FAFB] border-[#D1D5DB] text-[#050F1A] hover:border-[#0052FF]'
                      }`}
                    >
                      <span>{formatearFechaCompleta(item.fecha)}</span>
                      {numFaltas > 0 && (
                        <span className={`text-[10px] font-mono-tabular px-1.5 py-0.2 rounded ${
                          esActiva ? 'bg-white/20 text-white' : 'bg-[#FDECEE] text-[#DF2935]'
                        }`}>
                          {numFaltas}F
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {mensajeGuardado && (
            <div className="bg-[#E6F6EF] border border-[#05B169] text-[#05B169] px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between">
              <span>✓ Pase de lista del día {formatearFechaCompleta(fecha)} guardado con éxito. Los semáforos se actualizaron automáticamente.</span>
            </div>
          )}

          {/* Resumen del día con JetBrains Mono */}
          <div data-tour="asist-resumen" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="cb-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.06em] text-[#8A919E]">Presentes</div>
                <div className="text-2xl font-bold font-mono-tabular text-[#05B169] mt-1">{presentes}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E6F6EF] text-[#05B169] flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
            </div>

            <div className="cb-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.06em] text-[#8A919E]">Faltas</div>
                <div className="text-2xl font-bold font-mono-tabular text-[#DF2935] mt-1">{faltas}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FDECEE] text-[#DF2935] flex items-center justify-center">
                <X className="w-5 h-5" />
              </div>
            </div>

            <div className="cb-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.06em] text-[#8A919E]">Retardos</div>
                <div className="text-2xl font-bold font-mono-tabular text-[#B87514] mt-1">{retardos}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FEF6E7] text-[#B87514] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="cb-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.06em] text-[#8A919E]">Justificadas</div>
                <div className="text-2xl font-bold font-mono-tabular text-[#0052FF] mt-1">{justificadas}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0052FF]/10 text-[#0052FF] flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Lista de alumnos para pase de lista */}
          <div data-tour="asist-lista" className="cb-card overflow-hidden">
            <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#D1D5DB] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-[#8A919E]">
                Alumnos (<span className="font-mono-tabular">{alumnos.length}</span>) • Fecha: <span className="text-[#0052FF] normal-case">{formatearFechaCompleta(fecha)}</span>
              </span>
              <span className="text-xs text-[#5B616E] font-mono-tabular">
                [P] Presente • [F] Falta • [R] Retardo • [J] Justificada
              </span>
            </div>

            <div className="divide-y divide-[#D1D5DB]">
              {alumnos.map((alumno) => {
                const estadoActual = registros[alumno.id] || 'P';
                const analisis = semaforoData?.alumnos?.find(a => a.alumno.id === alumno.id);
                const tieneAlerta3Faltas = analisis?.asistencia?.alertaTresFaltas || false;

                return (
                  <div 
                    key={alumno.id} 
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors ${
                      estadoActual === 'F' ? 'bg-[#FDECEE]/30' : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#F3F4F6] font-mono-tabular font-bold text-[#5B616E] flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {alumno.noLista}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[#050F1A] text-sm flex items-center gap-2 flex-wrap">
                          <span>{alumno.nombre}</span>
                          {tieneAlerta3Faltas && (
                            <span className="bg-[#FDECEE] text-[#DF2935] font-bold text-[11px] px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              3+ FALTAS SEGUIDAS
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#5B616E] flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          <span>
                            Faltas periodo: <b className="font-mono-tabular text-[#050F1A]">{analisis?.asistencia?.faltas || 0}</b>
                          </span>
                          <span>
                            Asistencia: <b className="font-mono-tabular text-[#050F1A]">{analisis?.asistencia?.porcentaje || 100}%</b>
                          </span>
                          {alumno.telefono && (
                            <span className="text-[#8A919E] flex items-center gap-1 font-mono-tabular">
                              <Phone className="w-3 h-3" /> {alumno.telefono} ({alumno.tutor})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones de estado con área táctil mínima de 44px en móvil */}
                    <div data-tour="asist-botones" className="grid grid-cols-4 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <button
                        onClick={() => setEstado(alumno.id, 'P')}
                        className={`min-h-[44px] sm:min-w-[54px] px-3 py-2 rounded-lg text-xs font-mono-tabular font-bold transition flex items-center justify-center gap-1 border ${
                          estadoActual === 'P'
                            ? 'bg-[#05B169] border-[#05B169] text-white'
                            : 'bg-white border-[#D1D5DB] text-[#5B616E] hover:border-[#05B169] hover:text-[#05B169]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>P</span>
                      </button>

                      <button
                        onClick={() => setEstado(alumno.id, 'F')}
                        className={`min-h-[44px] sm:min-w-[54px] px-3 py-2 rounded-lg text-xs font-mono-tabular font-bold transition flex items-center justify-center gap-1 border ${
                          estadoActual === 'F'
                            ? 'bg-[#DF2935] border-[#DF2935] text-white'
                            : 'bg-white border-[#D1D5DB] text-[#5B616E] hover:border-[#DF2935] hover:text-[#DF2935]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>F</span>
                      </button>

                      <button
                        onClick={() => setEstado(alumno.id, 'R')}
                        className={`min-h-[44px] sm:min-w-[54px] px-3 py-2 rounded-lg text-xs font-mono-tabular font-bold transition flex items-center justify-center gap-1 border ${
                          estadoActual === 'R'
                            ? 'bg-[#F0AD4E] border-[#F0AD4E] text-[#050F1A]'
                            : 'bg-white border-[#D1D5DB] text-[#5B616E] hover:border-[#F0AD4E] hover:text-[#B87514]'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>R</span>
                      </button>

                      <button
                        onClick={() => setEstado(alumno.id, 'J')}
                        className={`min-h-[44px] sm:min-w-[54px] px-3 py-2 rounded-lg text-xs font-mono-tabular font-bold transition flex items-center justify-center gap-1 border ${
                          estadoActual === 'J'
                            ? 'bg-[#0052FF] border-[#0052FF] text-white'
                            : 'bg-white border-[#D1D5DB] text-[#5B616E] hover:border-[#0052FF] hover:text-[#0052FF]'
                        }`}
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>J</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* SUBVISTA 2: HISTORIAL DE PASES DE LISTA ANTERIORES Y MATRIZ POR FECHA */}
      {subVista === 'historial' && (
        <div className="space-y-5">
          {/* Tarjetas por día registrado */}
          <div className="cb-card p-4 sm:p-5">
            <h3 className="font-bold text-base text-[#050F1A] mb-1">
              Pases de Lista Guardados en {config.periodoActivo}
            </h3>
            <p className="text-xs text-[#5B616E] mb-4">
              Toca en <b>"Ver / Editar Lista"</b> en cualquier fecha para revisar o corregir la asistencia de ese día.
            </p>

            {historialFechas.length === 0 ? (
              <div className="text-center py-8 text-xs sm:text-sm text-[#8A919E]">
                Aún no hay pases de lista registrados en este periodo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {historialFechas.map((item) => {
                  const regs = item.registros || {};
                  const pCount = Object.values(regs).filter(v => v === 'P').length;
                  const fCount = Object.values(regs).filter(v => v === 'F').length;
                  const rCount = Object.values(regs).filter(v => v === 'R').length;
                  const jCount = Object.values(regs).filter(v => v === 'J').length;

                  return (
                    <div key={item.fecha} className="cb-card-interactive p-4 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-[#050F1A] flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[#0052FF] shrink-0" />
                            <span>{formatearFechaCompleta(item.fecha)}</span>
                          </span>
                          <button
                            onClick={() => handleEliminarFecha(item.fecha)}
                            className="p-1.5 text-[#8A919E] hover:text-[#DF2935] hover:bg-[#FDECEE] rounded-md transition"
                            title="Eliminar pase de lista de esta fecha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 mt-3 text-center font-mono-tabular text-xs">
                          <div className="bg-[#E6F6EF] text-[#05B169] py-1.5 rounded-md font-bold">
                            {pCount} P
                          </div>
                          <div className="bg-[#FDECEE] text-[#DF2935] py-1.5 rounded-md font-bold">
                            {fCount} F
                          </div>
                          <div className="bg-[#FEF6E7] text-[#B87514] py-1.5 rounded-md font-bold">
                            {rCount} R
                          </div>
                          <div className="bg-[#0052FF]/10 text-[#0052FF] py-1.5 rounded-md font-bold">
                            {jCount} J
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSeleccionarFechaAnterior(item.fecha)}
                        className="w-full min-h-[38px] bg-[#F9FAFB] hover:bg-[#0052FF] hover:text-white text-[#050F1A] border border-[#D1D5DB] hover:border-[#0052FF] rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver / Editar Lista</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Matriz concentrada de asistencias de todos los días registrados */}
          {fechasCronologicas.length > 0 && (
            <div className="cb-card overflow-hidden">
              <div className="p-4 bg-[#F9FAFB] border-b border-[#D1D5DB]">
                <h3 className="font-bold text-sm text-[#050F1A]">
                   Sábana / Concentrado de Asistencias por Fecha
                </h3>
                <p className="text-xs text-[#5B616E]">
                  Vista panorámica de todos los días registrados en {config.periodoActivo}.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#D1D5DB] text-[#8A919E] uppercase tracking-[0.06em] font-medium">
                      <th className="py-3 px-3 w-10 text-center">No.</th>
                      <th className="py-3 px-4 min-w-[200px]">Alumno</th>
                      {fechasCronologicas.map((f) => (
                        <th
                          key={f.fecha}
                          onClick={() => handleSeleccionarFechaAnterior(f.fecha)}
                          className="py-3 px-2.5 text-center font-mono-tabular whitespace-nowrap cursor-pointer hover:text-[#0052FF]"
                          title={`Ir al pase de lista del ${formatearFechaCompleta(f.fecha)}`}
                        >
                          {formatearFechaDMA(f.fecha)}
                        </th>
                      ))}
                      <th className="py-3 px-3 text-right bg-[#F3F4F6] text-[#050F1A] font-bold">
                        % Asist.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1D5DB]">
                    {alumnos.map((alu) => {
                      const analisis = semaforoData?.alumnos?.find(a => a.alumno.id === alu.id);
                      const porc = analisis?.asistencia?.porcentaje ?? 100;
                      return (
                        <tr key={alu.id} className="h-[52px] hover:bg-[#F9FAFB]">
                          <td className="py-2 px-3 text-center font-mono-tabular text-[#5B616E]">
                            {alu.noLista}
                          </td>
                          <td className="py-2 px-4 font-bold text-[#050F1A]">
                            {alu.nombre}
                          </td>
                          {fechasCronologicas.map((f) => {
                            const val = f.registros?.[alu.id] || '-';
                            return (
                              <td key={f.fecha} className="py-2 px-2 text-center font-mono-tabular">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold ${
                                  val === 'P'
                                    ? 'bg-[#E6F6EF] text-[#05B169]'
                                    : val === 'F'
                                    ? 'bg-[#FDECEE] text-[#DF2935]'
                                    : val === 'R'
                                    ? 'bg-[#FEF6E7] text-[#B87514]'
                                    : val === 'J'
                                    ? 'bg-[#0052FF]/10 text-[#0052FF]'
                                    : 'text-[#8A919E]'
                                }`}>
                                  {val}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-right font-mono-tabular font-bold bg-[#F9FAFB]">
                            <span className={porc < 70 ? 'text-[#DF2935]' : porc < 85 ? 'text-[#B87514]' : 'text-[#05B169]'}>
                              {porc}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
