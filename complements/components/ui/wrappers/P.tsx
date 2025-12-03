'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type PProps = React.HTMLAttributes<HTMLParagraphElement> &
  TrackingProps & {
    kind?: string; // default 'p'
    variant?: string;
    size?: string;
    state?: string;
    scheme?: 'light' | 'dark';
  };

export const P = React.forwardRef<HTMLParagraphElement, PProps>(function P(
  {
    kind = 'p',
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
  const { onClick, ...pRest } = rest;

  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();

  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: 'p',
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  const handleClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
    emit('click');
    if (onClick) onClick(e);
  };

  return (
    <p
      ref={ref}
      className={classes}
      onClick={handleClick}
      {...pRest}
    />
  );
});

P.displayName = 'P';
