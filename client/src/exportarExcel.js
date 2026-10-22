// Exportación de calificaciones a un libro de Excel (.xlsx) real, con fórmulas vivas,
// semáforo automático, estadísticas y boleta individual con selector de alumno.
// Si el docente corrige una calificación dentro del Excel, todo se recalcula solo.

import { unirMembrete } from './membrete';

// Paleta (misma identidad visual que la app)
const C = {
  navy: 'FF050F1A',
  navy2: 'FF0B1F3A',
  blue: 'FF0052FF',
  blueSoft: 'FFE8F0FF',
  zebra: 'FFF6F8FC',
  grid: 'FFDCE1EA',
  gray: 'FF5B616E',
  grayLight: 'FFF3F4F6',
  white: 'FFFFFFFF',
  green: 'FF05B169',
  greenSoft: 'FFE3F7EE',
  greenDark: 'FF04784A',
  teal: 'FF0E9F9A',
  tealSoft: 'FFE2F5F4',
  amber: 'FFB87514',
  amberSoft: 'FFFEF3DC',
  red: 'FFDF2935',
  redSoft: 'FFFDE7EA',
  gold: 'FFD4A017',
  input: 'FFFFF8E1'
};

const FONT = 'Segoe UI';

const colLetter = (n) => {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const cfFill = (argb) => ({ type: 'pattern', pattern: 'solid', bgColor: { argb } });
const thin = (argb = C.grid) => ({ style: 'thin', color: { argb } });
const allBorders = (argb = C.grid) => ({ top: thin(argb), left: thin(argb), bottom: thin(argb), right: thin(argb) });
const font = (opts = {}) => ({ name: FONT, size: 10, color: { argb: C.navy }, ...opts });

// Fórmula de texto de nivel de desempeño a partir de una celda numérica
const nivelFormula = (ref) =>
  `IF(NOT(ISNUMBER(${ref})),"SIN CAPTURA",IF(${ref}>=9,"EXCELENTE",IF(${ref}>=7,"APROBATORIO",IF(${ref}>=6,"EN OBSERVACIÓN","REPROBATORIO"))))`;

// Barra de desempeño dibujada con caracteres (funciona en cualquier versión de Excel)
const barraFormula = (ref, max = 10, ancho = 10) =>
  `IF(ISNUMBER(${ref}),REPT("█",ROUND(${ref}/${max}*${ancho},0))&REPT("░",${ancho}-ROUND(${ref}/${max}*${ancho},0)),"")`;

// Banda de título reutilizable para cada hoja
// Ancho aproximado de una columna en píxeles (Excel: caracteres → px)
const anchoColPx = (ws, c) => (ws.getColumn(c).width || 8.43) * 7 + 5;

// Coloca el logo del membrete dentro de la banda del título (a la izquierda o a la derecha)
function colocarLogo(ws, wb, dataUrl, ratio, lado, desde, hasta, altoPx) {
  const m = /^data:image\/(png|jpe?g|gif);base64,/i.exec(dataUrl || '');
  if (!m) return;
  const extension = m[1].toLowerCase().replace('jpg', 'jpeg');
  const id = wb.addImage({ base64: dataUrl, extension });
  const anchoPx = Math.max(10, altoPx * (ratio || 1));
  const filaTop = 1 + (56 - altoPx * 0.75) / 56 / 2; // centrado en la fila 2 (zero-based: 1)

  let x = 8; // píxeles desde el borde izquierdo de la banda
  if (lado === 'der') {
    let total = 0;
    for (let c = desde; c <= hasta; c++) total += anchoColPx(ws, c);
    x = Math.max(8, total - anchoPx - 10);
  }
  let acumulado = 0;
  let col = desde - 1;
  for (let c = desde; c <= hasta; c++) {
    const w = anchoColPx(ws, c);
    if (x < acumulado + w) {
      col = c - 1 + (x - acumulado) / w;
      break;
    }
    acumulado += w;
  }
  ws.addImage(id, { tl: { col, row: filaTop }, ext: { width: anchoPx, height: altoPx }, editAs: 'oneCell' });
}

function bandaTitulo(ws, desde, hasta, titulo, subtitulo, wb, mem) {
  const L1 = colLetter(desde);
  const L2 = colLetter(hasta);
  const tieneLogos = Boolean(mem && (mem.logoIzq || mem.logoDer));
  const acento = mem && mem.color && mem.color !== '#050F1A' ? `FF${mem.color.replace('#', '').toUpperCase()}` : C.blue;

  // Fila 1: franja de color con el encabezado superior del membrete
  const encabezado = (mem?.encabezado || '').trim();
  ws.getRow(1).height = encabezado ? 18 : 6;
  ws.mergeCells(`${L1}1:${L2}1`);
  const f1 = ws.getCell(`${L1}1`);
  f1.fill = fill(acento);
  if (encabezado) {
    f1.value = encabezado.toUpperCase();
    f1.font = font({ size: 8, bold: true, color: { argb: C.white } });
    f1.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  ws.getRow(2).height = tieneLogos ? 44 : 40;
  ws.mergeCells(`${L1}2:${L2}2`);
  const t = ws.getCell(`${L1}2`);
  t.value = titulo;
  t.font = font({ size: 20, bold: true, color: { argb: C.white } });
  t.fill = fill(C.navy);
  t.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.getRow(3).height = 22;
  ws.mergeCells(`${L1}3:${L2}3`);
  const s = ws.getCell(`${L1}3`);
  s.value = mem?.lema ? `${subtitulo}  •  ${mem.lema}` : subtitulo;
  s.font = font({ size: 10, bold: true, color: { argb: 'FFBFD3FF' } });
  s.fill = fill(C.navy2);
  s.alignment = { vertical: 'middle', horizontal: 'center' };

  if (tieneLogos && wb) {
    if (mem.logoIzq) colocarLogo(ws, wb, mem.logoIzq, mem.logoIzqRatio, 'izq', desde, hasta, 46);
    if (mem.logoDer) colocarLogo(ws, wb, mem.logoDer, mem.logoDerRatio, 'der', desde, hasta, 46);
  }
}

// Reparte `total` columnas (a partir de `inicio`) en `partes` bloques contiguos
function repartir(inicio, total, partes) {
  partes = Math.max(1, Math.min(partes, total));
  const bloques = [];
  const base = Math.floor(total / partes);
  let extra = total % partes;
  let c = inicio;
  for (let i = 0; i < partes; i++) {
    const ancho = base + (extra-- > 0 ? 1 : 0);
    bloques.push([c, c + ancho - 1]);
    c += ancho;
  }
  return bloques;
}

// Tarjeta tipo "KPI": etiqueta pequeña arriba, valor grande abajo
function tarjeta(ws, fila, [c1, c2], etiqueta, valor, { color = C.blue, numFmt } = {}) {
  const L1 = colLetter(c1);
  const L2 = colLetter(c2);
  const borde = { style: 'medium', color: { argb: C.white } };

  if (c1 !== c2) ws.mergeCells(`${L1}${fila}:${L2}${fila}`);
  const e = ws.getCell(`${L1}${fila}`);
  e.value = etiqueta;
  e.font = font({ size: 8, bold: true, color: { argb: C.white } });
  e.fill = fill(color);
  e.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  e.border = { left: borde, right: borde, top: borde };

  if (c1 !== c2) ws.mergeCells(`${L1}${fila + 1}:${L2}${fila + 1}`);
  const v = ws.getCell(`${L1}${fila + 1}`);
  v.value = valor;
  v.font = font({ size: 18, bold: true, color: { argb: color } });
  v.fill = fill(C.white);
  v.alignment = { vertical: 'middle', horizontal: 'center' };
  v.border = { left: borde, right: borde, bottom: { style: 'thick', color: { argb: color } } };
  if (numFmt) v.numFmt = numFmt;
}

// Bloque de firma: línea, nombre y cargo
function firma(ws, fila, [c1, c2], nombre, cargo) {
  const L1 = colLetter(c1);
  const L2 = colLetter(c2);
  ws.mergeCells(`${L1}${fila}:${L2}${fila}`);
  ws.getCell(`${L1}${fila}`).border = { bottom: { style: 'thin', color: { argb: C.navy } } };
  ws.mergeCells(`${L1}${fila + 1}:${L2}${fila + 1}`);
  const n = ws.getCell(`${L1}${fila + 1}`);
  n.value = nombre;
  n.font = font({ bold: true });
  n.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(`${L1}${fila + 2}:${L2}${fila + 2}`);
  const r = ws.getCell(`${L1}${fila + 2}`);
  r.value = cargo;
  r.font = font({ size: 8, color: { argb: C.gray } });
  r.alignment = { horizontal: 'center', vertical: 'middle' };
}

// Recuadro punteado para el sello oficial
function sello(ws, fila, [c1, c2], escuela, cct) {
  const L1 = colLetter(c1);
  const L2 = colLetter(c2);
  ws.mergeCells(`${L1}${fila - 2}:${L2}${fila + 2}`);
  const s = ws.getCell(`${L1}${fila - 2}`);
  s.value = `SELLO OFICIAL\n${escuela}\nC.C.T. ${cct}`;
  s.font = font({ size: 8, bold: true, color: { argb: 'FF9AA3B2' } });
  s.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const d = { style: 'dashed', color: { argb: 'FF9AA3B2' } };
  s.border = { top: d, left: d, bottom: d, right: d };
}

// Reglas de semáforo para un rango de calificaciones
// (solo celdas numéricas: las vacías o "—" no se colorean)
function semaforo(ws, ref, prioridadBase = 1) {
  const x = ref.split(':')[0];
  const regla = (cond, fondo, color, p) => ({
    type: 'expression', formulae: [`AND(ISNUMBER(${x}),${cond.replace(/X/g, x)})`], priority: p,
    style: { fill: cfFill(fondo), font: { color: { argb: color }, bold: true } }
  });
  ws.addConditionalFormatting({
    ref,
    rules: [
      regla('X<6', C.redSoft, C.red, prioridadBase),
      regla('X<7', C.amberSoft, C.amber, prioridadBase + 1),
      regla('X>=9', C.greenSoft, C.greenDark, prioridadBase + 2)
    ]
  });
}

// Colores para celdas con texto de nivel (EXCELENTE, REPROBATORIO...)
function semaforoTexto(ws, ref, celdaRel, prioridadBase = 1) {
  const regla = (texto, fondo, color, p) => ({
    type: 'expression', formulae: [`${celdaRel}="${texto}"`], priority: p,
    style: { fill: cfFill(fondo), font: { color: { argb: color }, bold: true } }
  });
  ws.addConditionalFormatting({
    ref,
    rules: [
      regla('REPROBATORIO', C.redSoft, C.red, prioridadBase),
      regla('EN OBSERVACIÓN', C.amberSoft, C.amber, prioridadBase + 1),
      regla('EXCELENTE', C.greenSoft, C.greenDark, prioridadBase + 2),
      regla('APROBATORIO', C.tealSoft, C.teal, prioridadBase + 3)
    ]
  });
}

// Colorea la barra de desempeño según el valor de referencia
function semaforoBarra(ws, ref, celdaRel, prioridadBase = 1) {
  const regla = (cond, color, p) => ({
    type: 'expression', formulae: [cond], priority: p, style: { font: { color: { argb: color } } }
  });
  ws.addConditionalFormatting({
    ref,
    rules: [
      regla(`AND(ISNUMBER(${celdaRel}),${celdaRel}<6)`, C.red, prioridadBase),
      regla(`AND(ISNUMBER(${celdaRel}),${celdaRel}<7)`, C.amber, prioridadBase + 1),
      regla(`AND(ISNUMBER(${celdaRel}),${celdaRel}>=9)`, C.green, prioridadBase + 2)
    ]
  });
}

// En los encabezados/pies de Excel el signo & se escribe && y no se admiten saltos de línea
function limpiarPieExcel(texto) {
  return String(texto).split('&').join('&&').split(String.fromCharCode(13)).join(' ').split(String.fromCharCode(10)).join(' ');
}

function configurarImpresion(ws, { horizontal = true, tituloFilas, escuela, pie }) {
  ws.pageSetup = {
    paperSize: 1, // Carta
    orientation: horizontal ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.3 },
    ...(tituloFilas ? { printTitlesRow: tituloFilas } : {})
  };
  ws.headerFooter = {
    oddFooter: `&L&8${limpiarPieExcel([escuela, pie].filter(Boolean).join(' • '))}&C&8Página &P de &N&R&8Generado el &D`
  };
}

export async function exportarCalificacionesExcel({ alumnos, materias, notas, config, opciones }) {
  const { default: ExcelJS } = await import('exceljs');

  const op = {
    incluirDatosEscuela: true,
    incluirNombreDocente: true,
    incluirFirmaDirector: true,
    incluirSelloEscolar: true,
    incluirEstatus: true,
    incluirEstadisticas: true,
    incluirBoleta: true,
    ...opciones
  };

  const escuela = config?.escuela || '';
  const cct = config?.cct || '';
  const periodo = config?.periodoActivo || '';
  const grupoTxt = `${config?.grado || ''} "${config?.grupo || ''}"`;
  const docente = config?.docente || 'Docente Titular';
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const SHEET = 'Concentrado';
  const REF = `'${SHEET}'!`;

  const mem = unirMembrete(config?.membrete);
  const wb = new ExcelJS.Workbook();
  wb.creator = docente;
  wb.company = escuela;
  wb.title = `Calificaciones ${periodo}`;
  wb.created = new Date();

  // ────────────────────────────────────────────────────────────────
  // HOJA 1: CONCENTRADO
  // ────────────────────────────────────────────────────────────────
  const ws = wb.addWorksheet(SHEET, {
    properties: { tabColor: { argb: C.blue }, defaultRowHeight: 20 },
    views: [{ showGridLines: false }]
  });

  const nM = materias.length;
  const cNo = 1;
  const cNombre = 2;
  const cMat0 = 3;
  const cProm = cMat0 + nM;
  const cLugar = cProm + 1;
  const cEstatus = op.incluirEstatus ? cLugar + 1 : null;
  const cBarra = (cEstatus || cLugar) + 1;
  const lastVisible = cBarra;
  // Columnas auxiliares ocultas (desempate de ranking y datos para la boleta)
  const cOrden = lastVisible + 1;
  const cCurp = cOrden + 1;
  const cTutor = cCurp + 1;
  const cRiesgo = cTutor + 1;

  const L = colLetter;
  ws.getColumn(cNo).width = 6;
  ws.getColumn(cNombre).width = 36;
  for (let i = 0; i < nM; i++) ws.getColumn(cMat0 + i).width = 15;
  ws.getColumn(cProm).width = 12;
  ws.getColumn(cLugar).width = 8;
  if (cEstatus) ws.getColumn(cEstatus).width = 18;
  ws.getColumn(cBarra).width = 18;
  [cOrden, cCurp, cTutor, cRiesgo].forEach(c => { ws.getColumn(c).hidden = true; });

  bandaTitulo(
    ws, 1, lastVisible,
    'CONCENTRADO DE CALIFICACIONES',
    `${periodo.toUpperCase()}  •  CICLO ESCOLAR ${config?.ciclo || ''}  •  ${grupoTxt}`,
    wb, mem
  );

  let r = 4;
  ws.getRow(r++).height = 8;

  // Ficha de datos de la escuela
  if (op.incluirDatosEscuela || op.incluirNombreDocente) {
    const datos = [];
    if (op.incluirDatosEscuela) {
      datos.push(['ESCUELA', escuela], ['C.C.T.', cct], ['ZONA / SECTOR', `${config?.zona || ''} / ${config?.sector || ''}`], ['GRADO Y GRUPO', grupoTxt]);
    }
    if (op.incluirNombreDocente) datos.push(['DOCENTE', docente]);
    datos.push(['FECHA DE EMISIÓN', fecha]);

    // El nombre de la escuela ocupa A:B, el resto se reparte en las demás columnas
    const bloques = [[1, 2], ...repartir(3, lastVisible - 2, Math.max(1, datos.length - 1))];
    ws.getRow(r).height = 16;
    ws.getRow(r + 1).height = 24;
    datos.forEach(([etq, val], i) => {
      const b = bloques[i];
      if (!b) return;
      const [c1, c2] = b;
      if (c1 !== c2) {
        ws.mergeCells(`${L(c1)}${r}:${L(c2)}${r}`);
        ws.mergeCells(`${L(c1)}${r + 1}:${L(c2)}${r + 1}`);
      }
      const e = ws.getCell(`${L(c1)}${r}`);
      e.value = etq;
      e.font = font({ size: 7, bold: true, color: { argb: C.gray } });
      e.fill = fill(C.grayLight);
      e.alignment = { horizontal: 'left', vertical: 'bottom', indent: 1 };
      const v = ws.getCell(`${L(c1)}${r + 1}`);
      v.value = val;
      v.font = font({ size: 10, bold: true });
      v.fill = fill(C.grayLight);
      v.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, shrinkToFit: true };
      v.border = { bottom: { style: 'medium', color: { argb: C.blue } } };
    });
    r += 2;
    ws.getRow(r++).height = 10;
  }

  const filaKpi = r;
  r += 2;
  const filaLeyenda = r++;
  ws.getRow(r++).height = 8;
  const filaHead = r++;
  const fila0 = r;
  const filaN = fila0 + Math.max(alumnos.length, 1) - 1;
  const rng = (c) => `${L(c)}$${fila0}:${L(c)}$${filaN}`;
  const rngAbs = (c) => `$${L(c)}$${fila0}:$${L(c)}$${filaN}`;
  const promRange = rngAbs(cProm);

  // Tarjetas de indicadores (todas con fórmulas en vivo)
  ws.getRow(filaKpi).height = 18;
  ws.getRow(filaKpi + 1).height = 36;
  const kpis = repartir(1, lastVisible, 4);
  // La primera tarjeta queda sobre No.+Nombre para equilibrar el ancho
  kpis[0] = [1, 2];
  const resto = repartir(3, lastVisible - 2, 3);
  [kpis[1], kpis[2], kpis[3]] = resto;
  tarjeta(ws, filaKpi, kpis[0], 'PROMEDIO GRUPAL', { formula: `IFERROR(ROUND(AVERAGE(${promRange}),1),"—")` }, { color: C.blue, numFmt: '0.0' });
  tarjeta(ws, filaKpi, kpis[1], 'APROBADOS', { formula: `COUNTIF(${promRange},">=6")&" de "&COUNT(${promRange})` }, { color: C.green });
  tarjeta(ws, filaKpi, kpis[2], 'REPROBADOS', { formula: `COUNTIF(${promRange},"<6")` }, { color: C.red });
  tarjeta(ws, filaKpi, kpis[3], '% DE APROBACIÓN', { formula: `IFERROR(COUNTIF(${promRange},">=6")/COUNT(${promRange}),0)` }, { color: C.navy2, numFmt: '0%' });

  // Leyenda del semáforo
  ws.getRow(filaLeyenda).height = 20;
  const leyenda = [
    ['● 9 – 10  EXCELENTE', C.greenDark, C.greenSoft],
    ['● 7 – 8.9  APROBATORIO', C.teal, C.tealSoft],
    ['● 6 – 6.9  EN OBSERVACIÓN', C.amber, C.amberSoft],
    ['● < 6  REPROBATORIO', C.red, C.redSoft]
  ];
  const bloquesLey = [[1, 2], ...repartir(3, lastVisible - 2, 3)];
  leyenda.forEach(([txt, color, fondo], i) => {
    const [c1, c2] = bloquesLey[i];
    if (c1 !== c2) ws.mergeCells(`${L(c1)}${filaLeyenda}:${L(c2)}${filaLeyenda}`);
    const cell = ws.getCell(`${L(c1)}${filaLeyenda}`);
    cell.value = txt;
    cell.font = font({ size: 8, bold: true, color: { argb: color } });
    cell.fill = fill(fondo);
    cell.alignment = { horizontal: 'center', vertical: 'middle', shrinkToFit: true };
    cell.border = { left: { style: 'medium', color: { argb: C.white } }, right: { style: 'medium', color: { argb: C.white } } };
  });

  // Encabezados de la tabla
  const head = ws.getRow(filaHead);
  // Altura suficiente para el nombre de materia más largo (≈16 caracteres por línea)
  const lineasMax = Math.max(2, ...materias.map(m => Math.ceil((m.nombre || '').length / 16) + (m.clave ? 1 : 0)));
  head.height = Math.max(48, lineasMax * 11 + 12);
  const headers = [
    [cNo, 'No.'],
    [cNombre, 'NOMBRE DEL ALUMNO'],
    ...materias.map((m, i) => [cMat0 + i, `${m.nombre}${m.clave ? `\n(${m.clave})` : ''}`]),
    [cProm, 'PROMEDIO'],
    [cLugar, 'LUGAR'],
    ...(cEstatus ? [[cEstatus, 'NIVEL / ESTATUS']] : []),
    [cBarra, 'DESEMPEÑO'],
    [cOrden, 'ORDEN'],
    [cCurp, 'CURP'],
    [cTutor, 'TUTOR'],
    [cRiesgo, 'RIESGO']
  ];
  headers.forEach(([c, txt]) => {
    const cell = head.getCell(c);
    cell.value = txt;
    const destacado = c === cProm;
    cell.font = font({ size: c >= cMat0 && c < cProm ? 8 : 9, bold: true, color: { argb: C.white } });
    cell.fill = fill(destacado ? C.blue : C.navy);
    cell.alignment = { horizontal: c === cNombre ? 'left' : 'center', vertical: 'middle', wrapText: true, indent: c === cNombre ? 1 : 0 };
    cell.border = { left: thin('FF1E2F4A'), right: thin('FF1E2F4A'), bottom: { style: 'medium', color: { argb: C.blue } } };
  });

  // Filas de alumnos
  const validacion = {
    type: 'decimal', operator: 'between', formulae: [0, 10], allowBlank: true,
    showErrorMessage: true, errorStyle: 'stop',
    errorTitle: 'Calificación no válida', error: 'Escribe un número entre 0 y 10 (ej. 8.5).',
    showInputMessage: true, promptTitle: 'Calificación', prompt: 'Puedes corregirla aquí: promedios, lugares y estadísticas se actualizan solos.'
  };

  alumnos.forEach((alu, idx) => {
    const f = fila0 + idx;
    const row = ws.getRow(f);
    row.height = 22;
    const n = notas[alu.id] || {};

    row.getCell(cNo).value = alu.noLista ?? idx + 1;
    row.getCell(cNombre).value = alu.nombre;

    materias.forEach((m, i) => {
      const v = parseFloat(n[m.id]);
      const cell = row.getCell(cMat0 + i);
      cell.value = isNaN(v) ? null : v;
      cell.numFmt = '0.0';
      cell.dataValidation = validacion;
    });

    const notasRef = `${L(cMat0)}${f}:${L(cProm - 1)}${f}`;
    const promRef = `${L(cProm)}${f}`;
    row.getCell(cProm).value = nM > 0
      ? { formula: `IF(COUNT(${notasRef})=0,"",ROUND(AVERAGE(${notasRef}),1))` }
      : '';
    row.getCell(cProm).numFmt = '0.0';
    row.getCell(cLugar).value = { formula: `IF(ISNUMBER(${promRef}),RANK(${promRef},${promRange}),"")` };
    row.getCell(cLugar).numFmt = '0"°"';
    if (cEstatus) row.getCell(cEstatus).value = { formula: nivelFormula(promRef) };
    row.getCell(cBarra).value = { formula: barraFormula(promRef) };
    // Lugar único (desempata por orden de lista) para el cuadro de honor
    row.getCell(cOrden).value = { formula: `IF(ISNUMBER(${promRef}),COUNTIF(${promRange},">"&${promRef})+COUNTIF(${L(cProm)}$${fila0}:${promRef},${promRef}),"")` };
    row.getCell(cCurp).value = alu.curp || '';
    row.getCell(cTutor).value = alu.tutor || '';
    // Consecutivo de alumnos con promedio menor a 7 (alimenta la lista de atención)
    row.getCell(cRiesgo).value = { formula: `IF(AND(ISNUMBER(${promRef}),${promRef}<7),COUNTIF(${L(cProm)}$${fila0}:${promRef},"<7"),"")` };

    for (let c = 1; c <= lastVisible; c++) {
      const cell = row.getCell(c);
      cell.border = allBorders();
      const esNota = c >= cMat0 && c <= cProm;
      cell.font = font({
        size: esNota ? 11 : c === cBarra ? 9 : 10,
        bold: c === cNombre || c === cProm,
        color: { argb: c === cNo || c === cLugar ? C.gray : c === cBarra ? C.teal : C.navy }
      });
      cell.alignment = {
        horizontal: c === cNombre ? 'left' : 'center',
        vertical: 'middle',
        indent: c === cNombre ? 1 : 0
      };
    }
    row.getCell(cProm).border = { ...allBorders(), left: { style: 'medium', color: { argb: C.blue } }, right: { style: 'medium', color: { argb: C.blue } } };
  });

  // Formato condicional: semáforo, estatus, barras y franjas alternadas
  const tabla = `A${fila0}:${L(lastVisible)}${filaN}`;
  if (nM > 0) semaforo(ws, `${L(cMat0)}${fila0}:${L(cProm)}${filaN}`, 1);
  if (cEstatus) semaforoTexto(ws, `${L(cEstatus)}${fila0}:${L(cEstatus)}${filaN}`, `${L(cEstatus)}${fila0}`, 4);
  semaforoBarra(ws, `${L(cBarra)}${fila0}:${L(cBarra)}${filaN}`, `$${L(cProm)}${fila0}`, 8);
  ws.addConditionalFormatting({
    ref: `${L(cLugar)}${fila0}:${L(cLugar)}${filaN}`,
    rules: [{ type: 'cellIs', operator: 'lessThanOrEqual', formulae: [3], priority: 11,
      style: { font: { color: { argb: C.gold }, bold: true } } }]
  });
  ws.addConditionalFormatting({
    ref: tabla,
    rules: [{ type: 'expression', formulae: ['MOD(ROW(),2)=0'], priority: 20, style: { fill: cfFill(C.zebra) } }]
  });

  // Filas de resumen por asignatura
  let rf = filaN + 1;
  const resumen = [
    ['PROMEDIO POR ASIGNATURA', (rg) => `IFERROR(ROUND(AVERAGE(${rg}),1),"—")`, C.navy, C.white],
    ['CALIFICACIÓN MÁS ALTA', (rg) => `IF(COUNT(${rg})=0,"—",MAX(${rg}))`, C.blueSoft, C.navy],
    ['CALIFICACIÓN MÁS BAJA', (rg) => `IF(COUNT(${rg})=0,"—",MIN(${rg}))`, C.blueSoft, C.navy],
    ['ALUMNOS REPROBADOS', (rg) => `COUNTIF(${rg},"<6")`, C.blueSoft, C.red]
  ];
  resumen.forEach(([etq, fx, fondo, color], i) => {
    const row = ws.getRow(rf);
    row.height = i === 0 ? 26 : 20;
    ws.mergeCells(`A${rf}:B${rf}`);
    const e = row.getCell(1);
    e.value = etq;
    e.font = font({ size: 9, bold: true, color: { argb: i === 0 ? C.white : C.navy } });
    e.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    for (let c = 1; c <= lastVisible; c++) {
      const cell = row.getCell(c);
      cell.fill = fill(fondo);
      cell.border = i === 0
        ? { top: { style: 'medium', color: { argb: C.blue } } }
        : { bottom: thin('FFC9D6F5') };
    }
    for (let c = cMat0; c <= cProm; c++) {
      const cell = row.getCell(c);
      cell.value = { formula: fx(rng(c)) };
      cell.numFmt = i === 3 ? '0' : '0.0';
      cell.font = font({ size: i === 0 ? 12 : 10, bold: true, color: { argb: c === cProm && i === 0 ? 'FF9CC0FF' : color } });
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    rf++;
  });

  // Nota al pie
  rf++;
  ws.mergeCells(`A${rf}:${L(lastVisible)}${rf}`);
  const nota = ws.getCell(`A${rf}`);
  nota.value = '💡 Este archivo es interactivo: si corriges una calificación, los promedios, lugares, semáforo, estadísticas y boletas se recalculan automáticamente. Usa las flechas del encabezado para ordenar o filtrar.';
  nota.font = font({ size: 8, italic: true, color: { argb: C.gray } });
  nota.alignment = { wrapText: true, vertical: 'middle' };
  ws.getRow(rf).height = 26;
  rf += 2;

  // Firmas y sello
  const bloquesFirma = [];
  if (op.incluirNombreDocente) bloquesFirma.push(['firma', docente, 'Docente de Grupo']);
  if (op.incluirFirmaDirector) bloquesFirma.push(['firma', 'Dirección Escolar', 'Vo. Bo. y Firma']);
  if (op.incluirSelloEscolar) bloquesFirma.push(['sello']);
  if (bloquesFirma.length) {
    const filaFirma = rf + 2;
    for (let i = rf; i <= filaFirma + 2; i++) ws.getRow(i).height = 18;
    const zonas = [[1, 2], ...repartir(3, lastVisible - 2, Math.max(1, bloquesFirma.length - 1))];
    if (bloquesFirma.length === 1) zonas[0] = [1, lastVisible];
    bloquesFirma.forEach((b, i) => {
      const z = zonas[i];
      if (!z) return;
      // Deja un margen de una columna a cada lado cuando hay espacio
      const zona = z[1] - z[0] >= 2 ? [z[0] + 1, z[1] - (i === 0 ? 0 : 1)] : z;
      if (b[0] === 'firma') firma(ws, filaFirma, i === 0 ? [2, 2] : zona, b[1], b[2]);
      else sello(ws, filaFirma, zona, escuela, cct);
    });
  }

  ws.views = [{ state: 'frozen', xSplit: 2, ySplit: filaHead, showGridLines: false, zoomScale: 100 }];
  ws.autoFilter = { from: { row: filaHead, column: 1 }, to: { row: filaN, column: lastVisible } };
  configurarImpresion(ws, { horizontal: true, tituloFilas: `${filaHead}:${filaHead}`, escuela, pie: mem.pie });

  // ────────────────────────────────────────────────────────────────
  // HOJA 2: ESTADÍSTICAS
  // ────────────────────────────────────────────────────────────────
  if (op.incluirEstadisticas) {
    const st = wb.addWorksheet('Estadísticas', {
      properties: { tabColor: { argb: C.green } },
      views: [{ showGridLines: false }]
    });
    [3, 40, 12, 10, 10, 12, 12, 13, 26].forEach((w, i) => { st.getColumn(i + 1).width = w; });
    bandaTitulo(st, 1, 9, 'ESTADÍSTICAS DEL GRUPO', `${periodo.toUpperCase()}  •  ${grupoTxt}  •  ${escuela}`, wb, mem);

    const seccion = (fila, texto) => {
      st.mergeCells(`B${fila}:I${fila}`);
      const s = st.getCell(`B${fila}`);
      s.value = texto;
      s.font = font({ size: 12, bold: true, color: { argb: C.blue } });
      s.border = { bottom: { style: 'medium', color: { argb: C.blue } } };
      st.getRow(fila).height = 24;
    };
    const encabezado = (fila, titulos) => {
      st.getRow(fila).height = 30;
      titulos.forEach((t, i) => {
        const cell = st.getCell(fila, i + 2);
        cell.value = t;
        cell.font = font({ size: 8, bold: true, color: { argb: C.white } });
        cell.fill = fill(C.navy);
        cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle', wrapText: true, indent: i === 0 ? 1 : 0 };
      });
    };
    const estiloFila = (fila, ultimaCol) => {
      st.getRow(fila).height = 22;
      for (let c = 2; c <= ultimaCol; c++) {
        const cell = st.getCell(fila, c);
        cell.border = { bottom: thin() };
        cell.alignment = { horizontal: c === 2 ? 'left' : 'center', vertical: 'middle', indent: c === 2 ? 1 : 0 };
        cell.font = font({ bold: c === 2 || c === 3, size: c === 9 ? 9 : 10 });
      }
    };

    // Desempeño por asignatura
    let s = 5;
    seccion(s, '📚  DESEMPEÑO POR ASIGNATURA');
    s += 1;
    encabezado(s, ['ASIGNATURA', 'PROMEDIO', 'MÁXIMA', 'MÍNIMA', 'APROBADOS', 'REPROBADOS', '% APROBACIÓN', 'GRÁFICA']);
    const sMat0 = s + 1;
    materias.forEach((m, i) => {
      const f = sMat0 + i;
      const rg = `${REF}${rngAbs(cMat0 + i)}`;
      st.getCell(`B${f}`).value = m.nombre;
      st.getCell(`C${f}`).value = { formula: `IFERROR(ROUND(AVERAGE(${rg}),1),"—")` };
      st.getCell(`D${f}`).value = { formula: `IF(COUNT(${rg})=0,"—",MAX(${rg}))` };
      st.getCell(`E${f}`).value = { formula: `IF(COUNT(${rg})=0,"—",MIN(${rg}))` };
      st.getCell(`F${f}`).value = { formula: `COUNTIF(${rg},">=6")` };
      st.getCell(`G${f}`).value = { formula: `COUNTIF(${rg},"<6")` };
      st.getCell(`H${f}`).value = { formula: `IFERROR(F${f}/(F${f}+G${f}),0)` };
      st.getCell(`I${f}`).value = { formula: barraFormula(`C${f}`, 10, 20) };
      estiloFila(f, 9);
      if ((m.nombre || '').length > 42) {
        st.getRow(f).height = 30;
        st.getCell(`B${f}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
      }
      ['C', 'D', 'E'].forEach(c => { st.getCell(`${c}${f}`).numFmt = '0.0'; });
      st.getCell(`H${f}`).numFmt = '0%';
      st.getCell(`I${f}`).font = font({ size: 9, color: { argb: C.teal } });
    });
    const sMatN = sMat0 + Math.max(nM, 1) - 1;
    if (nM > 0) {
      semaforo(st, `C${sMat0}:E${sMatN}`, 1);
      semaforoBarra(st, `I${sMat0}:I${sMatN}`, `$C${sMat0}`, 4);
      st.addConditionalFormatting({
        ref: `G${sMat0}:G${sMatN}`,
        rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: [0], priority: 7,
          style: { font: { color: { argb: C.red }, bold: true }, fill: cfFill(C.redSoft) } }]
      });
      st.addConditionalFormatting({
        ref: `H${sMat0}:H${sMatN}`,
        rules: [{ type: 'colorScale', priority: 8, cfvo: [{ type: 'num', value: 0.5 }, { type: 'num', value: 0.8 }, { type: 'num', value: 1 }],
          color: [{ argb: 'FFF8B4BA' }, { argb: 'FFFDE6A8' }, { argb: 'FFA8E6C9' }] }]
      });
    }

    // Distribución de promedios
    s = sMatN + 3;
    seccion(s, '📊  DISTRIBUCIÓN DE PROMEDIOS');
    s += 1;
    encabezado(s, ['RANGO', 'ALUMNOS', '% DEL GRUPO', '', '', '', '', 'GRÁFICA']);
    const rangos = [
      ['10  •  Sobresaliente', `COUNTIF(${REF}${promRange},10)`, C.greenDark],
      ['9.0 – 9.9  •  Excelente', `COUNTIFS(${REF}${promRange},">=9",${REF}${promRange},"<10")`, C.green],
      ['8.0 – 8.9  •  Muy bien', `COUNTIFS(${REF}${promRange},">=8",${REF}${promRange},"<9")`, C.teal],
      ['7.0 – 7.9  •  Bien', `COUNTIFS(${REF}${promRange},">=7",${REF}${promRange},"<8")`, C.blue],
      ['6.0 – 6.9  •  Suficiente', `COUNTIFS(${REF}${promRange},">=6",${REF}${promRange},"<7")`, C.amber],
      ['Menos de 6  •  Requiere apoyo', `COUNTIF(${REF}${promRange},"<6")`, C.red]
    ];
    const sDist0 = s + 1;
    rangos.forEach(([etq, fx, color], i) => {
      const f = sDist0 + i;
      st.getCell(`B${f}`).value = etq;
      st.getCell(`C${f}`).value = { formula: fx };
      st.getCell(`D${f}`).value = { formula: `IFERROR(C${f}/COUNT(${REF}${promRange}),0)` };
      st.getCell(`I${f}`).value = { formula: `REPT("█",ROUND(D${f}*20,0))` };
      estiloFila(f, 9);
      st.getCell(`D${f}`).numFmt = '0%';
      st.getCell(`B${f}`).font = font({ bold: true, color: { argb: color } });
      st.getCell(`I${f}`).font = font({ size: 9, color: { argb: color } });
      st.getCell(`I${f}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      st.getCell(`B${f}`).border = { bottom: thin(), left: { style: 'thick', color: { argb: color } } };
    });

    // Cuadro de honor
    s = sDist0 + rangos.length + 2;
    seccion(s, '🏆  CUADRO DE HONOR');
    s += 1;
    encabezado(s, ['ALUMNO', 'PROMEDIO', 'LUGAR', '', '', '', '', '']);
    const medallas = ['🥇', '🥈', '🥉', '4°', '5°'];
    const top = Math.min(5, alumnos.length);
    for (let k = 1; k <= top; k++) {
      const f = s + k;
      const match = `MATCH(${k},${REF}${rngAbs(cOrden)},0)`;
      st.getCell(`B${f}`).value = { formula: `IFERROR(INDEX(${REF}${rngAbs(cNombre)},${match}),"—")` };
      st.getCell(`C${f}`).value = { formula: `IFERROR(INDEX(${REF}${promRange},${match}),"—")` };
      st.getCell(`D${f}`).value = medallas[k - 1];
      estiloFila(f, 4);
      st.getCell(`C${f}`).numFmt = '0.0';
      st.getCell(`D${f}`).font = font({ size: k <= 3 ? 14 : 10, bold: true, color: { argb: C.gray } });
      if (k <= 3) {
        ['B', 'C', 'D'].forEach(c => { st.getCell(`${c}${f}`).fill = fill('FFFFF7DB'); });
        st.getCell(`B${f}`).border = { bottom: thin(), left: { style: 'thick', color: { argb: C.gold } } };
      }
    }

    // Alumnos que requieren apoyo (lista dinámica de hasta todos los alumnos)
    let a = s + top + 3;
    seccion(a, '🚨  ALUMNOS QUE REQUIEREN ATENCIÓN (promedio menor a 7)');
    a += 1;
    encabezado(a, ['ALUMNO', 'PROMEDIO', 'NIVEL', '', '', '', '', '']);
    st.mergeCells(`D${a}:E${a}`);
    alumnos.forEach((_, idx) => {
      const f = a + 1 + idx;
      const k = idx + 1;
      const match = `MATCH(${k},${REF}${rngAbs(cRiesgo)},0)`;
      st.getCell(`B${f}`).value = {
        formula: `IFERROR(INDEX(${REF}${rngAbs(cNombre)},${match}),${k === 1 ? '"✔ Ningún alumno en riesgo. ¡Excelente trabajo del grupo!"' : '""'})`
      };
      st.getCell(`C${f}`).value = { formula: `IFERROR(INDEX(${REF}${promRange},${match}),"")` };
      st.mergeCells(`D${f}:E${f}`);
      st.getCell(`D${f}`).value = { formula: `IF(ISNUMBER(C${f}),${nivelFormula(`C${f}`)},"")` };
      st.getRow(f).height = 20;
      st.getCell(`C${f}`).numFmt = '0.0';
      ['B', 'C', 'D'].forEach(c => {
        const cell = st.getCell(`${c}${f}`);
        cell.font = font({ size: 9, bold: c !== 'D' });
        cell.alignment = { horizontal: c === 'B' ? 'left' : 'center', vertical: 'middle', indent: c === 'B' ? 1 : 0 };
      });
    });
    if (alumnos.length) {
      const aN = a + alumnos.length;
      semaforo(st, `C${a + 1}:C${aN}`, 20);
      semaforoTexto(st, `D${a + 1}:D${aN}`, `D${a + 1}`, 23);
      st.addConditionalFormatting({
        ref: `B${a + 1}:E${aN}`,
        rules: [{ type: 'expression', formulae: [`ISNUMBER($C${a + 1})`], priority: 30, style: { fill: cfFill(C.zebra) } }]
      });
    }

    configurarImpresion(st, { horizontal: false, escuela, pie: mem.pie });
  }

  // ────────────────────────────────────────────────────────────────
  // HOJA 3: BOLETA INDIVIDUAL INTERACTIVA
  // ────────────────────────────────────────────────────────────────
  if (op.incluirBoleta && alumnos.length) {
    const bo = wb.addWorksheet('Boleta Individual', {
      properties: { tabColor: { argb: C.amber } },
      views: [{ showGridLines: false }]
    });
    [3, 44, 12, 15, 20, 24, 3].forEach((w, i) => { bo.getColumn(i + 1).width = w; });
    bandaTitulo(bo, 1, 7, 'BOLETA DE CALIFICACIONES', `${escuela.toUpperCase()}  •  C.C.T. ${cct}  •  ${periodo.toUpperCase()}`, wb, mem);

    // Selector de alumno
    bo.getRow(5).height = 14;
    bo.mergeCells('B5:F5');
    const ayuda = bo.getCell('B5');
    ayuda.value = '▼  SELECCIONA AL ALUMNO EN LA CELDA AMARILLA (lista desplegable)';
    ayuda.font = font({ size: 8, bold: true, color: { argb: C.amber } });

    bo.getRow(6).height = 32;
    bo.mergeCells('B6:F6');
    const sel = bo.getCell('B6');
    sel.value = alumnos[0].nombre;
    sel.font = font({ size: 16, bold: true });
    sel.fill = fill(C.input);
    sel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    const bAmber = { style: 'medium', color: { argb: C.gold } };
    sel.border = { top: bAmber, left: bAmber, bottom: bAmber, right: bAmber };
    sel.dataValidation = {
      type: 'list', allowBlank: false, formulae: [`${REF}${rngAbs(cNombre)}`],
      showErrorMessage: true, errorTitle: 'Alumno no encontrado', error: 'Elige un alumno de la lista.',
      showInputMessage: true, promptTitle: 'Boleta individual', prompt: 'Elige un alumno y la boleta se llena sola.'
    };

    const match = `MATCH($B$6,${REF}${rngAbs(cNombre)},0)`;
    const buscar = (c) => `IFERROR(INDEX(${REF}${rngAbs(c)},${match}),"")`;

    // Ficha del alumno (B..F)
    const ficha = [
      ['CURP', { formula: buscar(cCurp) }],
      ['No. LISTA', { formula: buscar(cNo) }],
      ['GRADO Y GRUPO', grupoTxt],
      ['CICLO ESCOLAR', config?.ciclo || ''],
      ['LUGAR EN EL GRUPO', { formula: `IFERROR(INDEX(${REF}${rngAbs(cLugar)},${match})&"° de "&COUNT(${REF}${promRange}),"")` }]
    ];
    bo.getRow(8).height = 14;
    bo.getRow(9).height = 22;
    ficha.forEach(([etq, val], i) => {
      const col = L(2 + i);
      const e = bo.getCell(`${col}8`);
      const v = bo.getCell(`${col}9`);
      e.value = etq;
      e.font = font({ size: 7, bold: true, color: { argb: C.gray } });
      e.fill = fill(C.grayLight);
      e.alignment = { indent: 1, vertical: 'bottom' };
      v.value = val;
      v.font = font({ bold: true, size: 10 });
      v.fill = fill(C.grayLight);
      v.alignment = { indent: 1, vertical: 'middle', shrinkToFit: true, horizontal: 'left' };
      v.border = { bottom: { style: 'medium', color: { argb: C.blue } } };
    });

    // Tabla de calificaciones
    const bh = 11;
    bo.getRow(bh).height = 26;
    ['ASIGNATURA', 'CLAVE', 'CALIFICACIÓN', 'NIVEL', 'DESEMPEÑO'].forEach((t, i) => {
      const cell = bo.getCell(bh, i + 2);
      cell.value = t;
      cell.font = font({ size: 8, bold: true, color: { argb: C.white } });
      cell.fill = fill(i === 2 ? C.blue : C.navy);
      cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle', indent: i === 0 ? 1 : 0 };
    });
    materias.forEach((m, i) => {
      const f = bh + 1 + i;
      bo.getRow(f).height = 26;
      bo.getCell(`B${f}`).value = m.nombre;
      bo.getCell(`C${f}`).value = m.clave || '';
      bo.getCell(`D${f}`).value = { formula: `IF(${buscar(cMat0 + i)}="","",${buscar(cMat0 + i)})` };
      bo.getCell(`E${f}`).value = { formula: nivelFormula(`D${f}`) };
      bo.getCell(`F${f}`).value = { formula: barraFormula(`D${f}`, 10, 12) };
      ['B', 'C', 'D', 'E', 'F'].forEach((c, j) => {
        const cell = bo.getCell(`${c}${f}`);
        cell.border = { bottom: thin() };
        cell.alignment = { horizontal: j === 0 ? 'left' : 'center', vertical: 'middle', indent: j === 0 ? 1 : 0, wrapText: j === 0 };
        cell.font = font({ size: j === 2 ? 13 : j === 0 ? 10 : 9, bold: j === 0 || j === 2, color: { argb: j === 1 ? C.gray : j === 4 ? C.teal : C.navy } });
      });
      bo.getCell(`D${f}`).numFmt = '0.0';
    });
    const bN = bh + Math.max(nM, 1);
    if (nM > 0) {
      semaforo(bo, `D${bh + 1}:D${bN}`, 1);
      semaforoTexto(bo, `E${bh + 1}:E${bN}`, `E${bh + 1}`, 4);
      semaforoBarra(bo, `F${bh + 1}:F${bN}`, `$D${bh + 1}`, 8);
    }

    // Promedio general destacado
    const fp = bN + 1;
    bo.getRow(fp).height = 34;
    bo.mergeCells(`B${fp}:C${fp}`);
    const pe = bo.getCell(`B${fp}`);
    pe.value = 'PROMEDIO GENERAL';
    pe.font = font({ size: 11, bold: true, color: { argb: C.white } });
    pe.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    const pv = bo.getCell(`D${fp}`);
    pv.value = { formula: buscar(cProm) };
    pv.numFmt = '0.0';
    pv.font = font({ size: 18, bold: true, color: { argb: C.white } });
    pv.alignment = { horizontal: 'center', vertical: 'middle' };
    const pn = bo.getCell(`E${fp}`);
    pn.value = { formula: nivelFormula(`D${fp}`) };
    pn.font = font({ size: 10, bold: true, color: { argb: C.white } });
    pn.alignment = { horizontal: 'center', vertical: 'middle' };
    const pb = bo.getCell(`F${fp}`);
    pb.value = { formula: barraFormula(`D${fp}`, 10, 12) };
    pb.font = font({ size: 9, color: { argb: 'FF9CC0FF' } });
    pb.alignment = { horizontal: 'center', vertical: 'middle' };
    ['B', 'C', 'D', 'E', 'F'].forEach(c => { bo.getCell(`${c}${fp}`).fill = fill(C.navy); });
    bo.getCell(`D${fp}`).fill = fill(C.blue);
    bo.addConditionalFormatting({
      ref: `B${fp}:F${fp}`,
      rules: [
        { type: 'expression', formulae: [`AND(ISNUMBER($D$${fp}),$D$${fp}<6)`], priority: 12, style: { fill: cfFill(C.red) } },
        { type: 'expression', formulae: [`AND(ISNUMBER($D$${fp}),$D$${fp}<7)`], priority: 13, style: { fill: cfFill(C.amber) } },
        { type: 'expression', formulae: [`AND(ISNUMBER($D$${fp}),$D$${fp}>=9)`], priority: 14, style: { fill: cfFill(C.greenDark) } }
      ]
    });

    // Observaciones
    const fo = fp + 2;
    bo.mergeCells(`B${fo}:F${fo}`);
    const ot = bo.getCell(`B${fo}`);
    ot.value = 'OBSERVACIONES Y RECOMENDACIONES DEL DOCENTE';
    ot.font = font({ size: 8, bold: true, color: { argb: C.gray } });
    bo.mergeCells(`B${fo + 1}:F${fo + 3}`);
    const ob = bo.getCell(`B${fo + 1}`);
    ob.value = {
      formula: `IF(NOT(ISNUMBER(D${fp})),"",IF(D${fp}>=9,"¡Felicidades! Excelente desempeño durante el periodo. Sigue así.",IF(D${fp}>=7,"Buen trabajo. Con constancia y dedicación puedes alcanzar la excelencia.",IF(D${fp}>=6,"Es necesario reforzar hábitos de estudio y entrega de trabajos. Se recomienda apoyo en casa.","Requiere apoyo inmediato. Se solicita al tutor acudir con el docente para acordar un plan de mejora."))))`
    };
    ob.font = font({ size: 10, italic: true });
    ob.alignment = { wrapText: true, vertical: 'top', indent: 1 };
    ob.fill = fill(C.zebra);
    const bo2 = { style: 'thin', color: { argb: C.grid } };
    ob.border = { top: bo2, left: bo2, bottom: bo2, right: bo2 };
    for (let i = fo + 1; i <= fo + 3; i++) bo.getRow(i).height = 20;

    // Firmas de la boleta
    const ff = fo + 7;
    for (let i = ff - 2; i <= ff + 2; i++) bo.getRow(i).height = 18;
    firma(bo, ff, [2, 2], op.incluirNombreDocente ? docente : 'Docente de Grupo', 'Docente de Grupo');
    bo.mergeCells(`D${ff}:E${ff}`);
    bo.getCell(`D${ff}`).border = { bottom: { style: 'thin', color: { argb: C.navy } } };
    bo.mergeCells(`D${ff + 1}:E${ff + 1}`);
    const tn = bo.getCell(`D${ff + 1}`);
    tn.value = { formula: `IF(${buscar(cTutor)}="","Padre, Madre o Tutor",${buscar(cTutor)})` };
    tn.font = font({ bold: true });
    tn.alignment = { horizontal: 'center' };
    bo.mergeCells(`D${ff + 2}:E${ff + 2}`);
    const tr = bo.getCell(`D${ff + 2}`);
    tr.value = 'Firma del Padre, Madre o Tutor';
    tr.font = font({ size: 8, color: { argb: C.gray } });
    tr.alignment = { horizontal: 'center' };
    if (op.incluirSelloEscolar) sello(bo, ff, [6, 6], escuela, cct);
    else if (op.incluirFirmaDirector) firma(bo, ff, [6, 6], 'Dirección Escolar', 'Vo. Bo.');
    if (op.incluirFirmaDirector && op.incluirSelloEscolar) {
      firma(bo, ff + 5, [4, 5], 'Dirección Escolar', 'Vo. Bo. y Firma');
    }

    configurarImpresion(bo, { horizontal: false, escuela, pie: mem.pie });
  }

  // ────────────────────────────────────────────────────────────────
  // Descarga
  // ────────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const limpio = (s) => String(s || '').replace(/[\\/:*?"<>|°]+/g, '').replace(/\s+/g, '_');
  a.download = `Calificaciones_${limpio(config?.grado)}${limpio(config?.grupo)}_${limpio(periodo) || 'Periodo'}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return wb;
}
