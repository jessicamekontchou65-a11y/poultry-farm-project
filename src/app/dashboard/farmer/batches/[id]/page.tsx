"use client";

import { useEffect, useState, use } from "react";
import { api, apiFetch } from "@/lib/api";
import { useAuth } from "../../../../AuthContext";
import { useLanguage } from "../../../../LanguageContext";
import DashboardShell from "../../../../components/DashboardShell";
import Link from "next/link";
import { ArrowLeft, Check, Layers, AlertCircle, Plus, AlertTriangle, MapPinned } from "lucide-react";

type TabKey = "overview" | "feeding" | "mortality" | "vaccination" | "eggs" | "sales" | "expenses" | "reports";

export default function BatchOperationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user } = useAuth();
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data lists
  const [feedingRecords, setFeedingRecords] = useState<any[]>([]);
  const [mortalityRecords, setMortalityRecords] = useState<any[]>([]);
  const [outbreakData, setOutbreakData] = useState<any>(null);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [eggRecords, setEggRecords] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Feedback messages
  const [msg, setMsg] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Log inputs
  const [feedType, setFeedType] = useState("");
  const [feedQty, setFeedQty] = useState(1);
  const [feedUnit, setFeedUnit] = useState("bag");
  const [feedCost, setFeedCost] = useState(0);

  const [mortQty, setMortQty] = useState(1);
  const [mortCause, setMortCause] = useState("");
  const [mortDisease, setMortDisease] = useState("");
  const [mortDescription, setMortDescription] = useState("");
  const [mortSymptoms, setMortSymptoms] = useState("");
  const [mortSeverity, setMortSeverity] = useState("medium");

  const [vaccName, setVaccName] = useState("");
  const [vaccPrevent, setVaccPrevent] = useState("");
  const [vaccDate, setVaccDate] = useState(new Date().toISOString().split("T")[0]);
  const [vaccCost, setVaccCost] = useState(0);
  const [vaccAdmin, setVaccAdmin] = useState("");

  const [eggsCollected, setEggsCollected] = useState(0);
  const [eggsDamaged, setEggsDamaged] = useState(0);
  const [eggsSold, setEggsSold] = useState(0);

  const [saleType, setSaleType] = useState("live_chicken");
  const [saleQty, setSaleQty] = useState(1);
  const [salePrice, setSalePrice] = useState(0);
  const [saleBuyer, setSaleBuyer] = useState("");

  const [expAmount, setExpAmount] = useState(0);
  const [expCat, setExpCat] = useState("feed");
  const [expDesc, setExpDesc] = useState("");

  const fetchData = async () => {
    if (!token) return;
    try {
      const batchRes = await api.get<any>(`/resources/batches/${id}`, token);
      setBatch(batchRes.data);

      const feedRes = await apiFetch<any>(`/batches/${id}/feeding-records`, { token });
      setFeedingRecords(feedRes.data || []);

      const mortRes = await apiFetch<any>(`/batches/${id}/mortality-records`, { token });
      setMortalityRecords(mortRes.data || []);

      const outbreakRes = await apiFetch<any>("/outbreaks/heatmap", { query: { days: 45 } });
      setOutbreakData(outbreakRes.data);

      const vaccRes = await apiFetch<any>(`/batches/${id}/vaccination-records`, { token });
      setVaccinations(vaccRes.data || []);

      const eggRes = await apiFetch<any>(`/batches/${id}/egg-production-records`, { token });
      setEggRecords(eggRes.data || []);

      const salesRes = await api.list<any>("/farm-sales", { batchId: id }, token);
      setSales(salesRes.data || []);

      const expRes = await api.list<any>("/expenses", { batchId: id }, token);
      setExpenses(expRes.data || []);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const handleCloseBatch = async () => {
    if (!token) return;
    try {
      const res = await api.update<any>(`/batches/${id}/close`, {}, token);
      setBatch(res.data);
    } catch (err) {}
  };

  // Add operational log handlers
  const addFeeding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setMsg("");
    try {
      const res = await api.create<any>(`/batches/${id}/feeding-records`, {
        feedType,
        quantity: feedQty,
        unit: feedUnit,
        cost: feedCost,
        feedingDate: new Date()
      }, token);
      setFeedingRecords((prev) => [res.data, ...prev]);
      setFeedType("");
      setFeedCost(0);
      setMsg(lang === "en" ? "Feeding logged!" : "Repas enregistré !");
      
      // Auto register expense for feed if cost is specified
      if (feedCost > 0) {
        await api.create("/expenses", {
          batchId: id,
          farmId: batch.farmId,
          category: "feed",
          amount: feedCost,
          date: new Date(),
          description: `Feed: ${feedType}`
        }, token);
        const expRes = await api.list<any>("/expenses", { batchId: id }, token);
        setExpenses(expRes.data || []);
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to record");
    } finally {
      setFormLoading(false);
    }
  };

  const addMortality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (mortQty > batch.currentQuantity) {
      setMsg(lang === "en" ? "Deaths cannot exceed current bird count!" : "Le nombre de décès ne peut dépasser l'effectif actuel !");
      return;
    }
    setFormLoading(true);
    setMsg("");
    try {
      const res = await api.create<any>(`/batches/${id}/mortality-records`, {
        numberOfDeaths: mortQty,
        cause: mortCause,
        suspectedDisease: mortDisease,
        deathDescription: mortDescription,
        symptoms: mortSymptoms,
        severity: mortSeverity,
        date: new Date()
      }, token);
      setMortalityRecords((prev) => [res.data.record, ...prev]);
      setBatch(res.data.batch);
      const outbreakRes = await apiFetch<any>("/outbreaks/heatmap", {
        query: { days: 45, disease: mortDisease || undefined }
      });
      setOutbreakData(outbreakRes.data);
      setMortCause("");
      setMortDisease("");
      setMortDescription("");
      setMortSymptoms("");
      setMortSeverity("medium");
      setMsg(lang === "en" ? "Mortality logged and disease watch updated." : "Décès enregistrés et surveillance sanitaire mise à jour.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to record");
    } finally {
      setFormLoading(false);
    }
  };

  const addVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setMsg("");
    try {
      const res = await api.create<any>(`/batches/${id}/vaccination-records`, {
        vaccineName: vaccName,
        diseasePrevented: vaccPrevent,
        scheduledDate: new Date(vaccDate),
        cost: vaccCost,
        administeredBy: vaccAdmin
      }, token);
      setVaccinations((prev) => [res.data, ...prev]);
      setVaccName("");
      setVaccPrevent("");
      setMsg(lang === "en" ? "Vaccination scheduled!" : "Vaccination planifiée !");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setFormLoading(false);
    }
  };

  const completeVaccination = async (vaccId: string) => {
    if (!token) return;
    try {
      const res = await api.update<any>(`/vaccination-records/${vaccId}/complete`, {}, token);
      setVaccinations((prev) => prev.map((v) => (v._id === vaccId ? res.data : v)));
    } catch (err) {}
  };

  const addEggProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (eggsDamaged > eggsCollected) {
      setMsg(lang === "en" ? "Damaged eggs cannot exceed collected eggs!" : "Les œufs cassés ne peuvent excéder la collecte !");
      return;
    }
    setFormLoading(true);
    setMsg("");
    try {
      const res = await api.create<any>(`/batches/${id}/egg-production-records`, {
        eggsCollected,
        damagedEggs: eggsDamaged,
        eggsSold,
        date: new Date()
      }, token);
      setEggRecords((prev) => [res.data, ...prev]);
      setEggsCollected(0);
      setEggsDamaged(0);
      setEggsSold(0);
      setMsg(lang === "en" ? "Egg production logged!" : "Production enregistrée !");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to record");
    } finally {
      setFormLoading(false);
    }
  };

  const addSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (saleType === "live_chicken" && saleQty > batch.currentQuantity) {
      setMsg(lang === "en" ? "Sales count exceeds batch size!" : "La vente dépasse l'effectif actuel !");
      return;
    }
    setFormLoading(true);
    setMsg("");
    try {
      const res = await api.create<any>("/farm-sales", {
        farmId: batch.farmId,
        batchId: id,
        productType: saleType,
        quantity: saleQty,
        unit: saleType === "eggs" ? "tray" : "bird",
        unitPrice: salePrice,
        buyerName: saleBuyer,
        saleDate: new Date(),
        paymentMethod: "cash"
      }, token);

      setSales((prev) => [res.data, ...prev]);
      
      // Update batch current birds if we sold chickens
      if (saleType === "live_chicken" || saleType === "dressed_chicken" || saleType === "spent_layers") {
        const nextBatch = await api.update<any>(`/resources/batches/${id}`, {
          currentQuantity: batch.currentQuantity - saleQty
        }, token);
        setBatch(nextBatch.data);
      }

      setSalePrice(0);
      setSaleBuyer("");
      setMsg(lang === "en" ? "Sale recorded!" : "Vente enregistrée !");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to record");
    } finally {
      setFormLoading(false);
    }
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setMsg("");
    try {
      const res = await api.create<any>("/expenses", {
        farmId: batch.farmId,
        batchId: id,
        category: expCat,
        amount: expAmount,
        date: new Date(),
        description: expDesc
      }, token);
      setExpenses((prev) => [res.data, ...prev]);
      setExpAmount(0);
      setExpDesc("");
      setMsg(lang === "en" ? "Expense recorded!" : "Dépense enregistrée !");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to record");
    } finally {
      setFormLoading(false);
    }
  };

  // Calculations for reports
  const totalDeaths = mortalityRecords.reduce((sum, r) => sum + r.numberOfDeaths, 0);
  const mortalityRate = batch ? ((totalDeaths / batch.initialQuantity) * 100).toFixed(1) : 0;
  const feedExp = expenses.filter((e) => e.category === "feed").reduce((sum, e) => sum + e.amount, 0);
  const vaccExp = expenses.filter((e) => e.category === "vaccination").reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const estimatedProfit = totalRevenue - totalExpenses;
  const outbreakPoints = outbreakData?.points ?? [];
  const outbreakSummaries = outbreakData?.summaries ?? [];
  const activeDiseaseSummary = mortDisease
    ? outbreakSummaries.find((summary: any) => summary.disease?.toLowerCase() === mortDisease.toLowerCase())
    : outbreakSummaries[0];
  const mapPointStyle = (point: any) => {
    const latitude = Number(point.coordinates?.latitude ?? 4);
    const longitude = Number(point.coordinates?.longitude ?? 11);
    const x = Math.min(92, Math.max(8, ((longitude - 8) / 8.5) * 100));
    const y = Math.min(92, Math.max(8, ((13.5 - latitude) / 12) * 100));
    const size = Math.min(58, Math.max(18, 14 + Math.sqrt(Number(point.deaths ?? 1)) * 7));
    return {
      left: `${x}%`,
      top: `${y}%`,
      width: `${size}px`,
      height: `${size}px`
    };
  };
  const alertClass = (level?: string) => `outbreak-dot ${level ?? "watch"}`;

  return (
    <DashboardShell>
      <div className="batch-ops-page">
      <div className="batch-ops-actions">
        {batch && (
          <Link href={`/dashboard/farmer/farms/${batch.farmId}`} className="batch-ops-back">
            <ArrowLeft size={16} />
            {lang === "en" ? "Back to Farm" : "Retour à l'élevage"}
          </Link>
        )}
        
        {batch && batch.status === "active" && (
          <button onClick={handleCloseBatch} className="batch-ops-close">
            {lang === "en" ? "Complete/Close Batch" : "Terminer/Cloturer le Lot"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="farmer-op-loading"><Layers size={26} /><span>{lang === "en" ? "Loading batch operations..." : "Chargement des opérations du lot..."}</span></div>
      ) : !batch ? (
        <div className="empty-state">{lang === "en" ? "Batch not found." : "Lot non trouvé."}</div>
      ) : (
        <div className="batch-ops-shell">
          {/* Header summary */}
          <div className="batch-ops-hero">
            <div className="batch-ops-hero__badges">
              <span className={`status-badge ${batch.status}`}>
                {batch.status === "active" ? (lang === "en" ? "active" : "actif") : (lang === "en" ? "closed" : "clôturé")}
              </span>
              <span className="status-badge approved" style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>
                {batch.poultryType === "layer" ? (lang === "en" ? "layer" : "pondeuse") : batch.poultryType === "broiler" ? (lang === "en" ? "broiler" : "poulet de chair") : batch.poultryType}
              </span>
            </div>
            <h1>{batch.name}</h1>
            <p>
              {lang === "en" ? "Code: " : "Code : "}<strong>{batch.batchCode}</strong> | {lang === "en" ? "Breed: " : "Race : "}<strong>{batch.breed || "N/A"}</strong> | {lang === "en" ? "Start: " : "Début : "}<strong>{new Date(batch.startDate).toLocaleDateString()}</strong>
            </p>
          </div>

          {/* Quick stats row */}
          <div className="overview-stats batch-ops-stats">
            <div className="stat-card" style={{ padding: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "700" }}>{lang === "en" ? "CURRENT BIRDS" : "EFFECTIF ACTUEL"}</span>
              <p style={{ fontSize: "1.5rem", fontWeight: "800" }}>{batch.currentQuantity} / {batch.initialQuantity}</p>
            </div>
            <div className="stat-card" style={{ padding: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "700" }}>{lang === "en" ? "MORTALITY RATE" : "TAUX DE MORTALITÉ"}</span>
              <p style={{ fontSize: "1.5rem", fontWeight: "800", color: Number(mortalityRate) > 5 ? "#ef4444" : "inherit" }}>{mortalityRate}%</p>
            </div>
            <div className="stat-card" style={{ padding: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "700" }}>{lang === "en" ? "TOTAL EXPENSES" : "DÉPENSES TOTALES"}</span>
              <p style={{ fontSize: "1.5rem", fontWeight: "800", color: "#ef4444" }}>{(totalExpenses ?? 0).toLocaleString()} XAF</p>
            </div>
            <div className="stat-card" style={{ padding: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "700" }}>{lang === "en" ? "EST. PROFIT" : "BÉNÉFICE ESTIMÉ"}</span>
              <p style={{ fontSize: "1.5rem", fontWeight: "800", color: estimatedProfit >= 0 ? "var(--color-accent)" : "#ef4444" }}>{(estimatedProfit ?? 0).toLocaleString()} XAF</p>
            </div>
          </div>

          {/* Tabs bar */}
          <div className="tabs-header">
            <button onClick={() => { setActiveTab("overview"); setMsg(""); }} className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}>{t("batch.tab.overview")}</button>
            <button onClick={() => { setActiveTab("feeding"); setMsg(""); }} className={`tab-btn ${activeTab === "feeding" ? "active" : ""}`}>{t("batch.tab.feeding")}</button>
            <button onClick={() => { setActiveTab("mortality"); setMsg(""); }} className={`tab-btn ${activeTab === "mortality" ? "active" : ""}`}>{t("batch.tab.mortality")}</button>
            <button onClick={() => { setActiveTab("vaccination"); setMsg(""); }} className={`tab-btn ${activeTab === "vaccination" ? "active" : ""}`}>{t("batch.tab.vaccine")}</button>
            {batch.poultryType === "layer" && (
              <button onClick={() => { setActiveTab("eggs"); setMsg(""); }} className={`tab-btn ${activeTab === "eggs" ? "active" : ""}`}>{t("batch.tab.eggs")}</button>
            )}
            <button onClick={() => { setActiveTab("sales"); setMsg(""); }} className={`tab-btn ${activeTab === "sales" ? "active" : ""}`}>{t("batch.tab.sales")}</button>
            <button onClick={() => { setActiveTab("expenses"); setMsg(""); }} className={`tab-btn ${activeTab === "expenses" ? "active" : ""}`}>{t("batch.tab.expenses")}</button>
            <button onClick={() => { setActiveTab("reports"); setMsg(""); }} className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}>{t("batch.tab.reports")}</button>
          </div>

          {/* Tabs Panels */}
          <div className="tab-panel-content">
            
            {/* Overview tab */}
            {activeTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{lang === "en" ? "Batch Specifications" : "Spécifications du Lot"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>{lang === "en" ? "Poultry Type" : "Type de volaille"}</span>
                      <strong>{batch.poultryType === "layer" ? (lang === "en" ? "layer" : "pondeuse") : batch.poultryType === "broiler" ? (lang === "en" ? "broiler" : "poulet de chair") : batch.poultryType}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>{lang === "en" ? "Breed Focus" : "Race"}</span>
                      <strong>{batch.breed || (lang === "en" ? "Unspecified" : "Non spécifiée")}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>{lang === "en" ? "Initial Birds" : "Effectif initial"}</span>
                      <strong>{batch.initialQuantity} {lang === "en" ? "birds" : "volailles"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>{lang === "en" ? "Remaining Birds" : "Effectif restant"}</span>
                      <strong>{batch.currentQuantity} {lang === "en" ? "birds" : "volailles"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>{lang === "en" ? "Laid Date" : "Date de démarrage"}</span>
                      <strong>{new Date(batch.startDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>
                <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h3 style={{ fontWeight: "700" }}>{lang === "en" ? "Operations Status" : "Statut des opérations"}</h3>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem" }}>
                    {batch.status === "active"
                      ? (lang === "en" ? "This batch is active. Record feeding, vaccination schedules, egg collections, direct sales, and operating expenses to update performance statistics in real time." : "Ce lot est actif. Enregistrez les repas, les vaccins, la ponte, les ventes directes et les dépenses pour mettre à jour les statistiques en temps réel.")
                      : (lang === "en" ? "This batch is closed. Registration of new metrics is suspended." : "Ce lot est clôturé. L'enregistrement de nouvelles données est suspendu.")}
                  </p>
                </div>
              </div>
            )}

            {/* Feeding Tab */}
            {activeTab === "feeding" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{lang === "en" ? "Feeding Log History" : "Historique de l'Alimentation"}</h3>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>{lang === "en" ? "Type" : "Type"}</th>
                          <th>{lang === "en" ? "Qty" : "Qté"}</th>
                          <th>{lang === "en" ? "Cost" : "Coût"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedingRecords.map((rec) => (
                          <tr key={rec._id}>
                            <td>{new Date(rec.feedingDate).toLocaleDateString()}</td>
                            <td>{rec.feedType}</td>
                            <td>{rec.quantity} {rec.unit === "bag" ? (lang === "en" ? "bag" : "sac") : rec.unit === "ton" ? (lang === "en" ? "ton" : "tonne") : rec.unit}</td>
                            <td>{(rec.cost ?? 0).toLocaleString()} XAF</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {batch.status === "active" && (
                  <div className="glass-card" style={{ padding: "24px", alignSelf: "start" }}>
                    <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{t("op.feed.btn")}</h3>
                    <form onSubmit={addFeeding} className="connected-form">
                      <div className="form-group">
                        <label>{t("op.feed.type")}</label>
                        <input type="text" value={feedType} onChange={(e) => setFeedType(e.target.value)} required placeholder="Starter Crumble" />
                      </div>
                      <div className="form-group" style={{ display: "flex", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <label>{t("op.feed.qty")}</label>
                          <input type="number" min={1} value={feedQty} onChange={(e) => setFeedQty(Number(e.target.value))} required />
                        </div>
                        <div>
                          <label>{t("op.feed.unit")}</label>
                          <select value={feedUnit} onChange={(e) => setFeedUnit(e.target.value)}>
                            <option value="bag">{lang === "en" ? "bag" : "sac"}</option>
                            <option value="kg">kg</option>
                            <option value="ton">{lang === "en" ? "ton" : "tonne"}</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{t("op.feed.cost")}</label>
                        <input type="number" min={0} value={feedCost} onChange={(e) => setFeedCost(Number(e.target.value))} required />
                      </div>
                      <button type="submit" className="auth-submit-btn" style={{ background: "var(--color-accent)", marginInline: 0 }}>
                        {formLoading ? (lang === "en" ? "Recording..." : "Enregistrement...") : t("op.feed.btn")}
                      </button>
                      {msg && <p className="form-success-banner" style={{ marginTop: "12px" }}>{msg}</p>}
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Mortality Tab */}
            {activeTab === "mortality" && (
              <div className="mortality-surveillance-layout">
                <div className="glass-card mortality-incidents-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "start", marginBottom: "16px" }}>
                    <div>
                      <h3 style={{ fontWeight: "800" }}>{lang === "en" ? "Mortality Incidents" : "Registre de Mortalité"}</h3>
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                        {lang === "en" ? "Record enough detail to power disease-specific outbreak alerts." : "Enregistrez les détails des décès pour alimenter la surveillance sanitaire."}
                      </p>
                    </div>
                    {activeDiseaseSummary && (
                      <span className={`outbreak-alert-pill ${activeDiseaseSummary.alertLevel}`}>
                        <AlertTriangle size={15} />
                        {activeDiseaseSummary.disease}: {activeDiseaseSummary.alertLevel === "watch" ? (lang === "en" ? "watch" : "surveillance") : activeDiseaseSummary.alertLevel === "warning" ? (lang === "en" ? "warning" : "attention") : activeDiseaseSummary.alertLevel === "danger" ? (lang === "en" ? "danger" : "danger") : activeDiseaseSummary.alertLevel}
                      </span>
                    )}
                  </div>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>{lang === "en" ? "Deaths" : "Décès"}</th>
                          <th>{lang === "en" ? "Cause" : "Cause"}</th>
                          <th>{lang === "en" ? "Suspected disease" : "Maladie suspectée"}</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mortalityRecords.map((rec) => (
                          <tr key={rec._id}>
                            <td>{new Date(rec.date).toLocaleDateString()}</td>
                            <td style={{ color: "#ef4444", fontWeight: "700" }}>{rec.numberOfDeaths}</td>
                            <td>{rec.cause}</td>
                            <td>{rec.suspectedDisease || (lang === "en" ? "Not specified" : "Non spécifiée")}</td>
                            <td style={{ maxWidth: "280px", color: "var(--color-text-secondary)" }}>
                              {rec.deathDescription || rec.notes || (lang === "en" ? "No description" : "Aucune description")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {batch.status === "active" && (
                  <div className="glass-card mortality-report-card">
                    <h3 style={{ fontWeight: "800", marginBottom: "6px" }}>{t("op.mort.btn")}</h3>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
                      {lang === "en" ? "Name the specific suspected sickness so nearby farmers can be alerted to that exact spread pattern." : "Nommez la maladie suspectée pour alerter les fermes voisines de sa propagation."}
                    </p>
                    <form onSubmit={addMortality} className="connected-form">
                      <div className="form-group">
                        <label>{t("op.mort.qty")}</label>
                        <input type="number" min={1} max={batch.currentQuantity} value={mortQty} onChange={(e) => setMortQty(Number(e.target.value))} required />
                      </div>
                      <div className="form-group">
                        <label>{t("op.mort.cause")}</label>
                        <input type="text" value={mortCause} onChange={(e) => setMortCause(e.target.value)} required placeholder={lang === "en" ? "Heat stress, coccidiosis..." : "Coup de chaleur, coccidiose..."} />
                      </div>
                      <div className="form-group">
                        <label>{lang === "en" ? "Specific suspected disease" : "Maladie suspectée spécifique"}</label>
                        <input type="text" value={mortDisease} onChange={(e) => setMortDisease(e.target.value)} placeholder={lang === "en" ? "Newcastle, Avian influenza, Gumboro..." : "Newcastle, Grippe aviaire, Gumboro..."} />
                      </div>
                      <div className="form-group">
                        <label>{lang === "en" ? "Symptoms observed" : "Symptômes observés"}</label>
                        <input type="text" value={mortSymptoms} onChange={(e) => setMortSymptoms(e.target.value)} placeholder={lang === "en" ? "Coughing, green diarrhea, twisted neck..." : "Toux, diarrhée verte, cou tordu..."} />
                      </div>
                      <div className="form-group">
                        <label>{lang === "en" ? "Severity" : "Gravité"}</label>
                        <select value={mortSeverity} onChange={(e) => setMortSeverity(e.target.value)}>
                          <option value="low">{lang === "en" ? "Low" : "Faible"}</option>
                          <option value="medium">{lang === "en" ? "Medium" : "Moyenne"}</option>
                          <option value="high">{lang === "en" ? "High" : "Élevée"}</option>
                          <option value="critical">{lang === "en" ? "Critical" : "Critique"}</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{lang === "en" ? "Describe the death pattern" : "Décrire le profil de mortalité"}</label>
                        <textarea
                          value={mortDescription}
                          onChange={(e) => setMortDescription(e.target.value)}
                          rows={4}
                          placeholder={lang === "en" ? "When did deaths start? Were birds suddenly dead? Any shared symptoms, feed change, or neighboring farm reports?" : "Quand les décès ont-ils commencé ? S'agissait-il de morts subites ? Autres symptômes, changement d'aliment ?"}
                        />
                      </div>
                      <button type="submit" className="auth-submit-btn" style={{ background: "#ef4444", marginInline: 0 }}>
                        {formLoading ? (lang === "en" ? "Recording..." : "Enregistrement...") : t("op.mort.btn")}
                      </button>
                      {msg && (
                        <p className={msg.includes("logged") || msg.includes("enregistr") ? "form-success-banner" : "form-error-banner"} style={{ marginTop: "12px" }}>
                          {msg}
                        </p>
                      )}
                    </form>
                  </div>
                )}

                <div className="glass-card outbreak-map-card">
                  <div className="outbreak-map-head">
                    <div>
                      <p className="resource-kicker">{lang === "en" ? "Disease surveillance" : "Surveillance épidémiologique"}</p>
                      <h3>{lang === "en" ? "Outbreak heatmap" : "Carte des Foyers d'Infection"}</h3>
                      <p>
                        {lang === "en" ? `Public alerts are grouped by specific suspected disease across the last ${outbreakData?.windowDays ?? 45} days.` : `Les alertes publiques sont regroupées par maladie suspectée sur les ${outbreakData?.windowDays ?? 45} derniers jours.`}
                      </p>
                    </div>
                    <MapPinned size={26} />
                  </div>
                  <div className="outbreak-map">
                    <span className="map-label north">{lang === "en" ? "North" : "Nord"}</span>
                    <span className="map-label coast">{lang === "en" ? "Coast" : "Littoral"}</span>
                    <span className="map-label center">Centre</span>
                    {outbreakPoints.length ? (
                      outbreakPoints.map((point: any, index: number) => (
                        <div
                           key={`${point.disease}-${point.region}-${point.city}-${index}`}
                           className={alertClass(point.alertLevel)}
                           style={mapPointStyle(point)}
                           title={lang === "en" ? `${point.disease}: ${point.deaths} deaths, ${point.reports} reports in ${point.city || point.region}` : `${point.disease} : ${point.deaths} décès, ${point.reports} signalements à ${point.city || point.region}`}
                        >
                          <span>{point.deaths}</span>
                        </div>
                      ))
                    ) : (
                      <div className="outbreak-empty">
                        {lang === "en" ? "No active disease alerts with mapped coordinates." : "Aucune alerte sanitaire active avec coordonnées géographiques."}
                      </div>
                    )}
                  </div>
                  <div className="outbreak-summary-list">
                    {outbreakSummaries.slice(0, 4).map((summary: any) => (
                      <div key={summary.disease} className="outbreak-summary-row">
                        <span className={`outbreak-severity ${summary.alertLevel}`} />
                        <div>
                          <strong>{summary.disease}</strong>
                          <p>{lang === "en" ? `${summary.deaths} deaths across ${summary.affectedLocations.length} area(s)` : `${summary.deaths} décès dans ${summary.affectedLocations.length} zone(s)`}</p>
                        </div>
                      </div>
                    ))}
                    {!outbreakSummaries.length && (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                        {lang === "en" ? "Reports with a specific suspected disease will appear here automatically." : "Les signalements avec une maladie suspectée apparaîtront ici automatiquement."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Vaccination Tab */}
            {activeTab === "vaccination" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{lang === "en" ? "Schedules & Administrations" : "Calendrier & Administrations"}</h3>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{lang === "en" ? "Vaccine" : "Vaccin"}</th>
                          <th>{lang === "en" ? "Disease" : "Maladie"}</th>
                          <th>{lang === "en" ? "Scheduled" : "Prévu"}</th>
                          <th>{lang === "en" ? "Status" : "Statut"}</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vaccinations.map((rec) => (
                          <tr key={rec._id}>
                            <td style={{ fontWeight: "700" }}>{rec.vaccineName}</td>
                            <td>{rec.diseasePrevented || "N/A"}</td>
                            <td>{new Date(rec.scheduledDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge ${rec.status}`}>
                                {rec.status === "scheduled" ? (lang === "en" ? "scheduled" : "planifié") : rec.status === "completed" ? (lang === "en" ? "completed" : "administré") : rec.status}
                              </span>
                            </td>
                            <td>
                              {rec.status === "scheduled" && batch.status === "active" && (
                                <button onClick={() => completeVaccination(rec._id)} className="status-badge approved" style={{ cursor: "pointer", border: "none" }}>
                                  {t("op.vacc.complete")}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {batch.status === "active" && (
                  <div className="glass-card" style={{ padding: "24px", alignSelf: "start" }}>
                    <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{t("op.vacc.btn")}</h3>
                    <form onSubmit={addVaccination} className="connected-form">
                      <div className="form-group">
                        <label>{t("op.vacc.name")}</label>
                        <input type="text" value={vaccName} onChange={(e) => setVaccName(e.target.value)} required placeholder="Gumboro, Lasota..." />
                      </div>
                      <div className="form-group">
                        <label>{t("op.vacc.prevent")}</label>
                        <input type="text" value={vaccPrevent} onChange={(e) => setVaccPrevent(e.target.value)} placeholder="Newcastle, IBD" />
                      </div>
                      <div className="form-group" style={{ display: "flex", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <label>{t("op.vacc.date")}</label>
                          <input type="date" value={vaccDate} onChange={(e) => setVaccDate(e.target.value)} required />
                        </div>
                        <div>
                          <label>{t("op.vacc.cost")}</label>
                          <input type="number" min={0} value={vaccCost} onChange={(e) => setVaccCost(Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{t("op.vacc.admin")}</label>
                        <input type="text" value={vaccAdmin} onChange={(e) => setVaccAdmin(e.target.value)} placeholder="Dr. Ndumbe" />
                      </div>
                      <button type="submit" className="auth-submit-btn" style={{ background: "var(--color-accent)", marginInline: 0 }}>
                        {formLoading ? (lang === "en" ? "Scheduling..." : "Planification...") : t("op.vacc.btn")}
                      </button>
                      {msg && <p className="form-success-banner" style={{ marginTop: "12px" }}>{msg}</p>}
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Egg Production Tab */}
            {activeTab === "eggs" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{lang === "en" ? "Daily Collections" : "Collectes Journalières"}</h3>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>{lang === "en" ? "Collected" : "Collectés"}</th>
                          <th>{lang === "en" ? "Damaged" : "Cassés"}</th>
                          <th>{lang === "en" ? "Remaining" : "Restants"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eggRecords.map((rec) => (
                          <tr key={rec._id}>
                            <td>{new Date(rec.date).toLocaleDateString()}</td>
                            <td style={{ fontWeight: "700" }}>{rec.eggsCollected}</td>
                            <td style={{ color: "#ef4444" }}>{rec.damagedEggs}</td>
                            <td>{rec.remainingEggs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {batch.status === "active" && (
                  <div className="glass-card" style={{ padding: "24px", alignSelf: "start" }}>
                    <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{t("op.egg.btn")}</h3>
                    <form onSubmit={addEggProduction} className="connected-form">
                      <div className="form-group">
                        <label>{t("op.egg.collected")}</label>
                        <input type="number" min={0} value={eggsCollected} onChange={(e) => setEggsCollected(Number(e.target.value))} required />
                      </div>
                      <div className="form-group">
                        <label>{t("op.egg.damaged")}</label>
                        <input type="number" min={0} value={eggsDamaged} onChange={(e) => setEggsDamaged(Number(e.target.value))} required />
                      </div>
                      <div className="form-group">
                        <label>{t("op.egg.sold")}</label>
                        <input type="number" min={0} value={eggsSold} onChange={(e) => setEggsSold(Number(e.target.value))} required />
                      </div>
                      <button type="submit" className="auth-submit-btn" style={{ background: "var(--color-accent)", marginInline: 0 }}>
                        {formLoading ? (lang === "en" ? "Logging..." : "Enregistrement...") : t("op.egg.btn")}
                      </button>
                      {msg && (
                        <p className={msg.includes("logged") || msg.includes("enregistr") ? "form-success-banner" : "form-error-banner"} style={{ marginTop: "12px" }}>
                          {msg}
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Direct Sales Tab */}
            {activeTab === "sales" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{lang === "en" ? "Direct Farm Sales" : "Ventes Directes de la Ferme"}</h3>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>{lang === "en" ? "Product" : "Produit"}</th>
                          <th>{lang === "en" ? "Qty" : "Qté"}</th>
                          <th>{lang === "en" ? "Revenue" : "Revenu"}</th>
                          <th>{lang === "en" ? "Buyer" : "Acheteur"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((rec) => (
                          <tr key={rec._id}>
                            <td>{new Date(rec.saleDate).toLocaleDateString()}</td>
                            <td style={{ fontWeight: "700" }}>
                              {lang === "en" 
                                ? rec.productType.replace(/_/g, " ") 
                                : (rec.productType === "live_chicken" ? "Poulet vivant" 
                                   : rec.productType === "dressed_chicken" ? "Poulet habillé" 
                                   : rec.productType === "eggs" ? "Œufs" 
                                   : rec.productType === "chicks" ? "Poussins" 
                                   : rec.productType === "manure" ? "Fumier" 
                                   : rec.productType === "spent_layers" ? "Réformes" 
                                   : rec.productType.replace(/_/g, " "))
                              }
                            </td>
                            <td>{rec.quantity} {rec.unit === "tray" ? (lang === "en" ? "tray" : "plateau") : rec.unit === "bird" ? (lang === "en" ? "bird" : "tête") : rec.unit}</td>
                            <td style={{ color: "var(--color-accent)", fontWeight: "700" }}>{(rec.totalAmount ?? 0).toLocaleString()} XAF</td>
                            <td>{rec.buyerName || (lang === "en" ? "Generic Customer" : "Client générique")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {batch.status === "active" && (
                  <div className="glass-card" style={{ padding: "24px", alignSelf: "start" }}>
                    <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{t("op.sale.btn")}</h3>
                    <form onSubmit={addSale} className="connected-form">
                      <div className="form-group">
                        <label>{t("op.sale.type")}</label>
                        <select value={saleType} onChange={(e) => setSaleType(e.target.value)}>
                          <option value="live_chicken">{lang === "en" ? "Live Chicken" : "Poulet vivant"}</option>
                          <option value="dressed_chicken">{lang === "en" ? "Dressed Chicken" : "Poulet habillé"}</option>
                          <option value="eggs">{lang === "en" ? "Eggs" : "Œufs"}</option>
                          <option value="chicks">{lang === "en" ? "Chicks" : "Poussins"}</option>
                          <option value="manure">{lang === "en" ? "Manure" : "Fumier"}</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ display: "flex", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <label>{t("op.sale.qty")}</label>
                          <input type="number" min={1} value={saleQty} onChange={(e) => setSaleQty(Number(e.target.value))} required />
                        </div>
                        <div>
                          <label>{t("op.sale.price")}</label>
                          <input type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} required />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{t("op.sale.buyer")}</label>
                        <input type="text" value={saleBuyer} onChange={(e) => setSaleBuyer(e.target.value)} placeholder={lang === "en" ? "Buyer Name" : "Nom de l'acheteur"} />
                      </div>
                      <button type="submit" className="auth-submit-btn" style={{ background: "var(--color-accent)", marginInline: 0 }}>
                        {formLoading ? (lang === "en" ? "Recording..." : "Enregistrement...") : t("op.sale.btn")}
                      </button>
                      {msg && (
                        <p className={msg.includes("recorded") || msg.includes("enregistr") ? "form-success-banner" : "form-error-banner"} style={{ marginTop: "12px" }}>
                          {msg}
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Expenses Tab */}
            {activeTab === "expenses" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{lang === "en" ? "Operating Expenses" : "Dépenses d'Exploitation"}</h3>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>{lang === "en" ? "Category" : "Catégorie"}</th>
                          <th>{lang === "en" ? "Amount" : "Montant"}</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((rec) => (
                          <tr key={rec._id}>
                            <td>{new Date(rec.date).toLocaleDateString()}</td>
                            <td style={{ fontWeight: "700" }}>
                              {lang === "en" 
                                ? rec.category 
                                : (rec.category === "feed" ? "Aliment" 
                                   : rec.category === "vaccination" ? "Vaccination" 
                                   : rec.category === "medicine" ? "Médicaments" 
                                   : rec.category === "labor" ? "Main d'œuvre" 
                                   : rec.category === "transport" ? "Transport" 
                                   : rec.category === "rent" ? "Loyer" 
                                   : rec.category === "other" ? "Autre" 
                                   : rec.category)
                              }
                            </td>
                            <td style={{ color: "#ef4444" }}>{(rec.amount ?? 0).toLocaleString()} XAF</td>
                            <td>{rec.description || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {batch.status === "active" && (
                  <div className="glass-card" style={{ padding: "24px", alignSelf: "start" }}>
                    <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>{t("op.expense.btn")}</h3>
                    <form onSubmit={addExpense} className="connected-form">
                      <div className="form-group">
                        <label>{t("op.expense.amount")}</label>
                        <input type="number" min={0} value={expAmount} onChange={(e) => setExpAmount(Number(e.target.value))} required />
                      </div>
                      <div className="form-group">
                        <label>{t("op.expense.cat")}</label>
                        <select value={expCat} onChange={(e) => setExpCat(e.target.value)}>
                          <option value="feed">{lang === "en" ? "Feed" : "Aliment"}</option>
                          <option value="vaccination">Vaccination</option>
                          <option value="medicine">{lang === "en" ? "Medicine" : "Médicaments"}</option>
                          <option value="labor">{lang === "en" ? "Labor" : "Main d'œuvre"}</option>
                          <option value="transport">Transport</option>
                          <option value="rent">{lang === "en" ? "Rent" : "Loyer"}</option>
                          <option value="other">{lang === "en" ? "Other" : "Autre"}</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t("op.expense.desc")}</label>
                        <input type="text" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} required placeholder={lang === "en" ? "Gasoline, workers wage, bags..." : "Essence, salaire des ouvriers, sacs..."} />
                      </div>
                      <button type="submit" className="auth-submit-btn" style={{ background: "var(--color-accent)", marginInline: 0 }}>
                        {formLoading ? (lang === "en" ? "Logging..." : "Enregistrement...") : t("op.expense.btn")}
                      </button>
                      {msg && <p className="form-success-banner" style={{ marginTop: "12px" }}>{msg}</p>}
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div className="chart-card">
                  <h3>{lang === "en" ? "Expenses Structure" : "Structure des Dépenses"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", justifyContent: "center", height: "200px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span>{lang === "en" ? "Feed Expenses" : "Dépenses d'Alimentation"}</span>
                      <strong>{(feedExp ?? 0).toLocaleString()} XAF</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span>{lang === "en" ? "Vaccine Expenses" : "Dépenses de Vaccination"}</span>
                      <strong>{(vaccExp ?? 0).toLocaleString()} XAF</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span>{lang === "en" ? "Other Operating Expenses" : "Autres Dépenses d'Exploitation"}</span>
                      <strong>{((totalExpenses ?? 0) - (feedExp ?? 0) - (vaccExp ?? 0)).toLocaleString()} XAF</strong>
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <h3>{lang === "en" ? "Overview Metrics" : "Métriques Globales"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{lang === "en" ? "Mortality Index" : "Indice de Mortalité"}</span>
                      <strong style={{ color: Number(mortalityRate) > 5 ? "#ef4444" : "var(--color-accent)" }}>{mortalityRate}%</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{lang === "en" ? "Total Birds Sold" : "Total Volailles Vendues"}</span>
                      <strong>{sales.filter(s => s.productType !== "eggs").reduce((sum, s) => sum + s.quantity, 0)} {lang === "en" ? "birds" : "volailles"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{lang === "en" ? "Total Trays of Eggs Sold" : "Total Plateaux d'Œufs Vendus"}</span>
                      <strong>{sales.filter(s => s.productType === "eggs").reduce((sum, s) => sum + s.quantity, 0)} {lang === "en" ? "trays" : "plateaux"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      </div>
    </DashboardShell>
  );
}
