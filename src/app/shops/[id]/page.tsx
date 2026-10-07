"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import type { Shop, Product } from "@/lib/types";
import ListingMiniMap from "../../components/map/ListingMiniMap";
import AppNav from "../../components/AppNav";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CheckCircle,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../LanguageContext";

function shopImage(shop: Shop) {
  return shop.images?.[0] ?? shop.logo ?? "/images/seed/shop-supplies.png";
}

function productImage(product: Product) {
  return product.images?.[0] ?? "/images/seed/shop-supplies.png";
}

function formatPrice(value: number) {
  return `${(value ?? 0).toLocaleString()} XAF`;
}

function placeLabel(item: Pick<Shop, "location" | "city" | "region">) {
  return [item.location, item.city, item.region].filter(Boolean).join(", ");
}

export default function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useLanguage();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState(lang === "en" ? "Loading details..." : "Chargement des détails...");

  useEffect(() => {
    let active = true;
    setStatus(lang === "en" ? "Loading shop profile..." : "Chargement du profil boutique...");

    api
      .get<Shop>(`/shops/${id}`)
      .then((res) => {
        if (!active) return null;
        setShop(res.data);
        return api.list<Product>("/products", {
          shopId: id,
          approvalStatus: "approved",
          status: "available",
          limit: 12,
        });
      })
      .then((res) => {
        if (!active || !res) return;
        setProducts(res.data);
        setStatus("");
      })
      .catch((err) => {
        if (!active) return;
        setStatus(err instanceof Error ? err.message : lang === "en" ? "Error loading details" : "Erreur lors du chargement");
      });

    return () => {
      active = false;
    };
  }, [id, lang]);

  return (
    <main className="app-page directory-detail-page shop-detail-page">
      <AppNav />

      <div className="directory-detail-shell">
        <Link href="/shops" className="directory-back-link">
          <ArrowLeft size={16} />
          {lang === "en" ? "Back to shops" : "Retour aux boutiques"}
        </Link>

        {status && (
          <div className="directory-state">
            <Store size={28} />
            <p>{status}</p>
          </div>
        )}

        {shop && !status && (
          <>
            <section className="directory-detail-hero">
              <div className="directory-detail-media">
                <img src={shopImage(shop)} alt={shop.name} />
                <span><BadgeCheck size={15} /> {lang === "en" ? "Verified shop" : "Boutique vérifiée"}</span>
              </div>
              <div className="directory-detail-copy">
                <span className="directory-kicker">
                  <ShieldCheck size={16} />
                  {lang === "en" ? "Poultry supply partner" : "Partenaire de fournitures avicoles"}
                </span>
                <h1>{shop.name}</h1>
                <p>{shop.description || (lang === "en" ? "This verified PoultryHub shop has not added a detailed description yet." : "Cette boutique vérifiée PoultryHub n'a pas encore ajouté de description détaillée.")}</p>
                <div className="directory-detail-actions">
                  <Link href={`/marketplace?shopId=${shop._id}`} className="directory-primary-btn">
                    <Package size={16} />
                    {lang === "en" ? "View shop catalog" : "Voir le catalogue"}
                  </Link>
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`} className="directory-secondary-btn">
                      <Phone size={16} />
                      {lang === "en" ? "Call shop" : "Appeler"}
                    </a>
                  )}
                </div>
              </div>
            </section>

            <section className="directory-detail-grid">
              <aside className="directory-profile-card">
                <h2>{lang === "en" ? "Shop profile" : "Profil boutique"}</h2>
                <div className="certified-trust-note">
                  <ShieldCheck size={18} />
                  <div>
                    <strong>
                      {shop.verificationStatus === "approved"
                        ? lang === "en"
                          ? "Certified PoultryHub shopkeeper"
                          : "Boutiquier PoultryHub certifié"
                        : lang === "en"
                          ? "Certification in progress"
                          : "Certification en cours"}
                    </strong>
                    <p>
                      {shop.verificationStatus === "approved"
                        ? lang === "en"
                          ? "This account was verified with an official shopkeeper document. You can buy with more trust."
                          : "Ce compte a été vérifié avec un document officiel de boutiquier. Achetez en toute confiance."
                        : lang === "en"
                          ? "This shopkeeper uploaded an official proof document. Admin review builds extra trust for buyers."
                          : "Ce boutiquier a téléversé un document officiel. La validation admin renforce la confiance des acheteurs."}
                    </p>
                  </div>
                </div>
                <div className="directory-profile-list">
                  <div>
                    <MapPin size={18} />
                    <span>{lang === "en" ? "Location" : "Adresse"}</span>
                    <strong>{placeLabel(shop) || (lang === "en" ? "Location pending" : "Adresse à confirmer")}</strong>
                  </div>
                  {shop.phone && (
                    <div>
                      <Phone size={18} />
                      <span>{lang === "en" ? "Contact" : "Contact"}</span>
                      <strong>{shop.phone}</strong>
                    </div>
                  )}
                  <div>
                    <Truck size={18} />
                    <span>{lang === "en" ? "Supply role" : "Rôle"}</span>
                    <strong>{lang === "en" ? "Poultry inputs and equipment" : "Intrants et équipements avicoles"}</strong>
                  </div>
                  <div>
                    <CheckCircle size={18} />
                    <span>{lang === "en" ? "Status" : "Statut"}</span>
                    <strong>{lang === "en" ? "Approved and active" : "Approuvé et actif"}</strong>
                  </div>
                </div>
                <ListingMiniMap listing={shop} kind="shop" lang={lang} />
              </aside>

              <section className="directory-catalog-section">
                <div className="directory-results-head">
                  <div>
                    <span>{lang === "en" ? "Shop catalog" : "Catalogue boutique"}</span>
                    <h2>
                      {lang === "en"
                        ? `${products.length} available product${products.length === 1 ? "" : "s"}`
                        : `${products.length} produit${products.length === 1 ? "" : "s"} disponible${products.length === 1 ? "" : "s"}`}
                    </h2>
                  </div>
                </div>

                {products.length === 0 ? (
                  <div className="directory-state compact">
                    <Boxes size={26} />
                    <h3>{lang === "en" ? "No active products yet" : "Aucun produit actif"}</h3>
                    <p>{lang === "en" ? "This shop profile is ready, but its marketplace catalog is not listed yet." : "Le profil boutique est prêt, mais le catalogue marketplace n'est pas encore publié."}</p>
                  </div>
                ) : (
                  <div className="directory-product-grid">
                    {products.map((product) => (
                      <article key={product._id} className="directory-product-card">
                        <Link href={`/products/${product._id}`}>
                          <img src={productImage(product)} alt={product.name} />
                        </Link>
                        <div>
                          <span>{product.quantity} {product.unit}</span>
                          <h3>{product.name}</h3>
                          <strong>{formatPrice(product.price)}</strong>
                          <Link href={`/products/${product._id}`}>
                            {lang === "en" ? "Inspect" : "Voir"}
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
