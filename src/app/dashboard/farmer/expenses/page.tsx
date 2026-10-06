"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import { ArrowRight, DollarSign, Plus, ReceiptText } from "lucide-react";

export default function FarmerExpensesPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("feed");
  const [description, setDescription] = useState("");
  
  const [msg, setMsg] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchExpenses = async () => {
    if (!token) return;
    try {
      const res = await api.list<any>("/expenses", undefined, token);
      setExpenses(res.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setMsg("");

    try {
      const res = await api.create<any>("/expenses", {
        category,
        amount: Number(amount),
        date: new Date(),
        description
      }, token);

      setExpenses((prev) => [res.data, ...prev]);
      setAmount("");
      setDescription("");
      setMsg(lang === "en" ? "Expense logged!" : "Dépense enregistrée !");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to record expense");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="farmer-op-page">
        <section className="farmer-op-hero">
          <div>
            <p className="resource-kicker">{t("dash.sidebar.farmer")}</p>
            <h1 className="farmer-op-hero__title">{lang === "en" ? "Control every cost before it controls margin." : "Maîtrisez chaque coût avant qu'il ne réduise la marge."}</h1>
            <p className="farmer-op-hero__copy">
              {lang === "en"
                ? "Track feed, medicine, labor, transport, rent, utilities, and operational costs with clean records for profit analysis."
                : "Suivez aliment, médicaments, main d'oeuvre, transport, loyer, charges et coûts opérationnels pour analyser la rentabilité."}
            </p>
          </div>
          <div className="farmer-op-hero__stat">
            <strong>{expenses.length}</strong>
            <span>{lang === "en" ? "expense records" : "dépenses suivies"}</span>
          </div>
        </section>

        <div className="farmer-op-layout">
          <section className="farmer-op-main">
            <div className="dash-section__header">
              <div>
                <p className="resource-kicker">{lang === "en" ? "Cost ledger" : "Grand livre"}</p>
                <h2 className="dash-section__title">{lang === "en" ? "Tracked Expenses" : "Suivi des Dépenses"}</h2>
              </div>
            </div>

          {loading ? (
            <div className="farmer-op-loading"><DollarSign size={26} /><span>{lang === "en" ? "Loading expenses..." : "Chargement des dépenses..."}</span></div>
          ) : expenses.length === 0 ? (
            <div className="farmer-op-empty">
              <div className="farmer-op-empty__icon"><ReceiptText size={30} /></div>
              <h3>{lang === "en" ? "No expenses logged yet" : "Aucune dépense enregistrée"}</h3>
              <p>{lang === "en" ? "Record your first farm expense to start building a reliable cost picture." : "Enregistrez votre première dépense pour obtenir une vue fiable des coûts."}</p>
            </div>
          ) : (
            <div className="farmer-op-table"><div className="data-table-wrapper">
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
                  {expenses.map((exp) => (
                    <tr key={exp._id}>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: "700" }}>
                        {lang === "en" 
                          ? exp.category 
                          : (exp.category === "feed" ? "Aliment" 
                             : exp.category === "vaccination" ? "Vaccination" 
                             : exp.category === "medicine" ? "Médicaments" 
                             : exp.category === "labor" ? "Main d'œuvre" 
                             : exp.category === "transport" ? "Transport" 
                             : exp.category === "rent" ? "Loyer" 
                             : exp.category === "water" ? "Eau" 
                             : exp.category === "electricity" ? "Électricité" 
                             : exp.category === "other" ? "Autre" 
                             : exp.category)
                        }
                      </td>
                      <td style={{ color: "#ef4444", fontWeight: "700" }}>{(exp.amount ?? 0).toLocaleString()} XAF</td>
                      <td>{exp.description || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          )}
          </section>

          <aside className="farmer-op-aside">
            <div className="farmer-op-form-card">
              <div className="farmer-op-form-card__head">
                <div className="farmer-op-form-card__icon"><Plus size={20} /></div>
                <div>
                  <p className="resource-kicker">{lang === "en" ? "New cost" : "Nouveau coût"}</p>
                  <h2>{t("op.expense.btn")}</h2>
                </div>
              </div>

          <form onSubmit={handleSubmit} className="connected-form farmer-op-form">
            <div className="form-group">
              <label>{t("op.expense.amount")}</label>
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="50000" />
            </div>

            <div className="form-group">
              <label>{t("op.expense.cat")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="feed">{lang === "en" ? "Feed" : "Aliment"}</option>
                <option value="vaccination">Vaccination</option>
                <option value="medicine">{lang === "en" ? "Medicine" : "Médicaments"}</option>
                <option value="labor">{lang === "en" ? "Labor" : "Main d'œuvre"}</option>
                <option value="transport">Transport</option>
                <option value="rent">{lang === "en" ? "Rent" : "Loyer"}</option>
                <option value="water">{lang === "en" ? "Water" : "Eau"}</option>
                <option value="electricity">{lang === "en" ? "Electricity" : "Électricité"}</option>
                <option value="other">{lang === "en" ? "Other" : "Autre"}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t("op.expense.desc")}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder={lang === "en" ? "Bags of feed, vaccine transport, wage..." : "Sacs d'aliments, transport des vaccins, salaire..."} rows={3} />
            </div>

            <button type="submit" className="farmer-op-submit" disabled={formLoading}>
              {formLoading ? (lang === "en" ? "Recording..." : "Enregistrement...") : t("op.expense.btn")}
              <ArrowRight size={17} />
            </button>

            {msg && <p className="form-success-banner" style={{ marginTop: "16px" }}>{msg}</p>}
          </form>
            </div>

            <div className="farmer-op-note">
              <strong>{lang === "en" ? "Better reporting starts here" : "De meilleurs rapports commencent ici"}</strong>
              <p>{lang === "en" ? "Log costs as they happen, especially feed and medicine, so batch profitability remains accurate." : "Enregistrez les coûts au fur et à mesure, surtout aliment et médicaments, pour garder une rentabilité exacte."}</p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
