'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type BProps = React.HTMLAttributes<HTMLElement> &
  TrackingProps & {
    kind?: string; // default 'b' (clave en tu RDD)
    variant?: string;
    size?: string;
    state?: string;
    scheme?: 'light' | 'dark';
  };

/** <B> wrapper con RDD */
export const B = React.forwardRef<HTMLElement, BProps>(function B(
  {
    kind = 'b',
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

  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();

  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: 'b', // usa esta clave si no hay estilos específicos
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  const { onClick, ...bRest } = rest;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    emit('click'); // solo emite si track viene definido
    if (onClick) {
      onClick(e);
    }
  };

  return <b ref={ref} className={classes} onClick={handleClick} {...bRest} />;
});
