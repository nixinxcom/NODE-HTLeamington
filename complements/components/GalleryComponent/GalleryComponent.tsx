// components/GalleryGrid.tsx
"use client";

import Image from "next/image";
import styles from "./GalleryComponent.module.css";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type GalleryGridProps = {
  images: string[];
  onImageClick?: (index: number) => void; // Nuevo prop
};

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, onImageClick }) => {
  return (
    <div className={styles.masonry}>
      {images.map((src, index) => (
        <div
          key={index}
          className={styles.item}
          onClick={() => onImageClick && onImageClick(index)} // Solo si hay función
          role="button"
        >
          <Image
            src={src}
            alt={`Gallery image ${index + 1}`}
            width={500}
            height={500}
            className={styles.image}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;