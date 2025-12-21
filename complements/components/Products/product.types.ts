export type ProductStatus = 'draft' | 'active' | 'archived';
export type ProductVisibility = 'public' | 'private' | 'unlisted';

export type SlideKind = 'image' | 'gif' | 'video';

export interface ProductSlide {
  kind: SlideKind;
  /** URL directa (https://... o /local) */
  src?: string;
  /** Ruta en Storage (ej: products/media/...) */
  storagePath?: string;
  /** Poster opcional para video */
  posterStoragePath?: string;
  alt?: string;
  caption?: string;
  durationMs?: number;
  href?: string;
  target?: '_self' | '_blank';
}

export interface ProductVideo {
  platform?: 'youtube' | 'vimeo' | 'self' | 'other';
  url?: string;
  storagePath?: string;
  caption?: string;
}

export interface ProductSpec {
  group?: string;
  key: string;
  value: string;
  unit?: string;
  comparable?: boolean;
  order?: number;
}

export interface ProductPricing {
  currency?: string;
  price?: number;
  salePrice?: number;
  compareAt?: number;
  taxIncluded?: boolean;
  unitLabel?: string;
}

export interface ProductInventory {
  trackStock?: boolean;
  stock?: number;
  lowStockThreshold?: number;
}

export interface ProductDimensions {
  weight?: number;
  weightUnit?: 'g' | 'kg' | 'lb';
  length?: number;
  width?: number;
  height?: number;
  dimUnit?: 'cm' | 'in' | 'mm';
}

export interface ProductOptionDef {
  name: string; // e.g. "Size" | "Color" | "Material"
  values?: string[];
}

export interface ProductOptionPair {
  name: string;
  value: string;
}

export interface ProductVariant {
  variantId: string;
  sku?: string;
  isDefault?: boolean;
  isActive?: boolean;
  optionValues?: ProductOptionPair[];
  price?: number;
  salePrice?: number;
  stock?: number;
  image?: string; // url o storage path
}

export interface ProductLink {
  label: string;
  url: string;
  kind?: 'external' | 'manual' | 'spec' | 'warranty';
  newTab?: boolean;
}

export type ProductCtaAction =
  | 'add_to_cart'
  | 'buy_now'
  | 'favorite'
  | 'link'
  | 'phone'
  | 'email';

export interface ProductCTA {
  label: string;
  action: ProductCtaAction;
  href?: string;
  style?: 'primary' | 'secondary' | 'ghost';
}

export interface ProductUI {
  sliderAutoplay?: boolean;
  sliderIntervalMs?: number;
  allowCart?: boolean;
  allowFavorites?: boolean;
  allowCompare?: boolean;
}

export interface Product {
  productId: string;
  sku?: string;
  slug?: string;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  createdAt?: string;
  updatedAt?: string;

  title: string;
  subtitle?: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  tags?: string[];
  categories?: string[];

  slider?: ProductSlide[];
  gallery?: string[]; // urls o rutas storage
  videos?: ProductVideo[];

  advantages?: string[];
  features?: string[];
  specs?: ProductSpec[];

  pricing?: ProductPricing;
  inventory?: ProductInventory;
  dimensions?: ProductDimensions;

  optionDefs?: ProductOptionDef[];
  variants?: ProductVariant[];

  links?: ProductLink[];
  ctas?: ProductCTA[];
  ui?: ProductUI;

  relatedProductIds?: string[];
}
