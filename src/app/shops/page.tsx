"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Shop } from "@/lib/types";
import AppNav from "../components/AppNav";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CheckCircle,
  Filter,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";

const regions = ["Littoral", "Centre", "Ouest", "Nord-Ouest", "Sud-Ouest"];

function shopImage(shop: Shop) {
  return shop.images?.[0] ?? shop.logo ?? "/images/seed/shop-supplies.png";
}

function placeLabel(item: Pick<Shop, "location" | "city" | "region">) {
  return [item.location, item.city, item.region].filter(Boolean).join(", ");
}

export default function ShopsPage() {
  const { lang } = useLanguage();
  const [shops, setShops] = useState<Shop[]>([]);
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(lang === "en" ? "Loading shops..." : "Chargement des boutiques...");

  useEffect(() => {
    let active = true;
    setStatus(lang === "en" ? "Loading verified shops..." : "Chargement des boutiques vérifiées...");

    api
      .list<Shop>("/shops", { region, city, limit: 100 })
      .then((response) => {
        if (!active) return;
        setShops(response.data);
        setStatus("");
      })
      .catch((error) => {
        if (!active) return;
        setStatus(
          error instanceof Error
            ? error.message
            : lang === "en"
              ? "Unable to load shops"
              : "Impossible de charger les boutiques"
        );
      });

    return () => {
      active = false;
    };
  }, [region, city, lang]);

  const visibleShops = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return shops;
    return shops.filter((shop) =>
      [shop.name, shop.description, shop.location, shop.city, shop.region]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [shops, search]);

  const cityCount = new Set(shops.map((shop) => shop.city).filter(Boolean)).size;
  const regionCount = new Set(shops.map((shop) => shop.region).filter(Boolean)).size;
  const featuredShop = visibleShops[0] ?? shops[0];

  const clearFilters = () => {
    setRegion("");
    setCity("");
    setSearch("");
  };

  return (
    <main className="app-page directory-page shops-directory-page">
      <AppNav />

      <section className="directory-hero directory-hero--shops">
        <div className="directory-hero__copy">
          <span className="directory-kicker">
            <ShieldCheck size={16} />
            {lang === "en" ? "Verified supply network" : "Réseau de boutiques vérifiées"}
          </span>
          <h1>{lang === "en" ? "Source poultry supplies from shops built for serious operators." : "Trouvez des fournitures avicoles auprès de boutiques fiables."}</h1>
          <p>
            {lang === "en"
              ? "Browse trusted shops for feed, vaccines, drinkers, cages, equipment, and farm essentials with local discovery built in."
              : "Parcourez des boutiques fiables pour aliments, vaccins, abreuvoirs, cages, équipements et essentiels d'élevage."}
          </p>
          <div className="directory-search-panel">
            <Search size={19} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={lang === "en" ? "Search shop, city, or supply keyword" : "Rechercher boutique, ville ou fourniture"}
            />
          </div>
        </div>

        <div className="directory-hero__feature">
          <div className="directory-feature-card">
            <img src={featuredShop ? shopImage(featuredShop) : "/images/seed/shop-supplies.png"} alt={featuredShop?.name ?? "Poultry supply shop"} />
            <div>
              <span><BadgeCheck size={14} /> {lang === "en" ? "Featured shop" : "Boutique en avant"}</span>
              <h2>{featuredShop?.name ?? (lang === "en" ? "Verified poultry suppliers" : "Fournisseurs avicoles vérifiés")}</h2>
              <p>{featuredShop ? placeLabel(featuredShop) : lang === "en" ? "Explore approved supply shops on PoultryHub." : "Explorez les boutiques approuvées sur PoultryHub."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="directory-metrics" aria-label={lang === "en" ? "Shop directory metrics" : "Statistiques des boutiques"}>
        <div>
          <Store size={20} />
          <span>{shops.length}</span>
          <p>{lang === "en" ? "Approved shops" : "Boutiques approuvées"}</p>
        </div>
        <div>
          <Building2 size={20} />
          <span>{cityCount}</span>
          <p>{lang === "en" ? "Cities served" : "Villes servies"}</p>
        </div>
        <div>
          <Truck size={20} />
          <span>{regionCount}</span>
          <p>{lang === "en" ? "Regions covered" : "Régions couvertes"}</p>
        </div>
        <div>
          <CheckCircle size={20} />
          <span>{visibleShops.length}</span>
          <p>{lang === "en" ? "Current matches" : "Résultats actuels"}</p>
        </div>
      </section>

      <section className="directory-command">
        <div className="directory-filter-row">
          <label>
            <span>{lang === "en" ? "Region" : "Région"}</span>
            <select value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="">{lang === "en" ? "All regions" : "Toutes les régions"}</option>
              {regions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{lang === "en" ? "City" : "Ville"}</span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder={lang === "en" ? "Douala, Yaounde..." : "Douala, Yaoundé..."}
            />
          </label>
        </div>
        <button type="button" className="directory-clear-btn" onClick={clearFilters}>
          <Filter size={15} />
          {lang === "en" ? "Clear filters" : "Effacer les filtres"}
        </button>
      </section>

      <section className="directory-results">
        <div className="directory-results-head">
          <div>
            <span>{lang === "en" ? "Shop directory" : "Annuaire des boutiques"}</span>
            <h2>
              {lang === "en"
                ? `${visibleShops.length} verified shop${visibleShops.length === 1 ? "" : "s"}`
                : `${visibleShops.length} boutique${visibleShops.length === 1 ? "" : "s"} vérifiée${visibleShops.length === 1 ? "" : "s"}`}
            </h2>
          </div>
          <Link href="/marketplace?productType=shop_product" className="directory-secondary-link">
            {lang === "en" ? "Browse shop supplies" : "Voir les fournitures"}
            <ArrowRight size={15} />
          </Link>
        </div>

        {status && (
          <div className="directory-state">
            <Store size={28} />
            <p>{status}</p>
          </div>
        )}

        {!status && visibleShops.length === 0 && (
          <div className="directory-state">
            <Search size={28} />
            <h3>{lang === "en" ? "No shops match your filters" : "Aucune boutique ne correspond"}</h3>
            <p>{lang === "en" ? "Try a broader region, city, or search term." : "Essayez une région, ville ou recherche plus large."}</p>
          </div>
        )}

        {!status && visibleShops.length > 0 && (
          <div className="directory-card-grid">
            {visibleShops.map((shop, index) => (
              <article key={shop._id} className="directory-card" style={{ animationDelay: `${index * 45}ms` }}>
                <Link href={`/shops/${shop._id}`} className="directory-card__media">
                  <img src={shopImage(shop)} alt={shop.name} />
                  <span>{lang === "en" ? "Supply shop" : "Boutique"}</span>
                </Link>
                <div className="directory-card__body">
                  <div className="directory-card__meta">
                    <span><BadgeCheck size={14} /> {lang === "en" ? "Verified" : "Vérifié"}</span>
                    <span><Boxes size={14} /> {shop.status}</span>
                  </div>
                  <h3>{shop.name}</h3>
                  <p>{shop.description || (lang === "en" ? "Verified PoultryHub shop for poultry supplies and equipment." : "Boutique PoultryHub vérifiée pour fournitures et équipements avicoles.")}</p>
                  <div className="directory-card__info">
                    <span><MapPin size={15} /> {placeLabel(shop) || (lang === "en" ? "Location pending" : "Adresse à confirmer")}</span>
                    {shop.phone && <span><Phone size={15} /> {shop.phone}</span>}
                  </div>
                  <Link href={`/shops/${shop._id}`} className="directory-card__cta">
                    {lang === "en" ? "View shop" : "Voir boutique"}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
