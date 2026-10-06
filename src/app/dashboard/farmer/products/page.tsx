"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import { ArrowRight, ClipboardList, PackageCheck, Plus, ShoppingBag } from "lucide-react";

export default function FarmerProductsPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("bird");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  
  const [msg, setMsg] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const prodRes = await api.list<Product>("/products/my", { productType: "farm_product" }, token);
      setProducts(prodRes.data);

      const catRes = await api.list<Category>("/categories");
      setCategories(catRes.data);
      if (catRes.data.length > 0) setCategoryId(catRes.data[0]._id);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setMsg("");

    try {
      const res = await api.create<Product>("/products", {
        name,
        productType: "farm_product",
        categoryId,
        price: Number(price),
        quantity: Number(quantity),
        unit,
        description
      }, token);

      setProducts((prev) => [res.data, ...prev]);
      setName("");
      setPrice("");
      setQuantity("");
      setDescription("");
      setMsg(lang === "en" ? "Product published! Pending admin validation." : "Produit publié ! En attente de validation.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Publishing failed");
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
            <h1 className="farmer-op-hero__title">{lang === "en" ? "Turn farm output into market-ready products." : "Transformez votre production en offres prêtes au marché."}</h1>
            <p className="farmer-op-hero__copy">
              {lang === "en"
                ? "Publish birds, eggs, chicks, manure, and other farm products with clean pricing, inventory, and approval status in one operational view."
                : "Publiez volailles, oeufs, poussins, fumier et autres produits avec prix, stock et statut de validation dans une vue claire."}
            </p>
          </div>
          <div className="farmer-op-hero__stat">
            <strong>{products.length}</strong>
            <span>{lang === "en" ? "farm products listed" : "produits fermiers publiés"}</span>
          </div>
        </section>

        <div className="farmer-op-layout">
          <section className="farmer-op-main">
            <div className="dash-section__header">
              <div>
                <p className="resource-kicker">{lang === "en" ? "Inventory" : "Inventaire"}</p>
                <h2 className="dash-section__title">{lang === "en" ? "My Farm Products" : "Mes Produits Fermiers"}</h2>
              </div>
            </div>

          {loading ? (
            <div className="farmer-op-loading"><ShoppingBag size={26} /><span>{lang === "en" ? "Loading products..." : "Chargement des produits..."}</span></div>
          ) : products.length === 0 ? (
            <div className="farmer-op-empty">
              <div className="farmer-op-empty__icon"><ShoppingBag size={30} /></div>
              <h3>{lang === "en" ? "No products published yet" : "Aucun produit publié"}</h3>
              <p>{lang === "en" ? "Publish your first farm product so customers can discover verified output." : "Publiez votre premier produit fermier pour le rendre visible aux clients."}</p>
            </div>
          ) : (
            <div className="farmer-op-card-list">
              {products.map((product) => (
                <article key={product._id} className="farmer-op-card">
                  <div className="farmer-op-card__top">
                    <div>
                      <h3>{product.name}</h3>
                      <p>{lang === "en" ? "Stock" : "Stock"}: <strong>{product.quantity} {product.unit}</strong></p>
                    </div>
                    <span className={`dash-badge dash-badge--${product.approvalStatus}`}>
                      {product.approvalStatus}
                    </span>
                  </div>

                  <p style={{ marginTop: "12px" }}>
                    {product.description || "No description provided."}
                  </p>

                  <div className="farmer-op-card__bottom">
                    <span className="farmer-op-card__value">
                      {product.price.toLocaleString()} XAF
                    </span>
                    {product.rejectionReason && (
                      <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>Reason: {product.rejectionReason}</span>
                    )}
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
                  <p className="resource-kicker">{lang === "en" ? "Marketplace" : "Marché"}</p>
                  <h2>{t("product.create.title")}</h2>
                </div>
              </div>

          <form onSubmit={handleSubmit} className="connected-form farmer-op-form">
            <div className="form-group">
              <label>{t("product.create.name")}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Premium Fresh Eggs (Tray)" />
            </div>

            <div className="form-group">
              <label>{t("product.create.cat")}</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="farmer-op-form__split">
              <div className="form-group">
                <label>{t("product.create.price")}</label>
                <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="2500" />
              </div>
              <div className="form-group">
                <label>{t("product.create.qty")}</label>
                <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="100" />
              </div>
            </div>

            <div className="form-group">
              <label>{t("product.create.unit")}</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="bird">{lang === "en" ? "bird" : "poulet"}</option>
                <option value="tray">{lang === "en" ? "tray" : "plateau"}</option>
                <option value="kg">kg</option>
                <option value="bag">{lang === "en" ? "bag" : "sac"}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t("product.create.desc")}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Provide details like weight, dimensions, health specs..." />
            </div>

            <button type="submit" className="farmer-op-submit" disabled={formLoading}>
              {formLoading ? "Publishing..." : t("product.create.btn")}
              <ArrowRight size={17} />
            </button>

            {msg && (
              <p className={msg.includes("published") || msg.includes("publié") ? "form-success-banner" : "form-error-banner"} style={{ marginTop: "16px" }}>
                {msg}
              </p>
            )}
          </form>
            </div>

            <div className="farmer-op-note">
              <strong><ClipboardList size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />{lang === "en" ? "Publishing checks" : "Contrôles de publication"}</strong>
              <p>{lang === "en" ? "Keep names clear, stock accurate, and descriptions specific so admin validation and buyer decisions are faster." : "Gardez des noms clairs, un stock exact et des descriptions précises pour accélérer la validation."}</p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
