"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, MapPin, Search, Store, Tractor } from "lucide-react";
import { api } from "@/lib/api";
import type { Farm, Product, Shop } from "@/lib/types";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import CustomerBottomNav from "../../../components/CustomerBottomNav";

const CATEGORIES = [
  { key: "vegetables", en: "Vegetables", fr: "Légumes" },
  { key: "fruits", en: "Fruits", fr: "Fruits" },
  { key: "meat", en: "Meat", fr: "Viande" },
  { key: "poultry", en: "Poultry", fr: "Volaille" },
  { key: "dairy", en: "Dairy", fr: "Produits laitiers" },
  { key: "grains", en: "Grains", fr: "Céréales" },
  { key: "tubers", en: "Tubers", fr: "Tubercules" },
  { key: "seeds", en: "Seeds", fr: "Semences" },
  { key: "other", en: "Other", fr: "Autres" },
];

export default function CustomerExplorePage() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.list<Product>("/products", { approvalStatus: "approved", status: "available", limit: 24 }),
      api.list<Farm>("/farms", { limit: 12 }),
      api.list<Shop>("/shops", { limit: 12 }),
    ])
      .then(([p, f, s]) => {
        setProducts(p.data);
        setFarms(f.data);
        setShops(s.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const hay = `${p.name} ${p.description || ""}`.toLowerCase();
      const matchesQuery = !q || hay.includes(q) || q.includes("near") || q.includes("près");
      const matchesCat =
        !category ||
        hay.includes(category) ||
        (category === "poultry" && /chicken|egg|poulet|œuf|oeuf|chick/i.test(hay));
      return matchesQuery && matchesCat;
    });
  }, [products, query, category]);

  const filteredFarms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.includes("farm") || q.includes("ferme") || q.includes("near") || q.includes("près")) {
      return farms.filter(
        (f) =>
          !q ||
          q.includes("near") ||
          q.includes("près") ||
          q.includes("farm") ||
          q.includes("ferme") ||
          `${f.name} ${f.city} ${f.region}`.toLowerCase().includes(q)
      );
    }
    return farms.filter((f) => `${f.name} ${f.city} ${f.region}`.toLowerCase().includes(q));
  }, [farms, query]);

  const filteredShops = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.includes("shop") || q.includes("boutique") || q.includes("near") || q.includes("près")) {
      return shops.filter(
        (s) =>
          !q ||
          q.includes("near") ||
          q.includes("près") ||
          q.includes("shop") ||
          q.includes("boutique") ||
          `${s.name} ${s.city} ${s.region}`.toLowerCase().includes(q)
      );
    }
    return shops.filter((s) => `${s.name} ${s.city} ${s.region}`.toLowerCase().includes(q));
  }, [shops, query]);

  return (
    <DashboardShell mediaMode>
      <div className="media-explore">
        <header className="media-explore__head">
          <Compass size={22} />
          <div>
            <h1>{lang === "en" ? "Explore" : "Explorer"}</h1>
            <p>
              {lang === "en"
                ? "Find products, farms, shops, and nearby places."
                : "Trouvez produits, fermes, boutiques et lieux proches."}
            </p>
          </div>
        </header>

        <div className="media-explore__search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === "en"
                ? "Tomatoes, chicken, farms near me..."
                : "Tomates, poulet, fermes près de moi..."
            }
          />
        </div>

        <div className="media-explore__cats">
          <button
            type="button"
            className={!category ? "is-active" : ""}
            onClick={() => setCategory("")}
          >
            {lang === "en" ? "All" : "Tout"}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              className={category === c.key ? "is-active" : ""}
              onClick={() => setCategory(c.key)}
            >
              {lang === "en" ? c.en : c.fr}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="media-feed__status">{lang === "en" ? "Discovering..." : "Découverte..."}</p>
        ) : (
          <>
            <section className="media-explore__section">
              <h2>{lang === "en" ? "Trending products" : "Produits tendance"}</h2>
              <div className="media-explore__grid">
                {filteredProducts.slice(0, 12).map((p) => (
                  <Link key={p._id} href={`/products/${p._id}`} className="media-explore-card">
                    <img
                      src={p.images?.[0] || "/images/seed/eggs-poultry-products.png"}
                      alt=""
                    />
                    <strong>{p.name}</strong>
                    <span>{(p.price ?? 0).toLocaleString()} FCFA / {p.unit}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="media-explore__section">
              <h2>
                <Tractor size={16} /> {lang === "en" ? "Nearby farms" : "Fermes à proximité"}
              </h2>
              <div className="media-explore__list">
                {filteredFarms.map((f) => (
                  <Link key={f._id} href={`/farms/${f._id}`} className="media-explore-row">
                    <div>
                      <strong>{f.name}</strong>
                      <span>
                        <MapPin size={12} /> {[f.city, f.region].filter(Boolean).join(", ") || f.location}
                      </span>
                    </div>
                    <em>{lang === "en" ? "Pickup" : "Retrait"}</em>
                  </Link>
                ))}
              </div>
            </section>

            <section className="media-explore__section">
              <h2>
                <Store size={16} /> {lang === "en" ? "Nearby shops" : "Boutiques à proximité"}
              </h2>
              <div className="media-explore__list">
                {filteredShops.map((s) => (
                  <Link key={s._id} href={`/shops/${s._id}`} className="media-explore-row">
                    <div>
                      <strong>{s.name}</strong>
                      <span>
                        <MapPin size={12} /> {[s.city, s.region].filter(Boolean).join(", ") || s.location}
                      </span>
                    </div>
                    <em>{lang === "en" ? "Open" : "Ouvert"}</em>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      <CustomerBottomNav />
    </DashboardShell>
  );
}
