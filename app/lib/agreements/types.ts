// app/lib/agreements/types.ts
import type { Timestamp } from "firebase/firestore";

export type Faculties = {
  adminPanel: boolean;
  adminzone: boolean;
  adsense: boolean;
  advisory: boolean;
  agentAI: boolean;
  analitics: boolean;
  booking: boolean;
  branding: boolean;
  contact: boolean;
  ecommerce: boolean;
  geolocation: boolean;
  maps: boolean;
  notifications: boolean;
  payments: boolean;
  products: boolean;
  sellsplatforms: boolean;
  services: boolean;
  settings: boolean;
  socialmedia: boolean;
  styles: boolean;
  website: boolean;
};

export type LicenseInfo = {
  active: boolean;
  clientid: string;
  expiredate: Timestamp | null;   // Firestore Timestamp
  selfservice: boolean;
  suspended: boolean;
};

export interface Agreement {
  BrandName: string;
  LegalName: string;
  admins: string[];
  domain: string;
  faculties: Faculties;
  license: LicenseInfo;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
