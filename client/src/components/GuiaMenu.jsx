import React from 'react';
import { Sparkles, X, PlayCircle, ChevronRight } from 'lucide-react';
import { MODULOS, contarPasos } from '../tourPasos';

// Ventana para elegir qué recorrido ver: todo, o un módulo en particular.
export default function GuiaMenu({ bienvenida, onElegir, onCerrar }) {
  const pasosTotal = contarPasos('todo');

  return (
    <div
      className="fixed inset-0 z-[80] bg-[#050F1A]/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-label="Guía de uso"
    >
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl cb-shadow-level-3 border border-[#D1D5DB] max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#E8F0FF] text-[#0052FF] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#050F1A] leading-tight">
                {bienvenida ? '¡Bienvenido(a) a SIGE-Tele!' : 'Guía de uso'}
              </h2>
              <p className="text-xs sm:text-sm text-[#5B616E] mt-0.5">
                {bienvenida
                  ? 'Te enseño la app señalando cada botón. Elige cómo prefieres aprender.'
                  : '¿Qué quieres repasar? Te voy señalando cada botón en pantalla.'}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="w-9 h-9 rounded-lg text-[#5B616E] hover:bg-[#F3F4F6] flex items-center justify-center shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-4 overflow-y-auto space-y-3">
          <button
            onClick={() => onElegir('todo')}
            className="w-full text-left rounded-xl bg-[#0052FF] hover:bg-[#003ECB] text-white p-4 flex items-center gap-3 transition"
          >
            <PlayCircle className="w-9 h-9 shrink-0" />
            <span className="flex-1">
              <span className="block font-bold text-sm sm:text-base">Recorrido completo</span>
              <span className="block text-xs text-white/80">
                Todos los módulos, uno por uno · {pasosTotal} pasos · unos 4 minutos
              </span>
            </span>
            <ChevronRight className="w-5 h-5 shrink-0" />
          </button>

          <p className="text-[11px] font-bold text-[#8A919E] tracking-wide pt-1">O ELIGE UN MÓDULO</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODULOS.map((m) => {
              const Icono = m.icono;
              return (
                <button
                  key={m.id}
                  onClick={() => onElegir(m.id)}
                  className="text-left rounded-xl border border-[#D1D5DB] hover:border-[#0052FF] hover:bg-[#F5F8FF] p-3 flex items-center gap-3 transition"
                >
                  <span className="w-9 h-9 rounded-lg bg-[#E8F0FF] text-[#0052FF] flex items-center justify-center shrink-0">
                    <Icono className="w-4.5 h-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-sm text-[#050F1A] truncate">{m.titulo}</span>
                    <span className="block text-[11px] text-[#5B616E] truncate">
                      {m.descripcion} · {m.pasos.length} pasos
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#F3F4F6] shrink-0 flex justify-end">
          <button onClick={onCerrar} className="text-xs font-bold text-[#5B616E] hover:text-[#050F1A] min-h-[36px] px-3">
            {bienvenida ? 'Ahora no, lo veo después' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
