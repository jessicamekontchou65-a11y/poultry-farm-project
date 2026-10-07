"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { LocationsMap, type MapPoint } from "../../components/map";

type StatusFilter = "all" | "approved" | "pending" | "rejected";

/** Every farm and shop on one map, including those awaiting review. */
export default function AdminMap({ token, lang }: { token: string | null; lang: string }) {
  const en = lang === "en";
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [withoutPosition, setWithoutPosition] = useState(0);
  const [kind, setKind] = useState<"all" | "farm" | "shop">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .get<MapPoint[]>("/admin/map/locations", token)
      .then((res) => {
        setPoints(res.data);
        setWithoutPosition(((res as unknown as { meta?: { withoutPosition?: number } }).meta?.withoutPosition) ?? 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [token]);

  const visible = useMemo(
    () =>
      points
        .filter((p) => kind === "all" || p.kind === kind)
        .filter((p) => status === "all" || p.verificationStatus === status),
    [points, kind, status]
  );
  const approximate = visible.filter((p) => p.approximate).length;

  return (
    <div className="kca">
      <div className="kca-toolbar">
        <div className="kca-filters">
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label={en ? "Type" : "Type"}>
            <option value="all">{en ? "Farms and shops" : "Fermes et boutiques"}</option>
            <option value="farm">{en ? "Farms" : "Fermes"}</option>
            <option value="shop">{en ? "Shops" : "Boutiques"}</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} aria-label={en ? "Status" : "Statut"}>
            <option value="all">{en ? "All statuses" : "Tous les statuts"}</option>
            <option value="approved">{en ? "Approved" : "Approuvés"}</option>
            <option value="pending">{en ? "Pending" : "En attente"}</option>
            <option value="rejected">{en ? "Rejected" : "Refusés"}</option>
          </select>
        </div>
        <p className="kca-hint">
          {en
            ? `${visible.length} on the map · ${approximate} approximate (no exact position saved)`
            : `${visible.length} sur la carte · ${approximate} approximatifs (pas de position exacte)`}
          {withoutPosition > 0 && (en ? ` · ${withoutPosition} without any location` : ` · ${withoutPosition} sans localisation`)}
        </p>
      </div>
      {error && <p className="form-error-banner">{error}</p>}
      <LocationsMap
        points={visible}
        lang={lang}
        height={560}
        fitKey={`${kind}|${status}|${points.length}`}
        detailHref={(p) => (p.kind === "farm" ? `/farms/${p._id}` : `/shops/${p._id}`)}
      />
    </div>
  );
}
