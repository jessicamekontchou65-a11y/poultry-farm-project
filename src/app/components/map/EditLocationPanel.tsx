"use client";

import { useState } from "react";
import { MapPin, Save } from "lucide-react";
import { api } from "@/lib/api";
import { type LatLng, LocationPicker } from "./index";

/** Lets an owner save or change the exact position of an existing farm or shop. */
export default function EditLocationPanel({
  endpoint,
  initial,
  token,
  lang,
  onSaved
}: {
  endpoint: string;
  initial?: LatLng | null;
  token: string | null;
  lang: string;
  onSaved?: (value: LatLng | null) => void;
}) {
  const en = lang === "en";
  const [value, setValue] = useState<LatLng | null>(
    initial && Number.isFinite(initial.latitude) && Number.isFinite(initial.longitude)
      ? { latitude: initial.latitude, longitude: initial.longitude }
      : null
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.update(endpoint, { coordinates: value }, token);
      setMessage({
        type: "success",
        text: value
          ? en ? "Position saved. It now appears on the map." : "Position enregistrée. Elle apparaît maintenant sur la carte."
          : en ? "Position removed." : "Position retirée."
      });
      onSaved?.(value);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : en ? "Could not save" : "Échec de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-location">
      <div className="edit-location__head">
        <MapPin size={18} />
        <div>
          <strong>{en ? "Position on the map" : "Position sur la carte"}</strong>
          <p>
            {initial
              ? en ? "Buyers see this exact point on the map and can get directions." : "Les acheteurs voient ce point exact sur la carte et peuvent obtenir l'itinéraire."
              : en ? "No exact position yet: the map shows your city or region instead." : "Pas encore de position exacte : la carte affiche votre ville ou région."}
          </p>
        </div>
      </div>
      <LocationPicker value={value} onChange={setValue} lang={lang} height={280} />
      <button type="button" className="kca-btn kca-btn--primary edit-location__save" onClick={save} disabled={saving}>
        <Save size={16} />
        {saving ? (en ? "Saving…" : "Enregistrement…") : en ? "Save position" : "Enregistrer la position"}
      </button>
      {message && (
        <p className={message.type === "success" ? "form-success-banner" : "form-error-banner"} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
