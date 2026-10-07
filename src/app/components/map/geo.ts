// Map types and helpers that are safe to use during server rendering (no Leaflet here).

export type MapPoint = {
  _id: string;
  kind: "farm" | "shop";
  name: string;
  farmType?: string;
  description?: string;
  location?: string;
  city?: string;
  region?: string;
  phone?: string;
  image?: string;
  latitude: number;
  longitude: number;
  /** True when the owner has not saved a position and we placed it at their city/region. */
  approximate: boolean;
  verificationStatus?: string;
  status?: string;
  ownerName?: string;
};

export type LatLng = { latitude: number; longitude: number };

// OpenStreetMap's standard tiles. Their usage policy requires this attribution.
export const OSM_TILES = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
};

/** Roughly the middle of Cameroon, zoomed to show the whole country. */
export const CAMEROON_VIEW = { center: [5.7, 12.4] as [number, number], zoom: 6 };

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** OpenStreetMap directions from the viewer (if known) to a point. */
export function directionsUrl(to: LatLng, from?: LatLng | null) {
  const origin = from ? `${from.latitude},${from.longitude}` : "";
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin};${to.latitude},${to.longitude}`;
}

/** Asks the browser for the device position. */
export function getDevicePosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}
