'use client';

// Import local SOLO para crear wrappers dinámicos
import _make from './elementFactory';

// Re-exports públicos (sin crear colisiones)
export { cx, useStylesRDD } from './utils';
export { resolveComponentClasses } from './resolve';
export { makeElement, toPascalCase } from './elementFactory';

// Wrappers existentes (ya en archivos propios)
export { BUTTON } from './Button';
export { IMAGE } from './Image';
export { A } from './A';
export { B } from './B';
export { INPUT } from './Input';
export { SELECT } from './Select';
export { P } from './P';
export { LABEL } from './Label';
export { H1 } from './H1';
export { H2 } from './H2';
export { H3 } from './H3';
export { H4 } from './H4';
export { H5 } from './H5';
export { H6 } from './H6';
export { default as LINK } from './Links';
export { default as NEXTIMAGE } from './NextImage';

// Wrappers genéricos en MAYÚSCULAS (se distinguen de HTML nativo)
export const SPAN  = _make('span', 'span');
export const SPAN1 = _make('span', 'span1');
export const SPAN2 = _make('span', 'span2');
export const DIV   = _make('div',  'surface');
