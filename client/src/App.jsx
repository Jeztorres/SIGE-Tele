import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Asistencia from './components/Asistencia';
import Tareas from './components/Tareas';
import Calificaciones from './components/Calificaciones';
import NotasDocente from './components/NotasDocente';
import ModuloCTE from './components/ModuloCTE';
import Evidencias from './components/Evidencias';
import AlumnosConfig from './components/AlumnosConfig';
import ModalExpediente from './components/ModalExpediente';
import GuiaMenu from './components/GuiaMenu';
import TourGuiado from './components/TourGuiado';
import { construirRecorrido } from './tourPasos';
import { useAuth } from './AuthGate';
import { supabase } from './supabase';
import MetaAIView, { abrirMetaAI } from './components/MetaAIView';
import { fetchConfig, updateConfig, fetchAlumnos, fetchSemaforo } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prevTab, setPrevTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [config, setConfig] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [semaforoData, setSemaforoData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [expedienteAlumnoId, setExpedienteAlumnoId] = useState(null);
  const { user } = useAuth();
  const [menuGuia, setMenuGuia] = useState(null); // null | 'bienvenida' | 'menu'
  const [tour, setTour] = useState(null);

  const handleSetTab = (newTab) => {
    if (newTab !== 'meta-ai') {
      setPrevTab(newTab);
    }
    setActiveTab(newTab);
  };

  // Carga general de datos iniciales
  const cargarDatos = async () => {
    try {
      const [configData, alumnosData] = await Promise.all([
        fetchConfig(),
        fetchAlumnos()
      ]);
      setConfig(configData.config);
      setPeriodos(configData.periodos);
      setMaterias(configData.materias);
      setAlumnos(alumnosData);

      // Cargar semáforo con el periodo activo
      if (configData.config?.periodoActivo) {
        const semData = await fetchSemaforo(configData.config.periodoActivo);
        setSemaforoData(semData);
      }
    } catch (err) {
      console.error('Error cargando datos principales:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // La guía se ofrece sola la primera vez que el maestro entra
  useEffect(() => {
    if (!cargando && user && !user.user_metadata?.tour_visto) {
      setMenuGuia('bienvenida');
    }
  }, [cargando, user]);

  const marcarGuiaVista = () => {
    if (user && !user.user_metadata?.tour_visto) {
      supabase?.auth.updateUser({ data: { tour_visto: true } }).catch(() => {});
    }
  };

  const cerrarMenuGuia = () => {
    setMenuGuia(null);
    marcarGuiaVista();
  };

  const elegirRecorrido = (idModulo) => {
    setMenuGuia(null);
    marcarGuiaVista();
    setTour({ pasos: construirRecorrido(idModulo) });
  };

  // Notificar a Electron del cambio de pestaña si aplica
  useEffect(() => {
    if (window.electron?.setTab) {
      window.electron.setTab(activeTab);
    }
  }, [activeTab]);

  // Cambiar periodo activo
  const handleCambiarPeriodo = async (nuevoPeriodo) => {
    try {
      await updateConfig({ periodoActivo: nuevoPeriodo });
      setConfig(prev => ({ ...prev, periodoActivo: nuevoPeriodo }));
      const semData = await fetchSemaforo(nuevoPeriodo);
      setSemaforoData(semData);
    } catch (err) {
      console.error('Error cambiando periodo:', err);
    }
  };

  // Recargar configuración, materias, alumnos y análisis de inmediato cuando cambian datos
  const handleDataChange = async (immediateConfig) => {
    if (immediateConfig && typeof immediateConfig === 'object' && immediateConfig.escuela) {
      setConfig(immediateConfig);
    }
    try {
      const [configData, alumnosData] = await Promise.all([
        fetchConfig(),
        fetchAlumnos()
      ]);
      setConfig(configData.config);
      setPeriodos(configData.periodos);
      setMaterias(configData.materias);
      setAlumnos(alumnosData);

      const perActivo = configData.config?.periodoActivo || config?.periodoActivo;
      if (perActivo) {
        const semData = await fetchSemaforo(perActivo);
        setSemaforoData(semData);
      }
    } catch (err) {
      console.error('Error recargando datos:', err);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center text-[#050F1A] p-6">
        <div className="cb-card p-8 flex flex-col items-center max-w-sm w-full text-center">
          <div className="w-11 h-11 border-3 border-[#0052FF] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="font-bold text-lg text-[#050F1A]">Iniciando SIGE-Tele</h2>
          <p className="text-xs text-[#5B616E] mt-1">
            Sincronizando base de datos escolar offline...
          </p>
        </div>
      </div>
    );
  }

  const alertasCriticasCount = semaforoData?.alertasCriticas?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#050F1A] relative">
      {/* Panel Lateral Unificado (Móvil, Tablet y Laptop/Desktop) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        config={config}
        periodos={periodos}
        onChangePeriodo={handleCambiarPeriodo}
        alertasCount={alertasCriticasCount}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onAbrirGuia={() => setMenuGuia('menu')}
      />

      {/* Contenedor Principal desplazado según el Panel Lateral en Laptop/Desktop */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[280px]'
        }`}
      >
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20">
          {activeTab === 'dashboard' && (
            <Dashboard
              semaforoData={semaforoData}
              onNavigateTab={handleSetTab}
              onOpenExpediente={(id) => setExpedienteAlumnoId(id)}
            />
          )}

          {activeTab === 'asistencia' && (
            <Asistencia
              alumnos={alumnos}
              config={config}
              onDataChange={handleDataChange}
              semaforoData={semaforoData}
            />
          )}

          {activeTab === 'tareas' && (
            <Tareas
              alumnos={alumnos}
              materias={materias}
              config={config}
              onDataChange={handleDataChange}
              semaforoData={semaforoData}
            />
          )}

          {activeTab === 'calificaciones' && (
            <Calificaciones
              alumnos={alumnos}
              materias={materias}
              config={config}
              periodos={periodos}
              onDataChange={handleDataChange}
            />
          )}

          {activeTab === 'notas' && (
            <NotasDocente
              alumnos={alumnos}
            />
          )}

          {activeTab === 'cte' && (
            <ModuloCTE
              config={config}
              onOpenExpediente={(id) => setExpedienteAlumnoId(id)}
            />
          )}

          {activeTab === 'evidencias' && (
            <Evidencias
              alumnos={alumnos}
              materias={materias}
              config={config}
              onOpenExpediente={(id) => setExpedienteAlumnoId(id)}
            />
          )}

          {activeTab === 'meta-ai' && (
            <MetaAIView
              onCloseFullScreen={() => setActiveTab(prevTab || 'dashboard')}
            />
          )}

          {activeTab === 'alumnos' && (
            <AlumnosConfig
              mode="alumnos"
              alumnos={alumnos}
              config={config}
              periodos={periodos}
              materias={materias}
              onDataChange={handleDataChange}
            />
          )}

          {activeTab === 'ajustes' && (
            <AlumnosConfig
              mode="ajustes"
              alumnos={alumnos}
              config={config}
              periodos={periodos}
              materias={materias}
              onDataChange={handleDataChange}
            />
          )}
        </main>

        {/* Footer minimalista no imprimible */}
        <footer className="bg-white border-t border-[#D1D5DB] py-3.5 text-center text-xs text-[#5B616E] no-print mt-auto">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <span>Sistema de Gestión y Alerta Temprana para Telesecundarias • Docente: <b className="text-[#050F1A]">{config?.docente}</b></span>
            <span className="text-[#8A919E] font-mono-tabular">
              Ciclo {config?.ciclo} • {config?.escuela}
            </span>
          </div>
        </footer>
      </div>

      {/* BURBUJA FLOTANTE "META AI" CUANDO SE ESTÁ VIENDO EN PANTALLA COMPLETA (FUERA DEL MÓDULO META AI) */}
      {activeTab !== 'meta-ai' && (
        <button
          onClick={() => {
            if (!abrirMetaAI()) {
              setActiveTab('meta-ai');
            }
          }}
          title="Abrir Asistente Meta AI"
          className="fixed bottom-5 right-5 z-40 bg-[#0052FF] hover:bg-[#003ECB] text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-full cb-shadow-level-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 no-print border-2 border-white"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Meta AI</span>
          <span className="w-2 h-2 rounded-full bg-[#05B169] ring-2 ring-white" />
        </button>
      )}

      {menuGuia && (
        <GuiaMenu bienvenida={menuGuia === 'bienvenida'} onElegir={elegirRecorrido} onCerrar={cerrarMenuGuia} />
      )}
      {tour && <TourGuiado pasos={tour.pasos} onCerrar={() => setTour(null)} onIrTab={handleSetTab} />}

      {/* Modal de Expediente Individual / Carpeta de Evidencias */}
      {expedienteAlumnoId && (
        <ModalExpediente
          alumnoId={expedienteAlumnoId}
          onClose={() => setExpedienteAlumnoId(null)}
        />
      )}
    </div>
  );
}
