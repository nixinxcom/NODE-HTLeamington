  // Acepta <FM /> o string por defecto; para datos serializables usa iBranding<UIString>
  export type UIString = string | JSX.Element; // acepta <FM /> o string por defecto
  export interface Branch {
    name: UIString;
    url: string;
    icon?: string;
  }
  export type SocialMediaName = "facebook" | "instagram" | "tiktok" | "youtube" | "linkedin" | "twitter" | "twitch" | "discord" | "snapchat" | "telegram" | "pinterest" | string;
  export type sellsplatforms = "onlineorder" | "uber" | "doordash" | "skipthedishes" | "amazon" | "tripadvisor" | "airbnb" | "booking" | "etsy" | "shopify" | "wix" | "squarespace" | "magento" | "bigcommerce" | string;

  export default interface iBranding<TText = UIString> {
    company: {
      legalName?: TText;
      brandName?: TText;
      logo?: string;
      tagline?: TText;
      contact?: {
        website?: string;
        phone?: string;
        email?: string;
        address?: {
          street?: string,
          number?: string,
          interior?: string,
          city?: string,
          state?: string,
          zip?: string,
          country?: string,
        }
      },
      terms?: string;
      privacy?: string;
      mission?: TText;
      vision?: TText;
      values?: TText[];
      branches?: Branch[];
      [k: string]: any; // ← extensible para cada cliente 
    };
    agentAI?: {
      name: string;
      displayName: TText;
      role: TText;
      description?: TText;
      tone?: TText;
      greeting?: TText;
      farewell?: TText;
      unknown_response?: TText;
      fallback_when_unsure?: TText;
    };
    socials?: Array<{name: SocialMediaName; url: string; username?: string; icon?: string;}>;
    platforms?: Array<{name: sellsplatforms; url: string; icon?: string;}>;
    contact?: {
      address?: {
        intNumber?: string;
        extNumber?: string;
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
        lat?: number;
        lng?: number;
        zoom?: number;
      };
      phone?: string;
      email?: string;
      whatsapp?: string;
      map?: string;
      directions?: string;
      google?: string;
      googleMaps?: string;
    };
    schedule: Array<{
      day: TText;
      open: string | null;
      close: string | null;
      closed?: boolean;
    }>;
    holidays?: Array<{
      name: TText;
      date: string;
    }>;
    products?: Array<{
      prodName: TText;
      description: TText;
      price: string;
      image?: string;
      video?: string;
      gallery?: string[];
      url?: string;
      category?: string;
      subcategory?: string;
    }>;
    services?: Array<{
      servName: TText;
      description: TText;
      price: string;
      image?: string;
      video?: string;
      gallery?: string[];
      url?: string;
    }>;
    more?: {
      [k: string]: any;  // espacio para futuras expansiones
    };
  }
