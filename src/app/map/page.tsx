"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Crosshair, MapPin, Navigation, Phone, Search, Store, Tractor } from "lucide-react";
import { api } from "@/lib/api";
import AppNav from "../components/AppNav";
import { distanceKm, directionsUrl, getDevicePosition, type LatLng, LocationsMap, type MapPoint } from "../components/map";
import { useLanguage } from "../LanguageContext";

type KindFilter = "all" | "farm" | "shop";

export default function MapPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [kind, setKind] = useState<KindFilter>("all");
  const [region, setRegion] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState(en ? "Loading map…" : "Chargement de la carte…");

  useEffect(() => {
    api
      .get<MapPoint[]>("/map/locations")
      .then((res) => {
        setPoints(res.data);
        setStatus("");
      })
      .catch(() => setStatus(en ? "Could not load locations." : "Impossible de charger les emplacements."));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const regions = useMemo(
    () => [...new Set(points.map((p) => p.region).filter(Boolean) as string[])].sort(),
    [points]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = points
      .filter((p) => kind === "all" || p.kind === kind)
      .filter((p) => !region || p.region === region)
      .filter((p) => !q || [p.name, p.city, p.location, p.farmType].some((v) => v?.toLowerCase().includes(q)))
      .map((p) => ({ ...p, distance: userPosition ? distanceKm(userPosition, p) : null }));
    if (userPosition) list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    return list;
  }, [points, kind, region, query, userPosition]);

  const locateMe = async () => {
    setLocating(true);
    try {
      setUserPosition(await getDevicePosition());
    } catch {
      setStatus(en ? "Location access was refused or unavailable." : "La localisation a été refusée ou est indisponible.");
    } finally {
      setLocating(false);
    }
  };

  const counts = {
    farm: points.filter((p) => p.kind === "farm").length,
    shop: points.filter((p) => p.kind === "shop").length
  };
  const fitKey = `${kind}|${region}|${query}|${userPosition ? "me" : ""}|${points.length}`;

  return (
    <>
      <AppNav />
      <main className="app-page map-page">
        <header className="map-head">
          <div>
            <p className="resource-kicker">OpenStreetMap</p>
            <h1>{en ? "Farms & shops map" : "Carte des fermes et boutiques"}</h1>
            <p>
              {en
                ? `${counts.farm} verified farms and ${counts.shop} shops. Find the nearest one and get directions.`
                : `${counts.farm} fermes et ${counts.shop} boutiques vérifiées. Trouvez la plus proche et obtenez l'itinéraire.`}
            </p>
          </div>
          <button type="button" className="map-locate-btn" onClick={locateMe} disabled={locating}>
            <Crosshair size={18} />
            {locating ? (en ? "Locating…" : "Localisation…") : en ? "Near me" : "Près de moi"}
          </button>
        </header>

        <div className="map-filters">
          <div className="map-segment" role="tablist" aria-label={en ? "Type" : "Type"}>
            {(["all", "farm", "shop"] as KindFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={kind === value}
                className={kind === value ? "is-active" : ""}
                onClick={() => setKind(value)}
              >
                {value === "all" ? (en ? "All" : "Tous") : value === "farm" ? (en ? "Farms" : "Fermes") : en ? "Shops" : "Boutiques"}
              </button>
            ))}
          </div>
          <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label={en ? "Region" : "Région"}>
            <option value="">{en ? "All regions" : "Toutes les régions"}</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <label className="map-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={en ? "Name, city…" : "Nom, ville…"}
              aria-label={en ? "Search" : "Rechercher"}
            />
          </label>
        </div>

        {status && <p className="map-status">{status}</p>}

        <div className="map-layout">
          <div className="map-canvas">
            <LocationsMap
              points={visible}
              lang={lang}
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p._id)}
              userPosition={userPosition}
              detailHref={(p) => (p.kind === "farm" ? `/farms/${p._id}` : `/shops/${p._id}`)}
              height="100%"
              fitKey={fitKey}
            />
            <div className="map-legend" aria-hidden="true">
              <span><i className="map-legend__dot map-legend__dot--farm" />{en ? "Farm" : "Ferme"}</span>
              <span><i className="map-legend__dot map-legend__dot--shop" />{en ? "Shop" : "Boutique"}</span>
              <span><i className="map-legend__dot map-legend__dot--approx" />{en ? "Approximate" : "Approximatif"}</span>
            </div>
          </div>

          <ul className="map-list" aria-label={en ? "Results" : "Résultats"}>
            {visible.length === 0 && !status && (
              <li className="map-list__empty">{en ? "Nothing matches these filters." : "Aucun résultat pour ces filtres."}</li>
            )}
            {visible.map((p) => (
              <li key={`${p.kind}-${p._id}`}>
                <button
                  type="button"
                  className={`map-card ${selectedId === p._id ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(p._id)}
                >
                  <span className={`map-card__icon map-card__icon--${p.kind}`}>
                    {p.kind === "farm" ? <Tractor size={18} /> : <Store size={18} />}
                  </span>
                  <span className="map-card__body">
                    <strong>{p.name}</strong>
                    <span>
                      <MapPin size={13} />
                      {[p.city, p.region].filter(Boolean).join(", ")}
                      {p.approximate && ` · ${en ? "approx." : "approx."}`}
                    </span>
                  </span>
                  {p.distance !== null && <span className="map-card__distance">{p.distance < 10 ? p.distance.toFixed(1) : Math.round(p.distance)} km</span>}
                </button>
                {selectedId === p._id && (
                  <div className="map-card__actions">
                    <Link href={p.kind === "farm" ? `/farms/${p._id}` : `/shops/${p._id}`}>{en ? "Open" : "Voir la fiche"}</Link>
                    {p.phone && (
                      <a href={`tel:${p.phone}`}>
                        <Phone size={14} />
                        {en ? "Call" : "Appeler"}
                      </a>
                    )}
                    {!p.approximate && (
                      <a href={directionsUrl(p, userPosition)} target="_blank" rel="noopener noreferrer">
                        <Navigation size={14} />
                        {en ? "Directions" : "Itinéraire"}
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
