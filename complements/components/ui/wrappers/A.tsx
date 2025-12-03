'use client';

import * as React from 'react';
import { isExternalHref, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type AProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  TrackingProps & {
    kind?: string;          // default 'link'
    variant?: string;
    size?: string;
    state?: string;
    scheme?: 'light' | 'dark';
  };

export const A = React.forwardRef<HTMLAnchorElement, AProps>(function A(
  {
    kind = 'link',
    variant,
    size,
    state,
    scheme,
    className,
    href = '#',
    track,
    trackCategory,
    trackView,
    trackMeta,
    ...rest
  },
  ref,
) {
  const { emit } = useTracking({ track, trackCategory, trackView, trackMeta });

  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();
  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: kind === 'link' ? 'link' : '',
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  const { onClick, ...aRest } = rest;

  const external = isExternalHref(href);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    emit('click');
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a
      ref={ref}
      href={href}
      className={classes}
      target={external ? '_blank' : aRest.target}
      rel={external ? 'noopener noreferrer' : aRest.rel}
      onClick={handleClick}
      {...aRest}
    />
  );
});
