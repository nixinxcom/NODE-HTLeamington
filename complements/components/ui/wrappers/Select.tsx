'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  kind?: 'select' | 'select2' | string;  // ahora soporta select2 “oficial”
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
      children,
      ...rest
    },
    ref
  ) {
    const Styles = useStylesRDD();
    const _scheme = scheme || detectScheme();

    const classes = resolveComponentClasses(Styles, kind, {
      baseFallback: 'select', // clase base .select en globals.css
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    return (
      <select ref={ref} className={classes} {...rest}>
        {children}
      </select>
    );
  }
);

// Variante fija SELECT2 → siempre usa el set de estilos "select2"
export const SELECT2 = React.forwardRef<
  HTMLSelectElement,
  Omit<SelectProps, 'kind'>
>(function SELECT2(props, ref) {
  return (
    <SELECT
      ref={ref}
      {...props}
      kind="select2"
    />
  );
});

SELECT.displayName = 'SELECT';
SELECT2.displayName = 'SELECT2';
