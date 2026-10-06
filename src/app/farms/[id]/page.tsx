"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import type { Farm, Product } from "@/lib/types";
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
  Sprout,
  Tractor,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../LanguageContext";

function farmImage(farm: Farm) {
  return farm.images?.[0] ?? "/images/seed/modern-poultry-farm.png";
}

function productImage(product: Product) {
  return product.images?.[0] ?? "/images/seed/eggs-poultry-products.png";
}

function formatPrice(value: number) {
  return `${(value ?? 0).toLocaleString()} XAF`;
}

function placeLabel(item: Pick<Farm, "location" | "city" | "region">) {
  return [item.location, item.city, item.region].filter(Boolean).join(", ");
}

export default function FarmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useLanguage();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState(lang === "en" ? "Loading details..." : "Chargement des détails...");

  useEffect(() => {
    let active = true;
    setStatus(lang === "en" ? "Loading farm profile..." : "Chargement du profil d'élevage...");

    api
      .get<Farm>(`/farms/${id}`)
      .then((res) => {
        if (!active) return null;
        setFarm(res.data);
        return api.list<Product>("/products", {
          farmId: id,
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
    <main className="app-page directory-detail-page farm-detail-page">
      <AppNav />

      <div className="directory-detail-shell">
        <Link href="/farms" className="directory-back-link">
          <ArrowLeft size={16} />
          {lang === "en" ? "Back to farms" : "Retour aux élevages"}
        </Link>

        {status && (
          <div className="directory-state">
            <Tractor size={28} />
            <p>{status}</p>
          </div>
        )}

        {farm && !status && (
          <>
            <section className="directory-detail-hero">
              <div className="directory-detail-media">
                <img src={farmImage(farm)} alt={farm.name} />
                <span><BadgeCheck size={15} /> {lang === "en" ? "Verified farm" : "Élevage vérifié"}</span>
              </div>
              <div className="directory-detail-copy">
                <span className="directory-kicker">
                  <ShieldCheck size={16} />
                  {farm.farmType || (lang === "en" ? "Poultry production" : "Production avicole")}
                </span>
                <h1>{farm.name}</h1>
                <p>{farm.description || (lang === "en" ? "This verified PoultryHub farm has not added a detailed description yet." : "Cet élevage vérifié PoultryHub n'a pas encore ajouté de description détaillée.")}</p>
                <div className="directory-detail-actions">
                  <Link href={`/marketplace?farmId=${farm._id}`} className="directory-primary-btn">
                    <Package size={16} />
                    {lang === "en" ? "View farm products" : "Voir les produits"}
                  </Link>
                  {farm.phone && (
                    <a href={`tel:${farm.phone}`} className="directory-secondary-btn">
                      <Phone size={16} />
                      {lang === "en" ? "Call farm" : "Appeler"}
                    </a>
                  )}
                </div>
              </div>
            </section>

            <section className="directory-detail-grid">
              <aside className="directory-profile-card">
                <h2>{lang === "en" ? "Farm profile" : "Profil de l'élevage"}</h2>
                <div className="certified-trust-note">
                  <ShieldCheck size={18} />
                  <div>
                    <strong>
                      {farm.verificationStatus === "approved"
                        ? lang === "en"
                          ? "Certified PoultryHub farmer"
                          : "Éleveur PoultryHub certifié"
                        : lang === "en"
                          ? "Certification in progress"
                          : "Certification en cours"}
                    </strong>
                    <p>
                      {farm.verificationStatus === "approved"
                        ? lang === "en"
                          ? "This account was verified with an official farmer document. You can buy with more trust."
                          : "Ce compte a été vérifié avec un document officiel d'éleveur. Achetez en toute confiance."
                        : lang === "en"
                          ? "This farmer uploaded an official proof document. Admin review builds extra trust for buyers."
                          : "Cet éleveur a téléversé un document officiel. La validation admin renforce la confiance des acheteurs."}
                    </p>
                  </div>
                </div>
                <div className="directory-profile-list">
                  <div>
                    <MapPin size={18} />
                    <span>{lang === "en" ? "Location" : "Adresse"}</span>
                    <strong>{placeLabel(farm) || (lang === "en" ? "Location pending" : "Adresse à confirmer")}</strong>
                  </div>
                  {farm.phone && (
                    <div>
                      <Phone size={18} />
                      <span>{lang === "en" ? "Contact" : "Contact"}</span>
                      <strong>{farm.phone}</strong>
                    </div>
                  )}
                  <div>
                    <Sprout size={18} />
                    <span>{lang === "en" ? "Focus" : "Spécialité"}</span>
                    <strong>{farm.farmType || (lang === "en" ? "Poultry farm" : "Élevage avicole")}</strong>
                  </div>
                  <div>
                    <CheckCircle size={18} />
                    <span>{lang === "en" ? "Status" : "Statut"}</span>
                    <strong>{lang === "en" ? "Approved and active" : "Approuvé et actif"}</strong>
                  </div>
                </div>
              </aside>

              <section className="directory-catalog-section">
                <div className="directory-results-head">
                  <div>
                    <span>{lang === "en" ? "Farm catalog" : "Catalogue de la ferme"}</span>
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
                    <p>{lang === "en" ? "This farm profile is ready, but its marketplace products are not listed yet." : "Le profil est prêt, mais les produits marketplace ne sont pas encore publiés."}</p>
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
