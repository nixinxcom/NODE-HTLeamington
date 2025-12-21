import type { MediaSlide } from '@/complements/components/AutoMediaCarousel/AutoMediaCarousel';

export type Translatable = string | Record<string, string>;

export type ServiceStatus = 'draft' | 'active' | 'archived';
export type ServiceLevel =
  | 'standard'
  | 'premium'
  | 'gold'
  | 'platinum'
  | 'custom';

export type ServiceBookingMode = 'none' | 'request' | 'instant';

export type ServicePriceType =
  | 'fixed'
  | 'startingAt'
  | 'quote'
  | 'free'
  | 'subscription';

export type ServicePriceUnit =
  | 'per_session'
  | 'per_hour'
  | 'per_day'
  | 'per_person'
  | 'per_booking'
  | 'per_month';

export type ServiceLocationMode =
  | 'on_site'
  | 'remote'
  | 'at_customer'
  | 'hybrid';

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type ServiceCtaAction =
  | 'book'
  | 'call'
  | 'whatsapp'
  | 'email'
  | 'openLink';

export type ServiceLinkType =
  | 'website'
  | 'booking'
  | 'menu'
  | 'brochure'
  | 'other';

export type ComparableSpec = {
  key: string;
  label: Translatable;
  value: Translatable;
  unit?: string;
  comparable?: boolean;
  order?: number;
};

export type ServicePackage = {
  packageId: string;
  name: Translatable;
  description?: Translatable;
  durationMinutes?: number;
  price?: number;
};

export type ServicePricing = {
  priceType?: ServicePriceType;
  currency?: string;
  basePrice?: number;
  unit?: ServicePriceUnit;
  taxIncluded?: boolean;
  depositRequired?: boolean;
  depositAmount?: number;
};

export type ServiceDuration = {
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
};

export type ServiceWeeklyInterval = {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  capacity?: number;
};

export type ServiceWeeklyDay = {
  dayOfWeek: WeekDay;
  enabled?: boolean;
  intervals?: ServiceWeeklyInterval[];
};

export type ServiceDateOverride = {
  date: string; // "YYYY-MM-DD"
  closed?: boolean;
  reason?: Translatable;
  intervals?: ServiceWeeklyInterval[];
};

export type ServiceBlackoutDate = {
  date: string; // "YYYY-MM-DD"
  reason?: Translatable;
};

export type ServiceAvailability = {
  timezone?: string;
  bookingMode?: ServiceBookingMode;
  leadTimeHours?: number;
  maxAdvanceDays?: number;
  capacityPerSlot?: number;
  weeklySchedule?: ServiceWeeklyDay[];
  dateOverrides?: ServiceDateOverride[];
  blackoutDates?: ServiceBlackoutDate[];
};

export type ServiceLocation = {
  mode?: ServiceLocationMode;
  address?: Translatable;
  notes?: Translatable;
};

export type ServiceLink = {
  label: Translatable;
  url: string;
  type?: ServiceLinkType;
};

export type ServiceCta = {
  primaryLabel?: Translatable;
  primaryAction?: ServiceCtaAction;
  primaryUrl?: string;
  secondaryLabel?: Translatable;
  secondaryUrl?: string;
};

export type ServiceFlags = {
  featured?: boolean;
  allowFavorites?: boolean;
  allowCart?: boolean;
  allowCompare?: boolean;
  allowReviews?: boolean;
};

export type ServiceMedia = {
  cover?: string;
  slider?: MediaSlide[];
  gallery?: Array<Pick<MediaSlide, 'kind' | 'src' | 'alt'>>;
};

export type Service = {
  serviceId: string;
  status?: ServiceStatus;
  name?: Translatable;
  slug?: string;
  summary?: Translatable;
  description?: Translatable;
  categories?: string[];
  tags?: string[];

  serviceLevel?: ServiceLevel;
  customLevelLabel?: Translatable;

  media?: ServiceMedia;
  links?: ServiceLink[];
  packages?: ServicePackage[];

  pricing?: ServicePricing;
  duration?: ServiceDuration;
  availability?: ServiceAvailability;
  location?: ServiceLocation;
  specs?: ComparableSpec[];

  cta?: ServiceCta;
  flags?: ServiceFlags;

  relatedServiceIds?: string[];
  relatedProductIds?: string[];
};

export type ServicesDoc = {
  services: Service[];
};
