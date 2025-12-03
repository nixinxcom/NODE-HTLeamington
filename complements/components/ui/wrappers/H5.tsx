'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type H5Props = React.HTMLAttributes<HTMLHeadingElement> &
  TrackingProps & {
    kind?: string;
    variant?: string;
    size?: string;
    state?: string;
    scheme?: 'light' | 'dark';
  };

export const H5 = React.forwardRef<HTMLHeadingElement, H5Props>(function H5(
  {
    kind = 'h5',
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

  return <h5 ref={ref} className={classes} onClick={handleClick} {...hRest} />;
});
