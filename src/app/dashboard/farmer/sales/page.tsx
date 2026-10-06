"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import { ArrowRight, Banknote, Plus, TrendingUp } from "lucide-react";

export default function FarmerSalesPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [productType, setProductType] = useState("eggs");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [buyerName, setBuyerName] = useState("");
  
  const [msg, setMsg] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchSales = async () => {
    if (!token) return;
    try {
      const res = await api.list<any>("/farm-sales", undefined, token);
      setSales(res.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setMsg("");

    try {
      const res = await api.create<any>("/farm-sales", {
        productType,
        quantity: Number(quantity),
        unit: productType === "eggs" ? "tray" : "bird",
        unitPrice: Number(unitPrice),
        buyerName,
        saleDate: new Date(),
        paymentMethod: "cash"
      }, token);

      setSales((prev) => [res.data, ...prev]);
      setQuantity("");
      setUnitPrice("");
      setBuyerName("");
      setMsg(lang === "en" ? "Sale recorded!" : "Vente enregistrée !");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to record sale");
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
            <h1 className="farmer-op-hero__title">{lang === "en" ? "Keep direct farm sales clean and traceable." : "Gardez vos ventes directes claires et traçables."}</h1>
            <p className="farmer-op-hero__copy">
              {lang === "en"
                ? "Record eggs, birds, chicks, manure, buyer names, quantities, and pricing so farm revenue is ready for reporting."
                : "Enregistrez oeufs, volailles, poussins, fumier, acheteurs, quantités et prix pour des rapports de revenus fiables."}
            </p>
          </div>
          <div className="farmer-op-hero__stat">
            <strong>{sales.length}</strong>
            <span>{lang === "en" ? "direct sales recorded" : "ventes directes"}</span>
          </div>
        </section>

        <div className="farmer-op-layout">
          <section className="farmer-op-main">
            <div className="dash-section__header">
              <div>
                <p className="resource-kicker">{lang === "en" ? "Revenue ledger" : "Registre revenus"}</p>
                <h2 className="dash-section__title">{lang === "en" ? "Farm Sales Log" : "Registre des Ventes Directes"}</h2>
              </div>
            </div>

          {loading ? (
            <div className="farmer-op-loading"><TrendingUp size={26} /><span>{lang === "en" ? "Loading sales..." : "Chargement des ventes..."}</span></div>
          ) : sales.length === 0 ? (
            <div className="farmer-op-empty">
              <div className="farmer-op-empty__icon"><Banknote size={30} /></div>
              <h3>{lang === "en" ? "No direct sales logged yet" : "Aucune vente enregistrée"}</h3>
              <p>{lang === "en" ? "Record a farm sale to start tracking revenue beyond marketplace orders." : "Enregistrez une vente directe pour suivre les revenus hors marketplace."}</p>
            </div>
          ) : (
            <div className="farmer-op-table"><div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{lang === "en" ? "Product" : "Produit"}</th>
                    <th>{lang === "en" ? "Quantity" : "Quantité"}</th>
                    <th>{lang === "en" ? "Total Revenue" : "Revenu Total"}</th>
                    <th>{lang === "en" ? "Buyer" : "Acheteur"}</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale._id}>
                      <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: "700" }}>
                        {lang === "en" 
                          ? sale.productType.replace(/_/g, " ") 
                          : (sale.productType === "live_chicken" ? "Poulet vivant" 
                             : sale.productType === "dressed_chicken" ? "Poulet habillé" 
                             : sale.productType === "eggs" ? "Œufs" 
                             : sale.productType === "chicks" ? "Poussins" 
                             : sale.productType === "manure" ? "Fumier" 
                             : sale.productType === "spent_layers" ? "Réformes" 
                             : sale.productType.replace(/_/g, " "))
                        }
                      </td>
                      <td>{sale.quantity} {sale.unit === "tray" ? (lang === "en" ? "tray" : "plateau") : sale.unit === "bird" ? (lang === "en" ? "bird" : "tête") : sale.unit}</td>
                      <td style={{ color: "var(--color-accent)", fontWeight: "700" }}>{(sale.totalAmount ?? 0).toLocaleString()} XAF</td>
                      <td>{sale.buyerName || (lang === "en" ? "Generic Buyer" : "Acheteur générique")}</td>
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
                  <p className="resource-kicker">{lang === "en" ? "New revenue" : "Nouveau revenu"}</p>
                  <h2>{t("op.sale.btn")}</h2>
                </div>
              </div>

          <form onSubmit={handleSubmit} className="connected-form farmer-op-form">
            <div className="form-group">
              <label>{t("op.sale.type")}</label>
              <select value={productType} onChange={(e) => setProductType(e.target.value)}>
                <option value="eggs">{lang === "en" ? "Eggs" : "Œufs"}</option>
                <option value="live_chicken">{lang === "en" ? "Live Chicken" : "Poulet vivant"}</option>
                <option value="dressed_chicken">{lang === "en" ? "Dressed Chicken" : "Poulet habillé"}</option>
                <option value="chicks">{lang === "en" ? "Chicks" : "Poussins"}</option>
                <option value="spent_layers">{lang === "en" ? "Spent Layers" : "Réformes"}</option>
                <option value="manure">{lang === "en" ? "Manure" : "Fumier"}</option>
              </select>
            </div>

            <div className="farmer-op-form__split">
              <div className="form-group">
                <label>{t("op.sale.qty")}</label>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="10" />
              </div>
              <div className="form-group">
                <label>{t("op.sale.price")}</label>
                <input type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required placeholder="2500" />
              </div>
            </div>

            <div className="form-group">
              <label>{t("op.sale.buyer")}</label>
              <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder={lang === "en" ? "Buyer Name" : "Nom de l'acheteur"} />
            </div>

            <button type="submit" className="farmer-op-submit" disabled={formLoading}>
              {formLoading ? (lang === "en" ? "Recording..." : "Enregistrement...") : t("op.sale.btn")}
              <ArrowRight size={17} />
            </button>

            {msg && <p className="form-success-banner" style={{ marginTop: "16px" }}>{msg}</p>}
          </form>
            </div>

            <div className="farmer-op-note">
              <strong>{lang === "en" ? "Revenue discipline" : "Discipline des revenus"}</strong>
              <p>{lang === "en" ? "Record every sale on the day it happens so reports can compare revenue against expenses accurately." : "Enregistrez chaque vente le jour même pour comparer correctement revenus et dépenses."}</p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
