// Genera src/tema-oscuro.css: el modo oscuro de la app.
//
// La app usa una paleta pequeña de colores escritos directamente en las clases
// (por ejemplo bg-[#F9FAFB], text-[#050F1A]). Este script recorre el código, encuentra
// cada una de esas clases y genera su equivalente oscuro. Solo aplica en pantalla:
// al imprimir, los reportes siguen saliendo en blanco.
//
// Uso:  npm run tema        (volver a correrlo si se agregan colores nuevos a las clases)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(aqui, '../src');
const SALIDA = path.join(SRC, 'tema-oscuro.css');

// ── Colores equivalentes en modo oscuro ─────────────────────────────────────
const FONDO = {
  '#FFFFFF': '#121C2F', // tarjetas y paneles
  '#F9FAFB': '#0C1424', // fondo de la página y zonas internas
  '#F3F4F6': '#1A2540',
  '#E5E7EB': '#25314D',
  '#D1D5DB': '#2E3B58',
  '#FDECEE': 'rgba(223, 41, 53, 0.16)',
  '#FEF6E7': 'rgba(240, 173, 78, 0.14)',
  '#E6F6EF': 'rgba(5, 177, 105, 0.15)',
  '#E8F0FF': 'rgba(0, 82, 255, 0.22)',
  '#F5F8FF': 'rgba(0, 82, 255, 0.12)',
  '#D6E4FF': 'rgba(0, 82, 255, 0.32)',
  '#003ECB': '#2E70FF'
  // #0052FF, #DF2935, #05B169 y #F0AD4E como fondo se quedan igual
};

const TEXTO = {
  '#050F1A': '#E8EDF7',
  '#5B616E': '#A5AFC4',
  '#8A919E': '#7C88A3',
  '#0052FF': '#6AA2FF',
  '#DF2935': '#FF6E78',
  '#05B169': '#3DD598',
  '#B87514': '#F2B654',
  '#F0AD4E': '#F5B95F',
  '#04784A': '#5EEAB0',
  '#003ECB': '#8DB4FF'
};

const BORDE = {
  '#D1D5DB': '#2E3B58',
  '#E5E7EB': '#2E3B58',
  '#F3F4F6': '#1F2A44',
  '#8A919E': '#52607F',
  '#0052FF': '#3F82FF',
  '#DF2935': '#F0525C',
  '#050F1A': '#5F6F8F',
  '#F5C2C7': 'rgba(223, 41, 53, 0.45)',
  '#A8E6C9': 'rgba(5, 177, 105, 0.45)'
};

// propiedad CSS y tabla de colores según el tipo de clase de Tailwind
const TIPOS = {
  bg: { prop: ['background-color'], mapa: FONDO },
  text: { prop: ['color'], mapa: TEXTO },
  border: { prop: ['border-color'], mapa: BORDE },
  'border-l': { prop: ['border-left-color'], mapa: BORDE },
  'border-r': { prop: ['border-right-color'], mapa: BORDE },
  'border-t': { prop: ['border-top-color'], mapa: BORDE },
  'border-b': { prop: ['border-bottom-color'], mapa: BORDE },
  ring: { prop: ['--tw-ring-color'], mapa: BORDE },
  outline: { prop: ['outline-color'], mapa: BORDE },
  fill: { prop: ['fill'], mapa: TEXTO },
  stroke: { prop: ['stroke'], mapa: TEXTO },
  divide: { prop: ['border-color'], mapa: BORDE, divide: true }
};

// ── Recorrer el código y reunir las clases ─────────────────────────────────
function archivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return archivos(p);
    return /\.(jsx?|html)$/.test(d.name) ? [p] : [];
  });
}

