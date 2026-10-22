import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTema } from '../tema';

const OPCIONES = [
  { id: 'claro', Icono: Sun, etiqueta: 'Claro' },
  { id: 'oscuro', Icono: Moon, etiqueta: 'Oscuro' },
  { id: 'auto', Icono: Monitor, etiqueta: 'Auto' }
];

// variante "barra": tres botones (Claro / Oscuro / Auto). variante "icono": un botón que va rotando.
export default function SelectorTema({ variante = 'barra', className = '' }) {
  const { modo, elegir } = useTema();

  if (variante === 'icono') {
    const actual = OPCIONES.find((o) => o.id === modo) || OPCIONES[2];
    const siguiente = OPCIONES[(OPCIONES.findIndex((o) => o.id === modo) + 1) % OPCIONES.length];
    const Icono = actual.Icono;
    return (
      <button
        type="button"
        onClick={() => elegir(siguiente.id)}
        title={`Tema: ${actual.etiqueta}. Toca para cambiar a ${siguiente.etiqueta}.`}
        aria-label={`Tema ${actual.etiqueta}. Cambiar a ${siguiente.etiqueta}`}
        className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#5B616E] hover:bg-[#F3F4F6] hover:text-[#050F1A] transition ${className}`}
      >
        <Icono className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      data-tour="nav-tema"
      role="radiogroup"
      aria-label="Tema de color"
      className={`grid grid-cols-3 gap-1 bg-[#F3F4F6] p-1 rounded-lg ${className}`}
    >
      {OPCIONES.map(({ id, Icono, etiqueta }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={modo === id}
          onClick={() => elegir(id)}
          className={`min-h-[32px] rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition ${
            modo === id ? 'bg-white text-[#0052FF] cb-shadow-level-1' : 'text-[#5B616E] hover:text-[#050F1A]'
          }`}
        >
          <Icono className="w-3.5 h-3.5" />
          <span>{etiqueta}</span>
        </button>
      ))}
    </div>
  );
}
