'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type BProps = React.HTMLAttributes<HTMLElement> & {
  kind?: string;              // default 'b' (clave en tu RDD)
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light' | 'dark';
};

/** <b> wrapper con RDD */
export const B = React.forwardRef<HTMLElement, BProps>(function B(
  {
    kind = 'b',
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
    baseFallback: 'b',     // usa esta clave si no hay estilos específicos
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  return <b ref={ref} className={classes} {...rest} />;
});
