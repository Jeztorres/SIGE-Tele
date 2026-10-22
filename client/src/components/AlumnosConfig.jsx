import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Download, 
  UploadCloud, 
  School, 
  Phone, 
  Check,
  BookOpen,
  Search,
  X
} from 'lucide-react';
import { 
  createAlumno, 
  updateAlumno, 
  deleteAlumno, 
  updateConfig,
  createMateria,
  updateMateria,
  deleteMateria,
  descargarRespaldo,
  restaurarRespaldo
} from '../api';
import EditorMembrete from './EditorMembrete';

export default function AlumnosConfig({ 
  alumnos = [], 
  config = {}, 
  materias = [], 
  onDataChange,
  mode = 'alumnos' // 'alumnos' | 'ajustes'
}) {
  // En el módulo de Ajustes permitimos alternar entre Datos Escolares, Materias y Respaldo
  const [subTabAjustes, setSubTabAjustes] = useState('escuela'); // 'escuela' | 'materias' | 'respaldo'
  const [busquedaAlumno, setBusquedaAlumno] = useState('');

  // Alumno Form
  const [modalAlumno, setModalAlumno] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [alumnoForm, setAlumnoForm] = useState({
    nombre: '',
    curp: '',
    tutor: '',
    telefono: '',
    notas: ''
  });

  // Config Form sincronizado en tiempo real con props.config
  const [schoolForm, setSchoolForm] = useState({
    escuela: config?.escuela || '',
    cct: config?.cct || '',
    zona: config?.zona || '',
    sector: config?.sector || '',
    grado: config?.grado || '2°',
    grupo: config?.grupo || 'A',
    ciclo: config?.ciclo || '2026-2027',
    docente: config?.docente || '',
    periodoActivo: config?.periodoActivo || 'Trimestre 2'
  });
  const [guardadoConfig, setGuardadoConfig] = useState(false);

  // Materias Form
  const [nuevaMateria, setNuevaMateria] = useState({
    nombre: '',
    campoFormativo: 'Personalizada'
  });
  const [editandoMateriaId, setEditandoMateriaId] = useState(null);
  const [editandoMateriaForm, setEditandoMateriaForm] = useState({
    nombre: '',
    campoFormativo: ''
  });

  useEffect(() => {
    if (config) {
      setSchoolForm({
        escuela: config.escuela || '',
        cct: config.cct || '',
        zona: config.zona || '',
        sector: config.sector || '',
        grado: config.grado || '2°',
        grupo: config.grupo || 'A',
        ciclo: config.ciclo || '2026-2027',
        docente: config.docente || '',
        periodoActivo: config.periodoActivo || 'Trimestre 2'
      });
    }
  }, [config]);

  // Manejadores de alumnos
  const abrirModalCrear = () => {
    setEditandoId(null);
    setAlumnoForm({
      nombre: '',
      curp: '',
      tutor: '',
      telefono: '',
      notas: ''
    });
    setModalAlumno(true);
  };

  const abrirModalEditar = (a) => {
    setEditandoId(a.id);
    setAlumnoForm({
      nombre: a.nombre,
      curp: a.curp || '',
      tutor: a.tutor || '',
      telefono: a.telefono || '',
      notas: a.notas || ''
    });
    setModalAlumno(true);
  };

  const handleGuardarAlumno = async (e) => {
    e.preventDefault();
    if (!alumnoForm.nombre.trim()) return;

    try {
      if (editandoId) {
        await updateAlumno(editandoId, alumnoForm);
      } else {
        await createAlumno(alumnoForm);
      }
      setModalAlumno(false);
      if (onDataChange) await onDataChange();
    } catch (err) {
      alert('Error al guardar datos del alumno');
    }
  };

  const handleEliminarAlumno = async (id) => {
    if (!window.confirm('¿Seguro que deseas dar de baja a este alumno? Sus registros de asistencia y notas se eliminarán.')) return;
    try {
      await deleteAlumno(id);
      if (onDataChange) await onDataChange();
    } catch (err) {
      alert('Error eliminando alumno');
    }
  };

  // Guardar configuración escolar con actualización inmediata en toda la interfaz
  const handleGuardarConfig = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateConfig(schoolForm);
      setGuardadoConfig(true);
      if (onDataChange) await onDataChange(updated);
      setTimeout(() => setGuardadoConfig(false), 3000);
    } catch (err) {
      alert('Error guardando configuración');
    }
  };

  // Manejadores de Materias Personalizadas
  const handleCrearMateria = async (e) => {
    e.preventDefault();
    if (!nuevaMateria.nombre.trim()) return;
    try {
      await createMateria({
        nombre: nuevaMateria.nombre.trim(),
        campoFormativo: nuevaMateria.campoFormativo.trim() || 'General'
      });
      setNuevaMateria({ nombre: '', campoFormativo: 'Personalizada' });
      if (onDataChange) await onDataChange();
    } catch (err) {
      alert('Error al agregar materia');
    }
  };

  const handleIniciarEdicionMateria = (m) => {
    setEditandoMateriaId(m.id);
    setEditandoMateriaForm({
      nombre: m.nombre,
      campoFormativo: m.campoFormativo || 'General'
    });
  };

  const handleGuardarEdicionMateria = async (id) => {
    if (!editandoMateriaForm.nombre.trim()) return;
    try {
      await updateMateria(id, editandoMateriaForm);
      setEditandoMateriaId(null);
      if (onDataChange) await onDataChange();
    } catch (err) {
      alert('Error actualizando materia');
    }
  };

  const handleEliminarMateria = async (m) => {
    if (!window.confirm(`¿Eliminar la materia "${m.nombre}"?`)) return;
    try {
      await deleteMateria(m.id);
      if (onDataChange) await onDataChange();
    } catch (err) {
      alert('Error eliminando materia');
    }
  };

  // Descargar respaldo
  const handleDescargarRespaldo = () => {
    descargarRespaldo().catch((err) => alert('No se pudo descargar el respaldo: ' + err.message));
  };

  // Restaurar respaldo
  const handleRestaurarArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('¡Atención! Restaurar un archivo de respaldo reemplazará los datos actuales de la aplicación. ¿Deseas continuar?')) {
      return;
    }

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      await restaurarRespaldo(jsonData);
      alert('Respaldo restaurado con éxito');
      if (onDataChange) await onDataChange();
    } catch (err) {
      alert('No se pudo restaurar el respaldo: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  const alumnosFiltrados = alumnos.filter((a) => {
    if (!busquedaAlumno.trim()) return true;
    const q = busquedaAlumno.toLowerCase();
    return (
      a.nombre?.toLowerCase().includes(q) ||
      a.curp?.toLowerCase().includes(q) ||
      a.tutor?.toLowerCase().includes(q)
    );
  });

  // ============================================================================
  // VISTA 1: MÓDULO EXCLUSIVO DE ALUMNOS (SEPARADO DE AJUSTES)
  // ============================================================================
  if (mode === 'alumnos') {
    return (
      <div className="space-y-5">
        <div className="cb-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#050F1A] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0052FF]" />
              <span>Padrón y Gestión de Alumnos</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">
              Administra la lista oficial de estudiantes, datos de contacto de tutores y observaciones individuales.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="cb-search-wrapper w-full sm:w-72">
              <Search className="w-4 h-4 text-[#0052FF] shrink-0" />
              <input data-tour="alu-buscar"
                type="text"
                placeholder="Buscar alumno, CURP o tutor..."
                value={busquedaAlumno}
                onChange={(e) => setBusquedaAlumno(e.target.value)}
                className="cb-search-input"
              />
              {busquedaAlumno && (
                <button
                  type="button"
                  onClick={() => setBusquedaAlumno('')}
                  className="w-5 h-5 rounded-full bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#5B616E] flex items-center justify-center shrink-0 transition"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button data-tour="alu-nuevo"
              onClick={abrirModalCrear}
              className="cb-btn-primary text-xs flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nuevo Alumno</span>
            </button>
          </div>
        </div>

        <div data-tour="alu-lista" className="cb-card overflow-hidden">
          <div className="p-4 bg-[#F9FAFB] border-b border-[#D1D5DB] flex items-center justify-between gap-3">
            <span className="font-bold text-xs text-[#8A919E] uppercase tracking-[0.06em]">
              Lista Oficial del Grupo (<span className="font-mono-tabular text-[#050F1A]">{alumnosFiltrados.length}</span> de <span className="font-mono-tabular text-[#050F1A]">{alumnos.length}</span> Alumnos)
            </span>
            <span className="text-xs font-mono-tabular font-bold text-[#0052FF]">
              {config?.grado} "{config?.grupo}"
            </span>
          </div>

          <div className="divide-y divide-[#D1D5DB]">
            {alumnosFiltrados.map((a) => (
              <div 
                key={a.id} 
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB] transition"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#F3F4F6] font-mono-tabular font-bold text-[#5B616E] flex items-center justify-center text-xs shrink-0">
                    {a.noLista}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#050F1A] text-sm">{a.nombre}</h4>
                    <div className="text-xs text-[#5B616E] flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span>CURP: <b className="font-mono-tabular text-[#050F1A]">{a.curp || 'S/N'}</b></span>
                      <span>Tutor: <b className="text-[#050F1A]">{a.tutor || 'No registrado'}</b></span>
                      {a.telefono && (
                        <span className="flex items-center gap-1 text-[#8A919E] font-mono-tabular">
                          <Phone className="w-3 h-3" /> {a.telefono}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={() => abrirModalEditar(a)}
                    className="min-h-[40px] px-3 py-1.5 text-xs font-bold text-[#050F1A] bg-white border border-[#D1D5DB] hover:border-[#0052FF] hover:text-[#0052FF] rounded-lg transition flex items-center gap-1.5"
                    title="Editar datos del alumno"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleEliminarAlumno(a.id)}
                    className="min-h-[40px] min-w-[40px] text-[#8A919E] hover:bg-[#FDECEE] hover:text-[#DF2935] rounded-lg flex items-center justify-center transition"
                    title="Dar de baja alumno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {alumnosFiltrados.length === 0 && (
              <div className="p-8 text-center text-xs text-[#8A919E]">
                No se encontraron alumnos con ese criterio de búsqueda.
              </div>
            )}
          </div>
        </div>

        {/* Modal Alumno (Crear / Editar) */}
        {modalAlumno && (
          <div className="fixed inset-0 bg-[#050F1A]/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full cb-shadow-level-3 border border-[#D1D5DB] my-auto">
              <h3 className="font-bold text-lg text-[#050F1A] mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0052FF]" />
                <span>{editandoId ? 'Editar Alumno' : 'Registrar Nuevo Alumno'}</span>
              </h3>

              <form onSubmit={handleGuardarAlumno} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">Nombre Completo (Apellidos, Nombre) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Gómez Pérez Mateo"
                    value={alumnoForm.nombre}
                    onChange={(e) => setAlumnoForm({ ...alumnoForm, nombre: e.target.value })}
                    className="cb-input w-full"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">CURP</label>
                  <input
                    type="text"
                    placeholder="Clave única de registro de población"
                    value={alumnoForm.curp}
                    onChange={(e) => setAlumnoForm({ ...alumnoForm, curp: e.target.value.toUpperCase() })}
                    className="cb-input w-full font-mono-tabular"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#050F1A] mb-1.5">Nombre del Tutor</label>
                    <input
                      type="text"
                      placeholder="Madre, padre o tutor"
                      value={alumnoForm.tutor}
                      onChange={(e) => setAlumnoForm({ ...alumnoForm, tutor: e.target.value })}
                      className="cb-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#050F1A] mb-1.5">Teléfono de Contacto</label>
                    <input
                      type="text"
                      placeholder="Para recados o citatorios"
                      value={alumnoForm.telefono}
                      onChange={(e) => setAlumnoForm({ ...alumnoForm, telefono: e.target.value })}
                      className="cb-input w-full font-mono-tabular"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#050F1A] mb-1.5">Notas u Observaciones del Docente</label>
                  <textarea
                    rows="2"
                    placeholder="Dificultades particulares, fortalezas, traslados largos..."
                    value={alumnoForm.notas}
                    onChange={(e) => setAlumnoForm({ ...alumnoForm, notas: e.target.value })}
                    className="cb-input w-full"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-[#D1D5DB]">
                  <button
                    type="button"
                    onClick={() => setModalAlumno(false)}
                    className="cb-btn-secondary w-full sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="cb-btn-primary w-full sm:w-auto"
                  >
                    {editandoId ? 'Actualizar' : 'Guardar Alumno'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: MÓDULO EXCLUSIVO DE AJUSTES (ESCUELA, MATERIAS Y RESPALDO)
  // ============================================================================
  return (
    <div className="space-y-5">
      {/* Selector de subpestañas de Ajustes */}
      <div data-tour="ajustes-tabs" className="cb-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#050F1A] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0052FF]" />
            <span>Ajustes Escolares, Materias y Respaldo</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">
            Personaliza los datos de la escuela y maestra(o), tus materias (no predefinidas) y respaldos. Al guardar, todo se actualiza al instante.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 bg-[#F3F4F6] p-1 rounded-lg">
          <button data-tour="ajustes-tab-escuela"
            onClick={() => setSubTabAjustes('escuela')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-md transition ${
              subTabAjustes === 'escuela' ? 'bg-white text-[#0052FF] cb-shadow-level-1' : 'text-[#5B616E] hover:text-[#050F1A]'
            }`}
          >
            Datos Escolares
          </button>
          <button data-tour="ajustes-tab-materias"
            onClick={() => setSubTabAjustes('materias')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-md transition ${
              subTabAjustes === 'materias' ? 'bg-white text-[#0052FF] cb-shadow-level-1' : 'text-[#5B616E] hover:text-[#050F1A]'
            }`}
          >
            Materias (<span className="font-mono-tabular">{materias.length}</span>)
          </button>
          <button data-tour="ajustes-tab-membrete"
            onClick={() => setSubTabAjustes('membrete')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-md transition ${
              subTabAjustes === 'membrete' ? 'bg-white text-[#0052FF] cb-shadow-level-1' : 'text-[#5B616E] hover:text-[#050F1A]'
            }`}
          >
            Membrete
          </button>
          <button data-tour="ajustes-tab-respaldo"
            onClick={() => setSubTabAjustes('respaldo')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-md transition ${
              subTabAjustes === 'respaldo' ? 'bg-white text-[#0052FF] cb-shadow-level-1' : 'text-[#5B616E] hover:text-[#050F1A]'
            }`}
          >
            Respaldo
          </button>
        </div>
      </div>

      {/* 1. DATOS ESCOLARES Y DOCENTE (ACTUALIZACIÓN INMEDIATA) */}
      {subTabAjustes === 'escuela' && (
        <div data-tour="ajustes-escuela" className="cb-card p-5 sm:p-6 max-w-2xl">
          <h3 className="font-bold text-base text-[#050F1A] mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-[#0052FF]" />
            <span>Datos Oficiales de la Escuela y Maestra(o)</span>
          </h3>

          <form onSubmit={handleGuardarConfig} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-medium text-[#050F1A] mb-1.5">Nombre del Plantel *</label>
              <input
                type="text"
                required
                value={schoolForm.escuela}
                onChange={(e) => setSchoolForm({ ...schoolForm, escuela: e.target.value })}
                className="cb-input w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Clave CCT *</label>
                <input
                  type="text"
                  required
                  value={schoolForm.cct}
                  onChange={(e) => setSchoolForm({ ...schoolForm, cct: e.target.value })}
                  className="cb-input w-full font-mono-tabular"
                />
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Zona Escolar</label>
                <input
                  type="text"
                  value={schoolForm.zona}
                  onChange={(e) => setSchoolForm({ ...schoolForm, zona: e.target.value })}
                  className="cb-input w-full font-mono-tabular"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Grado *</label>
                <select
                  value={schoolForm.grado}
                  onChange={(e) => setSchoolForm({ ...schoolForm, grado: e.target.value })}
                  className="cb-input w-full font-bold"
                >
                  <option value="1°">1° de Telesecundaria</option>
                  <option value="2°">2° de Telesecundaria</option>
                  <option value="3°">3° de Telesecundaria</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Grupo *</label>
                <input
                  type="text"
                  required
                  value={schoolForm.grupo}
                  onChange={(e) => setSchoolForm({ ...schoolForm, grupo: e.target.value })}
                  className="cb-input w-full font-mono-tabular font-bold text-center"
                />
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1.5">Ciclo Escolar *</label>
                <input
                  type="text"
                  required
                  value={schoolForm.ciclo}
                  onChange={(e) => setSchoolForm({ ...schoolForm, ciclo: e.target.value })}
                  className="cb-input w-full font-mono-tabular font-bold text-center"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#050F1A] mb-1.5">Nombre de la Maestra o Maestro Titular *</label>
              <input
                type="text"
                required
                value={schoolForm.docente}
                onChange={(e) => setSchoolForm({ ...schoolForm, docente: e.target.value })}
                className="cb-input w-full"
              />
            </div>

            {guardadoConfig && (
              <div className="p-3 bg-[#E6F6EF] border border-[#05B169] text-[#05B169] rounded-lg font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>¡Datos actualizados al instante en todo el sistema!</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="cb-btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar y Actualizar Ahora</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. MATERIAS PERSONALIZADAS (NO PREDEFINIDAS) */}
      {subTabAjustes === 'materias' && (
        <div data-tour="ajustes-materias" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 cb-card p-5 h-fit">
            <h3 className="font-bold text-base text-[#050F1A] mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#0052FF]" />
              <span>Agregar Cualquier Materia</span>
            </h3>
            <p className="text-xs text-[#5B616E] mb-4">
              Escribe el nombre de la asignatura, taller, club o campo formativo que impartas. Se reflejará de inmediato en Calificaciones, Tareas y Evidencias.
            </p>

            <form onSubmit={handleCrearMateria} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#050F1A] mb-1">Nombre de la Materia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Español, Inglés, Robótica, Lectura, Artes..."
                  value={nuevaMateria.nombre}
                  onChange={(e) => setNuevaMateria({ ...nuevaMateria, nombre: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              <div>
                <label className="block font-medium text-[#050F1A] mb-1">Campo Formativo / Categoría (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Lenguajes, Saberes, Taller..."
                  value={nuevaMateria.campoFormativo}
                  onChange={(e) => setNuevaMateria({ ...nuevaMateria, campoFormativo: e.target.value })}
                  className="cb-input w-full"
                />
              </div>

              <button type="submit" className="cb-btn-primary w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Agregar Materia</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 cb-card overflow-hidden">
            <div className="p-4 bg-[#F9FAFB] border-b border-[#D1D5DB] flex items-center justify-between">
              <span className="font-bold text-xs text-[#8A919E] uppercase tracking-[0.06em] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0052FF]" />
                <span>Materias Activas (<span className="font-mono-tabular text-[#050F1A]">{materias.length}</span>)</span>
              </span>
            </div>

            <div className="divide-y divide-[#D1D5DB]">
              {materias.map((m, idx) => (
                <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB]">
                  {editandoMateriaId === m.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={editandoMateriaForm.nombre}
                        onChange={(e) => setEditandoMateriaForm({ ...editandoMateriaForm, nombre: e.target.value })}
                        className="cb-input flex-1 text-xs"
                        placeholder="Nombre de materia"
                      />
                      <input
                        type="text"
                        value={editandoMateriaForm.campoFormativo}
                        onChange={(e) => setEditandoMateriaForm({ ...editandoMateriaForm, campoFormativo: e.target.value })}
                        className="cb-input sm:w-44 text-xs"
                        placeholder="Campo formativo"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleGuardarEdicionMateria(m.id)}
                          className="cb-btn-primary text-xs px-3 min-h-[38px]"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoMateriaId(null)}
                          className="cb-btn-secondary text-xs px-3 min-h-[38px]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#0052FF]/10 text-[#0052FF] font-mono-tabular font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#050F1A] truncate">{m.nombre}</h4>
                          <span className="text-[11px] text-[#5B616E]">{m.campoFormativo || 'General'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <button
                          onClick={() => handleIniciarEdicionMateria(m)}
                          className="min-h-[38px] px-2.5 py-1 text-xs font-bold text-[#050F1A] bg-white border border-[#D1D5DB] hover:border-[#0052FF] hover:text-[#0052FF] rounded-lg flex items-center gap-1 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleEliminarMateria(m)}
                          className="min-h-[38px] min-w-[38px] text-[#8A919E] hover:text-[#DF2935] hover:bg-[#FDECEE] rounded-lg flex items-center justify-center transition"
                          title="Eliminar materia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MEMBRETE EDITABLE DE LOS DOCUMENTOS */}
      {subTabAjustes === 'membrete' && <EditorMembrete config={config} onDataChange={onDataChange} />}

      {/* 3. COPIA DE SEGURIDAD (RESPALDO Y RESTAURACIÓN) */}
      {subTabAjustes === 'respaldo' && (
        <div data-tour="ajustes-respaldo" className="cb-card p-5 sm:p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="font-bold text-base text-[#050F1A] mb-1 flex items-center gap-2">
              <Download className="w-5 h-5 text-[#0052FF]" />
              <span>Respaldo Total de Datos (Seguridad Escolar)</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#5B616E]">
              Descarga una copia completa de toda la información (alumnos, asistencias, tareas, calificaciones, notas de la maestra, acuerdos y evidencias) en un solo archivo.
            </p>

            <button
              onClick={handleDescargarRespaldo}
              className="mt-4 cb-btn-primary text-xs flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Respaldo JSON Completo</span>
            </button>
          </div>

          <div className="border-t border-[#D1D5DB] pt-6">
            <h3 className="font-bold text-base text-[#050F1A] mb-1 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#F0AD4E]" />
              <span>Restaurar Datos desde un Respaldo</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#5B616E] mb-3">
              Selecciona un archivo JSON de respaldo previamente guardado para restaurar toda la información.
            </p>

            <input
              type="file"
              accept=".json"
              onChange={handleRestaurarArchivo}
              className="w-full text-xs text-[#5B616E] file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#FEF6E7] file:text-[#B87514] hover:file:opacity-90 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
