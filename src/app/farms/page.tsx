"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Farm } from "@/lib/types";
import AppNav from "../components/AppNav";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle,
  Filter,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sprout,
  Tractor,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";

const regions = ["Littoral", "Centre", "Ouest", "Nord-Ouest", "Sud-Ouest"];

function farmImage(farm: Farm) {
  return farm.images?.[0] ?? "/images/seed/modern-poultry-farm.png";
}

function placeLabel(item: Pick<Farm, "location" | "city" | "region">) {
  return [item.location, item.city, item.region].filter(Boolean).join(", ");
}

export default function FarmsPage() {
  const { lang } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(lang === "en" ? "Loading farms..." : "Chargement des élevages...");

  useEffect(() => {
    let active = true;
    setStatus(lang === "en" ? "Loading verified farms..." : "Chargement des élevages vérifiés...");

    api
      .list<Farm>("/farms", { region, city, limit: 100 })
      .then((response) => {
        if (!active) return;
        setFarms(response.data);
        setStatus("");
      })
      .catch((error) => {
        if (!active) return;
        setStatus(
          error instanceof Error
            ? error.message
            : lang === "en"
              ? "Unable to load farms"
              : "Impossible de charger les élevages"
        );
      });

    return () => {
      active = false;
    };
  }, [region, city, lang]);

  const visibleFarms = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return farms;
    return farms.filter((farm) =>
      [farm.name, farm.description, farm.farmType, farm.location, farm.city, farm.region]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [farms, search]);

  const cityCount = new Set(farms.map((farm) => farm.city).filter(Boolean)).size;
  const typeCount = new Set(farms.map((farm) => farm.farmType).filter(Boolean)).size;
  const featuredFarm = visibleFarms[0] ?? farms[0];

  const clearFilters = () => {
    setRegion("");
    setCity("");
    setSearch("");
  };

  return (
    <main className="app-page directory-page farms-directory-page">
      <AppNav />

      <section className="directory-hero directory-hero--farms">
        <div className="directory-hero__copy">
          <span className="directory-kicker">
            <ShieldCheck size={16} />
            {lang === "en" ? "Verified farm network" : "Réseau d'élevages vérifiés"}
          </span>
          <h1>{lang === "en" ? "Find trusted poultry farms near your market." : "Trouvez des élevages avicoles fiables près de votre marché."}</h1>
          <p>
            {lang === "en"
              ? "Discover active farms, understand their production focus, inspect local availability, and move from discovery to purchasing with confidence."
              : "Découvrez les élevages actifs, leur spécialité, leur disponibilité locale et avancez vers l'achat avec confiance."}
          </p>
          <div className="directory-search-panel">
            <Search size={19} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={lang === "en" ? "Search farm, city, type, or keyword" : "Rechercher élevage, ville, type ou mot-clé"}
            />
          </div>
        </div>

        <div className="directory-hero__feature">
          <div className="directory-feature-card">
            <img src={featuredFarm ? farmImage(featuredFarm) : "/images/seed/modern-poultry-farm.png"} alt={featuredFarm?.name ?? "Poultry farm"} />
            <div>
              <span><BadgeCheck size={14} /> {lang === "en" ? "Featured farm" : "Élevage en avant"}</span>
              <h2>{featuredFarm?.name ?? (lang === "en" ? "Verified poultry farms" : "Élevages avicoles vérifiés")}</h2>
              <p>{featuredFarm ? placeLabel(featuredFarm) : lang === "en" ? "Explore approved producers on PoultryHub." : "Explorez les producteurs approuvés sur PoultryHub."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="directory-metrics" aria-label={lang === "en" ? "Farm directory metrics" : "Statistiques des élevages"}>
        <div>
          <Tractor size={20} />
          <span>{farms.length}</span>
          <p>{lang === "en" ? "Approved farms" : "Élevages approuvés"}</p>
        </div>
        <div>
          <Building2 size={20} />
          <span>{cityCount}</span>
          <p>{lang === "en" ? "Cities covered" : "Villes couvertes"}</p>
        </div>
        <div>
          <Sprout size={20} />
          <span>{typeCount}</span>
          <p>{lang === "en" ? "Production focuses" : "Spécialités"}</p>
        </div>
        <div>
          <CheckCircle size={20} />
          <span>{visibleFarms.length}</span>
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
            <span>{lang === "en" ? "Farm directory" : "Annuaire des élevages"}</span>
            <h2>
              {lang === "en"
                ? `${visibleFarms.length} verified farm${visibleFarms.length === 1 ? "" : "s"}`
                : `${visibleFarms.length} élevage${visibleFarms.length === 1 ? "" : "s"} vérifié${visibleFarms.length === 1 ? "" : "s"}`}
            </h2>
          </div>
          <Link href="/marketplace" className="directory-secondary-link">
            {lang === "en" ? "Browse farm products" : "Voir les produits"}
            <ArrowRight size={15} />
          </Link>
        </div>

        {status && (
          <div className="directory-state">
            <Tractor size={28} />
            <p>{status}</p>
          </div>
        )}

        {!status && visibleFarms.length === 0 && (
          <div className="directory-state">
            <Search size={28} />
            <h3>{lang === "en" ? "No farms match your filters" : "Aucun élevage ne correspond"}</h3>
            <p>{lang === "en" ? "Try a broader region, city, or search term." : "Essayez une région, ville ou recherche plus large."}</p>
          </div>
        )}

        {!status && visibleFarms.length > 0 && (
          <div className="directory-card-grid">
            {visibleFarms.map((farm, index) => (
              <article key={farm._id} className="directory-card" style={{ animationDelay: `${index * 45}ms` }}>
                <Link href={`/farms/${farm._id}`} className="directory-card__media">
                  <img src={farmImage(farm)} alt={farm.name} />
                  <span>{farm.farmType || (lang === "en" ? "Poultry farm" : "Élevage avicole")}</span>
                </Link>
                <div className="directory-card__body">
                  <div className="directory-card__meta">
                    <span><BadgeCheck size={14} /> {lang === "en" ? "Verified" : "Vérifié"}</span>
                    <span>{farm.status}</span>
                  </div>
                  <h3>{farm.name}</h3>
                  <p>{farm.description || (lang === "en" ? "Verified PoultryHub farm ready for business discovery." : "Élevage vérifié PoultryHub prêt pour la découverte commerciale.")}</p>
                  <div className="directory-card__info">
                    <span><MapPin size={15} /> {placeLabel(farm) || (lang === "en" ? "Location pending" : "Adresse à confirmer")}</span>
                    {farm.phone && <span><Phone size={15} /> {farm.phone}</span>}
                  </div>
                  <Link href={`/farms/${farm._id}`} className="directory-card__cta">
                    {lang === "en" ? "View farm" : "Voir l'élevage"}
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
