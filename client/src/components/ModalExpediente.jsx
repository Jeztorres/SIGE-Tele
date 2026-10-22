import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  FolderLock, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon
} from 'lucide-react';
import { fetchExpedienteAlumno, formatearFechaCompleta } from '../api';
import Membrete from './Membrete';

export default function ModalExpediente({ alumnoId, onClose }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [opcionesImpresion, setOpcionesImpresion] = useState({
    incluirMembrete: true,
    incluirDocente: true,
    incluirTutor: true,
    incluirSelloDireccion: true
  });

  useEffect(() => {
    async function load() {
      setCargando(true);
      try {
        const res = await fetchExpedienteAlumno(alumnoId);
        setDatos(res);
      } catch (err) {
        console.error('Error cargando expediente:', err);
      } finally {
        setCargando(false);
      }
    }
    if (alumnoId) load();
  }, [alumnoId]);

  if (!alumnoId) return null;

  const handlePrint = () => {
    window.print();
  };

  const alumno = datos?.alumno;
  const estado = datos?.estadoActual;
  const evidencias = datos?.evidencias || [];

  return (
    <div className="fixed inset-0 bg-[#050F1A]/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto cb-shadow-level-3 border border-[#D1D5DB] flex flex-col">
        {/* Barra superior de control (no imprimible) */}
        <div className="p-4 bg-white border-b border-[#D1D5DB] rounded-t-2xl flex flex-wrap items-center justify-between gap-3 no-print sticky top-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#0052FF]/10 text-[#0052FF] flex items-center justify-center shrink-0">
              <FolderLock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-[#050F1A] truncate">
                Expediente Digital y Carpeta del Alumno
              </h3>
              <p className="text-[11px] text-[#5B616E] truncate">
                Formato oficial para Dirección, Supervisión o Padres de Familia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="cb-btn-primary text-xs px-3.5 min-h-[40px] flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#D1D5DB] text-[#5B616E] hover:text-[#050F1A] rounded-lg flex items-center justify-center transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de qué incluir en la exportación / impresión (no imprimible) */}
        <div className="px-4 py-2.5 bg-[#F9FAFB] border-b border-[#D1D5DB] flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          <span className="font-bold text-[#050F1A]">Incluir al exportar:</span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#5B616E] hover:text-[#050F1A]">
              <input
                type="checkbox"
                checked={opcionesImpresion.incluirMembrete}
                onChange={(e) => setOpcionesImpresion({ ...opcionesImpresion, incluirMembrete: e.target.checked })}
                className="w-4 h-4 accent-[#0052FF] rounded"
              />
              <span>Membrete Escuela</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[#5B616E] hover:text-[#050F1A]">
              <input
                type="checkbox"
                checked={opcionesImpresion.incluirDocente}
                onChange={(e) => setOpcionesImpresion({ ...opcionesImpresion, incluirDocente: e.target.checked })}
                className="w-4 h-4 accent-[#0052FF] rounded"
              />
              <span>Nombre / Firma Maestra(o)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[#5B616E] hover:text-[#050F1A]">
              <input
                type="checkbox"
                checked={opcionesImpresion.incluirTutor}
                onChange={(e) => setOpcionesImpresion({ ...opcionesImpresion, incluirTutor: e.target.checked })}
                className="w-4 h-4 accent-[#0052FF] rounded"
              />
              <span>Firma Tutor</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[#5B616E] hover:text-[#050F1A]">
              <input
                type="checkbox"
                checked={opcionesImpresion.incluirSelloDireccion}
                onChange={(e) => setOpcionesImpresion({ ...opcionesImpresion, incluirSelloDireccion: e.target.checked })}
                className="w-4 h-4 accent-[#0052FF] rounded"
              />
              <span>Dirección y Sello</span>
            </label>
          </div>
        </div>

        {/* CONTENIDO DEL EXPEDIENTE (IMPRIMIBLE) */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 text-[#050F1A] print:p-0">
          {cargando ? (
            <div className="text-center py-12 text-[#5B616E] text-sm">
              Cargando carpeta de evidencias...
            </div>
          ) : (
            <>
              {/* Membrete Oficial (Condicional, editable en Ajustes) */}
              {opcionesImpresion.incluirMembrete && (
                <Membrete
                  titulo="Carpeta de Evidencias y Ficha Descriptiva del Estudiante"
                  membrete={datos?.membrete}
                  items={[
                    { etiqueta: 'Escuela', valor: datos?.escuela },
                    { etiqueta: 'C.C.T.', valor: datos?.cct, tipo: 'mono' },
                    { etiqueta: 'Grado y Grupo', valor: datos?.gradoGrupo, tipo: 'azul' },
                    { etiqueta: 'Ciclo', valor: datos?.ciclo, tipo: 'mono' }
                  ]}
                />
              )}

              {/* Ficha General del Alumno */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F9FAFB] p-4 rounded-xl border border-[#D1D5DB] text-xs">
                <div>
                  <div className="text-[#8A919E] uppercase text-[11px] font-bold tracking-[0.06em]">Datos del Estudiante</div>
                  <div className="text-base font-bold text-[#050F1A] mt-1">
                    {alumno?.nombre}
                  </div>
                  <div className="text-[#5B616E] mt-1.5 space-y-1">
                    <div>No. de Lista: <b className="font-mono-tabular text-[#050F1A]">{alumno?.noLista}</b></div>
                    <div>CURP: <b className="font-mono-tabular text-[#050F1A]">{alumno?.curp || 'No registrada'}</b></div>
                    <div>Docente Responsable: <b className="text-[#050F1A]">{datos?.docente}</b></div>
                  </div>
                </div>

                <div>
                  <div className="text-[#8A919E] uppercase text-[11px] font-bold tracking-[0.06em]">Datos del Tutor y Contacto</div>
                  <div className="text-[#5B616E] mt-1.5 space-y-1">
                    <div>Nombre del Tutor: <b className="text-[#050F1A]">{alumno?.tutor || 'No registrado'}</b></div>
                    <div>Teléfono: <b className="font-mono-tabular text-[#050F1A]">{alumno?.telefono || 'Sin teléfono'}</b></div>
                    {alumno?.notas && (
                      <div className="text-[#5B616E] bg-white p-2.5 rounded-lg border border-[#D1D5DB] text-xs mt-1.5">
                        <b className="text-[#050F1A]">Observaciones:</b> {alumno?.notas}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumen de Desempeño y Semáforo */}
              {estado && (
                <div className="border border-[#D1D5DB] rounded-xl p-4">
                  <h4 className="font-bold text-xs uppercase text-[#8A919E] tracking-[0.06em] mb-3">
                    Diagnóstico Formativo y Semáforo
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#D1D5DB]">
                      <span className="text-[10px] text-[#8A919E] font-bold block uppercase">Estatus Semáforo</span>
                      <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-[6px] mt-1.5 ${
                        estado.semaforo === 'verde'
                          ? 'bg-[#E6F6EF] text-[#05B169]'
                          : estado.semaforo === 'amarillo'
                          ? 'bg-[#FEF6E7] text-[#B87514]'
                          : 'bg-[#FDECEE] text-[#DF2935]'
                      }`}>
                        {estado.semaforo === 'verde' ? '🟢 En Regla' : estado.semaforo === 'amarillo' ? '🟡 En Observación' : '🔴 Atención Prioritaria'}
                      </span>
                    </div>

                    <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#D1D5DB]">
                      <span className="text-[10px] text-[#8A919E] font-bold block uppercase">Asistencia</span>
                      <span className="text-lg font-bold font-mono-tabular text-[#050F1A] mt-0.5 block">
                        {estado.asistencia.porcentaje}%
                      </span>
                      <span className="text-[11px] text-[#5B616E] font-mono-tabular">
                        {estado.asistencia.faltas} faltas
                      </span>
                    </div>

                    <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#D1D5DB]">
                      <span className="text-[10px] text-[#8A919E] font-bold block uppercase">Tareas Cumplidas</span>
                      <span className="text-lg font-bold font-mono-tabular text-[#050F1A] mt-0.5 block">
                        {estado.tareas.porcentaje}%
                      </span>
                      <span className="text-[11px] text-[#5B616E] font-mono-tabular">
                        {estado.tareas.noEntregadas} sin entregar
                      </span>
                    </div>

                    <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#D1D5DB]">
                      <span className="text-[10px] text-[#8A919E] font-bold block uppercase">Promedio Actual</span>
                      <span className="text-lg font-bold font-mono-tabular text-[#050F1A] mt-0.5 block">
                        {estado.calificaciones.promedio}
                      </span>
                      <span className="text-[11px] text-[#5B616E]">Escala SEP</span>
                    </div>
                  </div>

                  {/* Alertas */}
                  {estado.causasRiesgo?.length > 0 && (
                    <div className="mt-3 bg-[#FDECEE] border border-[#DF2935]/40 text-[#DF2935] p-3 rounded-lg text-xs">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Incidencias registradas en el periodo:</span>
                      </div>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {estado.causasRiesgo.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Galería de Fotografías y Evidencias del Alumno */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 border-b border-[#D1D5DB] pb-2">
                  <h4 className="font-bold text-xs uppercase text-[#050F1A] tracking-[0.06em] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#0052FF]" />
                    <span>Muestras y Evidencias de Trabajo (<span className="font-mono-tabular">{evidencias.length}</span>)</span>
                  </h4>
                  <span className="text-xs text-[#5B616E]">
                    Fotos de cuadernos, exámenes, proyectos y citatorios
                  </span>
                </div>

                {evidencias.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {evidencias.map((evi) => (
                      <div 
                        key={evi.id} 
                        className="border border-[#D1D5DB] rounded-xl p-3.5 bg-white flex flex-col justify-between print-break-inside-avoid"
                      >
                        <div>
                          <div className="h-44 bg-[#F9FAFB] rounded-lg overflow-hidden border border-[#D1D5DB] flex items-center justify-center mb-2.5">
                            {evi.url ? (
                              <img 
                                src={evi.url} 
                                alt={evi.titulo} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="text-center p-4 text-[#8A919E]">
                                <FileText className="w-10 h-10 mx-auto mb-1" />
                                <span className="text-xs font-bold text-[#050F1A] block">{evi.tipo || 'Evidencia Registrada'}</span>
                                <span className="text-[11px]">{evi.nombreArchivo || 'Archivo adjunto'}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1 text-xs text-[#5B616E] mb-1">
                            <span className="bg-[#0052FF]/10 text-[#0052FF] font-bold px-2 py-0.5 rounded-[6px]">
                              {evi.materiaNombre}
                            </span>
                            <span className="text-[11px] font-medium">{formatearFechaCompleta(evi.fecha)}</span>
                          </div>

                          <h5 className="font-bold text-[#050F1A] text-sm">{evi.titulo}</h5>
                          {evi.descripcion && (
                            <p className="text-xs text-[#5B616E] mt-0.5">{evi.descripcion}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-[#F9FAFB] rounded-xl border border-dashed border-[#D1D5DB] text-[#8A919E] text-xs">
                    No hay fotografías ni evidencias adjuntas para este alumno todavía.
                  </div>
                )}
              </div>

              {/* Firmas oficiales de conformidad (Condicionales) */}
              {(opcionesImpresion.incluirDocente || opcionesImpresion.incluirTutor || opcionesImpresion.incluirSelloDireccion) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 text-center text-xs print-break-inside-avoid">
                  {opcionesImpresion.incluirDocente && (
                    <div>
                      <div className="border-b border-[#D1D5DB] pb-1.5 mb-2 font-bold text-[#050F1A]">
                        {datos?.docente}
                      </div>
                      <span className="text-[#5B616E]">Docente Titular</span>
                    </div>
                  )}

                  {opcionesImpresion.incluirTutor && (
                    <div>
                      <div className="border-b border-[#D1D5DB] pb-1.5 mb-2 font-bold text-[#050F1A]">
                        {alumno?.tutor || 'Madre / Padre de Familia o Tutor'}
                      </div>
                      <span className="text-[#5B616E]">Firma de Enterado(a)</span>
                    </div>
                  )}

                  {opcionesImpresion.incluirSelloDireccion && (
                    <div>
                      <div className="border-b border-[#D1D5DB] pb-1.5 mb-2 font-bold text-[#050F1A]">
                        Dirección Escolar
                      </div>
                      <span className="text-[#5B616E]">Visto Bueno y Sello</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
