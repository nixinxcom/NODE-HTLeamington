'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> &
  TrackingProps & {
    kind?: string; // default 'label'
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
      track,
      trackCategory,
      trackView,
      trackMeta,
      ...rest
    },
    ref,
  ) {
    const { emit } = useTracking({ track, trackCategory, trackView, trackMeta });
    const { onClick, ...labelRest } = rest;

    const Styles = useStylesRDD();
    const _scheme = scheme || detectScheme();

    const classes = resolveComponentClasses(Styles, kind, {
      baseFallback: 'label',
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    const handleClick = (e: React.MouseEvent<HTMLLabelElement>) => {
      emit('click');
      if (onClick) onClick(e);
    };

    return (
      <label
        ref={ref}
        className={classes}
        onClick={handleClick}
        {...labelRest}
      />
    );
  },
);

LABEL.displayName = 'LABEL';
