"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import type { Marker as LeafletMarker } from "leaflet";
import { Crosshair, Trash2 } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { CAMEROON_VIEW, getDevicePosition, type LatLng, OSM_TILES } from "./geo";
import { pinIcon } from "./map-icons";

type Props = {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
  lang: string;
  height?: number;
};

const round = (n: number) => Math.round(n * 1e5) / 1e5;

function ClickToPlace({ onPick }: { onPick: (value: LatLng) => void }) {
  useMapEvents({
    click: (event) => onPick({ latitude: round(event.latlng.lat), longitude: round(event.latlng.lng) })
  });
  return null;
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 15));
    // Recenter only when the position comes from outside the map (GPS or typed values).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, value?.latitude, value?.longitude]);
  return null;
}

/**
 * Lets an owner set the exact position of their farm or shop: tap the map, drag the pin,
 * use the phone's GPS, or type the coordinates.
 */
export default function LocationPicker({ value, onChange, lang, height = 320 }: Props) {
  const en = lang === "en";
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const useDevicePosition = async () => {
    setLocating(true);
    setError("");
    try {
      const position = await getDevicePosition();
      onChange({ latitude: round(position.latitude), longitude: round(position.longitude) });
    } catch {
      setError(
        en
          ? "Could not get your position. Allow location access, or tap the map instead."
          : "Impossible d'obtenir votre position. Autorisez la localisation, ou touchez la carte."
      );
    } finally {
      setLocating(false);
    }
  };

  const setField = (field: keyof LatLng, raw: string) => {
    const n = Number(raw);
    if (raw === "" || !Number.isFinite(n)) return;
    onChange({ latitude: value?.latitude ?? CAMEROON_VIEW.center[0], longitude: value?.longitude ?? CAMEROON_VIEW.center[1], [field]: n });
  };

  return (
    <div className="location-picker">
      <div className="location-picker__bar">
        <button type="button" className="location-picker__btn" onClick={useDevicePosition} disabled={locating}>
          <Crosshair size={16} />
          {locating ? (en ? "Locating…" : "Localisation…") : en ? "Use my current position" : "Utiliser ma position actuelle"}
        </button>
        {value && (
          <button type="button" className="location-picker__btn location-picker__btn--ghost" onClick={() => onChange(null)}>
            <Trash2 size={15} />
            {en ? "Remove" : "Retirer"}
          </button>
        )}
      </div>
      <p className="location-picker__hint">
        {en
          ? "Stand at the farm or shop and use your position, or tap the map and drag the pin to the exact place."
          : "Placez-vous sur place et utilisez votre position, ou touchez la carte et déplacez l'épingle au bon endroit."}
      </p>

      <MapContainer
        center={value ? [value.latitude, value.longitude] : CAMEROON_VIEW.center}
        zoom={value ? 15 : CAMEROON_VIEW.zoom}
        scrollWheelZoom
        className="osm-map"
        style={{ height }}
      >
        <TileLayer url={OSM_TILES.url} attribution={OSM_TILES.attribution} maxZoom={OSM_TILES.maxZoom} />
        <ClickToPlace onPick={onChange} />
        <Recenter value={value} />
        {value && (
          <Marker
            position={[value.latitude, value.longitude]}
            icon={pinIcon("pick")}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = (event.target as LeafletMarker).getLatLng();
                onChange({ latitude: round(lat), longitude: round(lng) });
              }
            }}
          />
        )}
      </MapContainer>

      <div className="location-picker__coords">
        <label>
          <span>Latitude</span>
          <input
            type="number"
            step="0.00001"
            min={-90}
            max={90}
            value={value?.latitude ?? ""}
            onChange={(e) => setField("latitude", e.target.value)}
            placeholder="4.05110"
          />
        </label>
        <label>
          <span>Longitude</span>
          <input
            type="number"
            step="0.00001"
            min={-180}
            max={180}
            value={value?.longitude ?? ""}
            onChange={(e) => setField("longitude", e.target.value)}
            placeholder="9.76790"
          />
        </label>
      </div>
      {error && <p className="form-error-banner">{error}</p>}
    </div>
  );
}
