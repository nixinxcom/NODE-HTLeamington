'use client';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { useMemo, useCallback } from 'react';
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type LatLng = { lat: number; lng: number };
type Libraries = ('places' | 'geometry' | 'drawing' | 'visualization')[];

type Props = {
  apiKey?: string;
  center: LatLng;
  zoom?: number;
  markers?: LatLng[];
  /** Tamaño del contenedor */
  height?: number | string;   // ej. 360 o '24rem'
  width?: number | string;    // ej. '100%' (default)
  className?: string;         // clases del contenedor (Tailwind)
  containerStyle?: React.CSSProperties; // estilos extra del contenedor
  /** Opciones de mapa */
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  gestureHandling?: 'auto' | 'greedy' | 'cooperative' | 'none';
  disableDefaultUI?: boolean;
  clickableIcons?: boolean;
  mapId?: string; // para Cloud Map Styling
  options?: google.maps.MapOptions; // requiere @types/google.maps
  libraries?: Libraries; // libs extra (p.ej. ['places'])
  /** Comportamiento */
  fitToMarkers?: boolean; // ajusta bounds a center+markers
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onLoad?: (map: google.maps.Map) => void;
};

export default function MapGoogle({
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  center,
  zoom = 14,
  markers = [],
  height = 360,
  width = '100%',
  className = '',
  containerStyle,
  mapTypeId = 'roadmap',
  gestureHandling = 'cooperative',
  disableDefaultUI = false,
  clickableIcons = false,
  mapId,
  options,
  libraries = ['places'],
  fitToMarkers = false,
  onClick,
  onLoad,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    id: 'gmap',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const style = useMemo<React.CSSProperties>(() => ({
    width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: '16px',
    overflow: 'hidden',
    ...containerStyle,
  }), [width, height, containerStyle]);

  const handleLoad = useCallback((map: google.maps.Map) => {
    if (fitToMarkers) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(center);
      markers.forEach(m => bounds.extend(m));
      map.fitBounds(bounds);
    }
    onLoad?.(map);
  }, [fitToMarkers, center, markers, onLoad]);

  if (!isLoaded) return <div className={`bg-gray-100 ${className}`} style={style} />;

  return (
    <GoogleMap
      mapContainerStyle={style}
      center={center}
      zoom={zoom}
      onLoad={handleLoad}
      onClick={onClick}
      options={{
        mapId,
        disableDefaultUI,
        clickableIcons,
        gestureHandling,
        mapTypeId,
        ...options,
      }}
    >
      {[center, ...markers].map((m, i) => <MarkerF key={i} position={m} />)}
    </GoogleMap>
  );
}