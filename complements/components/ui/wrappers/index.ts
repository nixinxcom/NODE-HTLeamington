'use client';

// Import local SOLO para crear wrappers dinámicos
import _make from './elementFactory';

// Re-exports públicos (sin crear colisiones)
export { cx, useStylesRDD } from './utils';
export { resolveComponentClasses } from './resolve';
export { makeElement, toPascalCase } from './elementFactory';

// Wrappers existentes (ya en archivos propios)
export { A } from './A';
export { B } from './B';
export { P } from './P';
export { H1 } from './H1';
export { H2 } from './H2';
export { H3 } from './H3';
export { H4 } from './H4';
export { H5 } from './H5';
export { H6 } from './H6';
export { INPUT, INPUT2 } from './Input';
export { SELECT, SELECT2 } from './Select';
export { LABEL, LABEL2 } from './Label';
export { BUTTON, BUTTON2 } from './Button';
export { LINK, LINK2 } from './Links';
export { IMAGE } from './Image';
export { default as NEXTIMAGE } from './NextImage';

// Wrappers genéricos en MAYÚSCULAS (se distinguen de HTML nativo)
export const SPAN  = _make('span', 'span');
export const SPAN1 = _make('span', 'span1');
export const SPAN2 = _make('span', 'span2');
export const DIV   = _make('div',  'div');
export const DIV2   = _make('div',  'div2');
export const DIV3   = _make('div',  'div3');


// Wrappers de tabla
export const TABLE = _make('table', 'table');
export const THEAD = _make('thead', 'thead');
export const TBODY = _make('tbody', 'tbody');
export const TR = _make('tr', 'tr');
export const TH = _make('th', 'th');
export const TD = _make('td', 'td');