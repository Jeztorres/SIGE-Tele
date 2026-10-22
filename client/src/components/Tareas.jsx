import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Save, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { fetchTareas, createTarea, deleteTarea, saveEntregasTarea, formatearFechaCompleta } from '../api';

export default function Tareas({ alumnos, materias, config, onDataChange, semaforoData }) {
  const [tareas, setTareas] = useState([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [entregas, setEntregas] = useState({});
  const [modalNueva, setModalNueva] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  // Formulario nueva tarea
  const [nuevaForm, setNuevaForm] = useState({
    titulo: '',
    materiaId: materias[0]?.id || '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: ''
  });

  const cargarTareas = async () => {
    try {
      const data = await fetchTareas(config.periodoActivo);
      setTareas(data);
      if (data.length > 0) {
        const target = tareaSeleccionada ? data.find(t => t.id === tareaSeleccionada.id) || data[0] : data[0];
        setTareaSeleccionada(target);
        setEntregas(target.entregas || {});
      } else {
        setTareaSeleccionada(null);
        setEntregas({});
      }
    } catch (err) {
      console.error('Error cargando tareas:', err);
    }
  };

  useEffect(() => {
    cargarTareas();
  }, [config.periodoActivo]);

  const handleSelectTarea = (t) => {
    setTareaSeleccionada(t);
    setEntregas(t.entregas || {});
  };

  const setEstadoEntrega = (alumnoId, estado) => {
    setEntregas(prev => ({
      ...prev,
      [alumnoId]: estado
    }));
  };

  const marcarTodosEntregaron = () => {
    const nuevos = {};
    alumnos.forEach(a => {
      nuevos[a.id] = 'E';
    });
    setEntregas(nuevos);
  };

  const handleGuardarEntregas = async () => {
    if (!tareaSeleccionada) return;
    setGuardando(true);
    try {
      await saveEntregasTarea(tareaSeleccionada.id, entregas);
      setMensajeGuardado(true);
      await cargarTareas();
      if (onDataChange) onDataChange();
      setTimeout(() => setMensajeGuardado(false), 3000);
    } catch (err) {
      alert('Error guardando entregas');
    } finally {
      setGuardando(false);
    }
  };

  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!nuevaForm.titulo.trim()) return;

    try {
      const res = await createTarea({
        ...nuevaForm,
        periodo: config.periodoActivo
      });
      setModalNueva(false);
      setNuevaForm({
        titulo: '',
        materiaId: materias[0]?.id || '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: ''
      });
      await cargarTareas();
      if (res.tarea) {
        setTareaSeleccionada(res.tarea);
        setEntregas(res.tarea.entregas || {});
      }
      if (onDataChange) onDataChange();
    } catch (err) {
      alert('Error al crear tarea');
    }
  };

  const handleEliminarTarea = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarea y sus registros de entrega?')) return;
    try {
      await deleteTarea(id);
      await cargarTareas();
      if (onDataChange) onDataChange();
    } catch (err) {
      alert('Error eliminando tarea');
    }
  };

  // Contadores de la tarea activa
  const totalEntregadas = Object.values(entregas).filter(v => v === 'E').length;
  const totalNoEntregadas = Object.values(entregas).filter(v => v === 'NE').length;
  const totalIncompletas = Object.values(entregas).filter(v => v === 'I').length;

  return (
    <div className="space-y-5">
      {/* Encabezado con selector de tareas y botón crear */}
      <div className="cb-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#050F1A] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0052FF]" />
            <span>Control de Tareas y Trabajos</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">
            Registra entregas diarias y detecta alertas tempranas de alumnos con 3 tareas consecutivas sin entregar.
          </p>
        </div>

        <button data-tour="tareas-nueva"
          onClick={() => setModalNueva(true)}
          className="cb-btn-primary text-xs flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Tarea / Actividad</span>
        </button>
      </div>

      {/* Lista horizontal de tareas del periodo */}
      <div data-tour="tareas-lista" className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {tareas.map((t) => {
          const mat = materias.find(m => m.id === t.materiaId);
          const isSelected = tareaSeleccionada?.id === t.id;
          return (
            <div
              key={t.id}
              onClick={() => handleSelectTarea(t)}
              className={`min-w-[240px] max-w-[280px] p-4 rounded-xl border cursor-pointer transition shrink-0 flex flex-col justify-between ${
                isSelected
                  ? 'border-[#0052FF] bg-white ring-3 ring-[#0052FF]/10 cb-shadow-level-1'
                  : 'border-[#D1D5DB] bg-white hover:border-[#8A919E]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 text-xs mb-1.5">
                  <span className={`font-bold px-2 py-0.5 rounded-[6px] text-[11px] ${
                    isSelected ? 'bg-[#0052FF] text-white' : 'bg-[#F3F4F6] text-[#5B616E]'
                  }`}>
                    {mat?.clave || mat?.nombre?.slice(0, 10) || 'Materia'}
                  </span>
                  <span className="text-[#8A919E] text-[11px]">{formatearFechaCompleta(t.fecha)}</span>
                </div>
                <h4 className="font-bold text-[#050F1A] text-sm line-clamp-1">{t.titulo}</h4>
                {t.descripcion && (
                  <p className="text-xs text-[#5B616E] line-clamp-1 mt-0.5">{t.descripcion}</p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#D1D5DB] flex items-center justify-between text-xs text-[#5B616E]">
                <span>
                  Entregas: <b className="font-mono-tabular text-[#050F1A]">{Object.values(t.entregas || {}).filter(v => v === 'E').length}/{alumnos.length}</b>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminarTarea(t.id);
                  }}
                  className="text-[#8A919E] hover:text-[#DF2935] p-1.5 rounded-md transition"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {tareas.length === 0 && (
          <div className="w-full cb-card p-8 text-center text-sm text-[#5B616E]">
            No hay tareas creadas para <b>{config.periodoActivo}</b>. Toca en "Nueva Tarea / Actividad" para crear la primera.
          </div>
        )}
      </div>

      {/* Detalle y Pase de Lista de la Tarea Seleccionada */}
      {tareaSeleccionada && (
        <div data-tour="tareas-detalle" className="cb-card overflow-hidden">
          {/* Header de la tarea activa */}
          <div className="p-4 sm:p-5 bg-[#F9FAFB] border-b border-[#D1D5DB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#0052FF] text-white font-bold text-xs px-2.5 py-0.5 rounded-[6px]">
                  {materias.find(m => m.id === tareaSeleccionada.materiaId)?.nombre || 'Asignatura'}
                </span>
                <span className="text-xs text-[#5B616E] font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0052FF]" /> {formatearFechaCompleta(tareaSeleccionada.fecha)}
                </span>
              </div>
              <h3 className="font-bold text-[#050F1A] text-base sm:text-lg mt-1.5">
                {tareaSeleccionada.titulo}
              </h3>
              {tareaSeleccionada.descripcion && (
                <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">{tareaSeleccionada.descripcion}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2.5 shrink-0">
              <button
                onClick={marcarTodosEntregaron}
                className="cb-btn-secondary text-xs"
              >
                Todos Entregaron
              </button>
              <button
                onClick={handleGuardarEntregas}
                disabled={guardando}
                className="cb-btn-primary text-xs flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{guardando ? 'Guardando...' : 'Guardar Entregas'}</span>
              </button>
            </div>
          </div>

          {mensajeGuardado && (
            <div className="bg-[#E6F6EF] border-b border-[#05B169] text-[#05B169] px-4 py-3 text-xs sm:text-sm font-bold flex items-center justify-between">
              <span>✓ Entregas guardadas exitosamente. El semáforo del grupo se actualizó en tiempo real.</span>
            </div>
          )}

          {/* Estadísticas de la tarea con JetBrains Mono */}
          <div data-tour="tareas-stats" className="grid grid-cols-3 divide-x divide-[#D1D5DB] border-b border-[#D1D5DB] text-center py-3 text-xs bg-white">
            <div>
              <span className="text-[#5B616E] block sm:inline">Entregaron:</span>
              <span className="font-mono-tabular font-bold text-[#05B169] sm:ml-1.5 text-sm">{totalEntregadas}</span>
            </div>
            <div>
              <span className="text-[#5B616E] block sm:inline">No entregaron:</span>
              <span className="font-mono-tabular font-bold text-[#DF2935] sm:ml-1.5 text-sm">{totalNoEntregadas}</span>
            </div>
            <div>
              <span className="text-[#5B616E] block sm:inline">Incompletas:</span>
              <span className="font-mono-tabular font-bold text-[#B87514] sm:ml-1.5 text-sm">{totalIncompletas}</span>
            </div>
          </div>

          {/* Lista de alumnos para calificar tarea */}
          <div className="divide-y divide-[#D1D5DB]">
            {alumnos.map((alumno) => {
              const estado = entregas[alumno.id] || 'E';

              // Analizar racha de tareas no entregadas
              const analisis = semaforoData?.alumnos?.find(a => a.alumno.id === alumno.id);
              const tieneAlerta3Tareas = analisis?.tareas?.alertaTresTareas || false;

              return (
                <div
                  key={alumno.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors ${
                    estado === 'NE' ? 'bg-[#FDECEE]/30' : 'hover:bg-[#F9FAFB]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-[#F3F4F6] font-mono-tabular font-bold text-[#5B616E] text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {alumno.noLista}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[#050F1A] text-sm flex items-center gap-2 flex-wrap">
                        <span>{alumno.nombre}</span>
                        {tieneAlerta3Tareas && (
                          <span className="bg-[#FEF6E7] text-[#B87514] text-[11px] font-bold px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            3+ TAREAS SIN ENTREGAR
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#5B616E] block mt-0.5">
                        Cumplimiento: <b className="font-mono-tabular text-[#050F1A]">{analisis?.tareas?.porcentaje || 100}%</b> (<span className="font-mono-tabular">{analisis?.tareas?.noEntregadas || 0}</span> sin entregar)
                      </span>
                    </div>
                  </div>

                  {/* Botones de entrega con área táctil mínima de 44px */}
                  <div data-tour="tareas-botones" className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => setEstadoEntrega(alumno.id, 'E')}
                      className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        estado === 'E'
                          ? 'bg-[#05B169] border-[#05B169] text-white'
                          : 'bg-white border-[#D1D5DB] text-[#5B616E] hover:border-[#05B169] hover:text-[#05B169]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Entregó</span>
                    </button>

                    <button
                      onClick={() => setEstadoEntrega(alumno.id, 'NE')}
                      className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        estado === 'NE'
                          ? 'bg-[#DF2935] border-[#DF2935] text-white'
                          : 'bg-white border-[#D1D5DB] text-[#5B616E] hover:border-[#DF2935] hover:text-[#DF2935]'
                      }`}
                    >
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>No entregó</span>
                    </button>

                    <button
                      onClick={() => setEstadoEntrega(alumno.id, 'I')}
                      className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        estado === 'I'
                          ? 'bg-[#F0AD4E] border-[#F0AD4E] text-[#050F1A]'
                          : 'bg-white border-[#D1D5DB] text-[#5B616E] hover:border-[#F0AD4E] hover:text-[#B87514]'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Incompleta</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Nueva Tarea */}
      {modalNueva && (
        <div className="fixed inset-0 bg-[#050F1A]/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full cb-shadow-level-3 border border-[#D1D5DB]">
            <h3 className="font-bold text-lg text-[#050F1A] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#0052FF]" />
              <span>Crear Nueva Tarea o Actividad</span>
            </h3>

            <form onSubmit={handleCrearTarea} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Título de la actividad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ensayo sobre la biodiversidad en México"
                  value={nuevaForm.titulo}
                  onChange={(e) => setNuevaForm({ ...nuevaForm, titulo: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">Materia / Campo *</label>
                  <select
                    value={nuevaForm.materiaId}
                    onChange={(e) => setNuevaForm({ ...nuevaForm, materiaId: e.target.value })}
                    className="cb-input w-full"
                  >
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">Fecha de Entrega *</label>
                  <input
                    type="date"
                    required
                    value={nuevaForm.fecha}
                    onChange={(e) => setNuevaForm({ ...nuevaForm, fecha: e.target.value })}
                    className="cb-input w-full font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Instrucciones o Criterios (opcional)</label>
                <textarea
                  rows="3"
                  placeholder="Ej. Realizar en hojas blancas o libreta, incluir portada..."
                  value={nuevaForm.descripcion}
                  onChange={(e) => setNuevaForm({ ...nuevaForm, descripcion: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-[#D1D5DB]">
                <button
                  type="button"
                  onClick={() => setModalNueva(false)}
                  className="cb-btn-secondary w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cb-btn-primary w-full sm:w-auto"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
