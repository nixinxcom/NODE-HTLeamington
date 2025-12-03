'use client';

import * as React from 'react';
import { cx, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

/**
 * Div estilable por RDD (útil para “cards”, “sections” o contenedores con sombras, bordes, etc.).
 * - kind: e.g., 'card', 'section', 'panel', 'chip', 'badge'
 */
export type DivProps = React.HTMLAttributes<HTMLDivElement> &
  TrackingProps & {
    kind?: 'div' | 'div2' | 'div3' | string; // añadimos div2/div3 como casos “oficiales”
    variant?: string;
    size?: string;
    state?: string;
    scheme?: 'light' | 'dark';
  };

export const DIV = React.forwardRef<HTMLDivElement, DivProps>(function DIV(
  {
    kind = 'div',
    variant,
    size,
    state,
    scheme,
    className,
    track,
    trackCategory,
    trackView,
    trackMeta,
    ...rest
  },
  ref,
) {
  const { emit } = useTracking({ track, trackCategory, trackView, trackMeta });
  const { onClick, ...divRest } = rest;

  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();

  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: 'div',
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    emit('click'); // solo registrará si viene `track`
    if (onClick) onClick(e);
  };

  return (
    <div
      ref={ref}
      className={cx(classes)}
      onClick={handleClick}
      {...divRest}
    />
  );
});

// Div2: mismo comportamiento, pero siempre usa el set de estilos "div2"
export const DIV2 = React.forwardRef<HTMLDivElement, Omit<DivProps, 'kind'>>(
  function DIV2(props, ref) {
    return <DIV ref={ref} {...props} kind="div2" />;
  },
);

// Div3: idem con "div3"
export const DIV3 = React.forwardRef<HTMLDivElement, Omit<DivProps, 'kind'>>(
  function DIV3(props, ref) {
    return <DIV ref={ref} {...props} kind="div3" />;
  },
);