const re =
  /(?<![A-Za-z0-9_\[\]:\/-])((?:[a-z][a-z-]*:)*)(bg|text|border-[lrtb]|border|ring|divide|outline|fill|stroke)-(\[#[0-9A-Fa-f]{6}\]|white)(?![A-Za-z0-9_\/\[-])/g;

const clases = new Map(); // clase completa → { variantes, tipo, hex }
const sinMapa = new Set();
const variantesDesconocidas = new Set();

for (const f of archivos(SRC)) {
  const texto = fs.readFileSync(f, 'utf8');
  for (const m of texto.matchAll(re)) {
    const [completa, prefijo, tipo, valor] = m;
    const hex = valor === 'white' ? '#FFFFFF' : valor.slice(1, -1).toUpperCase();
    if (valor === 'white' && tipo !== 'bg') continue; // text-white, border-white... se quedan blancos
    const variantes = prefijo ? prefijo.slice(0, -1).split(':') : [];
    if (variantes.includes('print')) continue;
    const def = TIPOS[tipo];
    if (!def.mapa[hex]) {
      sinMapa.add(`${tipo}-${valor}`);
      continue;
    }
    clases.set(completa, { variantes, tipo, hex });
  }
}

// ── Construir los selectores ───────────────────────────────────────────────
const esc = (s) => s.replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
const PSEUDO_CLASE = { hover: ':hover', focus: ':focus', active: ':active', 'focus-within': ':focus-within', disabled: ':disabled' };
const PSEUDO_ELEMENTO = { placeholder: '::placeholder', file: '::file-selector-button' };

function selector(clase, variantes, divide) {
  let base = `.${esc(clase)}`;
  let prefijoGrupo = '';
  let pseudoClases = '';
  let pseudoElementos = '';
  for (const v of variantes) {
    if (v === 'group-hover') prefijoGrupo = '.group:hover ';
    else if (PSEUDO_CLASE[v]) pseudoClases += PSEUDO_CLASE[v];
    else if (PSEUDO_ELEMENTO[v]) pseudoElementos += PSEUDO_ELEMENTO[v];
    else {
      variantesDesconocidas.add(v);
      return null;
    }
  }
  const suf = divide ? ' > :not(:last-child)' : '';
  return `html.dark ${prefijoGrupo}${base}${pseudoClases}${suf}${pseudoElementos}`;
}

const reglas = [];
for (const [clase, { variantes, tipo, hex }] of [...clases.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const def = TIPOS[tipo];
  const sel = selector(clase, variantes, def.divide);
  if (!sel) continue;
  const valor = def.mapa[hex];
  reglas.push(`${sel} { ${def.prop.map((p) => `${p}: ${valor}`).join('; ')}; }`);
}

// ── Reglas base escritas a mano ────────────────────────────────────────────
const BASE = `
html.dark {
  color-scheme: dark;
  background-color: #0A101D;
  color: #E8EDF7;
}
html.dark body { background-color: #0A101D; color: #E8EDF7; }
html.dark h1, html.dark h2, html.dark h3, html.dark h4, html.dark h5, html.dark h6 { color: #E8EDF7; }

html.dark .cb-card,
html.dark .cb-card-interactive {
  background-color: #121C2F;
  border-color: #2E3B58;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
html.dark .cb-card-interactive:hover { border-color: #3F82FF; }
html.dark .cb-shadow-level-1 { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45); }
html.dark .cb-shadow-level-2 { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); }
html.dark .cb-shadow-level-3 { box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6); }

html.dark .cb-input { background-color: #0C1424; border-color: #2E3B58; color: #E8EDF7; }
html.dark .cb-input:focus { border-color: #3F82FF; box-shadow: 0 0 0 4px rgba(63, 130, 255, 0.2); }
html.dark .cb-search-wrapper { border-color: #2E3B58; background-color: #0C1424; }
html.dark .cb-search-wrapper:focus-within {
  background-color: #121C2F;
  border-color: #3F82FF;
  box-shadow: 0 0 0 4px rgba(63, 130, 255, 0.2);
}
html.dark .cb-search-input { color: #E8EDF7; }
html.dark .cb-search-input::placeholder { color: #7C88A3; }

html.dark .cb-btn-primary:hover:not(:disabled) { background-color: #2E70FF; }
html.dark .cb-btn-secondary { background-color: #121C2F; color: #E8EDF7; border-color: #2E3B58; }
html.dark .cb-btn-secondary:hover:not(:disabled) { background-color: #1A2540; border-color: #52607F; }

html.dark input::placeholder,
html.dark textarea::placeholder { color: #6F7B96; }
html.dark select option { background-color: #121C2F; color: #E8EDF7; }
html.dark ::selection { background-color: #1F4FBF; color: #FFFFFF; }
html.dark ::-webkit-scrollbar { background: #0C1424; }
html.dark ::-webkit-scrollbar-thumb { background: #2E3B58; border-radius: 8px; }

/* Texto oscuro sobre fondos de colores vivos (p. ej. botón "Retardo" en ámbar) */
html.dark .bg-\\[\\#F0AD4E\\].text-\\[\\#050F1A\\] { color: #050F1A; }

/* Fotos y logos: ligeramente atenuados para no deslumbrar */
html.dark img:not([data-sin-filtro]) { filter: brightness(0.92); }
`;

const salida = `/* ARCHIVO GENERADO por scripts/generar-tema-oscuro.mjs — no editar a mano. Ejecuta: npm run tema */
@media screen {
${BASE}
${reglas.join('\n')}
}
`;

fs.writeFileSync(SALIDA, salida, 'utf8');
console.log(`Modo oscuro generado: ${reglas.length} reglas → ${path.relative(process.cwd(), SALIDA)}`);
if (sinMapa.size) console.log('Colores sin equivalente oscuro (se quedan como están):', [...sinMapa].join(', '));
if (variantesDesconocidas.size) console.log('Variantes no soportadas (omitidas):', [...variantesDesconocidas].join(', '));
