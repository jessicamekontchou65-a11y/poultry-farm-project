"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Product, Shop } from "@/lib/types";
import { useAuth } from "../../AuthContext";
import { useLanguage } from "../../LanguageContext";
import DashboardShell from "../../components/DashboardShell";
import Link from "next/link";
import {
  Store,
  Plus,
  ShoppingBag,
  AlertTriangle,
  ChevronRight,
  FileText,
  MapPin,
  Package,
} from "lucide-react";

function getGreeting(lang: string): string {
  const h = new Date().getHours();
  if (lang === "en") return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
}

export default function ShopkeeperDashboard() {
  const { token, user } = useAuth();
  const { lang, t } = useLanguage();

  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    api.list<Shop>("/shops/my", undefined, token)
      .then((res) => setShops(res.data))
      .catch(() => {});

    api.list<Product>("/products/my", { productType: "shop_product" }, token)
      .then((res) => setProducts(res.data))
      .catch(() => {});

    api.list<any>("/orders/seller", undefined, token)
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const pendingOrders = orders.filter((o) => o.orderStatus === "pending").length;
  const confirmedOrders = orders.filter((o) => o.orderStatus === "confirmed").length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered").length;
  const lowStockCount = products.filter((p) => p.quantity < 10).length;

  // Donut: Order status
  const totalOrders = orders.length || 1;
  const orderSegments = [
    { label: lang === "en" ? "Pending" : "En attente", count: pendingOrders, color: "var(--gold-400)" },
    { label: lang === "en" ? "Confirmed" : "Confirmé", count: confirmedOrders, color: "var(--emerald-500)" },
    { label: lang === "en" ? "Delivered" : "Livré", count: deliveredOrders, color: "var(--charcoal-400)" },
    { label: lang === "en" ? "Other" : "Autre", count: Math.max(0, orders.length - pendingOrders - confirmedOrders - deliveredOrders), color: "#ef4444" },
  ].filter(s => s.count > 0);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const donutSegs = orderSegments.map((seg) => {
    const pct = seg.count / totalOrders;
    const segLen = pct * circumference;
    const rotation = (offset / circumference) * 360 - 90;
    offset += segLen;
    return { ...seg, pct, segLen, rotation };
  });

  // Stock health — top 5 products
  const stockProducts = [...products].sort((a, b) => a.quantity - b.quantity).slice(0, 5);
  const maxStock = Math.max(...stockProducts.map(p => p.quantity), 1);

  return (
    <DashboardShell>
      {/* Welcome */}
      <div className="dash-welcome">
        <div className="dash-welcome__top">
          <div>
            <h1 className="dash-welcome__greeting">
              {getGreeting(lang)}, {user?.fullName?.split(" ")[0]} 👋
            </h1>
            <p className="dash-welcome__subtitle">
              {lang === "en"
                ? "Manage your shops, track orders, and monitor inventory from one place."
                : "Gérez vos boutiques, suivez les commandes et surveillez le stock depuis un seul endroit."}
            </p>
            <span className="dash-welcome__badge">
              <Store size={13} />
              {lang === "en" ? "Shopkeeper Dashboard" : "Tableau de Bord Boutiquier"}
            </span>
          </div>
          <Link href="/dashboard/shopkeeper/shops" className="dash-welcome__action">
            <Plus size={18} />
            {t("shop.create.title")}
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="dash-metrics">
        <div className="dash-metric">
          <div className="dash-metric__header">
            <span className="dash-metric__label">{lang === "en" ? "Pending Orders" : "Commandes en attente"}</span>
            <div className="dash-metric__icon dash-metric__icon--amber"><FileText size={18} /></div>
          </div>
          <span className="dash-metric__value">{pendingOrders}</span>
          <span className="dash-metric__desc">{lang === "en" ? "Awaiting your confirmation" : "En attente de confirmation"}</span>
        </div>

        <div className="dash-metric">
          <div className="dash-metric__header">
            <span className="dash-metric__label">{lang === "en" ? "Low Stock" : "Stock Faible"}</span>
            <div className={`dash-metric__icon ${lowStockCount > 0 ? "dash-metric__icon--warn" : ""}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <span className={`dash-metric__value ${lowStockCount > 0 ? "dash-metric__value--danger" : ""}`}>
            {lowStockCount}
          </span>
          <span className="dash-metric__desc">{lang === "en" ? "Products under 10 units" : "Produits sous 10 unités"}</span>
        </div>

        <div className="dash-metric">
          <div className="dash-metric__header">
            <span className="dash-metric__label">{lang === "en" ? "Active Catalog" : "Catalogue Actif"}</span>
            <div className="dash-metric__icon"><ShoppingBag size={18} /></div>
          </div>
          <span className="dash-metric__value">{products.length}</span>
          <span className="dash-metric__desc">{lang === "en" ? "Total listed supplies" : "Fournitures publiées"}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="dash-charts">
        {/* Order Status Donut */}
        <div className="dash-chart">
          <div className="dash-chart__header">
            <h3 className="dash-chart__title">{lang === "en" ? "Order Status" : "Statut des Commandes"}</h3>
            <span className="dash-chart__badge">{orders.length} {lang === "en" ? "total" : "total"}</span>
          </div>
          <div className="dash-chart__body">
            {orders.length === 0 ? (
              <div className="dash-empty" style={{ border: "none", padding: "32px 16px" }}>
                <div className="dash-empty__icon"><Package size={24} /></div>
                <p className="dash-empty__text">{lang === "en" ? "No orders yet" : "Aucune commande"}</p>
              </div>
            ) : (
              <div className="dash-donut">
                <svg className="dash-donut__ring" viewBox="0 0 120 120">
                  <circle className="ring-bg" cx="60" cy="60" r={radius} />
                  {donutSegs.map((seg, i) => (
                    <circle
                      key={i}
                      cx="60" cy="60" r={radius}
                      stroke={seg.color}
                      strokeDasharray={`${seg.segLen} ${circumference - seg.segLen}`}
                      strokeDashoffset="0"
                      transform={`rotate(${seg.rotation} 60 60)`}
                      style={{ transition: "stroke-dasharray 0.6s ease" }}
                      fill="none" strokeWidth="20" strokeLinecap="round"
                    />
                  ))}
                </svg>
                <div className="dash-donut__legend">
                  {donutSegs.map((seg, i) => (
                    <div key={i} className="dash-donut__legend-item">
                      <div className="dash-donut__legend-dot" style={{ background: seg.color }} />
                      <span className="dash-donut__legend-label">{seg.label}</span>
                      <span className="dash-donut__legend-value">{seg.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock Levels */}
        <div className="dash-chart">
          <div className="dash-chart__header">
            <h3 className="dash-chart__title">{lang === "en" ? "Stock Levels" : "Niveaux de Stock"}</h3>
            <span className="dash-chart__badge">{lang === "en" ? "Lowest first" : "Plus bas d'abord"}</span>
          </div>
          <div className="dash-chart__body">
            {stockProducts.length === 0 ? (
              <div className="dash-empty" style={{ border: "none", padding: "32px 16px" }}>
                <div className="dash-empty__icon"><ShoppingBag size={24} /></div>
                <p className="dash-empty__text">{lang === "en" ? "No products yet" : "Aucun produit"}</p>
              </div>
            ) : (
              <div className="dash-progress-list">
                {stockProducts.map((p) => (
                  <div key={p._id} className="dash-progress">
                    <div className="dash-progress__top">
                      <span className="dash-progress__label">{p.name}</span>
                      <span className="dash-progress__value">
                        {p.quantity} {p.unit}
                      </span>
                    </div>
                    <div className="dash-progress__track">
                      <div
                        className={`dash-progress__fill ${p.quantity < 10 ? "dash-progress__fill--danger" : p.quantity < 30 ? "dash-progress__fill--amber" : ""}`}
                        style={{ width: `${Math.min((p.quantity / maxStock) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two-column: Shops + Inventory */}
      <div className="dash-columns">
        {/* Shops */}
        <div className="dash-section">
          <div className="dash-section__header">
            <h2 className="dash-section__title">{lang === "en" ? "My Shops" : "Mes Boutiques"}</h2>
          </div>
          {shops.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty__icon"><Store size={24} /></div>
              <p className="dash-empty__text">{lang === "en" ? "No shops registered yet." : "Aucune boutique enregistrée."}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {shops.map((shop) => (
                <div key={shop._id} className="dash-entity">
                  <div className="dash-entity__top">
                    <h3 className="dash-entity__name">{shop.name}</h3>
                    <span className={`dash-badge dash-badge--${shop.verificationStatus}`}>
                      {t(`farm.status.${shop.verificationStatus}`)}
                    </span>
                  </div>
                  <div className="dash-entity__bottom">
                    <span className="dash-entity__location">
                      <MapPin size={14} /> {shop.location}, {shop.city}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Preview */}
        <div className="dash-section">
          <div className="dash-section__header">
            <h2 className="dash-section__title">{lang === "en" ? "Inventory Preview" : "Aperçu de l'Inventaire"}</h2>
            <Link href="/dashboard/shopkeeper/shops" className="dash-section__link">
              {lang === "en" ? "Manage" : "Gérer"} <ChevronRight size={16} />
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty__icon"><ShoppingBag size={24} /></div>
              <p className="dash-empty__text">{lang === "en" ? "No products in inventory." : "Aucun produit en stock."}</p>
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{lang === "en" ? "Product" : "Produit"}</th>
                    <th>{lang === "en" ? "Price" : "Prix"}</th>
                    <th>Stock</th>
                    <th>{lang === "en" ? "Status" : "Statut"}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td>{(p.price ?? 0).toLocaleString()} XAF</td>
                      <td style={{ color: p.quantity < 10 ? "#ef4444" : "inherit", fontWeight: p.quantity < 10 ? 800 : 600 }}>
                        {p.quantity} {p.unit}
                      </td>
                      <td>
                        <span className={`dash-badge dash-badge--${p.approvalStatus}`}>
                          {p.approvalStatus === "approved"
                            ? (lang === "en" ? "approved" : "approuvé")
                            : p.approvalStatus === "pending"
                              ? (lang === "en" ? "pending" : "en attente")
                              : p.approvalStatus === "rejected"
                                ? (lang === "en" ? "rejected" : "rejeté")
                                : p.approvalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
