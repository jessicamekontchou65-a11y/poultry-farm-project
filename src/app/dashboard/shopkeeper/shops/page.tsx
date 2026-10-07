"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Shop, Product, Category } from "@/lib/types";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import { type LatLng, LocationPicker } from "../../../components/map";
import EditLocationPanel from "../../../components/map/EditLocationPanel";
import { Store, Plus, ShoppingBag, DollarSign } from "lucide-react";

export default function ShopkeeperShopsPage() {
  const { token, user } = useAuth();
  const { lang, t } = useLanguage();

  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Shop form states
  const [shopName, setShopName] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [shopCity, setShopCity] = useState("");
  const [shopRegion, setShopRegion] = useState("");
  const [shopCoordinates, setShopCoordinates] = useState<LatLng | null>(null);
  const [locatingShopId, setLocatingShopId] = useState<string | null>(null);
  const [shopDescription, setShopDescription] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopMsg, setShopMsg] = useState("");
  const [shopLoading, setShopLoading] = useState(false);
  const [docName, setDocName] = useState("");
  const [docDataUrl, setDocDataUrl] = useState("");

  const MAX_DOC_BYTES = 2 * 1024 * 1024;

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  // Product form states
  const [selectedShopId, setSelectedShopId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodQty, setProdQty] = useState("");
  const [prodUnit, setProdUnit] = useState("kg");
  const [categoryId, setCategoryId] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodMsg, setProdMsg] = useState("");
  const [prodLoading, setProdLoading] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const shopRes = await api.list<Shop>("/shops/my", undefined, token);
      setShops(shopRes.data);
      if (shopRes.data.length > 0) setSelectedShopId(shopRes.data[0]._id);

      const prodRes = await api.list<Product>("/products/my", { productType: "shop_product" }, token);
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

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!docDataUrl || !docName) {
      setShopMsg(
        lang === "en"
          ? "Upload an official document that proves this shop is legitimate."
          : "Téléversez un document officiel prouvant que cette boutique est légitime."
      );
      return;
    }
    setShopLoading(true);
    setShopMsg("");

    try {
      const res = await api.create<Shop>("/shops", {
        name: shopName,
        location: shopLocation,
        city: shopCity,
        region: shopRegion,
        description: shopDescription,
        phone: shopPhone,
        ...(shopCoordinates ? { coordinates: shopCoordinates } : {}),
        verificationDocument: docDataUrl,
        verificationDocumentName: docName,
        pickupAvailable: true,
        openingHours: "08:00 - 18:00"
      }, token);

      setShops((prev) => [res.data, ...prev]);
      if (!selectedShopId) setSelectedShopId(res.data._id);
      setShopName("");
      setShopLocation("");
      setShopCity("");
      setShopRegion("");
      setShopCoordinates(null);
      setShopDescription("");
      setShopPhone("");
      setDocName("");
      setDocDataUrl("");
      setShopMsg(lang === "en" ? "Shop created! Pending verification." : "Boutique créée ! En attente de validation.");
      
      // Update local storage roles if user is now a shopkeeper
      if (user && !user.roles.includes("shopkeeper")) {
        const nextUser = { ...user, roles: [...user.roles, "shopkeeper"] };
        localStorage.setItem("poultryhub-user", JSON.stringify(nextUser));
        window.location.reload();
      }
    } catch (err) {
      setShopMsg(err instanceof Error ? err.message : "Failed to create shop");
    } finally {
      setShopLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedShopId) return;
    setProdLoading(true);
    setProdMsg("");

    try {
      const res = await api.create<Product>("/products", {
        shopId: selectedShopId,
        productType: "shop_product",
        name: prodName,
        categoryId,
        price: Number(prodPrice),
        quantity: Number(prodQty),
        unit: prodUnit,
        description: prodDesc
      }, token);

      setProducts((prev) => [res.data, ...prev]);
      setProdName("");
      setProdPrice("");
      setProdQty("");
      setProdDesc("");
      setProdMsg(lang === "en" ? "Product added! Pending approval." : "Produit ajouté ! En attente d'approbation.");
    } catch (err) {
      setProdMsg(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setProdLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
        
        {/* Left side: Shops & Products management lists */}
        <div>
          <p className="resource-kicker">{t("dash.sidebar.shopkeeper")}</p>
          <h1 style={{ marginBottom: "24px" }}>{lang === "en" ? "Shop Listings" : "Mes Boutiques & Produits"}</h1>

          {loading ? (
            <p>{lang === "en" ? "Loading catalog details..." : "Chargement des détails du catalogue..."}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              
              {/* Shops */}
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "16px" }}>{lang === "en" ? "Registered Shops" : "Boutiques"}</h2>
                {shops.length === 0 ? (
                  <div className="empty-state" style={{ padding: "20px" }}>
                    <Store size={32} style={{ color: "var(--color-text-muted)", marginBottom: "8px" }} />
                    <p>{lang === "en" ? "No shops registered." : "Aucune boutique enregistrée."}</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {shops.map((s) => (
                      <div key={s._id} className="glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                          <div>
                            <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>{s.name}</h3>
                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>📍 {s.location}, {s.city}</p>
                          </div>
                          <span className={`status-badge ${s.verificationStatus}`}>
                            {s.verificationStatus === "approved" ? (lang === "en" ? "verified" : "vérifié") : s.verificationStatus === "pending" ? (lang === "en" ? "pending" : "en attente") : s.verificationStatus === "rejected" ? (lang === "en" ? "rejected" : "rejeté") : s.verificationStatus}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="kca-btn kca-btn--ghost"
                          style={{ alignSelf: "flex-start" }}
                          aria-expanded={locatingShopId === s._id}
                          onClick={() => setLocatingShopId(locatingShopId === s._id ? null : s._id)}
                        >
                          📍 {s.coordinates
                            ? lang === "en" ? "Edit map position" : "Modifier la position"
                            : lang === "en" ? "Set map position" : "Définir la position"}
                        </button>
                        {locatingShopId === s._id && (
                          <EditLocationPanel
                            endpoint={`/shops/${s._id}`}
                            initial={s.coordinates}
                            token={token}
                            lang={lang}
                            onSaved={(value) =>
                              setShops((prev) => prev.map((shop) => (shop._id === s._id ? { ...shop, coordinates: value ?? undefined } : shop)))
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Products */}
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "16px" }}>{lang === "en" ? "Supplies Inventory" : "Fournitures en Vente"}</h2>
                {products.length === 0 ? (
                  <div className="empty-state" style={{ padding: "20px" }}>
                    <ShoppingBag size={32} style={{ color: "var(--color-text-muted)", marginBottom: "8px" }} />
                    <p>{lang === "en" ? "No products listed." : "Aucun produit en vente."}</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {products.map((p) => (
                      <div key={p._id} className="glass-card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>{p.name}</h3>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                            {lang === "en" ? "Stock:" : "Stock :"} <strong>{p.quantity} {p.unit}</strong> | {lang === "en" ? "Price:" : "Prix :"} <strong>{(p.price ?? 0).toLocaleString()} XAF</strong>
                          </p>
                          {p.approvalStatus === "approved" && (
                            <Link href={`/platform?product=${p._id}`} className="promote-link" style={{ marginTop: 8 }}>
                              📣 {lang === "en" ? "Promote with photos/video" : "Promouvoir (photos/vidéo)"}
                            </Link>
                          )}
                        </div>
                        <span className={`status-badge ${p.approvalStatus}`}>
                          {p.approvalStatus === "approved" ? (lang === "en" ? "approved" : "approuvé") : p.approvalStatus === "pending" ? (lang === "en" ? "pending" : "en attente") : p.approvalStatus === "rejected" ? (lang === "en" ? "rejected" : "rejeté") : p.approvalStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Right side: Forms columns */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Create Shop Form */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontWeight: "800", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Store size={20} style={{ color: "var(--color-accent)" }} />
              {t("shop.create.title")}
            </h3>
            <form onSubmit={handleCreateShop} className="connected-form">
              <div className="form-group">
                <label>{t("shop.create.name")}</label>
                <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} required placeholder="Poultry Feed supplier" />
              </div>
              <div className="form-group">
                <label>{t("farm.create.phone")}</label>
                <input type="tel" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="+237 6xx xxx xxx" />
              </div>
              <div className="form-group" style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <label>{t("farm.create.city")}</label>
                  <input type="text" value={shopCity} onChange={(e) => setShopCity(e.target.value)} placeholder="Yaounde" />
                </div>
                <div style={{ flex: 1 }}>
                  <label>{t("farm.create.region")}</label>
                  <input type="text" value={shopRegion} onChange={(e) => setShopRegion(e.target.value)} placeholder="Centre" />
                </div>
              </div>
              <div className="form-group">
                <label>{t("shop.create.loc")}</label>
                <input type="text" value={shopLocation} onChange={(e) => setShopLocation(e.target.value)} required placeholder="Mvan block B" />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Exact position on the map" : "Position exacte sur la carte"}</label>
                <LocationPicker value={shopCoordinates} onChange={setShopCoordinates} lang={lang} height={240} />
              </div>
              <div className="form-group">
                <label>{t("shop.create.desc")}</label>
                <textarea value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} placeholder="Feed, waterers, incubators..." rows={2} />
              </div>
              <div className="form-group register-doc-field">
                <label htmlFor="shopProofDoc">
                  {lang === "en" ? "Official shop proof document" : "Document officiel de la boutique"}
                </label>
                <p className="register-doc-hint">
                  {lang === "en"
                    ? "Required for every new shop. Upload trade license or registration (PDF/image, max 2 MB)."
                    : "Obligatoire pour chaque nouvelle boutique. Licence ou enregistrement (PDF/image, max 2 Mo)."}
                </p>
                <label htmlFor="shopProofDoc" className="register-doc-drop">
                  <Store size={18} />
                  <span>{docName || (lang === "en" ? "Choose file to upload" : "Choisir un fichier")}</span>
                </label>
                <input
                  id="shopProofDoc"
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png"
                  required
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > MAX_DOC_BYTES) {
                      setShopMsg(lang === "en" ? "Document too large (max 2 MB)." : "Document trop volumineux (max 2 Mo).");
                      e.target.value = "";
                      return;
                    }
                    try {
                      const dataUrl = await readFileAsDataUrl(file);
                      setDocName(file.name);
                      setDocDataUrl(dataUrl);
                    } catch {
                      setShopMsg(lang === "en" ? "Could not read document." : "Impossible de lire le document.");
                    }
                  }}
                />
              </div>
              <button type="submit" className="auth-submit-btn" style={{ background: "var(--color-accent)", marginInline: 0 }} disabled={shopLoading}>
                {shopLoading ? (lang === "en" ? "Creating..." : "Création en cours...") : t("shop.create.btn")}
              </button>
              {shopMsg && <p className="form-success-banner" style={{ marginTop: "12px" }}>{shopMsg}</p>}
            </form>
          </div>

          {/* Add Product Form */}
          {shops.length > 0 && (
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontWeight: "800", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShoppingBag size={20} style={{ color: "var(--color-accent)" }} />
                {t("product.create.title")}
              </h3>
              <form onSubmit={handleCreateProduct} className="connected-form">
                <div className="form-group">
                  <label>{lang === "en" ? "Associate Shop" : "Associer à la boutique"}</label>
                  <select value={selectedShopId} onChange={(e) => setSelectedShopId(e.target.value)}>
                    {shops.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("product.create.name")}</label>
                  <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} required placeholder="Automatic Chicken Drinker" />
                </div>
                <div className="form-group">
                  <label>{t("product.create.cat")}</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {lang === "en" 
                          ? c.name 
                          : (c.name === "Feed" || c.name === "Alimentation" ? "Aliments" 
                             : c.name === "Equipment" || c.name === "Équipement" ? "Équipement" 
                             : c.name === "Chicks" || c.name === "Poussins" ? "Poussins" 
                             : c.name === "Medicine" || c.name === "Médicaments" ? "Médicaments" 
                             : c.name)
                        }
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label>{t("product.create.price")}</label>
                    <input type="number" min={1} value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required placeholder="12500" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>{t("product.create.qty")}</label>
                    <input type="number" min={0} value={prodQty} onChange={(e) => setProdQty(e.target.value)} required placeholder="20" />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t("product.create.unit")}</label>
                  <input type="text" value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} required placeholder="piece, bag, drinker" />
                </div>
                <div className="form-group">
                  <label>{t("product.create.desc")}</label>
                  <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Details..." rows={2} />
                </div>
                <button type="submit" className="auth-submit-btn" style={{ background: "var(--color-accent)", marginInline: 0 }} disabled={prodLoading}>
                  {prodLoading ? (lang === "en" ? "Adding..." : "Ajout en cours...") : t("product.create.btn")}
                </button>
                {prodMsg && <p className="form-success-banner" style={{ marginTop: "12px" }}>{prodMsg}</p>}
              </form>
            </div>
          )}

        </div>
      </div>
    </DashboardShell>
  );
}
