'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

type Scheme = 'light' | 'dark';
type RDDBaseProps = {
  kind?: string;
  variant?: string;
  size?: string;
  state?: string;
  scheme?: Scheme;
  className?: string;
};

export function makeElement<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  defaultKind?: string,
  baseFallback?: string
) {
  const Comp = React.forwardRef<any, any>(function Wrapped(
    { kind, variant, size, state, scheme, className, ...rest }: RDDBaseProps & Record<string, any>,
    ref
  ) {
    const Styles = useStylesRDD();
    const _scheme = scheme || detectScheme();
    const _kind = kind || defaultKind || String(tag);

    const classes = resolveComponentClasses(Styles, _kind, {
      baseFallback: baseFallback || '',
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    return React.createElement(tag as any, { ...(rest as any), ref, className: classes });
  });

  (Comp as any).displayName = `Wrapped(${defaultKind ?? String(tag)})`;

  return Comp as unknown as React.ForwardRefExoticComponent<
    React.PropsWithoutRef<RDDBaseProps & Record<string, any>> & React.RefAttributes<any>
  >;
}

export function toPascalCase(s: string) {
  return s
    .replace(/(^\w|[-_\s]\w)/g, (m) => m.replace(/[-_\s]/g, '').toUpperCase())
    .replace(/^\d+/, '');
}

// ✅ Soporta import default y nombrado
export default makeElement;
