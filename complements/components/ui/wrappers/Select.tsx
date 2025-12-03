'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  TrackingProps & {
    kind?: string; // default 'select'
    variant?: string;
    size?: string;
    state?: string;
    scheme?: 'light' | 'dark';
  };

export const SELECT = React.forwardRef<HTMLSelectElement, SelectProps>(
  function SELECT(
    {
      kind = 'select',
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
    const { onClick, ...selectRest } = rest;

    const Styles = useStylesRDD();
    const _scheme = scheme || detectScheme();

    const classes = resolveComponentClasses(Styles, kind, {
      baseFallback: 'select',
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    const handleClick = (e: React.MouseEvent<HTMLSelectElement>) => {
      emit('click');
      if (onClick) onClick(e);
    };

    return (
      <select
        ref={ref}
        className={classes}
        onClick={handleClick}
        {...selectRest}
      />
    );
  },
);

SELECT.displayName = 'SELECT';
