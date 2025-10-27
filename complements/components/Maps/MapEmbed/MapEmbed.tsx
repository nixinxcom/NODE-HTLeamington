type MapType = 'roadmap' | 'satellite';
type Mode = 'view' | 'streetview' | 'place' | 'search' | 'directions';

type Props = {
  apiKey?: string;                // usa NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY si no pasas
  mode?: Mode;

  // Coords
  lat?: number; lng?: number;

  // VIEW
  zoom?: number; mapType?: MapType;

  // STREET VIEW
  heading?: number; pitch?: number; fov?: number;

  // PLACE / SEARCH
  q?: string; placeId?: string;

  // DIRECTIONS
  origin?: string; destination?: string; waypoints?: string;

  // Localización
  language?: string; region?: string;

  // Tamaño del contenedor (solo inline styles)
  height?: number | string;       // 360 | '24rem' | '60vh' | '100%'
  width?: number | string;        // '100%' | 600
  containerStyle?: React.CSSProperties;

  // Interacción
  blockInteraction?: boolean;

  // Iframe / firma
  title?: string; allowFullScreen?: boolean;
  signedSrcOverride?: string;     // si firmas la URL en servidor
};

function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }
function wrap360(n: number) { return ((n % 360) + 360) % 360; }

export default function MapEmbed({
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_NOT_RESTRICTED_API_KEY!,
  mode = 'view',
  lat, lng,
  zoom = 15, mapType = 'roadmap',
  heading = 0, pitch = 0, fov = 80,
  q, placeId, origin, destination, waypoints,
  language, region,
  height = 360, width = '100%', containerStyle,
  blockInteraction = true,
  title = 'Mapa', allowFullScreen = false,
  signedSrcOverride,
}: Props) {
  const base = 'https://www.google.com/maps/embed/v1/';
  const p = new URLSearchParams({ key: apiKey });
  if (language) p.set('language', language);
  if (region) p.set('region', region);

  let path = '';
  switch (mode) {
    case 'view':
      if (lat == null || lng == null) throw new Error('lat/lng requeridos en mode="view"');
      p.set('center', `${lat},${lng}`); p.set('zoom', String(zoom)); p.set('maptype', mapType);
      path = 'view'; break;
    case 'streetview':
      if (lat == null || lng == null) throw new Error('lat/lng requeridos en mode="streetview"');
      p.set('location', `${lat},${lng}`);
      p.set('heading', String(wrap360(heading)));
      p.set('pitch', String(clamp(pitch, -45, 45)));
      p.set('fov', String(clamp(fov, 10, 120)));
      path = 'streetview'; break;
    case 'place':
      if (placeId) p.set('q', `place_id:${placeId}`); else if (q) p.set('q', q); else throw new Error('q o placeId requeridos en mode="place"');
      path = 'place'; break;
    case 'search':
      if (q) p.set('q', q); else if (lat!=null && lng!=null) p.set('q', `${lat},${lng}`); else throw new Error('q o lat/lng requeridos en mode="search"');
      path = 'search'; break;
    case 'directions':
      if (!origin || !destination) throw new Error('origin y destination requeridos en mode="directions"');
      p.set('origin', origin); p.set('destination', destination); if (waypoints) p.set('waypoints', waypoints);
      path = 'directions'; break;
  }

  const src = signedSrcOverride ?? `${base}${path}?${p.toString()}`;

  // Wrapper con altura/anchura reales y el iframe a full por absolute
  const h = typeof height === 'number' ? `${height}px` : height;
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height: h,
    minHeight: h,                 // evita que grid/flex lo achiquen
    overflow: 'hidden',
    ...containerStyle,
  };

  return (
    <div style={wrapperStyle}>
    <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0, display:'block', aspectRatio:'auto' }}
        allowFullScreen={allowFullScreen}
      />
      {blockInteraction && (
        <div style={{ position:'absolute', inset:0, cursor:'default' }} aria-hidden />
      )}
    </div>
  );
}