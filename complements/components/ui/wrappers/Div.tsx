'use client';

import * as React from 'react';
import { cx, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

/**
 * Div estilable por RDD (útil para “cards”, “sections” o contenedores con sombras, bordes, etc.).
 * - kind: e.g., 'card', 'section', 'panel', 'chip', 'badge'
 */
export type DivProps = React.HTMLAttributes<HTMLDivElement> & {
  kind?: 'div' | 'div2' | 'div3' | string;   // añadimos div2/div3 como casos “oficiales”
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light'|'dark';
};

export const DIV = React.forwardRef<HTMLDivElement, DivProps>(function Div({
  kind = 'div',        // antes 'surface'
  variant,
  size,
  state,
  scheme,
  className,
  ...rest
}, ref) {
  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();

  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: '',
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  return <div ref={ref} className={classes} {...rest} />;
});

// Div2: mismo comportamiento, pero siempre usa el set de estilos "div2"
export const DIV2 = React.forwardRef<HTMLDivElement, Omit<DivProps, 'kind'>>(
  function DIV2(props, ref) {
    return <DIV ref={ref} {...props} kind="div2" />;
  }
);

// Div3: idem con "div3"
export const DIV3 = React.forwardRef<HTMLDivElement, Omit<DivProps, 'kind'>>(
  function DIV3(props, ref) {
    return <DIV ref={ref} {...props} kind="div3" />;
  }
);
