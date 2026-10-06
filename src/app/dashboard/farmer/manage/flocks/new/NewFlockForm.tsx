"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Layers, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { FLOCK_TYPES, todayISO } from "@/lib/farm-ops";
import type { Farm } from "@/lib/types";
import { useAuth } from "../../../../../AuthContext";
import { useLanguage } from "../../../../../LanguageContext";
import DashboardShell from "../../../../../components/DashboardShell";

export default function NewFlockForm() {
  const { token } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetFarmId = searchParams.get("farmId") || "";

  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState(presetFarmId);
  const [name, setName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [poultryType, setPoultryType] = useState("layer");
  const [breed, setBreed] = useState("");
  const [purpose, setPurpose] = useState("eggs");
  const [housing, setHousing] = useState("");
  const [startingAgeDays, setStartingAgeDays] = useState("0");
  const [initialQuantity, setInitialQuantity] = useState("100");
  const [startDate, setStartDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .list<Farm>("/farms/my", undefined, token)
      .then((res) => {
        setFarms(res.data);
        if (!farmId && res.data[0]?._id) setFarmId(res.data[0]._id);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (presetFarmId) setFarmId(presetFarmId);
  }, [presetFarmId]);

  const selectedFarm = useMemo(
    () => farms.find((f) => f._id === farmId),
    [farms, farmId]
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !farmId) return;
    setLoading(true);
    setError("");
    try {
      const qty = Number(initialQuantity);
      const age = Number(startingAgeDays);
      if (!Number.isFinite(qty) || qty < 0) {
        throw new Error(
          lang === "en"
            ? "Initial bird count must be zero or greater"
            : "L'effectif initial doit être ≥ 0"
        );
      }
      const res = await api.create<any>(
        `/farms/${farmId}/batches`,
        {
          name: name.trim(),
          batchCode: batchCode.trim(),
          poultryType,
          breed: breed.trim() || undefined,
          purpose,
          housing: housing.trim() || undefined,
          startingAgeDays: Number.isFinite(age) ? age : 0,
          initialQuantity: qty,
          startDate,
          notes: notes.trim() || undefined
        },
        token
      );

      router.push(`/dashboard/farmer/manage/flocks/${res.data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="fm-form-page">
        <Link href="/dashboard/farmer/manage" className="fm-back">
          <ArrowLeft size={16} />
          {lang === "en" ? "Back to Farm Management" : "Retour à la gestion"}
        </Link>

        <header className="fm-form-page__head">
          <Layers size={22} />
          <div>
            <h1>{lang === "en" ? "Create flock" : "Créer un lot"}</h1>
            <p>
              {selectedFarm
                ? `${lang === "en" ? "Farm" : "Ferme"}: ${selectedFarm.name}`
                : lang === "en"
                  ? "Choose a farm and define this flock."
                  : "Choisissez une ferme et définissez ce lot."}
            </p>
          </div>
        </header>

        {farms.length === 0 ? (
          <div className="fm-empty">
            <p>
              {lang === "en"
                ? "You need a farm before creating a flock."
                : "Vous devez créer une ferme avant un lot."}
            </p>
            <Link href="/dashboard/farmer/farms" className="fm-btn fm-btn--primary">
              {lang === "en" ? "Create farm" : "Créer une ferme"}
            </Link>
          </div>
        ) : (
          <form className="connected-form fm-form" onSubmit={submit}>
            <div className="form-group">
              <label>{lang === "en" ? "Farm" : "Ferme"}</label>
              <select value={farmId} onChange={(e) => setFarmId(e.target.value)} required>
                {farms.map((farm) => (
                  <option key={farm._id} value={farm._id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Flock / batch name" : "Nom du lot"}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={lang === "en" ? "Layer Batch 003" : "Lot pondeuses 003"}
                />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Batch code" : "Code lot"}</label>
                <input
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  required
                  placeholder="BATCH-003"
                />
              </div>
            </div>

            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Bird type" : "Type d'oiseaux"}</label>
                <select value={poultryType} onChange={(e) => setPoultryType(e.target.value)}>
                  {FLOCK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {lang === "en" ? t.labelEn : t.labelFr}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Purpose" : "Objectif"}</label>
                <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                  <option value="eggs">{lang === "en" ? "Eggs" : "Œufs"}</option>
                  <option value="meat">{lang === "en" ? "Meat" : "Viande"}</option>
                  <option value="breeding">{lang === "en" ? "Breeding" : "Reproduction"}</option>
                  <option value="dual">{lang === "en" ? "Dual purpose" : "Mixte"}</option>
                  <option value="other">{lang === "en" ? "Other" : "Autre"}</option>
                </select>
              </div>
            </div>

            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Breed" : "Race"}</label>
                <input
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="Isa Brown, Cobb 500..."
                />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Housing / house" : "Bâtiment / poulailler"}</label>
                <input
                  value={housing}
                  onChange={(e) => setHousing(e.target.value)}
                  placeholder={lang === "en" ? "House A" : "Poulailler A"}
                />
              </div>
            </div>

            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Initial birds" : "Effectif initial"}</label>
                <input
                  type="number"
                  min={0}
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Starting age (days)" : "Âge au placement (jours)"}</label>
                <input
                  type="number"
                  min={0}
                  value={startingAgeDays}
                  onChange={(e) => setStartingAgeDays(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Date placed" : "Date de placement"}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>{lang === "en" ? "Notes" : "Notes"}</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  lang === "en"
                    ? "Optional notes about this flock"
                    : "Notes optionnelles sur ce lot"
                }
              />
            </div>

            {error && <p className="form-error-banner">{error}</p>}

            <button type="submit" className="fm-btn fm-btn--primary" disabled={loading}>
              <Plus size={16} />
              {loading
                ? lang === "en"
                  ? "Creating..."
                  : "Création..."
                : lang === "en"
                  ? "Create flock"
                  : "Créer le lot"}
            </button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
