import React, { useState, useEffect, useRef } from 'react';
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Edit3, 
  Tag, 
  Star, 
  Calendar, 
  User, 
  Search,
  FolderPlus,
  X,
  Check,
  Mic,
  Square,
  Volume2,
  RotateCcw
} from 'lucide-react';
import { fetchNotas, createNota, updateNota, deleteNota, formatearFechaCompleta } from '../api';

const DEFAULT_CATEGORIAS = [
  'Planeación Didáctica',
  'Conducta e Incidencias',
  'Acuerdos con Padres',
  'Pendientes Administrativos',
  'Observación Pedagógica'
];

const LS_NOTAS_KEY = 'sige_tele_notas_docente_v1';
const LS_CATS_KEY = 'sige_tele_categorias_notas_v1';

function formatearSegundos(seg = 0) {
  const total = Math.max(0, Math.floor(Number(seg) || 0));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function NotasDocente({ alumnos = [] }) {
  const [notas, setNotas] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_NOTAS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [categorias, setCategorias] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_CATS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIAS;
    } catch {
      return DEFAULT_CATEGORIAS;
    }
  });

  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [usandoNuevaCat, setUsandoNuevaCat] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState('');

  // Estados de grabación de nota de voz (Audio real sin transcribir)
  const [grabando, setGrabando] = useState(false);
  const [segundosGrabacion, setSegundosGrabacion] = useState(0);
  const [errorMicrofono, setErrorMicrofono] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const segundosRef = useRef(0);

  const [form, setForm] = useState({
    titulo: '',
    contenido: '',
    categoria: 'Planeación Didáctica',
    nuevaCategoria: '',
    alumnoId: '',
    fecha: new Date().toISOString().split('T')[0],
    destacada: false,
    audioData: '',
    audioDuracion: 0
  });

  const sincronizarLocal = (nuevasNotas, nuevasCategorias) => {
    try {
      if (nuevasNotas) {
        setNotas(nuevasNotas);
        localStorage.setItem(LS_NOTAS_KEY, JSON.stringify(nuevasNotas));
      }
      if (nuevasCategorias && nuevasCategorias.length > 0) {
        setCategorias(nuevasCategorias);
        localStorage.setItem(LS_CATS_KEY, JSON.stringify(nuevasCategorias));
      }
    } catch (e) {
      console.error('Error guardando respaldo local de notas:', e);
    }
  };

  const cargarNotas = async () => {
    try {
      const data = await fetchNotas();
      if (data && Array.isArray(data.notas)) {
        sincronizarLocal(data.notas, data.categorias);
      }
    } catch (err) {
      console.warn('Usando almacenamiento local para notas:', err);
    }
  };

  useEffect(() => {
    cargarNotas();
    return () => {
      limpiarGrabacionActiva();
    };
  }, []);

  const limpiarGrabacionActiva = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setGrabando(false);
  };

  const iniciarGrabacionVoz = async () => {
    setErrorMicrofono('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMicrofono('Tu navegador no permite acceso a grabación de audio.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      segundosRef.current = 0;
      setSegundosGrabacion(0);

      // Seleccionar formato compatible con cualquier dispositivo (PC, Android, iPad/iPhone)
      let options = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const duracionFinal = segundosRef.current;

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          setForm(prev => ({
            ...prev,
            audioData: base64Audio,
            audioDuracion: duracionFinal,
            titulo: prev.titulo.trim() ? prev.titulo : `Nota de voz (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
          }));
        };
        reader.readAsDataURL(audioBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
      };

      recorder.start(250);
      setGrabando(true);

      timerRef.current = setInterval(() => {
        segundosRef.current += 1;
        setSegundosGrabacion(segundosRef.current);
      }, 1000);
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
      setErrorMicrofono('No se pudo acceder al micrófono. Verifica que diste permiso en el navegador.');
    }
  };

  const detenerGrabacionVoz = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setGrabando(false);
  };

  const descartarAudioGrabado = () => {
    setForm(prev => ({
      ...prev,
      audioData: '',
      audioDuracion: 0
    }));
    setSegundosGrabacion(0);
    segundosRef.current = 0;
  };

  const mostrarConfirmacion = (texto) => {
    setMensajeGuardado(texto);
    setTimeout(() => setMensajeGuardado(''), 2500);
  };

  const abrirCrear = (iniciarConVoz = false) => {
    limpiarGrabacionActiva();
    setEditandoId(null);
    setUsandoNuevaCat(false);
    setErrorMicrofono('');
    setForm({
      titulo: '',
      contenido: '',
      categoria: categoriaActiva !== 'todas' && categoriaActiva !== 'destacadas' && categoriaActiva !== 'voz'
        ? categoriaActiva
        : categorias[0] || 'Planeación Didáctica',
      nuevaCategoria: '',
      alumnoId: '',
      fecha: new Date().toISOString().split('T')[0],
      destacada: false,
      audioData: '',
      audioDuracion: 0
    });
    setModalAbierto(true);
    if (iniciarConVoz) {
      setTimeout(() => {
        iniciarGrabacionVoz();
      }, 150);
    }
  };

  const abrirEditar = (nota) => {
    limpiarGrabacionActiva();
    setEditandoId(nota.id);
    setUsandoNuevaCat(false);
    setErrorMicrofono('');
    setForm({
      titulo: nota.titulo,
      contenido: nota.contenido || '',
      categoria: nota.categoria,
      nuevaCategoria: '',
      alumnoId: nota.alumnoId || '',
      fecha: nota.fecha || new Date().toISOString().split('T')[0],
      destacada: Boolean(nota.destacada),
      audioData: nota.audioData || '',
      audioDuracion: nota.audioDuracion || 0
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    limpiarGrabacionActiva();
    setModalAbierto(false);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (grabando) {
      alert('Primero detén la grabación de voz para poder escucharla o guardarla.');
      return;
    }

    if (!form.titulo.trim() && !form.contenido.trim() && !form.audioData) {
      alert('Escribe un apunte o graba una nota de voz antes de guardar.');
      return;
    }

    const categoriaFinal = usandoNuevaCat && form.nuevaCategoria.trim()
      ? form.nuevaCategoria.trim()
      : form.categoria;

    const payload = {
      titulo: form.titulo.trim() || (form.audioData ? 'Nota de Voz Docente' : 'Nota Docente'),
      contenido: form.contenido,
      categoria: categoriaFinal,
      alumnoId: form.alumnoId,
      fecha: form.fecha,
      destacada: Boolean(form.destacada),
      audioData: form.audioData || '',
      audioDuracion: form.audioDuracion || 0
    };

    try {
      let res;
      if (editandoId) {
        res = await updateNota(editandoId, payload);
      } else {
        res = await createNota(payload);
      }

      if (res && Array.isArray(res.notas)) {
        sincronizarLocal(res.notas, res.categorias);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch {
      const nuevasCategorias = categorias.includes(categoriaFinal)
        ? categorias
        : [...categorias, categoriaFinal];

      let nuevasNotas;
      if (editandoId) {
        nuevasNotas = notas.map(n => n.id === editandoId ? { ...n, ...payload } : n);
      } else {
        const nuevaNota = {
          id: `nota-${Date.now()}`,
          ...payload
        };
        nuevasNotas = [nuevaNota, ...notas];
      }
      sincronizarLocal(nuevasNotas, nuevasCategorias);
    }

    setModalAbierto(false);
    mostrarConfirmacion(editandoId ? 'Nota actualizada correctamente' : 'Nota guardada correctamente');
  };

  const handleToggleDestacada = async (nota) => {
    const nuevoValor = !nota.destacada;
    try {
      const res = await updateNota(nota.id, { destacada: nuevoValor });
      if (res && Array.isArray(res.notas)) {
        sincronizarLocal(res.notas, res.categorias);
        return;
      }
    } catch {
      // Fallback local
    }
    const nuevasNotas = notas.map(n => n.id === nota.id ? { ...n, destacada: nuevoValor } : n);
    sincronizarLocal(nuevasNotas, categorias);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Deseas eliminar esta nota permanentemente?')) return;
    try {
      const res = await deleteNota(id);
      if (res && Array.isArray(res.notas)) {
        sincronizarLocal(res.notas, res.categorias);
        mostrarConfirmacion('Nota eliminada');
        return;
      }
    } catch {
      // Fallback local
    }
    const nuevasNotas = notas.filter(n => n.id !== id);
    sincronizarLocal(nuevasNotas, categorias);
    mostrarConfirmacion('Nota eliminada');
  };

  const notasFiltradas = notas.filter((n) => {
    if (categoriaActiva === 'destacadas' && !n.destacada) return false;
    if (categoriaActiva === 'voz' && !n.audioData) return false;
    if (
      categoriaActiva !== 'todas' &&
      categoriaActiva !== 'destacadas' &&
      categoriaActiva !== 'voz' &&
      n.categoria !== categoriaActiva
    ) {
      return false;
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const alu = alumnos.find(a => a.id === n.alumnoId);
      const matchTitulo = (n.titulo || '').toLowerCase().includes(q);
      const matchCont = (n.contenido || '').toLowerCase().includes(q);
      const matchCat = (n.categoria || '').toLowerCase().includes(q);
      const matchAlu = alu ? alu.nombre.toLowerCase().includes(q) : false;
      return matchTitulo || matchCont || matchCat || matchAlu;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Cabecera con botón de Nueva Nota y botón directo de Grabar Nota de Voz */}
      <div className="cb-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#050F1A] flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-[#0052FF]" />
            <span>Bitácora y Notas de Voz / Texto por Categoría</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">
            Escribe apuntes o graba tu voz directamente para escucharla después, clasificando todo en la categoría que elijas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {mensajeGuardado && (
            <span className="bg-[#E6F6EF] text-[#05B169] border border-[#05B169]/30 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {mensajeGuardado}
            </span>
          )}

          <button data-tour="notas-voz"
            onClick={() => abrirCrear(true)}
            className="cb-btn-secondary text-xs flex items-center justify-center gap-2 border-[#0052FF] text-[#0052FF] hover:bg-[#0052FF]/5 flex-1 sm:flex-initial"
          >
            <Mic className="w-4 h-4 text-[#DF2935]" />
            <span>Grabar Nota de Voz</span>
          </button>

          <button data-tour="notas-nueva"
            onClick={() => abrirCrear(false)}
            className="cb-btn-primary text-xs flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Nota</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y selector de categorías */}
      <div data-tour="notas-buscar" className="cb-card p-4 space-y-3.5">
        <div className="cb-search-wrapper">
          <Search className="w-4 h-4 text-[#0052FF] shrink-0" />
          <input
            type="text"
            placeholder="Buscar en tus notas por título, texto, categoría o nombre del alumno..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="cb-search-input"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="w-6 h-6 rounded-full bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#5B616E] flex items-center justify-center shrink-0 transition"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoriaActiva('todas')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              categoriaActiva === 'todas'
                ? 'bg-[#0052FF] text-white'
                : 'bg-[#F3F4F6] text-[#5B616E] hover:text-[#050F1A]'
            }`}
          >
            Todas (<span className="font-mono-tabular">{notas.length}</span>)
          </button>

          <button
            onClick={() => setCategoriaActiva('voz')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              categoriaActiva === 'voz'
                ? 'bg-[#0052FF] text-white'
                : 'bg-[#0052FF]/10 text-[#0052FF] hover:bg-[#0052FF]/15'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Notas de Voz (<span className="font-mono-tabular">{notas.filter(n => Boolean(n.audioData)).length}</span>)</span>
          </button>

          <button
            onClick={() => setCategoriaActiva('destacadas')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              categoriaActiva === 'destacadas'
                ? 'bg-[#F0AD4E] text-[#050F1A]'
                : 'bg-[#FEF6E7] text-[#B87514] hover:opacity-90'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Destacadas (<span className="font-mono-tabular">{notas.filter(n => n.destacada).length}</span>)</span>
          </button>

          {categorias.map((cat) => {
            const count = notas.filter(n => n.categoria === cat).length;
            const isAct = categoriaActiva === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isAct
                    ? 'bg-[#0052FF] text-white'
                    : 'bg-[#F3F4F6] text-[#5B616E] hover:text-[#050F1A]'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>{cat}</span>
                <span className="font-mono-tabular opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cuadrícula de Notas */}
      <div data-tour="notas-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notasFiltradas.map((nota) => {
          const alumno = alumnos.find(a => a.id === nota.alumnoId);
          return (
            <div
              key={nota.id}
              className={`cb-card-interactive p-5 flex flex-col justify-between ${
                nota.destacada ? 'border-[#F0AD4E] bg-[#FEF6E7]/15' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-bold bg-[#0052FF]/10 text-[#0052FF]">
                      <Tag className="w-3 h-3" />
                      {nota.categoria}
                    </span>

                    {nota.audioData && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-bold bg-[#E6F6EF] text-[#05B169] font-mono-tabular">
                        <Volume2 className="w-3.5 h-3.5" />
                        {nota.audioDuracion ? formatearSegundos(nota.audioDuracion) : 'Audio'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleDestacada(nota)}
                    className={`p-1.5 rounded-lg transition shrink-0 ${
                      nota.destacada
                        ? 'text-[#F0AD4E] bg-[#FEF6E7]'
                        : 'text-[#8A919E] hover:text-[#F0AD4E] hover:bg-[#F9FAFB]'
                    }`}
                    title={nota.destacada ? 'Quitar de destacadas' : 'Destacar nota'}
                  >
                    <Star className={`w-4 h-4 ${nota.destacada ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <h3 className="font-bold text-[#050F1A] text-base leading-snug">
                  {nota.titulo}
                </h3>

                {/* Reproductor de Audio si la nota tiene grabación de voz */}
                {nota.audioData && (
                  <div className="mt-3 p-3 rounded-xl bg-[#F9FAFB] border border-[#D1D5DB] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#0052FF]">
                      <span className="flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5" />
                        <span>Grabación de Voz de la Maestra(o)</span>
                      </span>
                      {nota.audioDuracion > 0 && (
                        <span className="font-mono-tabular text-[#5B616E]">
                          {formatearSegundos(nota.audioDuracion)}
                        </span>
                      )}
                    </div>
                    <audio
                      controls
                      src={nota.audioData}
                      className="w-full h-9"
                      preload="metadata"
                    />
                  </div>
                )}

                {nota.contenido && (
                  <p className="text-xs sm:text-sm text-[#5B616E] mt-2.5 whitespace-pre-line leading-relaxed">
                    {nota.contenido}
                  </p>
                )}

                {alumno && (
                  <div className="mt-3 p-2 rounded-lg bg-[#F9FAFB] border border-[#D1D5DB] flex items-center gap-2 text-xs text-[#050F1A]">
                    <User className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
                    <span className="truncate">Alumno: <b>{alumno.nombre}</b></span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#D1D5DB] flex items-center justify-between text-xs text-[#8A919E]">
                <span className="flex items-center gap-1 font-medium text-[#5B616E]">
                  <Calendar className="w-3.5 h-3.5 text-[#0052FF]" />
                  {formatearFechaCompleta(nota.fecha)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => abrirEditar(nota)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg text-[#5B616E] hover:text-[#0052FF] hover:bg-[#F9FAFB] font-bold flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleEliminar(nota.id)}
                    className="min-h-[36px] min-w-[36px] rounded-lg text-[#8A919E] hover:text-[#DF2935] hover:bg-[#FDECEE] flex items-center justify-center transition"
                    title="Eliminar nota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {notasFiltradas.length === 0 && (
          <div className="col-span-full cb-card p-10 text-center">
            <StickyNote className="w-12 h-12 mx-auto text-[#8A919E] mb-3" />
            <h4 className="font-bold text-[#050F1A] text-base">No hay notas en esta categoría</h4>
            <p className="text-xs sm:text-sm text-[#5B616E] mt-1 max-w-md mx-auto">
              Graba notas de voz para escucharlas cuando quieras o escribe apuntes rápidos y clasifícalos en tus propias categorías.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => abrirCrear(true)}
                className="cb-btn-secondary text-xs border-[#0052FF] text-[#0052FF] flex items-center gap-2"
              >
                <Mic className="w-4 h-4 text-[#DF2935]" />
                <span>Grabar Nota de Voz</span>
              </button>
              <button
                onClick={() => abrirCrear(false)}
                className="cb-btn-primary text-xs"
              >
                Crear Nota Escrita
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Nota (con Grabadora de Audio Real integrada) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-[#050F1A]/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full cb-shadow-level-3 border border-[#D1D5DB] my-auto">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-lg text-[#050F1A] flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-[#0052FF]" />
                <span>{editandoId ? 'Editar Nota Docente' : 'Nueva Nota (Voz o Texto)'}</span>
              </h3>
              <button
                type="button"
                onClick={cerrarModal}
                className="w-9 h-9 rounded-lg border border-[#D1D5DB] text-[#5B616E] hover:text-[#050F1A] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4 text-xs sm:text-sm">
              {/* GRABADORA DE NOTA DE VOZ (AUDIO REAL PARA ESCUCHAR) */}
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#D1D5DB] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      grabando ? 'bg-[#FDECEE] text-[#DF2935] animate-pulse' : 'bg-[#0052FF]/10 text-[#0052FF]'
                    }`}>
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#050F1A] block text-xs sm:text-sm">
                        Nota de Voz (Audio Grabado)
                      </span>
                      <span className="text-[11px] text-[#5B616E] block">
                        Graba tu voz para escucharla después y guárdala cuando quieras
                      </span>
                    </div>
                  </div>

                  {grabando && (
                    <span className="bg-[#FDECEE] text-[#DF2935] font-mono-tabular font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#DF2935] animate-ping" />
                      {formatearSegundos(segundosGrabacion)}
                    </span>
                  )}
                </div>

                {errorMicrofono && (
                  <div className="p-2.5 rounded-lg bg-[#FDECEE] border border-[#DF2935]/30 text-[#DF2935] text-xs font-medium">
                    {errorMicrofono}
                  </div>
                )}

                {/* Controles según estado: Sin audio / Grabando / Audio listo para escuchar */}
                {!grabando && !form.audioData && (
                  <button
                    type="button"
                    onClick={iniciarGrabacionVoz}
                    className="w-full min-h-[44px] rounded-lg bg-white hover:bg-[#0052FF]/5 text-[#0052FF] border border-[#0052FF] font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Mic className="w-4 h-4 text-[#DF2935]" />
                    <span>Iniciar Grabación de Voz</span>
                  </button>
                )}

                {grabando && (
                  <div className="space-y-2.5">
                    <div className="text-center py-2 text-xs text-[#DF2935] font-bold">
                      Escuchando y grabando tu voz... Presiona detener cuando termines.
                    </div>
                    <button
                      type="button"
                      onClick={detenerGrabacionVoz}
                      className="w-full min-h-[44px] rounded-lg bg-[#DF2935] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Detener Grabación ({formatearSegundos(segundosGrabacion)})</span>
                    </button>
                  </div>
                )}

                {!grabando && form.audioData && (
                  <div className="space-y-2.5 bg-white p-3 rounded-lg border border-[#D1D5DB]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#05B169] flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4" />
                        <span>Audio listo para escuchar ({formatearSegundos(form.audioDuracion)})</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={iniciarGrabacionVoz}
                          className="text-[#0052FF] hover:underline font-bold flex items-center gap-1 text-[11px]"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Grabar de nuevo</span>
                        </button>
                        <button
                          type="button"
                          onClick={descartarAudioGrabado}
                          className="text-[#DF2935] hover:underline font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    </div>

                    <audio
                      controls
                      src={form.audioData}
                      className="w-full h-10"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">
                  Título de la nota {form.audioData ? '(Opcional)' : '*'}
                </label>
                <input
                  type="text"
                  required={!form.audioData}
                  placeholder="Ej. Recordatorio de reunión / Observación de clase..."
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              {/* Selección o creación de categoría personalizada */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-[#050F1A]">Categoría *</label>
                  <button
                    type="button"
                    onClick={() => setUsandoNuevaCat(!usandoNuevaCat)}
                    className="text-xs font-bold text-[#0052FF] hover:underline flex items-center gap-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>{usandoNuevaCat ? 'Elegir categoría existente' : '+ Crear nueva categoría'}</span>
                  </button>
                </div>

                {usandoNuevaCat ? (
                  <input
                    type="text"
                    required
                    placeholder="Escribe el nombre de tu nueva categoría (ej. Exámenes, Eventos, Tutoría...)"
                    value={form.nuevaCategoria}
                    onChange={(e) => setForm({ ...form, nuevaCategoria: e.target.value })}
                    className="cb-input w-full border-[#0052FF]"
                  />
                ) : (
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="cb-input w-full"
                  >
                    {categorias.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">Relacionar con Alumno (Opcional)</label>
                  <select
                    value={form.alumnoId}
                    onChange={(e) => setForm({ ...form, alumnoId: e.target.value })}
                    className="cb-input w-full"
                  >
                    <option value="">General (Todo el grupo)</option>
                    {alumnos.map((a) => (
                      <option key={a.id} value={a.id}>{a.noLista}. {a.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="cb-input w-full font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">
                  Contenido escrito / Apuntes {form.audioData ? '(Opcional, ya tienes nota de voz)' : '*'}
                </label>
                <textarea
                  rows="3"
                  required={!form.audioData}
                  placeholder="Puedes agregar apuntes escritos adicionales o dejar solo tu grabación de voz..."
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={form.destacada}
                  onChange={(e) => setForm({ ...form, destacada: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#0052FF]"
                />
                <span className="text-xs sm:text-sm font-medium text-[#050F1A]">
                  Marcar como nota importante / destacada ⭐
                </span>
              </label>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-[#D1D5DB]">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="cb-btn-secondary w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={grabando}
                  className="cb-btn-primary w-full sm:w-auto"
                >
                  {editandoId ? 'Actualizar Nota' : 'Guardar Nota Ahora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
