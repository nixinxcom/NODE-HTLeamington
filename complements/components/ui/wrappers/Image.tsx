'use client';

import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { cx, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

export type ImageProps = NextImageProps &
  TrackingProps & {
    kind?: string;          // default 'image'
    variant?: string;
    size?: string;
    state?: string;
    scheme?: 'light' | 'dark';
    className?: string;
  };

export function IMAGE({
  kind = 'image',
  variant,
  size,
  state,
  scheme,
  className,
  track,
  trackCategory,
  trackView,
  trackMeta,
  ...props
}: ImageProps) {
  const { emit } = useTracking({ track, trackCategory, trackView, trackMeta });
  const { onClick, ...imgRest } = props;

  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();

  const base = resolveComponentClasses(Styles, kind, {
    baseFallback: '', // normalmente las imágenes no requieren clase base
    scheme: _scheme,
    variant,
    size,
    state,
  });

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    emit('click');
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <NextImage
      {...imgRest}
      className={cx(base, className)}
      onClick={handleClick}
    />
  );
}
