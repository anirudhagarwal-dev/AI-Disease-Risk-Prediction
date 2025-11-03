/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_TWILIO_ACCOUNT_SID: string;
  readonly VITE_TWILIO_AUTH_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google: typeof google;
}

declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
    panTo(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    addListener(eventName: string, handler: Function): void;
  }

  namespace places {
    class PlacesService {
      constructor(attrContainer: HTMLDivElement | Map);
      nearbySearch(
        request: PlaceSearchRequest,
        callback: (
          results: PlaceResult[] | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
    }

    enum PlacesServiceStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
    }

    interface PlaceResult {
      place_id?: string;
      name?: string;
      vicinity?: string;
      formatted_phone_number?: string;
      rating?: number;
      geometry?: {
        location?: {
          lat(): number;
          lng(): number;
        };
      };
    }

    interface PlaceSearchRequest {
      location: LatLng | LatLngLiteral;
      radius: number;
      type?: string;
    }
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    styles?: any[];
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: any;
  }

  namespace SymbolPath {
    const CIRCLE: any;
  }
}
