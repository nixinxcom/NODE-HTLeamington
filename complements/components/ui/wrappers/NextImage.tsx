'use client';

import React from 'react';
import NextImage, { type ImageProps } from 'next/image';
import { cx, useStylesRDD } from './utils';
import { resolveComponentClasses } from './resolve';
import { useTracking, type TrackingProps } from './tracking';

type RDD = {
  kind?: string;
  scheme?: 'light' | 'dark';
  variant?: string;
  size?: string;
  state?: string;
  className?: string;
};

export type NextImgProps = ImageProps & RDD & TrackingProps;

const Img = React.forwardRef<HTMLImageElement, NextImgProps>(
  function Img(
    {
      kind = 'image',
      scheme,
      variant,
      size,
      state,
      className,
      track,
      trackCategory,
      trackView,
      trackMeta,
      ...imgProps
    },
    ref,
  ) {
    const { emit } = useTracking({ track, trackCategory, trackView, trackMeta });
    const { onClick, ...rest } = imgProps;

    const Styles = useStylesRDD();
    const rddClass = resolveComponentClasses(Styles, kind, {
      baseFallback: 'image',
      scheme,
      variant,
      size,
      state,
      extra: className,
    });

    const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
      emit('click');
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <NextImage
        {...rest}
        ref={ref as any}
        className={cx('image', rddClass)}
        onClick={handleClick}
      />
    );
  },
);

export default Img;
export { Img as NextImage };
