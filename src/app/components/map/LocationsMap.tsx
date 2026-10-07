"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { CAMEROON_VIEW, directionsUrl, type LatLng, type MapPoint, OSM_TILES } from "./geo";
import { pinIcon } from "./map-icons";

type Props = {
  points: MapPoint[];
  lang: string;
  selectedId?: string | null;
  onSelect?: (point: MapPoint) => void;
  userPosition?: LatLng | null;
  /** Link for "open the listing" in popups; return null to hide it. */
  detailHref?: (point: MapPoint) => string | null;
  height?: number | string;
  /** Fit the view to the points whenever this value changes. */
  fitKey?: string;
};

function FitToPoints({ points, userPosition, fitKey }: { points: MapPoint[]; userPosition?: LatLng | null; fitKey?: string }) {
  const map = useMap();
  useEffect(() => {
    const coords: [number, number][] = points.map((p) => [p.latitude, p.longitude]);
    if (userPosition) coords.push([userPosition.latitude, userPosition.longitude]);
    if (coords.length === 0) {
      map.setView(CAMEROON_VIEW.center, CAMEROON_VIEW.zoom);
    } else if (coords.length === 1) {
      map.setView(coords[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 14 });
    }
    // Only refit when the caller says the set changed, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);
  return null;
}

function FlyToSelected({ point }: { point?: MapPoint }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.latitude, point.longitude], Math.max(map.getZoom(), 13), { duration: 0.6 });
  }, [map, point]);
  return null;
}

export default function LocationsMap({
  points,
  lang,
  selectedId,
  onSelect,
  userPosition,
  detailHref,
  height = 520,
  fitKey
}: Props) {
  const en = lang === "en";
  const selected = points.find((p) => p._id === selectedId);

  return (
    <MapContainer
      center={CAMEROON_VIEW.center}
      zoom={CAMEROON_VIEW.zoom}
      scrollWheelZoom
      className="osm-map"
      style={{ height }}
    >
      <TileLayer url={OSM_TILES.url} attribution={OSM_TILES.attribution} maxZoom={OSM_TILES.maxZoom} />
      <FitToPoints points={points} userPosition={userPosition} fitKey={fitKey} />
      <FlyToSelected point={selected} />

      {userPosition && (
        <>
          <Circle
            center={[userPosition.latitude, userPosition.longitude]}
            radius={120}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.25, weight: 2 }}
          />
          <Marker position={[userPosition.latitude, userPosition.longitude]} icon={pinIcon("user")}>
            <Popup>{en ? "You are here" : "Vous êtes ici"}</Popup>
          </Marker>
        </>
      )}

      {points.map((point) => {
        const href = detailHref?.(point);
        return (
          <Marker
            key={`${point.kind}-${point._id}`}
            position={[point.latitude, point.longitude]}
            icon={pinIcon(point.kind, { approximate: point.approximate, selected: point._id === selectedId })}
            eventHandlers={{ click: () => onSelect?.(point) }}
          >
            <Popup>
              <div className="map-popup">
                <span className={`map-popup__kind map-popup__kind--${point.kind}`}>
                  {point.kind === "farm" ? (en ? "Farm" : "Ferme") : en ? "Shop" : "Boutique"}
                  {point.verificationStatus && point.verificationStatus !== "approved" && ` · ${point.verificationStatus}`}
                </span>
                <strong>{point.name}</strong>
                <span>{[point.location, point.city, point.region].filter(Boolean).join(", ")}</span>
                {point.ownerName && <span>👤 {point.ownerName}</span>}
                {point.phone && <a href={`tel:${point.phone}`}>☎ {point.phone}</a>}
                {point.approximate && (
                  <em>{en ? "Approximate position (city or region)" : "Position approximative (ville ou région)"}</em>
                )}
                <div className="map-popup__actions">
                  {href && <a href={href}>{en ? "Open" : "Voir la fiche"}</a>}
                  {!point.approximate && (
                    <a href={directionsUrl(point, userPosition)} target="_blank" rel="noopener noreferrer">
                      {en ? "Directions" : "Itinéraire"}
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
