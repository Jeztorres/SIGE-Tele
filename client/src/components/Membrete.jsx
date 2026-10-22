import React from 'react';
import { unirMembrete, MEMBRETE_DEFAULT } from '../membrete';

// Encabezado oficial de los documentos. Lo usan el reporte del CTE, el expediente
// del alumno y la vista previa del editor, así que se ven siempre igual.
//
// items: [{ etiqueta, valor, tipo }]  tipo: 'normal' | 'mono' | 'azul'
export default function Membrete({ titulo, membrete, items = [] }) {
  const m = unirMembrete(membrete);
  const hayLogos = Boolean(m.logoIzq || m.logoDer);
  const colorPorDefecto = m.color === MEMBRETE_DEFAULT.color;

  const estiloLinea = colorPorDefecto ? undefined : { borderBottomColor: m.color };
  const claseValor = {
    normal: 'text-[#050F1A]',
    mono: 'font-mono-tabular text-[#050F1A]',
    azul: 'font-mono-tabular text-[#0052FF]'
  };

  return (
    <div
      className={`border-b-2 pb-4 mb-6 text-center ${colorPorDefecto ? 'border-[#050F1A]' : ''}`}
      style={estiloLinea}
    >
      <div className="flex items-center justify-between gap-3">
        {hayLogos && (
          <div className="w-14 sm:w-20 shrink-0 flex justify-start">
            {m.logoIzq && <img src={m.logoIzq} alt="Logo izquierdo" data-sin-filtro className="max-h-14 sm:max-h-20 w-auto object-contain rounded bg-white p-0.5" style={{ backgroundColor: '#FFFFFF' }} />}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {m.encabezado && (
            <div className="text-[11px] font-bold tracking-[0.06em] text-[#5B616E] uppercase">{m.encabezado}</div>
          )}
          <h1 className="text-base sm:text-xl font-bold text-[#050F1A] uppercase mt-1">{titulo}</h1>
          {m.lema && <div className="text-xs italic text-[#5B616E] mt-0.5">{m.lema}</div>}
        </div>

        {hayLogos && (
          <div className="w-14 sm:w-20 shrink-0 flex justify-end">
            {m.logoDer && <img src={m.logoDer} alt="Logo derecho" data-sin-filtro className="max-h-14 sm:max-h-20 w-auto object-contain rounded bg-white p-0.5" style={{ backgroundColor: '#FFFFFF' }} />}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-center gap-x-3 gap-y-1 flex-wrap text-xs text-[#5B616E] mt-2">
          {items.map((it, i) => (
            <React.Fragment key={it.etiqueta}>
              {i > 0 && <span className="hidden sm:inline">•</span>}
              <span>
                {it.etiqueta}: <b className={claseValor[it.tipo || 'normal']}>{it.valor}</b>
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {m.pie && <div className="text-[11px] text-[#5B616E] mt-2 whitespace-pre-line">{m.pie}</div>}
    </div>
  );
}
