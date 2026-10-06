"use client";

import { useEffect, useState } from "react";
import { api, apiFetch } from "@/lib/api";
import type { Farm } from "@/lib/types";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import { FileText, Tractor, Calendar, Download, TrendingUp, Layers, DollarSign, HelpCircle } from "lucide-react";

export default function FarmerReportsPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // FCR Estimated Weight per Batch (indexed by batchId)
  const [estWeights, setEstWeights] = useState<Record<string, string>>({});

  const fetchReportData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch financial records
      const [expRes, salesRes, farmsRes] = await Promise.all([
        api.list<any>("/expenses", undefined, token),
        api.list<any>("/farm-sales", undefined, token),
        api.list<Farm>("/farms/my", undefined, token)
      ]);
      setExpenses(expRes.data || []);
      setSales(salesRes.data || []);

      // Compile batch records across all verified farms
      const approvedFarms = (farmsRes.data || []).filter(f => f.verificationStatus === "approved");
      const compiledBatches: any[] = [];

      for (const farm of approvedFarms) {
        const batchesRes = await apiFetch<any>(`/farms/${farm._id}/batches`, { token }).catch(() => ({ data: [] }));
        const batchList = batchesRes.data || [];

        for (const batch of batchList) {
          const [feedRes, mortRes, eggRes] = await Promise.all([
            apiFetch<any>(`/batches/${batch._id}/feeding-records`, { token }).catch(() => ({ data: [] })),
            apiFetch<any>(`/batches/${batch._id}/mortality-records`, { token }).catch(() => ({ data: [] })),
            apiFetch<any>(`/batches/${batch._id}/egg-production-records`, { token }).catch(() => ({ data: [] }))
          ]);

          // Calculate Feed consumed
          let totalFeedKg = 0;
          let totalFeedCost = 0;
          const feeds = feedRes.data || [];
          feeds.forEach((f: any) => {
            const qty = Number(f.quantity || 0);
            const unit = String(f.unit || "bag").toLowerCase();
            if (unit === "bag") totalFeedKg += qty * 50; // assume 50kg bag
            else if (unit === "ton" || unit === "tonne") totalFeedKg += qty * 1000;
            else totalFeedKg += qty; // kg
            totalFeedCost += Number(f.cost || 0);
          });

          // Calculate mortality
          const deaths = mortRes.data || [];
          const totalDeaths = deaths.reduce((sum: number, m: any) => sum + Number(m.numberOfDeaths || 0), 0);
          const mortalityRate = batch.initialQuantity ? ((totalDeaths / batch.initialQuantity) * 100).toFixed(1) : "0.0";

          // Calculate egg production
          const eggs = eggRes.data || [];
          const totalEggs = eggs.reduce((sum: number, eg: any) => sum + Number(eg.eggsCollected || 0), 0);

          compiledBatches.push({
            ...batch,
            farmName: farm.name,
            totalFeedKg,
            totalFeedCost,
            totalDeaths,
            mortalityRate,
            totalEggs,
            feedPerBird: batch.currentQuantity ? (totalFeedKg / batch.currentQuantity).toFixed(2) : "0.00",
            feedCostPerBird: batch.currentQuantity ? (totalFeedCost / batch.currentQuantity).toFixed(0) : "0",
          });
        }
      }
      setBatches(compiledBatches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [token]);

  // Date filtering logic
  const filteredExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  const filteredSales = sales.filter((s) => {
    const d = new Date(s.saleDate || s.createdAt);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.totalAmount ?? 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // CSV Exporter
  const handleExportCSV = (type: "sales" | "expenses") => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (type === "sales") {
      filename = "farm_sales_report.csv";
      headers = ["Date", "Product Type", "Quantity", "Unit", "Unit Price (XAF)", "Total Amount (XAF)", "Buyer"];
      rows = filteredSales.map((s) => [
        new Date(s.saleDate || s.createdAt).toLocaleDateString(),
        s.productType,
        String(s.quantity),
        s.unit || "",
        String(s.unitPrice),
        String(s.totalAmount),
        s.buyerName || "Generic Buyer"
      ]);
    } else {
      filename = "farm_expenses_report.csv";
      headers = ["Date", "Category", "Amount (XAF)", "Description"];
      rows = filteredExpenses.map((e) => [
        new Date(e.date).toLocaleDateString(),
        e.category,
        String(e.amount),
        e.description || ""
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWeightChange = (batchId: string, val: string) => {
    setEstWeights((prev) => ({ ...prev, [batchId]: val }));
  };

  // SVG bar chart heights
  const maxVal = Math.max(totalRevenue, totalExpenses, 1);
  const revPct = Math.max(10, (totalRevenue / maxVal) * 85);
  const expPct = Math.max(10, (totalExpenses / maxVal) * 85);

  return (
    <DashboardShell>
      <div className="farmer-op-page farmer-report-page">
        <section className="farmer-op-hero">
          <div>
            <p className="resource-kicker">{t("dash.sidebar.farmer")}</p>
            <h1 className="farmer-op-hero__title">{lang === "en" ? "Performance & financial reports." : "Rapports financiers & performance."}</h1>
            <p className="farmer-op-hero__copy">
              {lang === "en"
                ? "Compare revenue, expenses, flock mortality, feed conversion, and batch performance from one reporting workspace."
                : "Comparez revenus, dépenses, mortalité, indice de consommation et performance des lots depuis un seul espace."}
            </p>
          </div>
          <div className="farmer-op-hero__stat">
            <strong>{batches.length}</strong>
            <span>{lang === "en" ? "batches analyzed" : "lots analysés"}</span>
          </div>
        </section>

        {!loading && (
          <div className="farmer-report-actions">
            <button onClick={() => handleExportCSV("sales")} className="dash-badge dash-badge--approved">
              <Download size={14} />
              {lang === "en" ? "Export Sales" : "Export Ventes"}
            </button>
            <button onClick={() => handleExportCSV("expenses")} className="dash-badge dash-badge--rejected">
              <Download size={14} />
              {lang === "en" ? "Export Expenses" : "Export Dépenses"}
            </button>
          </div>
        )}

      {/* Date Filters Row */}
      <div className="glass-card farmer-report-filters">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={16} style={{ color: "var(--color-text-secondary)" }} />
          <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{lang === "en" ? "Date Filters:" : "Filtres de date :"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{t("report.start_date")}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{t("report.end_date")}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
          >
            {lang === "en" ? "Clear Filters" : "Réinitialiser"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="farmer-op-loading"><FileText size={26} /><span>{lang === "en" ? "Loading reports and analytics..." : "Chargement des rapports et statistiques..."}</span></div>
      ) : (
        <div className="farmer-report-stack">
          
          {/* Quick Metrics */}
          <div className="overview-stats">
            <div className="stat-card">
              <div className="stat-header">
                <span>{lang === "en" ? "Gross Revenue" : "Revenu Brut"}</span>
              </div>
              <span className="stat-value" style={{ color: "var(--color-accent)" }}>
                {(totalRevenue ?? 0).toLocaleString()} XAF
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>{lang === "en" ? "Total Expenses" : "Dépenses Totales"}</span>
              </div>
              <span className="stat-value" style={{ color: "#ef4444" }}>
                {(totalExpenses ?? 0).toLocaleString()} XAF
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>{lang === "en" ? "Net Profit" : "Bénéfice Net"}</span>
              </div>
              <span className="stat-value" style={{ color: netProfit >= 0 ? "var(--color-accent)" : "#ef4444" }}>
                {(netProfit ?? 0).toLocaleString()} XAF
              </span>
            </div>
          </div>

          {/* Revenue vs Expenses Chart & Details */}
          <div className="farmer-report-chart-grid">
            
            {/* dynamic SVG graph */}
            <div className="chart-card" style={{ padding: "24px" }}>
              <h3 style={{ fontWeight: "800", marginBottom: "16px" }}>{lang === "en" ? "Revenue vs Expenses Breakdown" : "Répartition Ventes vs Dépenses"}</h3>
              <div style={{ height: "220px", display: "flex", alignItems: "flex-end", gap: "48px", padding: "16px 32px 0 32px", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--color-accent)" }}>{totalRevenue.toLocaleString()}</span>
                  <div style={{ width: "100%", maxWidth: "80px", height: `${revPct}%`, background: "var(--gradient-accent)", borderRadius: "6px 6px 0 0", transition: "height 0.5s ease" }} />
                  <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{lang === "en" ? "Revenue" : "Ventes"}</span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#ef4444" }}>{totalExpenses.toLocaleString()}</span>
                  <div style={{ width: "100%", maxWidth: "80px", height: `${expPct}%`, background: "linear-gradient(to top, #ef4444, #f87171)", borderRadius: "6px 6px 0 0", transition: "height 0.5s ease" }} />
                  <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{lang === "en" ? "Expenses" : "Dépenses"}</span>
                </div>
              </div>
            </div>

            {/* Expenses Structure */}
            <div className="chart-card" style={{ padding: "24px" }}>
              <h3 style={{ fontWeight: "800", marginBottom: "16px" }}>{lang === "en" ? "Category Expenses Breakdown" : "Structure des Dépenses"}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "220px", overflowY: "auto", paddingRight: "8px" }}>
                {Array.from(new Set(filteredExpenses.map(e => e.category))).length === 0 ? (
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{lang === "en" ? "No expenses recorded for this period." : "Aucune dépense enregistrée."}</p>
                ) : (
                  Array.from(new Set(filteredExpenses.map(e => e.category))).map((cat) => {
                    const amt = filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
                    const pct = totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(0) : "0";
                    return (
                      <div key={cat} className="dash-progress" style={{ marginBottom: "4px" }}>
                        <div className="dash-progress__top">
                          <span className="dash-progress__label" style={{ textTransform: "capitalize", fontWeight: "700" }}>{cat} ({pct}%)</span>
                          <span className="dash-progress__value">{amt.toLocaleString()} XAF</span>
                        </div>
                        <div className="dash-progress__track">
                          <div className="dash-progress__fill" style={{ width: `${pct}%`, background: cat === "feed" ? "var(--color-accent)" : "var(--gold-400)" }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Batch Performance Module */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={22} style={{ color: "var(--color-accent)" }} />
              {t("report.batch_perf")}
            </h2>

            {batches.length === 0 ? (
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                {lang === "en" ? "No active batches tracked." : "Aucun lot en cours d'élevage."}
              </p>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{lang === "en" ? "Batch / Farm" : "Lot / Ferme"}</th>
                      <th>{lang === "en" ? "Birds Count" : "Effectif Restant"}</th>
                      <th>{lang === "en" ? "Mortality" : "Mortalité"}</th>
                      <th>{lang === "en" ? "Feed Consumed" : "Aliment Consommé"}</th>
                      <th>{lang === "en" ? "Est. Avg Weight (kg)" : "Poids Moyen Est. (kg)"}</th>
                      <th>{t("report.fcr")}</th>
                      <th>{lang === "en" ? "Feed Cost/Bird" : "Coût Aliment/Sujet"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => {
                      const estWeight = estWeights[b._id] || "";
                      const currentBirds = Number(b.currentQuantity || 0);
                      const initialBirds = Number(b.initialQuantity || 0);
                      const weightNum = Number(estWeight);
                      
                      // FCR Calculation: Total Feed / (currentBirds * avgWeight)
                      let fcr = "N/A";
                      if (weightNum > 0 && currentBirds > 0) {
                        const totalMassGain = currentBirds * weightNum;
                        fcr = totalMassGain > 0 ? (b.totalFeedKg / totalMassGain).toFixed(2) : "N/A";
                      }

                      return (
                        <tr key={b._id}>
                          <td>
                            <div style={{ fontWeight: "700" }}>{b.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{b.farmName}</div>
                          </td>
                          <td style={{ fontWeight: "700" }}>{b.currentQuantity} / {b.initialQuantity}</td>
                          <td>
                            <span className={`status-badge ${Number(b.mortalityRate) > 5 ? "rejected" : "approved"}`}>
                              {b.mortalityRate}% ({b.totalDeaths} {lang === "en" ? "dead" : "morts"})
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: "700" }}>{b.totalFeedKg.toLocaleString()} kg</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{(b.totalFeedCost ?? 0).toLocaleString()} XAF</div>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.05"
                              min="0.1"
                              placeholder="e.g. 2.0"
                              value={estWeight}
                              onChange={(e) => handleWeightChange(b._id, e.target.value)}
                              style={{ width: "90px", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
                            />
                          </td>
                          <td style={{ fontWeight: "800", color: fcr !== "N/A" ? "var(--color-accent)" : "inherit" }}>
                            {fcr}
                            {fcr !== "N/A" && (
                              <span style={{ display: "block", fontSize: "0.65rem", fontWeight: "normal", color: "var(--color-text-secondary)" }}>
                                {lang === "en" ? "FCR calculated" : "IC calculé"}
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: "700" }}>{Number(b.feedCostPerBird).toLocaleString()} XAF</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "16px", background: "var(--color-bg-elevated)", padding: "12px", borderRadius: "8px", fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
              <HelpCircle size={16} />
              <span>
                {lang === "en" 
                  ? "Feed Conversion Ratio (FCR) is computed as: Total Feed consumed (kg) / Total Est. Live Weight (Current Birds * Est. Weight). Enter the current average weight of birds to calculate."
                  : "L'indice de consommation (IC) est calculé comme : Aliment total consommé (kg) / Poids vif total estimé (Effectif actuel * Poids moyen). Saisissez le poids moyen pour afficher l'IC."
                }
              </span>
            </div>
          </div>

        </div>
      )}
      </div>
    </DashboardShell>
  );
}
