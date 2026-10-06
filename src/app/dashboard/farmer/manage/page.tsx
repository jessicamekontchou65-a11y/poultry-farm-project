"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  ClipboardList,
  Egg,
  Layers,
  Plus,
  Syringe,
  Tractor,
  Wheat,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  farmOpsApi,
  flockTypeLabel,
  recordPath,
  todayISO,
} from "@/lib/farm-ops";
import type { FarmOpsDaySummary, FarmWithFlocks, PoultryBatch } from "@/lib/types";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";

export default function FarmManagementHubPage() {
  const { token } = useAuth();
  const { lang } = useLanguage();

  const [farms, setFarms] = useState<FarmWithFlocks[]>([]);
  const [farmId, setFarmId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [summary, setSummary] = useState<FarmOpsDaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedFarm = useMemo(
    () => farms.find((f) => f._id === farmId),
    [farms, farmId]
  );
  const flocks: PoultryBatch[] = selectedFarm?.flocks ?? [];

  const loadContext = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await farmOpsApi.context(token);
      const nextFarms = res.data.farms ?? [];
      setFarms(nextFarms);

      const firstFarm = nextFarms[0];
      const nextFarmId = farmId && nextFarms.some((f) => f._id === farmId) ? farmId : firstFarm?._id || "";
      setFarmId(nextFarmId);

      const farmFlocks =
        nextFarms.find((f) => f._id === nextFarmId)?.flocks?.filter((b) => b.status === "active") ??
        nextFarms.find((f) => f._id === nextFarmId)?.flocks ??
        [];
      const nextBatchId =
        batchId && farmFlocks.some((b) => b._id === batchId)
          ? batchId
          : farmFlocks[0]?._id || "";
      setBatchId(nextBatchId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load farms");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !farmId || !batchId) {
      setSummary(null);
      return;
    }
    let active = true;
    setSummaryLoading(true);
    setError("");
    farmOpsApi
      .summary(token, { farmId, batchId, date })
      .then((res) => {
        if (active) setSummary(res.data);
      })
      .catch((err) => {
        if (active) {
          setSummary(null);
          setError(err instanceof Error ? err.message : "Failed to load summary");
        }
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, farmId, batchId, date]);

  const onFarmChange = (nextFarmId: string) => {
    setFarmId(nextFarmId);
    const farm = farms.find((f) => f._id === nextFarmId);
    const nextFlocks = farm?.flocks ?? [];
    const preferred =
      nextFlocks.find((b) => b.status === "active")?._id || nextFlocks[0]?._id || "";
    setBatchId(preferred);
  };

  const recordQs = { farmId, batchId, date };
  const dailyHref =
    farmId && batchId
      ? `/dashboard/farmer/manage/daily?farmId=${farmId}&batchId=${batchId}&date=${date}`
      : "/dashboard/farmer/manage/daily";

  const s = summary?.summary;

  return (
    <DashboardShell>
      <div className="fm-hub">
        <header className="fm-hub__hero">
          <div>
            <p className="resource-kicker">
              {lang === "en" ? "Farm Management" : "Gestion de ferme"}
            </p>
            <h1>
              {lang === "en"
                ? "Private operations hub"
                : "Centre d'opérations privé"}
            </h1>
            <p>
              {lang === "en"
                ? "Select a farm and flock, review today's snapshot, then record eggs, feed, mortality, expenses, and health."
                : "Choisissez une ferme et un lot, consultez le résumé du jour, puis enregistrez œufs, aliment, mortalité, dépenses et santé."}
            </p>
          </div>
          <div className="fm-hub__hero-actions">
            <Link href={dailyHref} className="fm-btn">
              <ClipboardList size={16} />
              {lang === "en" ? "Daily log" : "Journal du jour"}
            </Link>
            <Link href="/dashboard/farmer/farms" className="fm-btn">
              <Tractor size={16} />
              {lang === "en" ? "Manage farms" : "Gérer les fermes"}
            </Link>
            <Link
              href={farmId ? `/dashboard/farmer/manage/flocks/new?farmId=${farmId}` : "/dashboard/farmer/farms"}
              className="fm-btn fm-btn--primary"
            >
              <Plus size={16} />
              {lang === "en" ? "New flock" : "Nouveau lot"}
            </Link>
          </div>
        </header>

        {loading ? (
          <p className="fm-hub__status">
            {lang === "en" ? "Loading your farms..." : "Chargement de vos fermes..."}
          </p>
        ) : farms.length === 0 ? (
          <div className="fm-empty">
            <Tractor size={28} />
            <h2>{lang === "en" ? "No farms yet" : "Aucune ferme"}</h2>
            <p>
              {lang === "en"
                ? "Register your first farm to start Farm Management."
                : "Enregistrez votre première ferme pour démarrer la gestion."}
            </p>
            <Link href="/dashboard/farmer/farms" className="fm-btn fm-btn--primary">
              {lang === "en" ? "Create a farm" : "Créer une ferme"}
            </Link>
          </div>
        ) : (
          <>
            <section className="fm-selectors">
              <label>
                <span>{lang === "en" ? "Farm" : "Ferme"}</span>
                <select value={farmId} onChange={(e) => onFarmChange(e.target.value)}>
                  {farms.map((farm) => (
                    <option key={farm._id} value={farm._id}>
                      {farm.name}
                      {farm.verificationStatus !== "approved"
                        ? ` (${farm.verificationStatus})`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>{lang === "en" ? "Flock" : "Lot"}</span>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  disabled={flocks.length === 0}
                >
                  {flocks.length === 0 ? (
                    <option value="">
                      {lang === "en" ? "No flocks on this farm" : "Aucun lot sur cette ferme"}
                    </option>
                  ) : (
                    flocks.map((flock) => (
                      <option key={flock._id} value={flock._id}>
                        {flockTypeLabel(flock.poultryType, lang)} — {flock.name} ({flock.batchCode})
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                <span>
                  <Calendar size={14} /> {lang === "en" ? "Date" : "Date"}
                </span>
                <input
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </section>

            {flocks.length === 0 ? (
              <div className="fm-empty compact">
                <Layers size={24} />
                <p>
                  {lang === "en"
                    ? "This farm has no flocks yet. Create a flock to see the day summary."
                    : "Cette ferme n'a pas encore de lots. Créez un lot pour voir le résumé."}
                </p>
                <Link
                  href={`/dashboard/farmer/manage/flocks/new?farmId=${farmId}`}
                  className="fm-btn fm-btn--primary"
                >
                  <Plus size={16} />
                  {lang === "en" ? "Create flock" : "Créer un lot"}
                </Link>
              </div>
            ) : (
              <>
                <section className="fm-summary-head">
                  <div>
                    <h2>{summary?.farm.name || selectedFarm?.name}</h2>
                    <p>
                      {summary
                        ? `${flockTypeLabel(summary.flock.poultryType, lang)} — ${summary.flock.name} (${summary.flock.batchCode})`
                        : ""}
                    </p>
                  </div>
                  {batchId && (
                    <Link
                      href={`/dashboard/farmer/manage/flocks/${batchId}`}
                      className="fm-btn"
                    >
                      {lang === "en" ? "Flock details" : "Détails du lot"}
                      <ChevronRight size={16} />
                    </Link>
                  )}
                </section>

                {error && <p className="form-error-banner">{error}</p>}

                <section className="fm-kpi-grid" aria-busy={summaryLoading}>
                  <div className="fm-kpi">
                    <span>{lang === "en" ? "Current birds" : "Effectif actuel"}</span>
                    <strong>{(s?.currentBirds ?? 0).toLocaleString()}</strong>
                    <Activity size={18} />
                  </div>
                  <div className="fm-kpi">
                    <span>{lang === "en" ? "Eggs (selected day)" : "Œufs (jour)"}</span>
                    <strong>{(s?.eggsToday ?? 0).toLocaleString()}</strong>
                    <Egg size={18} />
                  </div>
                  <div className="fm-kpi">
                    <span>{lang === "en" ? "Mortality (day)" : "Mortalité (jour)"}</span>
                    <strong>{(s?.mortalityToday ?? 0).toLocaleString()}</strong>
                    <AlertTriangle size={18} />
                  </div>
                  <div className="fm-kpi">
                    <span>{lang === "en" ? "Feed (day)" : "Aliment (jour)"}</span>
                    <strong>{(s?.feedKgToday ?? 0).toLocaleString()} kg</strong>
                    <Wheat size={18} />
                  </div>
                  <div className="fm-kpi">
                    <span>{lang === "en" ? "Expenses (day)" : "Dépenses (jour)"}</span>
                    <strong>{(s?.expensesToday ?? 0).toLocaleString()} FCFA</strong>
                    <DollarSign size={18} />
                  </div>
                  <div className="fm-kpi">
                    <span>{lang === "en" ? "Egg production rate" : "Taux de ponte"}</span>
                    <strong>{(s?.eggProductionRate ?? 0).toLocaleString()}%</strong>
                    <ClipboardList size={18} />
                  </div>
                </section>

                {s?.feedBagNote && (
                  <p className="fm-note">{s.feedBagNote}</p>
                )}

                <section className="fm-quick">
                  <div className="fm-quick__head">
                    <h3>{lang === "en" ? "Quick actions" : "Actions rapides"}</h3>
                    <Link href={dailyHref} className="fm-quick__log-link">
                      {lang === "en" ? "View day log" : "Voir le journal"}
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                  <div className="fm-quick__grid">
                    <Link
                      href={recordPath("eggs", recordQs)}
                      className="fm-quick__btn"
                      aria-disabled={!farmId || !batchId}
                    >
                      <Egg size={20} />
                      {lang === "en" ? "Record Eggs" : "Enregistrer œufs"}
                      <em>{lang === "en" ? "Collection" : "Collecte"}</em>
                    </Link>
                    <Link
                      href={recordPath("feed", recordQs)}
                      className="fm-quick__btn"
                    >
                      <Wheat size={20} />
                      {lang === "en" ? "Record Feed" : "Enregistrer aliment"}
                      <em>{lang === "en" ? "Consumption" : "Consommation"}</em>
                    </Link>
                    <Link
                      href={recordPath("mortality", recordQs)}
                      className="fm-quick__btn"
                    >
                      <AlertTriangle size={20} />
                      {lang === "en" ? "Record Mortality" : "Enregistrer mortalité"}
                      <em>{lang === "en" ? "Updates flock" : "Met à jour le lot"}</em>
                    </Link>
                    <Link
                      href={recordPath("expense", recordQs)}
                      className="fm-quick__btn"
                    >
                      <DollarSign size={20} />
                      {lang === "en" ? "Record Expense" : "Enregistrer dépense"}
                      <em>FCFA</em>
                    </Link>
                    <Link
                      href={recordPath("health", recordQs)}
                      className="fm-quick__btn"
                    >
                      <Syringe size={20} />
                      {lang === "en" ? "Record Health" : "Enregistrer santé"}
                      <em>{lang === "en" ? "Vaccine / treatment" : "Vaccin / traitement"}</em>
                    </Link>
                  </div>
                </section>

                <section className="fm-flock-list">
                  <div className="fm-flock-list__head">
                    <h3>{lang === "en" ? "Flocks on this farm" : "Lots de cette ferme"}</h3>
                    <Link href={`/dashboard/farmer/manage/flocks/new?farmId=${farmId}`}>
                      <Plus size={16} /> {lang === "en" ? "Add" : "Ajouter"}
                    </Link>
                  </div>
                  <div className="fm-flock-cards">
                    {flocks.map((flock) => (
                      <Link
                        key={flock._id}
                        href={`/dashboard/farmer/manage/flocks/${flock._id}`}
                        className={`fm-flock-card ${flock._id === batchId ? "is-active" : ""}`}
                        onClick={() => setBatchId(flock._id)}
                      >
                        <strong>{flock.name}</strong>
                        <span>
                          {flockTypeLabel(flock.poultryType, lang)} · {flock.batchCode}
                        </span>
                        <em>
                          {(flock.currentQuantity ?? 0).toLocaleString()}{" "}
                          {lang === "en" ? "birds" : "sujets"} · {flock.status}
                        </em>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
