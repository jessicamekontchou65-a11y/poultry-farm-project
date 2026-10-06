"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  DollarSign,
  Egg,
  Syringe,
  Wheat
} from "lucide-react";
import { farmOpsApi, flockTypeLabel, recordPath, todayISO } from "@/lib/farm-ops";
import { useAuth } from "../../../../AuthContext";
import { useLanguage } from "../../../../LanguageContext";
import DashboardShell from "../../../../components/DashboardShell";

function DailyLogInner() {
  const { token } = useAuth();
  const { lang } = useLanguage();
  const searchParams = useSearchParams();

  const [farmId, setFarmId] = useState(searchParams.get("farmId") || "");
  const [batchId, setBatchId] = useState(searchParams.get("batchId") || "");
  const [date, setDate] = useState(searchParams.get("date") || todayISO());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    if (!farmId || !batchId) {
      farmOpsApi
        .context(token)
        .then((res) => {
          const farm = res.data.farms[0];
          const flock =
            farm?.flocks?.find((f) => f.status === "active") || farm?.flocks?.[0];
          if (farm && flock) {
            setFarmId(farm._id);
            setBatchId(flock._id);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
      return;
    }

    setLoading(true);
    setError("");
    farmOpsApi
      .summary(token, { farmId, batchId, date, includeRecords: true })
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, farmId, batchId, date]);

  const s = data?.summary;
  const records = data?.records || {};

  return (
    <DashboardShell>
      <div className="fm-form-page">
        <Link href="/dashboard/farmer/manage" className="fm-back">
          <ArrowLeft size={16} />
          {lang === "en" ? "Back to Farm Management" : "Retour à la gestion"}
        </Link>

        <header className="fm-form-page__head">
          <ClipboardList size={22} />
          <div>
            <h1>{lang === "en" ? "Daily farm log" : "Journal quotidien"}</h1>
            <p>
              {lang === "en"
                ? "All activities recorded for the selected farm, flock, and date."
                : "Toutes les activités enregistrées pour la ferme, le lot et la date choisis."}
            </p>
          </div>
        </header>

        <div className="fm-selectors" style={{ maxWidth: 720 }}>
          <label>
            <span>{lang === "en" ? "Date" : "Date"}</span>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        {loading ? (
          <p className="fm-hub__status">{lang === "en" ? "Loading log..." : "Chargement..."}</p>
        ) : error ? (
          <p className="form-error-banner">{error}</p>
        ) : !data ? (
          <div className="fm-empty">
            <p>
              {lang === "en"
                ? "Select a farm and flock from Farm Management first."
                : "Choisissez d'abord une ferme et un lot."}
            </p>
            <Link href="/dashboard/farmer/manage" className="fm-btn fm-btn--primary">
              {lang === "en" ? "Open hub" : "Ouvrir le hub"}
            </Link>
          </div>
        ) : (
          <>
            <section className="fm-summary-head">
              <div>
                <h2>{data.farm.name}</h2>
                <p>
                  {flockTypeLabel(data.flock.poultryType, lang)} — {data.flock.name} (
                  {data.flock.batchCode}) · {data.date}
                </p>
              </div>
            </section>

            <section className="fm-kpi-grid">
              <div className="fm-kpi">
                <span>{lang === "en" ? "Birds" : "Effectif"}</span>
                <strong>{(s?.currentBirds ?? 0).toLocaleString()}</strong>
              </div>
              <div className="fm-kpi">
                <span>{lang === "en" ? "Eggs" : "Œufs"}</span>
                <strong>{(s?.eggsToday ?? 0).toLocaleString()}</strong>
              </div>
              <div className="fm-kpi">
                <span>{lang === "en" ? "Feed" : "Aliment"}</span>
                <strong>{(s?.feedKgToday ?? 0).toLocaleString()} kg</strong>
              </div>
              <div className="fm-kpi">
                <span>{lang === "en" ? "Mortality" : "Mortalité"}</span>
                <strong>{(s?.mortalityToday ?? 0).toLocaleString()}</strong>
              </div>
              <div className="fm-kpi">
                <span>{lang === "en" ? "Expenses" : "Dépenses"}</span>
                <strong>{(s?.expensesToday ?? 0).toLocaleString()} FCFA</strong>
              </div>
              <div className="fm-kpi">
                <span>{lang === "en" ? "Health records" : "Santé"}</span>
                <strong>{(s?.vaccinationsToday ?? 0).toLocaleString()}</strong>
              </div>
            </section>

            <div className="fm-quick__grid" style={{ marginBottom: 8 }}>
              {(["eggs", "feed", "mortality", "expense", "health"] as const).map((type) => (
                <Link
                  key={type}
                  href={recordPath(type, { farmId, batchId, date })}
                  className="fm-quick__btn"
                  style={{ textDecoration: "none" }}
                >
                  {type === "eggs" && <Egg size={18} />}
                  {type === "feed" && <Wheat size={18} />}
                  {type === "mortality" && <AlertTriangle size={18} />}
                  {type === "expense" && <DollarSign size={18} />}
                  {type === "health" && <Syringe size={18} />}
                  <span>+ {type}</span>
                </Link>
              ))}
            </div>

            <DailySection
              title={lang === "en" ? "Eggs" : "Œufs"}
              empty={lang === "en" ? "No egg records" : "Aucun enregistrement d'œufs"}
              rows={(records.eggs || []).map((r: any) => ({
                id: r._id,
                primary: `${r.eggsCollected} eggs${r.collectionSession ? ` (${r.collectionSession})` : ""}`,
                secondary: r.notes || ""
              }))}
            />
            <DailySection
              title={lang === "en" ? "Feeding" : "Alimentation"}
              empty={lang === "en" ? "No feeding records" : "Aucun enregistrement d'aliment"}
              rows={(records.feeding || []).map((r: any) => ({
                id: r._id,
                primary: `${r.quantity} ${r.unit} · ${r.feedType}`,
                secondary: r.notes || ""
              }))}
            />
            <DailySection
              title={lang === "en" ? "Mortality" : "Mortalité"}
              empty={lang === "en" ? "No mortality records" : "Aucune mortalité"}
              rows={(records.mortality || []).map((r: any) => ({
                id: r._id,
                primary: `${r.numberOfDeaths} · ${r.cause}`,
                secondary: r.notes || ""
              }))}
            />
            <DailySection
              title={lang === "en" ? "Expenses" : "Dépenses"}
              empty={lang === "en" ? "No expenses" : "Aucune dépense"}
              rows={(records.expenses || []).map((r: any) => ({
                id: r._id,
                primary: `${Number(r.amount || 0).toLocaleString()} FCFA · ${r.category}`,
                secondary: r.description || ""
              }))}
            />
            <DailySection
              title={lang === "en" ? "Health" : "Santé"}
              empty={lang === "en" ? "No health records" : "Aucune activité santé"}
              rows={(records.health || []).map((r: any) => ({
                id: r._id,
                primary: `${r.treatmentType || "vaccination"} · ${r.vaccineName}`,
                secondary: r.status
              }))}
            />
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function DailySection({
  title,
  empty,
  rows
}: {
  title: string;
  empty: string;
  rows: { id: string; primary: string; secondary: string }[];
}) {
  return (
    <section className="fm-daily-section">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="fm-note">{empty}</p>
      ) : (
        <ul className="fm-daily-list">
          {rows.map((row) => (
            <li key={row.id}>
              <strong>{row.primary}</strong>
              {row.secondary ? <span>{row.secondary}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DailyLogPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <DailyLogInner />
    </Suspense>
  );
}
