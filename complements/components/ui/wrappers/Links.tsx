'use client';

import * as React from 'react';
import NextLink, { LinkProps } from 'next/link';
import { cx, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

type RDDProps = {
  scheme?: 'light' | 'dark';
  variant?: string;
  size?: string;
  state?: string;
  /** kinds definidos en components.link (link, link2, etc.) */
  kind?: 'link' | 'link2' | string;
  className?: string;
};

export type LinkWrapperProps =
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  LinkProps &
  RDDProps;

/**
 * LINK principal (RDD + NextLink)
 */
export const LINK = React.forwardRef<HTMLAnchorElement, LinkWrapperProps>(
  function LINK(
    {
      href,
      children,
      className,
      scheme,
      variant,
      size,
      state,
      kind = 'link',
      ...rest
    },
    ref
  ) {
    const Styles = useStylesRDD();
    const _scheme = scheme || detectScheme();

    // clase por tipo (link--primary, link--nav, etc.)
    const kindClass = kind ? `link--${kind}` : undefined;

    // IMPORTANTE: el key debe coincidir con el componente en el SD
    const rddClass = resolveComponentClasses(Styles, 'link', {
      baseFallback: 'link', // .link en globals.css
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    return (
      <NextLink
        href={href}
        ref={ref}
        className={cx('link', kindClass, rddClass)}
        {...rest}
      >
        {children}
      </NextLink>
    );
  }
);

/**
 * LINK2: misma API pero siempre usa el set de estilos "link2"
 */
export const LINK2 = React.forwardRef<
  HTMLAnchorElement,
  Omit<LinkWrapperProps, 'kind'>
>(function LINK2(props, ref) {
  return <LINK ref={ref} {...props} kind="link2" />;
});

LINK.displayName = 'LINK';
LINK2.displayName = 'LINK2';
