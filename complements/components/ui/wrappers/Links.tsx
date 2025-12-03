'use client';

import * as React from 'react';
import NextLink, { type LinkProps } from 'next/link';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

type RDDProps = {
  scheme?: 'light' | 'dark';
  variant?: string;
  size?: string;
  state?: string;
  kind?: 'link' | 'link2' | string;
  className?: string;
};

export type LinkWrapperProps = LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> &
  RDDProps &
  TrackingProps;

export const LINK = React.forwardRef<HTMLAnchorElement, LinkWrapperProps>(
  function LINK(
    {
      kind = 'link',
      variant,
      size,
      state,
      scheme,
      className,
      href,
      track,
      trackCategory,
      trackView,
      trackMeta,
      ...rest
    },
    ref,
  ) {
    const { emit } = useTracking({ track, trackCategory, trackView, trackMeta });
    const { onClick, ...aRest } = rest;

    const Styles = useStylesRDD();
    const _scheme = scheme || detectScheme();

    const classes = resolveComponentClasses(Styles, kind, {
      baseFallback: 'link',
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      emit('click');
      if (onClick) onClick(e);
    };

    return (
      <NextLink
        ref={ref}
        href={href ?? '#'}
        className={classes}
        onClick={handleClick}
        {...aRest}
      />
    );
  },
);

/** LINK2: alias que fuerza kind="link2" */
export const LINK2 = React.forwardRef<
  HTMLAnchorElement,
  Omit<LinkWrapperProps, 'kind'>
>(function LINK2(props, ref) {
  return <LINK ref={ref} {...props} kind="link2" />;
});

LINK.displayName = 'LINK';
LINK2.displayName = 'LINK2';
