"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Farm } from "@/lib/types";
import { useAuth } from "../../AuthContext";
import { useLanguage } from "../../LanguageContext";
import DashboardShell from "../../components/DashboardShell";
import Link from "next/link";
import {
  Tractor,
  Plus,
  TrendingUp,
  AlertTriangle,
  Layers,
  ChevronRight,
  MapPin,
  Egg,
  ShoppingBag,
  ClipboardList,
  Syringe,
  Wheat,
} from "lucide-react";

function getGreeting(lang: string): string {
  const h = new Date().getHours();
  if (lang === "en") return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
}

export default function FarmerDashboard() {
  const { token, user } = useAuth();
  const { lang, t } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [overview, setOverview] = useState({
    birds: 0,
    batches: 0,
    mortality: 0,
    feedCost: 0,
    revenue: 0,
    profit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    api
      .list<Farm>("/farms/my", undefined, token)
      .then((res) => setFarms(res.data))
      .catch(() => {});

    api
      .get<any>("/reports/farmer/overview", token)
      .then((res) => {
        if (res.data) setOverview(res.data);
        setLoading(false);
      })
      .catch(() => {
        setOverview({
          birds: 0,
          batches: 0,
          mortality: 0,
          feedCost: 0,
          revenue: 0,
          profit: 0,
        });
        setLoading(false);
      });
  }, [token]);

  const workflow = [
    {
      step: "1",
      title: lang === "en" ? "Register your farm" : "Enregistrez votre ferme",
      desc:
        lang === "en"
          ? "Add farm details so customers and admins can find you."
          : "Ajoutez les infos de votre élevage pour être visible.",
      href: "/dashboard/farmer/farms",
      icon: Tractor,
    },
    {
      step: "2",
      title: lang === "en" ? "Create poultry batches" : "Créez vos lots",
      desc:
        lang === "en"
          ? "Track chicks, layers, or broilers by batch."
          : "Suivez poussins, pondeuses ou chairs par lot.",
      href: "/dashboard/farmer/farms",
      icon: Layers,
    },
    {
      step: "3",
      title: lang === "en" ? "Log daily operations" : "Enregistrez le quotidien",
      desc:
        lang === "en"
          ? "Feed, mortality, vaccines, and egg production."
          : "Aliment, mortalité, vaccins et production d'œufs.",
      href: "/dashboard/farmer/manage",
      icon: ClipboardList,
    },
    {
      step: "4",
      title: lang === "en" ? "Sell & review profit" : "Vendez & suivez le profit",
      desc:
        lang === "en"
          ? "Record sales, expenses, and check reports."
          : "Notez ventes, dépenses et consultez les rapports.",
      href: "/dashboard/farmer/sales",
      icon: ShoppingBag,
    },
  ];

  const quickActions = [
    {
      href: "/dashboard/farmer/manage",
      label: lang === "en" ? "Farm hub" : "Hub ferme",
      icon: Layers,
    },
    {
      href: "/dashboard/farmer/farms",
      label: lang === "en" ? "My farms" : "Mes fermes",
      icon: Tractor,
    },
    {
      href: "/dashboard/farmer/manage/daily",
      label: lang === "en" ? "Daily log" : "Journal",
      icon: ClipboardList,
    },
    {
      href: "/dashboard/farmer/reports",
      label: lang === "en" ? "Reports" : "Rapports",
      icon: Egg,
    },
  ];

  return (
    <DashboardShell>
      <div className="dash-welcome">
        <div className="dash-welcome__top">
          <div>
            <h1 className="dash-welcome__greeting">
              {getGreeting(lang)}, {user?.fullName?.split(" ")[0]}
            </h1>
            <p className="dash-welcome__subtitle">
              {lang === "en"
                ? "Your farm command center — follow the simple model below to manage production with confidence."
                : "Votre centre de commande — suivez le modèle simple ci-dessous pour gérer votre production."}
            </p>
            <span className="dash-welcome__badge">
              <Tractor size={13} />
              {lang === "en" ? "Farmer Dashboard" : "Tableau de Bord Éleveur"}
            </span>
          </div>
          <Link href="/dashboard/farmer/manage" className="dash-welcome__action">
            <Layers size={18} />
            {lang === "en" ? "Farm Management" : "Gestion de ferme"}
          </Link>
        </div>
      </div>

      {/* Clear farm management model */}
      <section className="farmer-model-section">
        <div className="farmer-model-section__head">
          <h2>
            {lang === "en" ? "How your farm works here" : "Comment fonctionne votre ferme ici"}
          </h2>
          <p>
            {lang === "en"
              ? "Four clear steps. Start at the top and move down as your farm grows."
              : "Quatre étapes claires. Commencez en haut et avancez au fur et à mesure."}
          </p>
        </div>
        <div className="farmer-model-grid">
          {workflow.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.step} href={item.href} className="farmer-model-card">
                <span className="farmer-model-card__step">{item.step}</span>
                <div className="farmer-model-card__icon">
                  <Icon size={20} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <span className="farmer-model-card__link">
                  {lang === "en" ? "Open" : "Ouvrir"} <ChevronRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="farmer-quick-actions">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="farmer-quick-action">
              <Icon size={18} />
              <span>{action.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="dash-metrics">
        <div className="dash-metric">
          <div className="dash-metric__header">
            <span className="dash-metric__label">{t("dash.metric.total_birds")}</span>
            <div className="dash-metric__icon">
              <TrendingUp size={18} />
            </div>
          </div>
          <span className="dash-metric__value">
            {loading ? "…" : (overview?.birds ?? 0).toLocaleString()}
          </span>
          <span className="dash-metric__desc">
            {lang === "en" ? "Across all active batches" : "Sur tous les lots actifs"}
          </span>
        </div>

        <div className="dash-metric">
          <div className="dash-metric__header">
            <span className="dash-metric__label">{t("dash.metric.active_batches")}</span>
            <div className="dash-metric__icon">
              <Layers size={18} />
            </div>
          </div>
          <span className="dash-metric__value">{loading ? "…" : overview?.batches ?? 0}</span>
          <span className="dash-metric__desc">
            {lang === "en" ? "Currently growing" : "En cours d'élevage"}
          </span>
        </div>

        <div className="dash-metric">
          <div className="dash-metric__header">
            <span className="dash-metric__label">{t("dash.metric.mortality")}</span>
            <div
              className={`dash-metric__icon ${(overview?.mortality ?? 0) > 5 ? "dash-metric__icon--warn" : ""}`}
            >
              <AlertTriangle size={18} />
            </div>
          </div>
          <span
            className={`dash-metric__value ${(overview?.mortality ?? 0) > 5 ? "dash-metric__value--danger" : ""}`}
          >
            {loading ? "…" : `${overview?.mortality ?? 0}%`}
          </span>
          <span className="dash-metric__desc">
            {lang === "en" ? "Keep this low for healthy flocks" : "À garder bas pour des lots sains"}
          </span>
        </div>

        <div className="dash-metric">
          <div className="dash-metric__header">
            <span className="dash-metric__label">{t("dash.metric.profit")}</span>
            <div className="dash-metric__icon">
              <span style={{ fontSize: "0.7rem", fontWeight: 800 }}>XAF</span>
            </div>
          </div>
          <span
            className={`dash-metric__value ${(overview?.profit ?? 0) >= 0 ? "dash-metric__value--accent" : "dash-metric__value--danger"}`}
          >
            {loading ? "…" : (overview?.profit ?? 0).toLocaleString()}
          </span>
          <span className="dash-metric__desc">
            {lang === "en" ? "Revenue minus expenses" : "Ventes moins dépenses"}
          </span>
        </div>
      </div>

      <section className="farmer-ops-hint">
        <div className="farmer-ops-hint__item">
          <Wheat size={16} />
          <span>
            {lang === "en"
              ? "Log feeding regularly to control feed cost."
              : "Notez l'alimentation régulièrement pour maîtriser le coût."}
          </span>
        </div>
        <div className="farmer-ops-hint__item">
          <Syringe size={16} />
          <span>
            {lang === "en"
              ? "Complete vaccinations on schedule from each batch page."
              : "Complétez les vaccins à temps depuis chaque page de lot."}
          </span>
        </div>
        <div className="farmer-ops-hint__item">
          <Egg size={16} />
          <span>
            {lang === "en"
              ? "Record egg collections daily for accurate reports."
              : "Enregistrez la collecte d'œufs chaque jour pour des rapports fiables."}
          </span>
        </div>
      </section>

      <div className="dash-section">
        <div className="dash-section__header">
          <h2 className="dash-section__title">
            {lang === "en" ? "My Registered Farms" : "Mes Élevages Enregistrés"}
          </h2>
          <Link href="/dashboard/farmer/farms" className="dash-section__link">
            {lang === "en" ? "View all" : "Voir tout"} <ChevronRight size={16} />
          </Link>
        </div>

        {farms.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty__icon">
              <Tractor size={24} />
            </div>
            <p className="dash-empty__text">
              {lang === "en"
                ? "Start with step 1: register your first farm. It only takes a few minutes."
                : "Commencez à l'étape 1 : enregistrez votre première ferme. Cela prend quelques minutes."}
            </p>
            <Link href="/dashboard/farmer/farms" className="dash-welcome__action">
              {t("farm.create.title")}
            </Link>
          </div>
        ) : (
          <div className="dash-entity-grid">
            {farms.map((farm) => (
              <div key={farm._id} className="dash-entity">
                <div className="dash-entity__top">
                  <div>
                    <h3 className="dash-entity__name">{farm.name}</h3>
                    <span className="dash-entity__type">{farm.farmType}</span>
                  </div>
                  <span className={`dash-badge dash-badge--${farm.verificationStatus}`}>
                    {t(`farm.status.${farm.verificationStatus}`)}
                  </span>
                </div>
                <div className="dash-entity__bottom">
                  <span className="dash-entity__location">
                    <MapPin size={14} /> {farm.city}, {farm.region}
                  </span>
                  {farm.verificationStatus === "approved" ? (
                    <Link
                      href={`/dashboard/farmer/farms/${farm._id}`}
                      className="dash-entity__link"
                    >
                      {lang === "en" ? "Manage" : "Gérer"} <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                      {lang === "en" ? "Awaiting activation" : "En attente d'activation"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
