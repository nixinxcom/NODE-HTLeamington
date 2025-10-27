import type { GeolocationPayload } from "./GeolocationComp";

type Props = {
  setState: (v: GeolocationPayload) => void;
  Msg_denied: string;
  Msg_unavailable: string;
  Msg_timeout: string;
  Msg_unknown: string;
  Msg_not_supported: string;
};

export default function enableGeolocation(props: Props) {
  if (typeof window === "undefined") return;

  if (!("geolocation" in navigator)) {
    props.setState({ error: props.Msg_not_supported, code: -1 });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      props.setState({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        datenow: new Date(position.timestamp),
        locale: navigator.language,
        lngs: navigator.languages,
        // OJO: si verdaderamente usas una API externa, evita exponer keys públicas:
        // usa un endpoint /api como proxy en lugar de NEXT_PUBLIC_*
        key: process.env.NEXT_PUBLIC_GEOLOCATION_APIKEY,
      });
    },
    (error) => {
      let message: string;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = props.Msg_denied;
          break;
        case error.POSITION_UNAVAILABLE:
          message = props.Msg_unavailable;
          break;
        case error.TIMEOUT:
          message = props.Msg_timeout;
          break;
        default:
          message = props.Msg_unknown;
          break;
      }
      props.setState({ error: message, code: error.code });
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }
  );
}