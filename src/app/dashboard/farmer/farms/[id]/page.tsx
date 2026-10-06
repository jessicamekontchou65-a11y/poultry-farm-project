"use client";

import { useEffect, useState, use } from "react";
import { api, apiFetch } from "@/lib/api";
import type { Farm } from "@/lib/types";
import { useAuth } from "../../../../AuthContext";
import { useLanguage } from "../../../../LanguageContext";
import DashboardShell from "../../../../components/DashboardShell";
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, Layers, Plus, Tractor } from "lucide-react";
import Link from "next/link";

export default function FarmDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAuth();
  const { lang, t } = useLanguage();
  
  const [farm, setFarm] = useState<Farm | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New batch form states
  const [name, setName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [poultryType, setPoultryType] = useState("broiler");
  const [breed, setBreed] = useState("");
  const [initialQuantity, setInitialQuantity] = useState(100);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [msg, setMsg] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const farmRes = await api.get<Farm>(`/farms/${id}`, token);
      setFarm(farmRes.data);
      
      const batchesRes = await apiFetch<any>(`/farms/${id}/batches`, { token });
      setBatches(batchesRes.data || []);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setMsg("");

    try {
      const res = await api.create<any>(`/farms/${id}/batches`, {
        name,
        batchCode,
        poultryType,
        breed,
        initialQuantity,
        startDate: new Date(startDate)
      }, token);

      setBatches((prev) => [res.data, ...prev]);
      setName("");
      setBatchCode("");
      setBreed("");
      setMsg(lang === "en" ? "Batch launched!" : "Lot démarré !");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : (lang === "en" ? "Failed to launch batch" : "Impossible de lancer le lot"));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardShell>
      {loading ? (
        <div className="farmer-op-page">
          <div className="farmer-op-loading"><Tractor size={26} /><span>{lang === "en" ? "Loading farm data..." : "Chargement des données de l'élevage..."}</span></div>
        </div>
      ) : (
        <div className="farmer-op-page">
          <Link href="/dashboard/farmer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--color-accent)", fontWeight: "800", width: "fit-content" }}>
            <ArrowLeft size={16} />
            {lang === "en" ? "Back to Dashboard" : "Retour au tableau de bord"}
          </Link>

          <section className="farmer-op-hero">
            <div>
              <p className="resource-kicker">{farm?.farmType}</p>
              <h1 className="farmer-op-hero__title">{farm?.name}</h1>
              <p className="farmer-op-hero__copy">
                {farm?.location}, {farm?.city || (lang === "en" ? "city pending" : "ville à renseigner")} · {farm?.description || (lang === "en" ? "Launch batches and keep operational records attached to this farm." : "Lancez des lots et gardez les registres opérationnels liés à cet élevage.")}
              </p>
            </div>
            <div className="farmer-op-hero__stat">
              <strong>{batches.length}</strong>
              <span>{lang === "en" ? "active batch records" : "lots enregistrés"}</span>
            </div>
          </section>

          <div className="farmer-op-layout">
            <section className="farmer-op-main">
              <div className="dash-section__header">
                <div>
                  <p className="resource-kicker">{lang === "en" ? "Production" : "Production"}</p>
                  <h2 className="dash-section__title">{lang === "en" ? "Poultry Batches" : "Lots de volailles"}</h2>
                </div>
              </div>

            {batches.length === 0 ? (
              <div className="farmer-op-empty">
                <div className="farmer-op-empty__icon"><Layers size={30} /></div>
                <h3>{lang === "en" ? "No batches growing yet" : "Aucun lot en cours"}</h3>
                <p>{lang === "en" ? "Launch your first batch to start tracking feed, mortality, vaccines, eggs, and sales." : "Démarrez votre premier lot pour suivre aliment, mortalité, vaccins, oeufs et ventes."}</p>
              </div>
            ) : (
              <div className="farmer-op-card-list">
                {batches.map((batch) => (
                  <article key={batch._id} className="farmer-op-card">
                    <div className="farmer-op-card__top">
                      <div>
                        <h3>{batch.name}</h3>
                        <p>
                          Code: <span style={{ fontWeight: "700" }}>{batch.batchCode}</span> | Type: <strong>{batch.poultryType}</strong>
                        </p>
                      </div>
                      <span className={`dash-badge dash-badge--${batch.status}`}>
                        {batch.status}
                      </span>
                    </div>

                    <div className="farmer-op-card__bottom">
                      <span>🐥 {batch.currentQuantity} / {batch.initialQuantity} {lang === "en" ? "birds" : "volailles"}</span>
                      <Link href={`/dashboard/farmer/batches/${batch._id}`} style={{ color: "var(--color-accent)", fontWeight: "700", display: "flex", alignItems: "center", gap: "2px" }}>
                        {lang === "en" ? "Manage Logs" : "Gérer les registres"}
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
            </section>

            <aside className="farmer-op-aside">
              <div className="farmer-op-form-card">
                <div className="farmer-op-form-card__head">
                  <div className="farmer-op-form-card__icon"><Plus size={20} /></div>
                  <div>
                    <p className="resource-kicker">{lang === "en" ? "New flock" : "Nouveau lot"}</p>
                    <h2>{t("batch.create.title")}</h2>
                  </div>
                </div>

            <form onSubmit={handleSubmit} className="connected-form farmer-op-form">
              <div className="form-group">
                <label>{t("batch.create.name")}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Broilers block A" />
              </div>

              <div className="form-group">
                <label>{t("batch.create.code")}</label>
                <input type="text" value={batchCode} onChange={(e) => setBatchCode(e.target.value)} required placeholder="BATCH-001" />
              </div>

              <div className="form-group">
                <label>{t("batch.create.type")}</label>
                <select value={poultryType} onChange={(e) => setPoultryType(e.target.value)}>
                  <option value="broiler">Broiler</option>
                  <option value="layer">Layer</option>
                  <option value="chick">Chick</option>
                  <option value="cockerel">Cockerel</option>
                  <option value="local">Local</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t("batch.create.breed")}</label>
                <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Cobb 500" />
              </div>

              <div className="form-group">
                <label>{t("batch.create.qty")}</label>
                <input type="number" min={1} value={initialQuantity} onChange={(e) => setInitialQuantity(Number(e.target.value))} required />
              </div>

              <div className="form-group">
                <label>{t("batch.create.date")}</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>

              <button type="submit" className="farmer-op-submit" disabled={formLoading}>
                {formLoading ? (lang === "en" ? "Launching..." : "Démarrage...") : t("batch.create.btn")}
                <ArrowRight size={17} />
              </button>

              {msg && (
                <p className={msg.includes("launched") || msg.includes("démarré") ? "form-success-banner" : "form-error-banner"} style={{ marginTop: "16px" }}>
                  {msg}
                </p>
              )}
            </form>
              </div>

              <div className="farmer-op-note">
                <strong>{lang === "en" ? "Batch setup tip" : "Conseil de démarrage"}</strong>
                <p>{lang === "en" ? "Use a clear batch code and accurate starting quantity; every feed, vaccine, mortality, and sale record will depend on this baseline." : "Utilisez un code clair et une quantité initiale exacte ; les registres d'aliment, vaccin, mortalité et vente dépendront de cette base."}</p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
