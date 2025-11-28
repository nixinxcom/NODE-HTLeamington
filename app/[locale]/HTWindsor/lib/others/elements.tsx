'use client'

import { JSX } from "react";

export type ImageSrc = {
  source : string;
  title : string;
  className? : string;
}

export default function ImageSrcComp( props : {imgSrc : ImageSrc} ) : JSX.Element {
  return (
    <img 
      src={props.imgSrc.source} 
      alt={props.imgSrc.title} 
      className={props.imgSrc.className}
    />
  ); 
}