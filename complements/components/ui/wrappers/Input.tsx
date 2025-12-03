'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  TrackingProps & {
    kind?: 'input' | 'input2' | string;  // soporta input2 “oficialmente”
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
      track,
      trackCategory,
      trackView,
      trackMeta,
      ...rest
    },
    ref,
  ) {
    const { emit } = useTracking({ track, trackCategory, trackView, trackMeta });
    const { onClick, ...inputRest } = rest;

    const Styles = useStylesRDD();
    const _scheme = scheme || detectScheme();

    const classes = resolveComponentClasses(Styles, kind, {
      baseFallback: 'input',
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      emit('click');
      if (onClick) onClick(e);
    };

    return (
      <input
        ref={ref}
        className={classes}
        onClick={handleClick}
        {...inputRest}
      />
    );
  },
);

/** INPUT2: alias fijo al set de estilos "input2" */
export const INPUT2 = React.forwardRef<HTMLInputElement, Omit<InputProps, 'kind'>>(
  function INPUT2(props, ref) {
    return <INPUT ref={ref} {...props} kind="input2" />;
  },
);

INPUT.displayName = 'INPUT';
INPUT2.displayName = 'INPUT2';
