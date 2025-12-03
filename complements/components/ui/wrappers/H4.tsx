'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type H4Props = React.HTMLAttributes<HTMLHeadingElement> &
  TrackingProps & {
    kind?: string;
    variant?: string;
    size?: string;
    state?: string;
    scheme?: 'light' | 'dark';
  };

export const H4 = React.forwardRef<HTMLHeadingElement, H4Props>(function H4(
  {
    kind = 'h4',
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
  const { onClick, ...hRest } = rest;

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

  const handleClick = (e: React.MouseEvent<HTMLHeadingElement>) => {
    emit('click');
    if (onClick) onClick(e);
  };

  // Respeto tu implementación original: H4 devuelve <h3>
  return <h3 ref={ref} className={classes} onClick={handleClick} {...hRest} />;
});
