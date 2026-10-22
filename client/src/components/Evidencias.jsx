import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  Upload, 
  Trash2, 
  Filter, 
  FileText, 
  User, 
  Printer, 
  FolderOpen,
  Check,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { fetchEvidencias, uploadEvidencia, deleteEvidencia, formatearFechaCompleta } from '../api';

const LS_EVIDENCIAS_KEY = 'sige_tele_evidencias_v1';

export default function Evidencias({ alumnos = [], materias = [], config = {}, onOpenExpediente }) {
  const [evidencias, setEvidencias] = useState([]);
  const [alumnoFiltro, setAlumnoFiltro] = useState('');
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('todos');
  const [modalSubir, setModalSubir] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [mensajeGuardado, setMensajeGuardado] = useState('');

  // Formulario de subida
  const [uploadForm, setUploadForm] = useState({
    alumnoId: alumnos[0]?.id || '',
    materiaId: materias[0]?.id || '',
    titulo: '',
    tipo: 'Fotografía de Libreta / Trabajo',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: ''
  });
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [archivoDataUrl, setArchivoDataUrl] = useState('');

  const mostrarConfirmacion = (msg) => {
    setMensajeGuardado(msg);
    setTimeout(() => setMensajeGuardado(''), 3000);
  };

  const cargarEvidencias = async () => {
    try {
      const params = {};
      if (periodoFiltro && periodoFiltro !== 'todos') {
        params.periodo = periodoFiltro;
      }
      if (alumnoFiltro) {
        params.alumnoId = alumnoFiltro;
      }
      if (materiaFiltro) {
        params.materiaId = materiaFiltro;
      }

      const data = await fetchEvidencias(params);
      if (Array.isArray(data)) {
        setEvidencias(data);
        if (!alumnoFiltro && !materiaFiltro && periodoFiltro === 'todos') {
          try {
            localStorage.setItem(LS_EVIDENCIAS_KEY, JSON.stringify(data));
          } catch {
            // ignore quota
          }
        }
      }
    } catch (err) {
      console.error('Error cargando evidencias:', err);
      try {
        const local = localStorage.getItem(LS_EVIDENCIAS_KEY);
        if (local) {
          setEvidencias(JSON.parse(local));
        }
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    cargarEvidencias();
  }, [config?.periodoActivo, periodoFiltro, alumnoFiltro, materiaFiltro]);

  const abrirModalSubir = () => {
    setArchivoSeleccionado(null);
    setArchivoDataUrl('');
    setUploadForm({
      alumnoId: alumnoFiltro || alumnos[0]?.id || '',
      materiaId: materiaFiltro || materias[0]?.id || '',
      titulo: '',
      tipo: 'Fotografía de Libreta / Trabajo',
      fecha: new Date().toISOString().split('T')[0],
      descripcion: ''
    });
    setModalSubir(true);
  };

  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setArchivoSeleccionado(null);
      setArchivoDataUrl('');
      return;
    }
    setArchivoSeleccionado(file);

    // Si el título está vacío, sugerir el nombre del archivo sin extensión
    if (!uploadForm.titulo.trim()) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      setUploadForm(prev => ({ ...prev, titulo: cleanTitle }));
    }

    // Generar previsualización DataURL si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setArchivoDataUrl(reader.result || '');
      };
      reader.readAsDataURL(file);
    } else {
      setArchivoDataUrl('');
    }
  };

  const handleSubirEvidencia = async (e) => {
    e.preventDefault();
    const alumnoIdFinal = uploadForm.alumnoId || alumnos[0]?.id || '';
    const materiaIdFinal = uploadForm.materiaId || materias[0]?.id || '';

    if (!alumnoIdFinal) {
      alert('Selecciona un alumno para asociar la evidencia');
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('alumnoId', alumnoIdFinal);
      formData.append('materiaId', materiaIdFinal);
      formData.append('periodo', config?.periodoActivo || 'Trimestre 2');
      formData.append('titulo', uploadForm.titulo.trim() || 'Muestra de trabajo');
      formData.append('tipo', uploadForm.tipo);
      formData.append('fecha', uploadForm.fecha);
      formData.append('descripcion', uploadForm.descripcion);
      if (archivoSeleccionado) {
        formData.append('archivo', archivoSeleccionado);
      } else if (archivoDataUrl) {
        formData.append('dataUrl', archivoDataUrl);
      }

      const res = await uploadEvidencia(formData);
      if (res && res.evidencia) {
        setEvidencias(prev => [res.evidencia, ...prev]);
      }

      setModalSubir(false);
      setArchivoSeleccionado(null);
      setArchivoDataUrl('');
      await cargarEvidencias();
      mostrarConfirmacion('¡Evidencia guardada y asignada!');
    } catch (err) {
      console.error('Error subiendo evidencia:', err);
      alert('No se pudo guardar la evidencia: ' + (err?.message || 'error desconocido'));
    } finally {
      setSubiendo(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Deseas eliminar esta evidencia fotográfica?')) return;
    try {
      await deleteEvidencia(id);
      setEvidencias(prev => prev.filter(e => e.id !== id));
      await cargarEvidencias();
      mostrarConfirmacion('Evidencia eliminada');
    } catch (err) {
      setEvidencias(prev => prev.filter(e => e.id !== id));
    }
  };

  // Navegar al siguiente o anterior alumno en la barra de filtros
  const handleCambiarAlumnoSecuencial = (direccion = 1) => {
    if (!alumnos || alumnos.length === 0) return;
    const idxActual = alumnos.findIndex(a => a.id === alumnoFiltro);
    let nuevoIdx;
    if (idxActual === -1) {
      nuevoIdx = direccion > 0 ? 0 : alumnos.length - 1;
    } else {
      nuevoIdx = (idxActual + direccion + alumnos.length) % alumnos.length;
    }
    setAlumnoFiltro(alumnos[nuevoIdx].id);
  };

  // Navegar al siguiente o anterior alumno directamente dentro del visor de imagen en grande
  const handleIrAOtroAlumnoEnVisor = (direccion = 1) => {
    if (!previewFoto || !alumnos || alumnos.length === 0) return;

    // Buscar alumnos que tienen al menos una evidencia con imagen en la lista actual
    const idsConEvidencia = [];
    evidencias.forEach(e => {
      if (e.alumnoId && !idsConEvidencia.includes(e.alumnoId)) {
        idsConEvidencia.push(e.alumnoId);
      }
    });

    // Ordenarlos según el orden de lista del grupo
    const alumnosOrdenadosConEvi = alumnos
      .filter(a => idsConEvidencia.includes(a.id))
      .map(a => a.id);

    const listaIds = alumnosOrdenadosConEvi.length > 0 ? alumnosOrdenadosConEvi : alumnos.map(a => a.id);
    const idxActual = listaIds.indexOf(previewFoto.alumnoId);
    const siguienteIdx = idxActual === -1
      ? 0
      : (idxActual + direccion + listaIds.length) % listaIds.length;
    const siguienteAlumnoId = listaIds[siguienteIdx];

    // Buscar la primera evidencia de ese siguiente alumno
    const eviSiguienteAlumno = evidencias.find(e => e.alumnoId === siguienteAlumnoId && e.url)
      || evidencias.find(e => e.alumnoId === siguienteAlumnoId);

    if (eviSiguienteAlumno) {
      setPreviewFoto(eviSiguienteAlumno);
    } else {
      // Si estaba filtrado por un solo alumno, cambiamos el filtro al siguiente alumno
      setAlumnoFiltro(siguienteAlumnoId);
      setPreviewFoto(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Encabezado y botones principales */}
      <div className="cb-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#050F1A] flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-[#0052FF]" />
            <span>Carpeta Digital de Evidencias Fotográficas</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">
            Sube fotos de libretas, maquetas, exámenes o citatorios y asígnalos al instante a cada alumno.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {mensajeGuardado && (
            <span className="bg-[#E6F6EF] text-[#05B169] border border-[#05B169]/30 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {mensajeGuardado}
            </span>
          )}

          {alumnoFiltro && (
            <button data-tour="evi-exportar"
              onClick={() => onOpenExpediente(alumnoFiltro)}
              className="cb-btn-secondary text-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#0052FF]" />
              <span>Exportar Carpeta del Alumno</span>
            </button>
          )}

          <button data-tour="evi-subir"
            onClick={abrirModalSubir}
            className="cb-btn-primary text-xs flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Archivo / Foto</span>
          </button>
        </div>
      </div>

      {/* Filtros de búsqueda rápida */}
      <div data-tour="evi-filtros" className="cb-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap flex-1">
          <div className="flex items-center gap-1.5 text-[#050F1A] font-bold">
            <Filter className="w-4 h-4 text-[#8A919E]" />
            <span>Filtrar por:</span>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <User className="w-4 h-4 text-[#8A919E] hidden sm:block" />
            <select
              value={alumnoFiltro}
              onChange={(e) => setAlumnoFiltro(e.target.value)}
              className="cb-input text-xs font-medium w-full sm:w-auto min-h-[40px] py-1.5"
            >
              <option value="">Todos los Alumnos ({alumnos.length})</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.noLista}. {a.nombre}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleCambiarAlumnoSecuencial(-1)}
              className="min-h-[40px] px-2.5 rounded-lg border border-[#D1D5DB] bg-white hover:border-[#0052FF] text-[#050F1A] flex items-center justify-center transition shrink-0"
              title="Alumno anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleCambiarAlumnoSecuencial(1)}
              className="min-h-[40px] px-3 rounded-lg border border-[#0052FF] bg-[#0052FF]/10 hover:bg-[#0052FF] text-[#0052FF] hover:text-white font-bold text-xs flex items-center gap-1 transition shrink-0"
              title="Pasar al siguiente alumno"
            >
              <span>Siguiente Alumno</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <select
              value={materiaFiltro}
              onChange={(e) => setMateriaFiltro(e.target.value)}
              className="cb-input text-xs font-medium w-full sm:w-auto min-h-[40px] py-1.5"
            >
              <option value="">Todas las Asignaturas</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
              className="cb-input text-xs font-medium w-full sm:w-auto min-h-[40px] py-1.5"
            >
              <option value="todos">Todos los Periodos</option>
              <option value="Trimestre 1">1er Trimestre</option>
              <option value="Trimestre 2">2do Trimestre</option>
              <option value="Trimestre 3">3er Trimestre</option>
            </select>
          </div>

          {(alumnoFiltro || materiaFiltro || periodoFiltro !== 'todos') && (
            <button
              onClick={() => {
                setAlumnoFiltro('');
                setMateriaFiltro('');
                setPeriodoFiltro('todos');
              }}
              className="text-xs text-[#DF2935] hover:underline font-bold self-start sm:self-center"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="text-[#5B616E] font-medium text-xs shrink-0">
          <span className="font-mono-tabular font-bold text-[#050F1A]">{evidencias.length}</span> evidencia(s) registrada(s)
        </div>
      </div>

      {/* Galería de Evidencias */}
      <div data-tour="evi-galeria" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {evidencias.map((evi) => (
          <div 
            key={evi.id} 
            className="cb-card-interactive overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Imagen o miniatura */}
              <div 
                onClick={() => evi.url && setPreviewFoto(evi)}
                className="h-44 bg-[#F9FAFB] border-b border-[#D1D5DB] relative overflow-hidden flex items-center justify-center cursor-pointer group-hover:brightness-95 transition"
              >
                {evi.url ? (
                  <img 
                    src={evi.url} 
                    alt={evi.titulo} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-center p-4">
                    <FileText className="w-10 h-10 mx-auto text-[#8A919E] mb-1.5" />
                    <span className="text-xs font-bold text-[#050F1A] block">{evi.tipo}</span>
                    <span className="text-[11px] text-[#5B616E]">{evi.nombreOriginal || evi.nombreArchivo || 'Evidencia documentada'}</span>
                  </div>
                )}

                <div className="absolute top-2.5 right-2.5 bg-[#050F1A]/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-[6px]">
                  {formatearFechaCompleta(evi.fecha)}
                </div>
              </div>

              {/* Contenido descriptivo */}
              <div className="p-4">
                <div className="flex items-center justify-between gap-1 text-xs mb-1.5">
                  <span className="bg-[#0052FF]/10 text-[#0052FF] font-bold px-2 py-0.5 rounded-[6px] truncate">
                    {evi.materiaNombre}
                  </span>
                  <span className="text-[11px] text-[#8A919E] truncate max-w-[110px]">
                    {evi.periodo || evi.tipo}
                  </span>
                </div>

                <div className="font-bold text-[#050F1A] text-sm mt-1">
                  {evi.alumnoNombre}
                </div>

                <h4 className="font-medium text-[#5B616E] text-xs mt-0.5 line-clamp-1">
                  {evi.titulo}
                </h4>

                {evi.descripcion && (
                  <p className="text-xs text-[#5B616E] mt-1.5 line-clamp-2">
                    {evi.descripcion}
                  </p>
                )}
              </div>
            </div>

            {/* Acciones en la tarjeta */}
            <div className="px-4 py-3 border-t border-[#D1D5DB] bg-[#F9FAFB] flex items-center justify-between">
              <button
                onClick={() => onOpenExpediente(evi.alumnoId)}
                className="min-h-[36px] text-xs font-bold text-[#0052FF] hover:text-[#003ECB] flex items-center gap-1.5"
                title="Abrir expediente completo del alumno"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Ver Expediente</span>
              </button>

              <button
                onClick={() => handleEliminar(evi.id)}
                className="min-h-[36px] min-w-[36px] text-[#8A919E] hover:text-[#DF2935] hover:bg-[#FDECEE] rounded-lg flex items-center justify-center transition"
                title="Eliminar evidencia"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {evidencias.length === 0 && (
          <div className="col-span-full py-12 px-4 text-center cb-card">
            <FolderLock className="w-12 h-12 mx-auto text-[#8A919E] mb-3" />
            <h4 className="font-bold text-[#050F1A] text-base">No hay evidencias registradas con este filtro</h4>
            <p className="text-xs sm:text-sm text-[#5B616E] mt-1 max-w-md mx-auto">
              Puedes subir fotografías de libretas, tareas o exámenes tomadas con tu teléfono o cámara para asignarlas al alumno correspondiente.
            </p>
            <button
              onClick={abrirModalSubir}
              className="mt-4 cb-btn-primary text-xs"
            >
              Subir Primera Evidencia
            </button>
          </div>
        )}
      </div>

      {/* Modal para Subir Nueva Evidencia */}
      {modalSubir && (
        <div className="fixed inset-0 bg-[#050F1A]/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full cb-shadow-level-3 border border-[#D1D5DB] my-auto">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-lg text-[#050F1A] flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#0052FF]" />
                <span>Subir Fotografía o Archivo de Evidencia</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalSubir(false)}
                className="w-9 h-9 rounded-lg border border-[#D1D5DB] text-[#5B616E] hover:text-[#050F1A] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubirEvidencia} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">
                  Asignar a Alumno *
                </label>
                <select
                  required
                  value={uploadForm.alumnoId}
                  onChange={(e) => setUploadForm({ ...uploadForm, alumnoId: e.target.value })}
                  className="cb-input w-full"
                >
                  <option value="">Selecciona al estudiante</option>
                  {alumnos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.noLista}. {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">
                    Materia / Campo *
                  </label>
                  <select
                    value={uploadForm.materiaId}
                    onChange={(e) => setUploadForm({ ...uploadForm, materiaId: e.target.value })}
                    className="cb-input w-full"
                  >
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">
                    Tipo de Evidencia *
                  </label>
                  <select
                    value={uploadForm.tipo}
                    onChange={(e) => setUploadForm({ ...uploadForm, tipo: e.target.value })}
                    className="cb-input w-full"
                  >
                    <option value="Fotografía de Libreta / Trabajo">Fotografía de Libreta</option>
                    <option value="Examen o Evaluación Escrita">Examen / Evaluación</option>
                    <option value="Proyecto o Maqueta">Proyecto / Maqueta</option>
                    <option value="Citatorio a Padres Firmado">Citatorio Firmado</option>
                    <option value="Ficha de Ajuste Razonable">Ficha de Ajuste / Tutoría</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">
                    Título o Tema de la Evidencia *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Resumen de Geografía pág 34"
                    value={uploadForm.titulo}
                    onChange={(e) => setUploadForm({ ...uploadForm, titulo: e.target.value })}
                    className="cb-input w-full"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">
                    Fecha de la Evidencia *
                  </label>
                  <input
                    type="date"
                    required
                    value={uploadForm.fecha}
                    onChange={(e) => setUploadForm({ ...uploadForm, fecha: e.target.value })}
                    className="cb-input w-full font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">
                  Seleccionar Fotografía o Documento (JPG, PNG, PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleSeleccionarArchivo}
                  className="w-full text-[#5B616E] text-xs file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0052FF]/10 file:text-[#0052FF] hover:file:bg-[#0052FF]/20 cursor-pointer"
                />

                {/* Vista previa inmediata del archivo seleccionado */}
                {archivoDataUrl && (
                  <div className="mt-2.5 p-2 rounded-xl bg-[#F9FAFB] border border-[#D1D5DB] flex items-center gap-3">
                    <img
                      src={archivoDataUrl}
                      alt="Vista previa"
                      className="w-16 h-16 rounded-lg object-cover border border-[#D1D5DB]"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#05B169] flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Imagen lista para guardar
                      </span>
                      <span className="text-[11px] text-[#5B616E] truncate block">
                        {archivoSeleccionado?.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">
                  Notas u Observaciones Pedagógicas
                </label>
                <textarea
                  rows="2"
                  placeholder="Ej. Buena redacción, entregado en tiempo y forma..."
                  value={uploadForm.descripcion}
                  onChange={(e) => setUploadForm({ ...uploadForm, descripcion: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-[#D1D5DB]">
                <button
                  type="button"
                  onClick={() => setModalSubir(false)}
                  className="cb-btn-secondary w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subiendo}
                  className="cb-btn-primary w-full sm:w-auto"
                >
                  {subiendo ? 'Guardando...' : 'Guardar y Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visor de Fotografía a Pantalla Completa con Título Arriba y Controles de Alumno */}
      {previewFoto && (() => {
        const evidenciasMismoAlumno = evidencias.filter(e => e.alumnoId === previewFoto.alumnoId);
        return (
          <div 
            onClick={() => setPreviewFoto(null)}
            className="fixed inset-0 bg-[#050F1A]/90 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-3 sm:p-4 cursor-pointer overflow-y-auto"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full flex flex-col items-center my-auto"
            >
              {/* Barra superior con el Título de la Evidencia y Botones de Acción del Alumno */}
              <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-white truncate">
                    {previewFoto.titulo || 'Evidencia Fotográfica'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-white/80 mt-0.5">
                    {previewFoto.alumnoNombre && <span>Alumno: <b className="text-white">{previewFoto.alumnoNombre}</b></span>}
                    {previewFoto.materiaNombre && <span>• {previewFoto.materiaNombre}</span>}
                    {previewFoto.fecha && <span>• {formatearFechaCompleta(previewFoto.fecha)}</span>}
                  </div>
                </div>

                {/* Botones rápidos: Ver todas las evidencias del alumno / Siguiente alumno / Cerrar */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAlumnoFiltro(previewFoto.alumnoId);
                      setPreviewFoto(null);
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0052FF] hover:bg-[#003ECB] text-white font-bold text-xs flex items-center gap-1.5 transition"
                    title="Filtrar la galería para ver todas las evidencias de este alumno"
                  >
                    <Users className="w-4 h-4" />
                    <span>Ver todas las evidencias del alumno ({evidenciasMismoAlumno.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleIrAOtroAlumnoEnVisor(-1)}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1 transition"
                    title="Ir al alumno anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleIrAOtroAlumnoEnVisor(1)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white text-[#050F1A] hover:bg-[#F3F4F6] font-bold text-xs flex items-center gap-1 transition"
                    title="Pasar al siguiente alumno"
                  >
                    <span>Siguiente Alumno</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFoto(null)}
                    className="w-9 h-9 rounded-lg bg-white/15 hover:bg-[#DF2935] text-white flex items-center justify-center shrink-0 transition"
                    title="Cerrar vista previa"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <img 
                src={previewFoto.url || previewFoto} 
                alt={previewFoto.titulo || 'Evidencia ampliada'} 
                className="max-w-full max-h-[68vh] rounded-xl cb-shadow-level-3 object-contain mx-auto bg-black/20" 
              />

              {previewFoto.descripcion && (
                <p className="text-center text-xs sm:text-sm text-white/90 mt-2.5 max-w-2xl">
                  {previewFoto.descripcion}
                </p>
              )}

              {/* Tira rápida de las demás evidencias de este mismo alumno (si tiene más de una) */}
              {evidenciasMismoAlumno.length > 1 && (
                <div className="mt-3 w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5">
                  <span className="text-[11px] font-bold text-white/80 block mb-1.5">
                    Otras evidencias de {previewFoto.alumnoNombre}:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {evidenciasMismoAlumno.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPreviewFoto(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                          item.id === previewFoto.id
                            ? 'bg-[#0052FF] text-white'
                            : 'bg-white/15 text-white/80 hover:bg-white/25'
                        }`}
                      >
                        <span className="truncate max-w-[160px]">{item.titulo}</span>
                        <span className="text-[10px] opacity-85">({formatearFechaCompleta(item.fecha)})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span 
                onClick={() => setPreviewFoto(null)}
                className="block text-center text-xs text-white/60 mt-2 hover:text-white cursor-pointer"
              >
                Haz clic fuera o en la ✕ para cerrar
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
