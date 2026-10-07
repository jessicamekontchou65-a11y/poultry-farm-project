"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileDown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { downloadFarmRecordsPdf, type FarmRecordsExport } from "@/lib/farm-records-pdf";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";

type RecordType = keyof FarmRecordsExport["records"];
type FarmOption = { _id: string; name: string; flocks: { _id: string; name: string; batchCode?: string; status: string }[] };

const RECORD_TYPES: { key: RecordType; en: string; fr: string }[] = [
  { key: "feeding", en: "Feeding", fr: "Alimentation" },
  { key: "mortality", en: "Mortality", fr: "Mortalité" },
  { key: "vaccination", en: "Vaccination & treatment", fr: "Vaccination & traitements" },
  { key: "eggs", en: "Egg production", fr: "Production d'œufs" },
  { key: "expenses", en: "Expenses", fr: "Dépenses" },
  { key: "sales", en: "Sales", fr: "Ventes" }
];

export default function FarmRecordsExportPage() {
  const { token } = useAuth();
  const { lang } = useLanguage();
  const en = lang === "en";

  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [farmId, setFarmId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [types, setTypes] = useState<RecordType[]>(RECORD_TYPES.map((t) => t.key));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ farms: FarmOption[] }>("/farm-ops/context", token)
      .then((res) => {
        setFarms(res.data.farms);
        if (res.data.farms[0]) setFarmId(res.data.farms[0]._id);
      })
      .catch(() => setMessage({ type: "error", text: en ? "Could not load your farms." : "Impossible de charger vos fermes." }));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const flocks = useMemo(() => farms.find((f) => f._id === farmId)?.flocks ?? [], [farms, farmId]);

  const toggleType = (key: RecordType) =>
    setTypes((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !farmId) return;
    if (types.length === 0) {
      setMessage({ type: "error", text: en ? "Choose at least one type of record." : "Choisissez au moins un type de registre." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get<FarmRecordsExport>(
        `/farm-ops/records-export?${new URLSearchParams({
          farmId,
          ...(batchId ? { batchId } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          types: types.join(",")
        })}`,
        token
      );
      await downloadFarmRecordsPdf(res.data, en ? "en" : "fr", types);
      const total = types.reduce((count, key) => count + (res.data.records[key]?.length ?? 0), 0);
      setMessage({
        type: "success",
        text: en ? `PDF downloaded (${total} records).` : `PDF téléchargé (${total} enregistrements).`
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : en ? "Export failed" : "Échec de l'export" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="dash-page">
        <div className="dash-page-head">
          <div>
            <p className="resource-kicker">{en ? "Farm records" : "Registres de la ferme"}</p>
            <h1>{en ? "Download records as PDF" : "Télécharger les registres en PDF"}</h1>
            <p>
              {en
                ? "Choose a farm, a flock and a period. Leave the dates empty to include every record since the start."
                : "Choisissez une ferme, un lot et une période. Laissez les dates vides pour inclure tout l'historique."}
            </p>
          </div>
          <div className="dash-page-head__icon">
            <FileDown size={24} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="records-export">
          <div className="dash-panel records-export__panel">
            <div className="records-export__grid">
              <label className="kca-field">
                <span>{en ? "Farm" : "Ferme"}</span>
                <select
                  value={farmId}
                  onChange={(e) => {
                    setFarmId(e.target.value);
                    setBatchId("");
                  }}
                  required
                >
                  {farms.length === 0 && <option value="">{en ? "No farm yet" : "Aucune ferme"}</option>}
                  {farms.map((farm) => (
                    <option key={farm._id} value={farm._id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="kca-field">
                <span>{en ? "Flock" : "Lot"}</span>
                <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                  <option value="">{en ? "All flocks" : "Tous les lots"}</option>
                  {flocks.map((flock) => (
                    <option key={flock._id} value={flock._id}>
                      {flock.name}
                      {flock.status !== "active" ? ` (${flock.status})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="kca-field">
                <span>{en ? "From" : "Du"}</span>
                <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="kca-field">
                <span>{en ? "To" : "Au"}</span>
                <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
              </label>
            </div>

            <fieldset className="records-export__types">
              <legend>{en ? "Include" : "Inclure"}</legend>
              {RECORD_TYPES.map((type) => (
                <label key={type.key} className={types.includes(type.key) ? "is-checked" : ""}>
                  <input type="checkbox" checked={types.includes(type.key)} onChange={() => toggleType(type.key)} />
                  {en ? type.en : type.fr}
                </label>
              ))}
            </fieldset>

            {message && (
              <p className={message.type === "success" ? "form-success-banner" : "form-error-banner"} role="status">
                {message.text}
              </p>
            )}

            <button type="submit" className="kca-btn kca-btn--primary records-export__submit" disabled={loading || !farmId}>
              {loading ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
              {loading ? (en ? "Preparing PDF…" : "Préparation du PDF…") : en ? "Download PDF" : "Télécharger le PDF"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
