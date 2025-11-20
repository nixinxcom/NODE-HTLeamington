'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { cx, isExternalHref, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type BtnProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  /** Conjunto de estilos: 'button' (default), 'button2', etc. */
  kind?: 'button' | 'button2' | string;
  variant?: string;
  size?: string;
  state?: string;
  as?: 'button' | 'link';
  href?: string;
  scheme?: 'light' | 'dark';
};

/** BUTTON base: respeta `kind` (button, button2, …) */
export const BUTTON = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  BtnProps
>(function BUTTON(
  {
    kind = 'button',
    variant,
    size,
    state,
    as = 'button',
    href,
    scheme,
    type,
    className,
    ...rest
  },
  ref
) {
  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();

  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: 'button', // clase base CSS si RDD no tiene nada
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  // modo "link" (usa <a> o <NextLink>)
  if (href || as === 'link') {
    const _href = href ?? '#';
    if (isExternalHref(_href)) {
      return (
        <a
          ref={ref as any}
          href={_href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          {...(rest as any)}
        />
      );
    }
    return (
      <NextLink
        ref={ref as any}
        href={_href}
        className={classes}
        {...(rest as any)}
      />
    );
  }

  // modo botón normal
  const _type = type ?? 'button';
  return <button ref={ref as any} type={_type} className={classes} {...rest} />;
});

/** BUTTON2: alias fijo al set de estilos "button2" */
export const BUTTON2 = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  Omit<BtnProps, 'kind'>
>(function BUTTON2(props, ref) {
  return <BUTTON ref={ref} {...props} kind="button2" />;
});

// (Opcional) para que en React DevTools se vean bonitos
BUTTON.displayName = 'BUTTON';
BUTTON2.displayName = 'BUTTON2';
