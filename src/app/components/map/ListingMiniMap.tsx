"use client";

import Link from "next/link";
import { Map as MapIcon, Navigation } from "lucide-react";
import { directionsUrl, LocationsMap, type MapPoint } from "./index";

/** Small map of one farm or shop on its public page. Hidden until the owner saves a position. */
export default function ListingMiniMap({
  listing,
  kind,
  lang
}: {
  listing: { _id: string; name: string; location?: string; city?: string; region?: string; phone?: string; coordinates?: { latitude: number; longitude: number } };
  kind: "farm" | "shop";
  lang: string;
}) {
  const en = lang === "en";
  const c = listing.coordinates;
  if (!c || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) return null;

  const point: MapPoint = {
    _id: listing._id,
    kind,
    name: listing.name,
    location: listing.location,
    city: listing.city,
    region: listing.region,
    phone: listing.phone,
    latitude: c.latitude,
    longitude: c.longitude,
    approximate: false
  };

  return (
    <div className="listing-map">
      <LocationsMap points={[point]} lang={lang} height={220} fitKey={listing._id} />
      <div className="listing-map__actions">
        <a href={directionsUrl(point)} target="_blank" rel="noopener noreferrer">
          <Navigation size={15} />
          {en ? "Directions" : "Itinéraire"}
        </a>
        <Link href="/map">
          <MapIcon size={15} />
          {en ? "See all on the map" : "Voir sur la carte"}
        </Link>
      </div>
    </div>
  );
}
