"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Layers } from "lucide-react";
import {
  farmOpsApi,
  FLOCK_STATUSES,
  FLOCK_TYPES,
  flockTypeLabel,
} from "@/lib/farm-ops";
import type { PoultryBatch } from "@/lib/types";
import { useAuth } from "../../../../../AuthContext";
import { useLanguage } from "../../../../../LanguageContext";
import DashboardShell from "../../../../../components/DashboardShell";

export default function FlockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { token } = useAuth();
  const { lang } = useLanguage();

  const [flock, setFlock] = useState<(PoultryBatch & { farm?: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [poultryType, setPoultryType] = useState("layer");
  const [breed, setBreed] = useState("");
  const [purpose, setPurpose] = useState("");
  const [housing, setHousing] = useState("");
  const [startingAgeDays, setStartingAgeDays] = useState("0");
  const [currentQuantity, setCurrentQuantity] = useState("0");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    farmOpsApi
      .getBatch(token, id)
      .then((res) => {
        const data = res.data;
        setFlock(data);
        setName(data.name || "");
        setBatchCode(data.batchCode || "");
        setPoultryType(data.poultryType || "layer");
        setBreed(data.breed || "");
        setPurpose(data.purpose || "");
        setHousing(data.housing || "");
        setStartingAgeDays(String(data.startingAgeDays ?? 0));
        setCurrentQuantity(String(data.currentQuantity ?? 0));
        setStatus(data.status || "active");
        setNotes(data.notes || "");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load flock")
      )
      .finally(() => setLoading(false));
  }, [token, id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await farmOpsApi.updateBatch(token, id, {
        name: name.trim(),
        batchCode: batchCode.trim(),
        poultryType,
        breed: breed.trim() || undefined,
        purpose: purpose.trim() || undefined,
        housing: housing.trim() || undefined,
        startingAgeDays: Number(startingAgeDays),
        currentQuantity: Number(currentQuantity),
        status,
        notes: notes.trim() || undefined
      });
      setFlock((prev) => ({ ...(prev || {}), ...res.data }));
      setSuccess(
        lang === "en" ? "Flock updated successfully." : "Lot mis à jour avec succès."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="fm-form-page">
        <Link href="/dashboard/farmer/manage" className="fm-back">
          <ArrowLeft size={16} />
          {lang === "en" ? "Back to Farm Management" : "Retour à la gestion"}
        </Link>

        {loading ? (
          <p className="fm-hub__status">
            {lang === "en" ? "Loading flock..." : "Chargement du lot..."}
          </p>
        ) : !flock ? (
          <p className="form-error-banner">{error || "Not found"}</p>
        ) : (
          <>
            <header className="fm-form-page__head">
              <Layers size={22} />
              <div>
                <h1>{flock.name}</h1>
                <p>
                  {flock.farm?.name ? `${flock.farm.name} · ` : ""}
                  {flockTypeLabel(flock.poultryType, lang)} · {flock.batchCode}
                </p>
              </div>
            </header>

            <div className="fm-flock-stats">
              <div>
                <span>{lang === "en" ? "Initial birds" : "Effectif initial"}</span>
                <strong>{(flock.initialQuantity ?? 0).toLocaleString()}</strong>
              </div>
              <div>
                <span>{lang === "en" ? "Current birds" : "Effectif actuel"}</span>
                <strong>{(flock.currentQuantity ?? 0).toLocaleString()}</strong>
              </div>
              <div>
                <span>{lang === "en" ? "Status" : "Statut"}</span>
                <strong>{flock.status}</strong>
              </div>
            </div>

            <form className="connected-form fm-form" onSubmit={submit}>
              <div className="fm-form__row">
                <div className="form-group">
                  <label>{lang === "en" ? "Flock name" : "Nom du lot"}</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>{lang === "en" ? "Batch code" : "Code lot"}</label>
                  <input
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="fm-form__row">
                <div className="form-group">
                  <label>{lang === "en" ? "Bird type" : "Type"}</label>
                  <select value={poultryType} onChange={(e) => setPoultryType(e.target.value)}>
                    {FLOCK_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {lang === "en" ? t.labelEn : t.labelFr}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{lang === "en" ? "Status" : "Statut"}</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {FLOCK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {lang === "en" ? s.labelEn : s.labelFr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="fm-form__row">
                <div className="form-group">
                  <label>{lang === "en" ? "Breed" : "Race"}</label>
                  <input value={breed} onChange={(e) => setBreed(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{lang === "en" ? "Purpose" : "Objectif"}</label>
                  <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{lang === "en" ? "Housing" : "Bâtiment"}</label>
                  <input value={housing} onChange={(e) => setHousing(e.target.value)} />
                </div>
              </div>

              <div className="fm-form__row">
                <div className="form-group">
                  <label>
                    {lang === "en" ? "Current birds (manual adjust)" : "Effectif actuel (ajustement)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>{lang === "en" ? "Starting age (days)" : "Âge au placement"}</label>
                  <input
                    type="number"
                    min={0}
                    value={startingAgeDays}
                    onChange={(e) => setStartingAgeDays(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{lang === "en" ? "Notes" : "Notes"}</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {error && <p className="form-error-banner">{error}</p>}
              {success && <p className="form-success-banner">{success}</p>}

              <div className="fm-form__actions">
                <button type="submit" className="fm-btn fm-btn--primary" disabled={saving}>
                  <Save size={16} />
                  {saving
                    ? lang === "en"
                      ? "Saving..."
                      : "Enregistrement..."
                    : lang === "en"
                      ? "Save flock"
                      : "Enregistrer"}
                </button>
                <Link href="/dashboard/farmer/manage" className="fm-btn">
                  {lang === "en" ? "Open hub" : "Ouvrir le hub"}
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
