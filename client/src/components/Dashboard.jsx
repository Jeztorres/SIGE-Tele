import React, { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  BookOpen, 
  FolderLock, 
  FileText,
  ArrowRight
} from 'lucide-react';

export default function Dashboard({ 
  semaforoData, 
  onNavigateTab, 
  onOpenExpediente 
}) {
  const [filtroSemaforo, setFiltroSemaforo] = useState('todos');

  const resumen = semaforoData?.resumen || {
    totalAlumnos: 0,
    enVerde: 0,
    enAmarillo: 0,
    enRojo: 0,
    promedioGrupal: 0,
    asistenciaGrupal: 0,
    cumplimientoTareasGrupal: 0
  };

  const alertasCriticas = semaforoData?.alertasCriticas || [];
  const alumnos = semaforoData?.alumnos || [];

  const alumnosFiltrados = alumnos.filter(item => {
    if (filtroSemaforo === 'todos') return true;
    if (filtroSemaforo === 'alertas') return item.alertas.tresFaltas || item.alertas.tresTareas;
    return item.semaforo === filtroSemaforo;
  });

  const renderSemaforoChip = (semaforo) => {
    if (semaforo === 'rojo') {
      return (
        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-[13px] font-medium bg-[#FDECEE] text-[#DF2935]">
          <span className="w-2 h-2 rounded-full bg-[#DF2935] animate-pulse"></span>
          Necesita Apoyo
        </span>
      );
    }
    if (semaforo === 'amarillo') {
      return (
        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-[13px] font-medium bg-[#FEF6E7] text-[#B87514]">
          <span className="w-2 h-2 rounded-full bg-[#F0AD4E]"></span>
          En Riesgo Leve
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-[13px] font-medium bg-[#E6F6EF] text-[#05B169]">
        <span className="w-2 h-2 rounded-full bg-[#05B169]"></span>
        Va Bien
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. PANCARTA DE ALERTAS CRÍTICAS TEMPRANAS (3 FALTAS O 3 TAREAS SEGUIDAS) */}
      {alertasCriticas.length > 0 ? (
        <div data-tour="dash-alertas" className="bg-white rounded-xl p-4 sm:p-5 border-2 border-[#DF2935] cb-shadow-level-1">
          <div className="flex flex-col sm:flex-row items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#FDECEE] text-[#DF2935] flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-[#050F1A]">
                    Alerta Temprana de Riesgo Escolar
                  </h3>
                  <span className="bg-[#FDECEE] text-[#DF2935] text-xs px-2.5 py-0.5 rounded-[6px] font-mono-tabular font-bold">
                    {alertasCriticas.length} caso{alertasCriticas.length > 1 ? 's' : ''} prioritario{alertasCriticas.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-xs text-[#5B616E] bg-[#F3F4F6] px-2.5 py-1 rounded-[6px] font-medium">
                  Regla de 3 incidencias consecutivas
                </span>
              </div>
              <p className="text-sm text-[#5B616E] mt-1">
                El sistema detectó alumnos con 3 faltas seguidas o 3 tareas continuas sin entregar. Intervén a tiempo para prevenir rezago en el CTE.
              </p>

              {/* Lista de tarjetas de alerta */}
              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertasCriticas.map((alerta, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[#050F1A] text-sm flex items-center gap-2 flex-wrap">
                        {alerta.tipo === 'FALTAS' ? (
                          <span className="bg-[#FDECEE] text-[#DF2935] text-[11px] font-mono-tabular font-bold px-2 py-0.5 rounded">
                            3+ FALTAS
                          </span>
                        ) : (
                          <span className="bg-[#FEF6E7] text-[#B87514] text-[11px] font-mono-tabular font-bold px-2 py-0.5 rounded">
                            3+ TAREAS
                          </span>
                        )}
                        <span className="truncate">{alerta.nombre}</span>
                      </div>
                      <p className="text-[#5B616E] text-xs mt-1">{alerta.mensaje}</p>
                    </div>

                    <button data-tour="dash-expediente"
                      onClick={() => onOpenExpediente(alerta.alumnoId)}
                      className="min-h-[40px] sm:min-h-[36px] shrink-0 bg-white hover:bg-[#F9FAFB] text-[#050F1A] border border-[#D1D5DB] hover:border-[#0052FF] font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                      title="Ver expediente y evidencias"
                    >
                      <FolderLock className="w-3.5 h-3.5 text-[#0052FF]" />
                      <span>Expediente</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div data-tour="dash-alertas" className="cb-card p-4 flex items-center gap-3 border-l-4 border-l-[#05B169]">
          <div className="w-9 h-9 rounded-lg bg-[#E6F6EF] text-[#05B169] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm text-[#050F1A]">
            <span className="font-bold text-[#05B169]">Todo en orden:</span> Ningún alumno presenta alertas críticas de 3 faltas continuas ni 3 tareas sin entregar en este momento.
          </p>
        </div>
      )}

      {/* 2. TARJETAS DE INDICADORES GLOBALES (KPIs con JetBrains Mono) */}
      <div data-tour="dash-kpis" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Promedio General */}
        <div className="cb-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A919E] uppercase tracking-[0.06em]">
              Promedio Grupal
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-[#050F1A] font-mono-tabular mt-1">
              {resumen.promedioGrupal}
            </div>
            <span className="text-xs text-[#5B616E] block mt-1">
              Escala oficial SEP (5 a 10)
            </span>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#E6F6EF] text-[#05B169] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Asistencia */}
        <div className="cb-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A919E] uppercase tracking-[0.06em]">
              Asistencia
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-[#050F1A] font-mono-tabular mt-1">
              {resumen.asistenciaGrupal}%
            </div>
            <span className="text-xs text-[#5B616E] block mt-1">
              Meta mínima: 85%
            </span>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#F3F4F6] text-[#050F1A] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Tareas */}
        <div className="cb-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A919E] uppercase tracking-[0.06em]">
              Cumplimiento Tareas
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-[#050F1A] font-mono-tabular mt-1">
              {resumen.cumplimientoTareasGrupal}%
            </div>
            <span className="text-xs text-[#5B616E] block mt-1">
              Evaluación formativa
            </span>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#F3F4F6] text-[#050F1A] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Total Alumnos */}
        <div className="cb-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A919E] uppercase tracking-[0.06em]">
              Matrícula Activa
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-[#050F1A] font-mono-tabular mt-1">
              {resumen.totalAlumnos}
            </div>
            <span className="text-xs text-[#5B616E] block mt-1">
              Estudiantes registrados
            </span>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#F3F4F6] text-[#5B616E] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SEMÁFORO ESCOLAR (VERDE / AMARILLO / ROJO) */}
      <div data-tour="dash-semaforo" className="cb-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#D1D5DB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#050F1A]">
              Semáforo de Desempeño y Riesgo
            </h2>
            <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">
              Calculado en automático según faltas, entregas y calificaciones del periodo activo.
            </p>
          </div>

          {/* Filtros rápidos del semáforo con botones de buen tamaño táctil */}
          <div data-tour="dash-filtros" className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setFiltroSemaforo('todos')}
              className={`min-h-[38px] px-3 py-1.5 text-xs rounded-lg font-bold transition whitespace-nowrap ${
                filtroSemaforo === 'todos'
                  ? 'bg-[#0052FF] text-white'
                  : 'bg-[#F3F4F6] text-[#5B616E] hover:text-[#050F1A]'
              }`}
            >
              Todos (<span className="font-mono-tabular">{resumen.totalAlumnos}</span>)
            </button>
            <button
              onClick={() => setFiltroSemaforo('verde')}
              className={`min-h-[38px] px-3 py-1.5 text-xs rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                filtroSemaforo === 'verde'
                  ? 'bg-[#05B169] text-white'
                  : 'bg-[#E6F6EF] text-[#05B169] hover:opacity-90'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${filtroSemaforo === 'verde' ? 'bg-white' : 'bg-[#05B169]'}`}></span>
              Verdes (<span className="font-mono-tabular">{resumen.enVerde}</span>)
            </button>
            <button
              onClick={() => setFiltroSemaforo('amarillo')}
              className={`min-h-[38px] px-3 py-1.5 text-xs rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                filtroSemaforo === 'amarillo'
                  ? 'bg-[#F0AD4E] text-[#050F1A]'
                  : 'bg-[#FEF6E7] text-[#B87514] hover:opacity-90'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#F0AD4E]"></span>
              Amarillos (<span className="font-mono-tabular">{resumen.enAmarillo}</span>)
            </button>
            <button
              onClick={() => setFiltroSemaforo('rojo')}
              className={`min-h-[38px] px-3 py-1.5 text-xs rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                filtroSemaforo === 'rojo'
                  ? 'bg-[#DF2935] text-white'
                  : 'bg-[#FDECEE] text-[#DF2935] hover:opacity-90'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${filtroSemaforo === 'rojo' ? 'bg-white' : 'bg-[#DF2935]'}`}></span>
              Rojos (<span className="font-mono-tabular">{resumen.enRojo}</span>)
            </button>
            {alertasCriticas.length > 0 && (
              <button
                onClick={() => setFiltroSemaforo('alertas')}
                className={`min-h-[38px] px-3 py-1.5 text-xs rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  filtroSemaforo === 'alertas'
                    ? 'bg-[#DF2935] text-white ring-2 ring-[#DF2935]/30'
                    : 'bg-[#FDECEE] text-[#DF2935]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Alertas (<span className="font-mono-tabular">{alertasCriticas.length}</span>)
              </button>
            )}
          </div>
        </div>

        {/* 4A. VISTA DE TARJETAS PARA TELÉFONOS MÓVILES (< md) */}
        <div data-tour="dash-lista" className="md:hidden divide-y divide-[#D1D5DB]">
          {alumnosFiltrados.map((item) => {
            const { alumno, asistencia, tareas, calificaciones, semaforo, causasRiesgo, alertas } = item;
            return (
              <div key={alumno.id} className="p-4 space-y-3 hover:bg-[#F9FAFB]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[#F3F4F6] text-[#5B616E] font-mono-tabular font-bold text-xs flex items-center justify-center shrink-0">
                      {alumno.noLista}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#050F1A] text-sm truncate">{alumno.nombre}</h4>
                      <p className="text-xs text-[#5B616E] truncate">
                        Tutor: {alumno.tutor || 'No registrado'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {renderSemaforoChip(semaforo)}
                  </div>
                </div>

                {/* Métricas en cuadrícula de 3 columnas con JetBrains Mono */}
                <div className="grid grid-cols-3 gap-2 bg-[#F9FAFB] p-2.5 rounded-lg border border-[#D1D5DB]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8A919E] block">Asistencia</span>
                    <span className={`font-mono-tabular font-bold text-sm ${
                      asistencia.porcentaje < 70 ? 'text-[#DF2935]' : asistencia.porcentaje < 85 ? 'text-[#B87514]' : 'text-[#05B169]'
                    }`}>
                      {asistencia.porcentaje}%
                    </span>
                    <span className="text-[10px] text-[#5B616E] block font-mono-tabular">{asistencia.faltas} faltas</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8A919E] block">Tareas</span>
                    <span className={`font-mono-tabular font-bold text-sm ${
                      tareas.porcentaje < 60 ? 'text-[#DF2935]' : tareas.porcentaje < 80 ? 'text-[#B87514]' : 'text-[#05B169]'
                    }`}>
                      {tareas.porcentaje}%
                    </span>
                    <span className="text-[10px] text-[#5B616E] block font-mono-tabular">{tareas.noEntregadas} sin ent.</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#8A919E] block">Promedio</span>
                    <span className={`font-mono-tabular font-bold text-base ${
                      calificaciones.promedio < 6.0 ? 'text-[#DF2935]' : calificaciones.promedio < 7.0 ? 'text-[#B87514]' : 'text-[#050F1A]'
                    }`}>
                      {calificaciones.promedio}
                    </span>
                    <span className="text-[10px] text-[#5B616E] block">SEP</span>
                  </div>
                </div>

                {/* Alertas y botón de expediente */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {alertas.tresFaltas && (
                      <span className="bg-[#FDECEE] text-[#DF2935] font-bold text-[11px] px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 3+ faltas
                      </span>
                    )}
                    {alertas.tresTareas && (
                      <span className="bg-[#FEF6E7] text-[#B87514] font-bold text-[11px] px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 3+ tareas
                      </span>
                    )}
                    {causasRiesgo.length > 0 && !alertas.tresFaltas && !alertas.tresTareas && (
                      <span className="text-xs text-[#5B616E] truncate">{causasRiesgo.join(' • ')}</span>
                    )}
                    {causasRiesgo.length === 0 && (
                      <span className="text-xs text-[#05B169] font-medium">Sin incidencias</span>
                    )}
                  </div>

                  <button data-tour="dash-expediente"
                    onClick={() => onOpenExpediente(alumno.id)}
                    className="min-h-[40px] px-3 py-1.5 bg-white hover:bg-[#0052FF] hover:text-white text-[#050F1A] border border-[#D1D5DB] hover:border-[#0052FF] rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                  >
                    <FolderLock className="w-3.5 h-3.5" />
                    <span>Expediente</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4B. TABLA DE DATOS CRYPTO BLUE PARA TABLET Y LAPTOP (hidden md:block) */}
        <div data-tour="dash-lista" className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#D1D5DB] text-[#8A919E] font-medium uppercase tracking-[0.06em] text-[12px]">
                <th className="py-3 px-4 w-14 text-center">No.</th>
                <th className="py-3 px-4">Alumno</th>
                <th className="py-3 px-4 text-center">Semáforo</th>
                <th className="py-3 px-4 text-right">Asistencia</th>
                <th className="py-3 px-4 text-right">Tareas</th>
                <th className="py-3 px-4 text-right">Promedio</th>
                <th className="py-3 px-4">Diagnóstico / Alertas</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D5DB]">
              {alumnosFiltrados.map((item) => {
                const { alumno, asistencia, tareas, calificaciones, semaforo, causasRiesgo, alertas } = item;

                return (
                  <tr 
                    key={alumno.id} 
                    className="h-[64px] hover:bg-[#F9FAFB] transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono-tabular font-medium text-[#5B616E] text-sm">
                      {alumno.noLista}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#050F1A] text-sm">
                        {alumno.nombre}
                      </div>
                      <div className="text-xs text-[#5B616E]">
                        Tutor: {alumno.tutor || 'No registrado'} {alumno.telefono ? `• ${alumno.telefono}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderSemaforoChip(semaforo)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`font-mono-tabular font-medium text-sm ${
                        asistencia.porcentaje < 70 ? 'text-[#DF2935]' : asistencia.porcentaje < 85 ? 'text-[#B87514]' : 'text-[#05B169]'
                      }`}>
                        {asistencia.porcentaje}%
                      </div>
                      <div className="text-[11px] text-[#5B616E] font-mono-tabular">
                        {asistencia.faltas} falta{asistencia.faltas !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`font-mono-tabular font-medium text-sm ${
                        tareas.porcentaje < 60 ? 'text-[#DF2935]' : tareas.porcentaje < 80 ? 'text-[#B87514]' : 'text-[#05B169]'
                      }`}>
                        {tareas.porcentaje}%
                      </div>
                      <div className="text-[11px] text-[#5B616E] font-mono-tabular">
                        {tareas.noEntregadas} sin entregar
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono-tabular text-base font-bold ${
                        calificaciones.promedio < 6.0 ? 'text-[#DF2935]' : calificaciones.promedio < 7.0 ? 'text-[#B87514]' : 'text-[#050F1A]'
                      }`}>
                        {calificaciones.promedio}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {alertas.tresFaltas && (
                          <span className="bg-[#FDECEE] text-[#DF2935] font-bold text-xs px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            3 faltas seguidas
                          </span>
                        )}
                        {alertas.tresTareas && (
                          <span className="bg-[#FEF6E7] text-[#B87514] font-bold text-xs px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            3 tareas sin entregar
                          </span>
                        )}
                        {causasRiesgo.length > 0 && !alertas.tresFaltas && !alertas.tresTareas && (
                          <span className="text-xs text-[#5B616E]">
                            {causasRiesgo.join(' • ')}
                          </span>
                        )}
                        {causasRiesgo.length === 0 && (
                          <span className="text-xs text-[#05B169] font-medium">
                            Sin incidencias
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button data-tour="dash-expediente"
                        onClick={() => onOpenExpediente(alumno.id)}
                        className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 bg-white hover:bg-[#0052FF] hover:text-white text-[#050F1A] border border-[#D1D5DB] hover:border-[#0052FF] rounded-lg text-xs font-bold transition"
                      >
                        <FolderLock className="w-3.5 h-3.5" />
                        <span>Expediente</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ACCESOS DIRECTOS DOCENTES RÁPIDOS */}
      <div data-tour="dash-accesos" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigateTab('asistencia')}
          className="cb-card-interactive p-5 cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#E6F6EF] text-[#05B169] rounded-xl flex items-center justify-center group-hover:bg-[#0052FF] group-hover:text-white transition shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#050F1A] text-sm">Pase de Lista Hoy</h4>
              <p className="text-xs text-[#5B616E]">Marcar presentes con 1 clic</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A919E] group-hover:text-[#0052FF] group-hover:translate-x-1 transition shrink-0" />
        </div>

        <div 
          onClick={() => onNavigateTab('cte')}
          className="cb-card-interactive p-5 cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#FEF6E7] text-[#B87514] rounded-xl flex items-center justify-center group-hover:bg-[#0052FF] group-hover:text-white transition shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#050F1A] text-sm">Reporte para el CTE</h4>
              <p className="text-xs text-[#5B616E]">Generar formato oficial para sesión</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A919E] group-hover:text-[#0052FF] group-hover:translate-x-1 transition shrink-0" />
        </div>

        <div 
          onClick={() => onNavigateTab('evidencias')}
          className="cb-card-interactive p-5 cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#0052FF]/10 text-[#0052FF] rounded-xl flex items-center justify-center group-hover:bg-[#0052FF] group-hover:text-white transition shrink-0">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#050F1A] text-sm">Subir Evidencias</h4>
              <p className="text-xs text-[#5B616E]">Asignar fotografías a alumnos</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A919E] group-hover:text-[#0052FF] group-hover:translate-x-1 transition shrink-0" />
        </div>
      </div>
    </div>
  );
}
