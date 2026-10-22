import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, X, PartyPopper } from 'lucide-react';

const MARGEN = 12;
const ESPERA_MAX_MS = 2500;

// Primer elemento con ese data-tour que esté realmente visible en pantalla
// (la app tiene vistas distintas para celular y computadora con el mismo nombre).
function buscarVisible(nombre) {
  const lista = document.querySelectorAll(`[data-tour="${nombre}"]`);
  for (const el of lista) {
    const r = el.getBoundingClientRect();
    const visibleH = r.right > 0 && r.left < window.innerWidth;
    if (r.width > 0 && r.height > 0 && visibleH) return el;
  }
  return null;
}

const esCelular = () => window.innerWidth < 640;

export default function TourGuiado({ pasos, onCerrar, onIrTab }) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null); // rectángulo del elemento resaltado
  const [buscando, setBuscando] = useState(true);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tarjetaRef = useRef(null);
  const elRef = useRef(null);
  const direccion = useRef(1);

  const paso = pasos[idx];
  const total = pasos.length;
  const esUltimo = idx === total - 1;

  const ir = useCallback(
    (nuevo) => {
      if (nuevo < 0) return;
      if (nuevo >= total) {
        onCerrar(true);
        return;
      }
      direccion.current = nuevo >= idx ? 1 : -1;
      setIdx(nuevo);
    },
    [idx, total, onCerrar]
  );

  // Al terminar el recorrido se cierra el menú lateral del celular
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('sige:menu', { detail: { abrir: false } }));
    };
  }, []);

  // Preparar el paso: cambiar de pantalla, abrir menú, dar clic previo y localizar el elemento
  useEffect(() => {
    let cancelado = false;
    let temporizador = null;
    elRef.current = null;
    setRect(null);
    setBuscando(true);

    if (paso.tab) onIrTab(paso.tab);
    if (window.innerWidth < 1024) {
      window.dispatchEvent(new CustomEvent('sige:menu', { detail: { abrir: Boolean(paso.menuMovil) } }));
    }

    if (!paso.target) {
      setBuscando(false);
      return undefined;
    }

    const inicio = Date.now();
    let clicHecho = !paso.clic;

    const intentar = () => {
      if (cancelado) return;

      if (!clicHecho) {
        const btn = buscarVisible(paso.clic);
        if (btn) {
          btn.click();
          clicHecho = true;
        }
      }

      const el = clicHecho ? buscarVisible(paso.target) : null;
      if (el) {
        elRef.current = el;
        // Llevar el elemento a una zona visible (arriba si hay hoja inferior en celular)
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const reservado = esCelular() ? 300 : 0;
        const fueraDeVista = r.top < 70 || r.bottom > vh - reservado - 16;
        const enPanelFijo = getComputedStyle(el).position === 'fixed' || !!el.closest('aside');
        if (fueraDeVista && !enPanelFijo) {
          const destino = esCelular() ? 84 : Math.max(84, (vh - Math.min(r.height, vh - 200)) / 2 - 60);
          window.scrollTo({ top: window.scrollY + r.top - destino, behavior: 'smooth' });
        }
        setBuscando(false);
        return;
      }

      if (Date.now() - inicio > ESPERA_MAX_MS) {
        setBuscando(false);
        if (paso.opcional) {
          // No existe en pantalla (p. ej. aún no hay tareas): se salta el paso
          if (direccion.current >= 0) ir(idx + 1);
          else if (idx > 0) ir(idx - 1);
          else ir(idx + 1);
        }
        return;
      }
      temporizador = setTimeout(intentar, 100);
    };

    temporizador = setTimeout(intentar, paso.tab || paso.clic ? 250 : 0);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Mantener el recuadro pegado al elemento aunque se haga scroll, cambie el tamaño o se anime
  useEffect(() => {
    let raf;
    const medir = () => {
      const el = elRef.current;
      if (el && el.isConnected) {
        const r = el.getBoundingClientRect();
        setRect((prev) =>
          prev &&
          Math.abs(prev.top - r.top) < 0.5 &&
          Math.abs(prev.left - r.left) < 0.5 &&
          Math.abs(prev.width - r.width) < 0.5 &&
          Math.abs(prev.height - r.height) < 0.5
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height }
        );
      } else if (paso.target) {
        // El elemento tardó en aparecer (o se volvió a dibujar): se vuelve a buscar solo
        const encontrado = buscarVisible(paso.target);
        if (encontrado) {
          elRef.current = encontrado;
          setBuscando(false);
        }
      }
      raf = requestAnimationFrame(medir);
    };
    raf = requestAnimationFrame(medir);
    return () => cancelAnimationFrame(raf);
  }, [paso.target]);

  // Colocar la tarjeta de explicación junto al elemento sin salirse de la pantalla
  useLayoutEffect(() => {
    const tarjeta = tarjetaRef.current;
    if (!tarjeta) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const W = tarjeta.offsetWidth;
    const H = tarjeta.offsetHeight;

    if (esCelular() || !rect) {
      setPos({ top: -1, left: -1 }); // -1: la tarjeta usa su posición fija (abajo / centro)
      return;
    }

    const pad = 8;
    const centroX = rect.left + rect.width / 2 - W / 2;
    const limitarX = (x) => Math.min(Math.max(MARGEN, x), vw - W - MARGEN);
    const limitarY = (y) => Math.min(Math.max(MARGEN, y), vh - H - MARGEN);

    let top;
    let left;
    if (rect.top + rect.height + pad + H + MARGEN <= vh) {
      top = rect.top + rect.height + pad + 4;
      left = limitarX(centroX);
    } else if (rect.top - pad - H - MARGEN >= 0) {
      top = rect.top - pad - H - 4;
      left = limitarX(centroX);
    } else if (rect.left + rect.width + pad + W + MARGEN <= vw) {
      left = rect.left + rect.width + pad + 4;
      top = limitarY(rect.top + rect.height / 2 - H / 2);
    } else if (rect.left - pad - W - MARGEN >= 0) {
      left = rect.left - pad - W - 4;
      top = limitarY(rect.top + rect.height / 2 - H / 2);
    } else {
      // Elemento muy grande: la tarjeta flota abajo, encima de él
      top = vh - H - 24;
      left = limitarX(centroX);
    }
    setPos({ top, left });
  }, [rect, idx, buscando]);

  // Teclado: Esc sale, flechas navegan
  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === 'Escape') onCerrar(false);
      else if (e.key === 'ArrowRight') ir(idx + 1);
      else if (e.key === 'ArrowLeft') ir(idx - 1);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [idx, ir, onCerrar]);

  const centrado = paso.centrado || !paso.target || (!buscando && !rect);
  const Icono = paso.icono;
  const celular = esCelular();

  const estiloTarjeta = centrado
    ? {}
    : celular
    ? {}
    : pos.top >= 0
    ? { top: pos.top, left: pos.left }
    : { visibility: 'hidden' };

  const clasePosicion = celular
    ? 'left-0 right-0 bottom-0 rounded-t-3xl'
    : centrado
    ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl'
    : 'rounded-2xl';

  return (
    <div className="fixed inset-0 z-[90] no-print" role="dialog" aria-modal="true" aria-label="Guía de uso">
      <style>{`@keyframes tourEntra{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      {/* Capa que bloquea clics en la app mientras dura el recorrido */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Recuadro resaltado: el resto de la pantalla se oscurece con una sombra gigante */}
      {rect && !paso.centrado ? (
        <div
          className="absolute pointer-events-none rounded-xl transition-all duration-200 ease-out"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(5,15,26,0.62), 0 0 0 3px #0052FF, 0 0 24px 4px rgba(0,82,255,0.45)'
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#050F1A]/60 pointer-events-none" />
      )}

      {/* Tarjeta explicativa */}
      <div
        ref={tarjetaRef}
        className={`fixed bg-white border border-[#D1D5DB] cb-shadow-level-3 flex flex-col ${clasePosicion}`}
        style={{
          width: celular ? undefined : 'min(360px, calc(100vw - 24px))',
          maxHeight: celular ? '48vh' : 'calc(100vh - 24px)',
          animation: 'tourEntra .22s ease-out',
          ...estiloTarjeta
        }}
        key={idx}
      >
        <div className="h-1 bg-[#F3F4F6] shrink-0 rounded-t-2xl overflow-hidden">
          <div className="h-full bg-[#0052FF] transition-all duration-300" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0052FF] bg-[#E8F0FF] rounded-full px-2.5 py-1 min-w-0">
              {paso.centrado ? <PartyPopper className="w-3.5 h-3.5 shrink-0" /> : Icono && <Icono className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{paso.modulo}</span>
            </span>
            <button
              onClick={() => onCerrar(false)}
              className="flex items-center gap-1 text-xs font-bold text-[#5B616E] hover:text-[#050F1A] min-h-[32px] px-1.5 shrink-0"
              aria-label="Salir de la guía"
            >
              Salir <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3 className="font-bold text-base sm:text-lg text-[#050F1A] leading-snug">{paso.titulo}</h3>
          <p className="text-sm text-[#5B616E] mt-1.5 leading-relaxed">{paso.texto}</p>

          {paso.target && !buscando && !rect && (
            <p className="mt-2 text-xs text-[#B87514] bg-[#FEF6E7] rounded-lg px-2.5 py-1.5">
              Este elemento aún no aparece en pantalla (por ejemplo, porque todavía no tienes datos). Aparecerá cuando lo uses.
            </p>
          )}
        </div>

        <div className="px-4 sm:px-5 pb-4 pt-1 shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-[#8A919E]">
              {idx + 1} de {total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => ir(idx - 1)}
              disabled={idx === 0}
              className="cb-btn-secondary text-sm flex items-center justify-center gap-1.5 px-3.5 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
            <button onClick={() => ir(idx + 1)} className="cb-btn-primary text-sm flex-1 flex items-center justify-center gap-1.5">
              <span>{esUltimo ? 'Terminar' : 'Siguiente'}</span>
              {esUltimo ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
