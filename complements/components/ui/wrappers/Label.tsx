'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  kind?: 'label' | 'label2' | string;  // añadimos label2 como variante “oficial”
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light' | 'dark';
};

export const LABEL = React.forwardRef<HTMLLabelElement, LabelProps>(
  function LABEL(
    {
      kind = 'label',
      variant,
      size,
      state,
      scheme,
      className,
      ...rest
    },
    ref
  ) {
    const Styles = useStylesRDD();
    const _scheme = scheme || detectScheme();

    const classes = resolveComponentClasses(Styles, kind, {
      baseFallback: 'label', // clase base .label en globals.css
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    return <label ref={ref} className={classes} {...rest} />;
  }
);

// Variante fija LABEL2 → siempre usa el set de estilos "label2"
export const LABEL2 = React.forwardRef<
  HTMLLabelElement,
  Omit<LabelProps, 'kind'>
>(function LABEL2(props, ref) {
  return <LABEL ref={ref} {...props} kind="label2" />;
});

LABEL.displayName = 'LABEL';
LABEL2.displayName = 'LABEL2';
