'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  kind?: 'input' | 'input2' | string;  // ahora soporta input2 “oficialmente”
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light' | 'dark';
};

/** INPUT base: respeta kind = 'input' | 'input2' | ... */
export const INPUT = React.forwardRef<HTMLInputElement, InputProps>(
  function INPUT(
    {
      kind = 'input',
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
      baseFallback: 'input', // clase CSS base si RDD no tiene nada
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    return <input ref={ref} className={classes} {...rest} />;
  }
);

/** INPUT2: siempre usa el set de estilos "input2" */
export const INPUT2 = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'kind'>
>(function INPUT2(props, ref) {
  return <INPUT ref={ref} {...props} kind="input2" />;
});

// opcional, solo para que se vean claros en DevTools
INPUT.displayName = 'INPUT';
INPUT2.displayName = 'INPUT2';
