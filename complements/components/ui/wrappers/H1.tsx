'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type H1Props = React.HTMLAttributes<HTMLHeadingElement> &
  TrackingProps & {
    kind?: string; // default 'h1'
    variant?: string;
    size?: string;
    state?: string;
    scheme?: 'light' | 'dark';
  };

export const H1 = React.forwardRef<HTMLHeadingElement, H1Props>(function H1(
  {
    kind = 'h1',
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
    baseFallback: '', // normalmente tailwind define tipografías
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

  return <h1 ref={ref} className={classes} onClick={handleClick} {...hRest} />;
});
