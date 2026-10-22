import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BookOpen, 
  GraduationCap, 
  Users, 
  FolderLock, 
  Settings, 
  AlertTriangle,
  School,
  Sparkles,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShieldCheck,
  StickyNote,
  UserCheck,
  LogOut,
  CircleHelp
} from 'lucide-react';
import { abrirMetaAI } from './MetaAIView';
import { useAuth } from '../AuthGate';
import SelectorTema from './SelectorTema';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  config, 
  periodos, 
  onChangePeriodo, 
  alertasCount,
  sidebarCollapsed,
  setSidebarCollapsed,
  onTriggerMetaBubble,
  onAbrirGuia
}) {
  const { user, cerrarSesion } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // La guía de uso abre/cierra el menú en celular para poder señalar sus opciones
  useEffect(() => {
    const alPedirMenu = (e) => setMobileMenuOpen(Boolean(e.detail?.abrir));
    window.addEventListener('sige:menu', alPedirMenu);
    return () => window.removeEventListener('sige:menu', alPedirMenu);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Tablero & Alertas', icon: LayoutDashboard, badge: alertasCount },
    { id: 'asistencia', label: 'Pase de Lista', icon: CheckSquare },
    { id: 'tareas', label: 'Tareas y Trabajos', icon: BookOpen },
    { id: 'calificaciones', label: 'Calificaciones', icon: GraduationCap },
    { id: 'notas', label: 'Notas de la Maestra', icon: StickyNote },
    { id: 'cte', label: 'Consejo Técnico (CTE)', icon: Users, highlight: true },
    { id: 'evidencias', label: 'Carpeta de Evidencias', icon: FolderLock },
    { id: 'meta-ai', label: 'Asistente Meta AI', icon: Sparkles, isAI: true },
    { id: 'alumnos', label: 'Padrón de Alumnos', icon: UserCheck },
    { id: 'ajustes', label: 'Ajustes y Materias', icon: Settings }
  ];

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  const handleSelectTab = (tabId) => {
    if (tabId === 'meta-ai') {
      // Ejecuta la misma función de abrir la ventana dividida de Meta AI directamente al presionar el módulo
      abrirMetaAI();
      if (onTriggerMetaBubble) onTriggerMetaBubble(true);
    }
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* BARRA MÓVIL / TABLET COMPACTA (Solo visible en pantallas < lg para abrir el Panel Lateral) */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#D1D5DB] px-3 sm:px-4 h-[60px] flex items-center justify-between gap-2 no-print cb-shadow-level-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-11 h-11 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] active:bg-[#F3F4F6] text-[#050F1A] flex items-center justify-center shrink-0 transition"
            aria-label="Abrir panel lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[#050F1A] truncate">
                {activeTabObj.label}
              </span>
              {alertasCount > 0 && (
                <span className="bg-[#FDECEE] text-[#DF2935] font-mono-tabular font-bold text-[11px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  {alertasCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#5B616E] truncate">
              {config?.escuela || 'Telesecundaria'} • <span className="font-mono-tabular font-medium">{config?.grado} "{config?.grupo}"</span>
            </p>
          </div>
        </div>

        {/* Selector rápido de periodo o botón de abrir panel en móvil */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#F3F4F6] text-[#5B616E] font-mono-tabular">
            {config?.periodoActivo}
          </span>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="px-3 h-9 rounded-lg bg-[#0052FF] hover:bg-[#003ECB] text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <span>Menú</span>
          </button>
        </div>
      </div>

      {/* OVERLAY PARA MÓVIL / TABLET CUANDO EL PANEL LATERAL ESTÁ ABIERTO */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-[#050F1A]/50 backdrop-blur-[2px] z-40 lg:hidden transition-opacity no-print"
        />
      )}

      {/* PANEL LATERAL UNIFICADO (Móvil, Tablet y Laptop/Desktop) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-[#D1D5DB] flex flex-col justify-between transition-all duration-300 ease-in-out no-print cb-shadow-level-2 lg:cb-shadow-level-1 ${
          mobileMenuOpen ? 'translate-x-0 w-[290px] sm:w-[310px]' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-[80px]' : 'lg:w-[280px]'}`}
      >
        {/* SECCIÓN SUPERIOR DEL PANEL: IDENTIDAD ESCOLAR Y CONTEXTO */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Cabecera del Panel Lateral */}
          <div className="h-[64px] px-4 border-b border-[#D1D5DB] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#0052FF] text-white flex items-center justify-center shrink-0 shadow-xs">
                <School className="w-5 h-5" />
              </div>
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div className="min-w-0">
                  <h1 className="font-bold text-sm text-[#050F1A] truncate leading-tight">
                    {config?.escuela || 'SIGE-Tele'}
                  </h1>
                  <p className="text-[11px] text-[#5B616E] font-mono-tabular truncate mt-0.5">
                    CCT: {config?.cct || 'S/D'} • Z:{config?.zona || '-'}
                  </p>
                </div>
              )}
            </div>

            {/* Botón cerrar en móvil */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden w-10 h-10 rounded-lg text-[#5B616E] hover:text-[#050F1A] hover:bg-[#F9FAFB] flex items-center justify-center shrink-0"
              aria-label="Cerrar panel lateral"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Botón colapsar/expandir en Laptop/Desktop */}
            <button
              onClick={() => setSidebarCollapsed && setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex w-8 h-8 rounded-lg border border-[#D1D5DB] text-[#5B616E] hover:text-[#050F1A] hover:border-[#0052FF] items-center justify-center shrink-0 transition"
              title={sidebarCollapsed ? 'Expandir panel lateral' : 'Compactar panel lateral'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Tarjeta de Datos de Grupo y Selector de Periodo dentro del Panel Lateral */}
          {(!sidebarCollapsed || mobileMenuOpen) ? (
            <div className="p-3.5 border-b border-[#D1D5DB] bg-[#F9FAFB] space-y-2.5 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#8A919E] block">
                    Grado y Grupo
                  </span>
                  <span className="text-xs font-bold text-[#050F1A] font-mono-tabular">
                    {config?.grado} "{config?.grupo}"
                  </span>
                </div>
                <div className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#8A919E] block">
                    Ciclo Escolar
                  </span>
                  <span className="text-xs font-bold text-[#050F1A] font-mono-tabular">
                    {config?.ciclo}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#5B616E] flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0052FF]" />
                  <span>Periodo de Evaluación Activo</span>
                </label>
                <select data-tour="nav-periodo"
                  value={config?.periodoActivo || ''}
                  onChange={(e) => onChangePeriodo(e.target.value)}
                  className="w-full min-h-[40px] bg-white border border-[#D1D5DB] focus:border-[#0052FF] focus:outline-none rounded-lg px-3 py-1.5 text-xs font-bold text-[#050F1A] transition cursor-pointer"
                >
                  {periodos?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="py-3 border-b border-[#D1D5DB] bg-[#F9FAFB] flex flex-col items-center gap-1.5 shrink-0">
              <span className="px-2 py-1 rounded-md bg-white border border-[#D1D5DB] text-[11px] font-bold font-mono-tabular text-[#0052FF]" title={`Grupo ${config?.grado} "${config?.grupo}"`}>
                {config?.grado}{config?.grupo}
              </span>
            </div>
          )}

          {/* LISTA DE NAVEGACIÓN EN EL PANEL LATERAL */}
          <nav data-tour="nav-menu" className="flex-1 overflow-y-auto p-3 space-y-1">
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#8A919E]">
                Módulos del Sistema
              </div>
            )}

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const showFull = !sidebarCollapsed || mobileMenuOpen;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  title={!showFull ? tab.label : undefined}
                  className={`w-full min-h-[44px] flex items-center ${
                    showFull ? 'justify-between px-3' : 'justify-center px-2'
                  } py-2 rounded-lg text-[13px] sm:text-[14px] font-medium transition-all group relative ${
                    isActive
                      ? 'bg-[#0052FF] text-white font-bold shadow-xs'
                      : 'text-[#5B616E] hover:bg-[#F9FAFB] hover:text-[#050F1A]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive
                          ? 'text-white'
                          : tab.highlight
                          ? 'text-[#F0AD4E] group-hover:text-[#050F1A]'
                          : tab.isAI
                          ? 'text-[#0052FF]'
                          : 'text-[#8A919E] group-hover:text-[#050F1A]'
                      }`}
                    />
                    {showFull && (
                      <span className="truncate text-left">{tab.label}</span>
                    )}
                  </div>

                  {showFull && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tab.isAI && (
                        <span
                          className={`text-[10px] font-mono-tabular font-bold px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[#0052FF]/10 text-[#0052FF]'
                          }`}
                        >
                          IA
                        </span>
                      )}

                      {tab.badge > 0 && (
                        <span
                          className={`font-mono-tabular text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isActive
                              ? 'bg-white text-[#DF2935]'
                              : 'bg-[#FDECEE] text-[#DF2935]'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {!showFull && tab.badge > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#DF2935] ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SECCIÓN INFERIOR DEL PANEL LATERAL: DOCENTE Y ESTADO */}
        <div className="p-3 border-t border-[#D1D5DB] bg-[#F9FAFB] shrink-0">
          {(!sidebarCollapsed || mobileMenuOpen) ? (
            <div className="space-y-2">
              <div className="px-1 flex items-center justify-between text-[11px] text-[#5B616E]">
                <span className="flex items-center gap-1.5 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#05B169] shrink-0" />
                  <span className="truncate font-medium text-[#050F1A]">{config?.docente || user?.email || 'Docente Titular'}</span>
                </span>
                <span className="font-mono-tabular text-[10px] text-[#8A919E] shrink-0">v2.1</span>
              </div>
              <SelectorTema />
              <button
                onClick={() => { onAbrirGuia?.(); setMobileMenuOpen(false); }}
                className="w-full min-h-[36px] px-2 rounded-lg text-xs font-bold text-[#0052FF] bg-[#E8F0FF] hover:bg-[#D6E4FF] transition flex items-center justify-center gap-1.5"
              >
                <CircleHelp className="w-3.5 h-3.5" />
                <span>Guía de uso</span>
              </button>
              <button
                onClick={cerrarSesion}
                className="w-full min-h-[36px] px-2 rounded-lg text-xs font-bold text-[#5B616E] hover:bg-[#FDECEE] hover:text-[#DF2935] transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <SelectorTema variante="icono" className="w-full" />
              <button
                onClick={() => onAbrirGuia?.()}
                title="Guía de uso"
                className="w-full min-h-[36px] flex items-center justify-center rounded-lg text-[#0052FF] hover:bg-[#E8F0FF] transition"
              >
                <CircleHelp className="w-4 h-4" />
              </button>
              <button
                onClick={cerrarSesion}
                title="Cerrar sesión"
                className="w-full min-h-[36px] flex items-center justify-center rounded-lg text-[#5B616E] hover:bg-[#FDECEE] hover:text-[#DF2935] transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
