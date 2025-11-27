import type React from "react";
type MapType = "roadmap" | "satellite";
type Mode = "view" | "streetview" | "place" | "search" | "directions";
import {
  BUTTON,
  LINK,
  BUTTON2,
  LINK2,
  NEXTIMAGE,
  IMAGE,
  DIV,
  DIV2,
  DIV3,
  INPUT,
  SELECT,
  LABEL,
  INPUT2,
  SELECT2,
  LABEL2,
  SPAN,
  SPAN1,
  SPAN2,
  A,
  B,
  P,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
} from "@/complements/components/ui/wrappers";

type Props = {
  apiKey?: string;
  mode?: Mode;

  // Coords
  lat?: number;
  lng?: number;

  // VIEW
  zoom?: number;
  mapType?: MapType;

  // STREET VIEW
  heading?: number;
  pitch?: number;
  fov?: number;

  // PLACE / SEARCH
  q?: string;
  placeId?: string;

  // DIRECTIONS
  origin?: string;
  destination?: string;
  waypoints?: string;

  // Localización
  language?: string;
  region?: string;

  // Tamaño del contenedor (solo inline styles)
  height?: number | string;
  width?: number | string;
  containerStyle?: React.CSSProperties;

  // Interacción
  blockInteraction?: boolean;

  // Iframe / firma
  title?: string;
  allowFullScreen?: boolean;
  signedSrcOverride?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function wrap360(n: number) {
  return ((n % 360) + 360) % 360;
}

export default function MapEmbed({
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_UNRESTRICTED_KEY!,
  mode = "view",
  lat,
  lng,
  zoom = 15,
  mapType = "roadmap",
  heading = 0,
  pitch = 0,
  fov = 80,
  q,
  placeId,
  origin,
  destination,
  waypoints,
  language,
  region,
  height = 360,
  width = "100%",
  containerStyle,
  blockInteraction = true,
  title = "Mapa",
  allowFullScreen = false,
  signedSrcOverride,
}: Props) {
  const base = "https://www.google.com/maps/embed/v1/";
  const p = new URLSearchParams({ key: apiKey });
  if (language) p.set("language", language);
  if (region) p.set("region", region);

  let path = "";

  switch (mode) {
    case "view": {
      if (lat == null || lng == null) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            'MapEmbed: lat/lng faltan en mode="view"; no se renderiza el mapa.',
          );
        }
        return null;
      }
      p.set("center", `${lat},${lng}`);
      p.set("zoom", String(zoom));
      p.set("maptype", mapType);
      path = "view";
      break;
    }

    case "streetview": {
      if (lat == null || lng == null) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            'MapEmbed: lat/lng faltan en mode="streetview"; no se renderiza el mapa.',
          );
        }
        return null;
      }
      p.set("location", `${lat},${lng}`);
      p.set("heading", String(wrap360(heading)));
      p.set("pitch", String(clamp(pitch, -45, 45)));
      p.set("fov", String(clamp(fov, 10, 120)));
      path = "streetview";
      break;
    }

    case "place": {
      if (placeId) {
        p.set("q", `place_id:${placeId}`);
      } else if (q) {
        p.set("q", q);
      } else {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            'MapEmbed: q/placeId faltan en mode="place"; no se renderiza el mapa.',
          );
        }
        return null;
      }
      path = "place";
      break;
    }

    case "search": {
      if (q) {
        p.set("q", q);
      } else if (lat != null && lng != null) {
        p.set("q", `${lat},${lng}`);
      } else {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            'MapEmbed: q o lat/lng faltan en mode="search"; no se renderiza el mapa.',
          );
        }
        return null;
      }
      path = "search";
      break;
    }

    case "directions": {
      if (!origin || !destination) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            'MapEmbed: origin/destination faltan en mode="directions"; no se renderiza el mapa.',
          );
        }
        return null;
      }
      p.set("origin", origin);
      p.set("destination", destination);
      if (waypoints) p.set("waypoints", waypoints);
      path = "directions";
      break;
    }
  }

  if (!path) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("MapEmbed: mode inválido o no soportado; no se renderiza.");
    }
    return null;
  }

  const src = signedSrcOverride ?? `${base}${path}?${p.toString()}`;

  const h = typeof height === "number" ? `${height}px` : height;
  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    width,
    height: h,
    minHeight: h,
    overflow: "hidden",
    ...containerStyle,
  };

  return (
    <div style={wrapperStyle}>
      <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
          aspectRatio: "auto",
        }}
        allowFullScreen={allowFullScreen}
      />
      {blockInteraction && (
        <div
          style={{ position: "absolute", inset: 0, cursor: "default" }}
          aria-hidden
        />
      )}
    </div>
  );
}
