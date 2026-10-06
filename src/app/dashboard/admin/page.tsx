"use client";

import { useEffect, useState, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { DashboardOverview, Farm, Product, Shop } from "@/lib/types";
import { useAuth } from "../../AuthContext";
import { useLanguage } from "../../LanguageContext";
import DashboardShell from "../../components/DashboardShell";
import {
  Layers,
  Tractor,
  Store,
  ShieldAlert,
  Plus,
  Users,
  Shield,
  Package,
  ArrowRight,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type AdminTab = "overview" | "approvals" | "categories" | "users" | "orders" | "audit";

function getGreeting(lang: string): string {
  const h = new Date().getHours();
  if (lang === "en") return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const { lang, t } = useLanguage();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as AdminTab | null;
  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam || "overview");

  // Sync tab state when sidebar navigation changes the URL query param
  useEffect(() => {
    if (tabParam && ["overview", "approvals", "categories", "users", "orders", "audit"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [overview, setOverview] = useState<any>({
    totalUsers: 0, totalFarms: 0, totalShops: 0, totalProducts: 0,
    totalOrders: 0, pendingFarms: 0, pendingShops: 0, pendingProducts: 0,
  });

  const [farms, setFarms] = useState<Farm[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  
  // All Farms & Shops list (not just pending)
  const [showAllFarmsAndShops, setShowAllFarmsAndShops] = useState(false);
  const [allFarmsList, setAllFarmsList] = useState<Farm[]>([]);
  const [allShopsList, setAllShopsList] = useState<Shop[]>([]);

  // Modals/details
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState("");
  const [rejectResource, setRejectResource] = useState<"farms" | "shops" | "products" | "">("");
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    if (!token) return;
    try { const res = await api.get<any>("/admin/dashboard", token); setOverview(res.data); } catch {}
  };

  const fetchApprovals = async () => {
    if (!token) return;
    try {
      const [farmRes, shopRes, prodRes] = await Promise.all([
        api.list<Farm>("/resources/farms", { verificationStatus: "pending" }, token),
        api.list<Shop>("/resources/shops", { verificationStatus: "pending" }, token),
        api.list<Product>("/resources/products", { approvalStatus: "pending" }, token),
      ]);
      setFarms(farmRes.data); setShops(shopRes.data); setProducts(prodRes.data);
    } catch {}
  };

  const fetchAllFarmsAndShops = async () => {
    if (!token) return;
    try {
      const [farmsRes, shopsRes] = await Promise.all([
        api.list<Farm>("/resources/farms", undefined, token),
        api.list<Shop>("/resources/shops", undefined, token)
      ]);
      setAllFarmsList(farmsRes.data || []);
      setAllShopsList(shopsRes.data || []);
    } catch {}
  };

  const fetchCategories = async () => {
    try { const res = await api.list<any>("/categories"); setCategories(res.data); } catch {}
  };

  const fetchUsers = async () => {
    if (!token) return;
    try { const res = await api.list<any>("/resources/users", undefined, token); setUsersList(res.data); } catch {}
  };

  const fetchAudit = async () => {
    if (!token) return;
    try { const res = await api.list<any>("/resources/audit-logs", undefined, token); setAuditLogs(res.data); } catch {}
  };

  const fetchAllOrders = async () => {
    if (!token) return;
    try { const res = await api.list<any>("/resources/orders", undefined, token); setAllOrders(res.data || []); } catch {}
  };

  const reloadData = async () => {
    if (!token) return;
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchApprovals(),
      fetchAllFarmsAndShops(),
      fetchCategories(),
      fetchUsers(),
      fetchAudit(),
      fetchAllOrders()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    reloadData();
  }, [token]);

  const handleApprove = async (resource: "farms" | "shops" | "products", id: string) => {
    if (!token) return;
    try {
      await api.update(`/admin/${resource}/${id}/approve`, {}, token);
      setMessage(lang === "en" ? `${resource.slice(0, -1)} approved!` : "Approbation réussie !");
      fetchOverview(); fetchApprovals(); fetchAllFarmsAndShops();
    } catch {}
  };

  const openRejectPrompt = (resource: "farms" | "shops" | "products", id: string) => {
    setRejectResource(resource); setRejectId(id); setRejectReason("");
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rejectResource || !rejectId) return;
    try {
      await api.update(`/admin/${rejectResource}/${rejectId}/reject`, { reason: rejectReason }, token);
      setRejectResource(""); setRejectId("");
      setMessage(lang === "en" ? "Rejected successfully" : "Rejet enregistré");
      fetchOverview(); fetchApprovals(); fetchAllFarmsAndShops();
    } catch {}
  };

  const handleSuspendResource = async (resource: "farms" | "shops" | "products", id: string) => {
    if (!token) return;
    try {
      await api.update(`/admin/${resource}/${id}/suspend`, {}, token);
      setMessage(lang === "en" ? `${resource.slice(0, -1)} suspended!` : "Ressource suspendue !");
      fetchOverview(); fetchApprovals(); fetchAllFarmsAndShops();
    } catch {}
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    if (!token) return;
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await api.update(`/resources/users/${userId}`, { status: nextStatus }, token);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u))
      );
      setMessage(lang === "en" ? `User status updated to ${nextStatus}` : "Statut d'utilisateur mis à jour");
    } catch {
      setMessage(lang === "en" ? "Failed to update user status" : "Échec de la mise à jour");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await api.create("/categories", { name: catName, slug: catSlug.toLowerCase().replace(/\s+/g, "-"), status: "active", sortOrder: 0 }, token);
      setCatName(""); setCatSlug(""); fetchCategories();
    } catch {}
  };

  const totalPending = (overview?.pendingFarms ?? 0) + (overview?.pendingShops ?? 0) + (overview?.pendingProducts ?? 0);

  const approvalData = [
    { label: lang === "en" ? "Farms" : "Fermes", count: overview?.pendingFarms ?? 0, color: "var(--emerald-500)" },
    { label: lang === "en" ? "Shops" : "Boutiques", count: overview?.pendingShops ?? 0, color: "var(--gold-400)" },
    { label: lang === "en" ? "Products" : "Produits", count: overview?.pendingProducts ?? 0, color: "var(--charcoal-400)" },
  ];
  const maxApproval = Math.max(...approvalData.map(d => d.count), 1);

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
                ? "Platform administration — manage users, approvals, and content."
                : "Administration de la plateforme — gérez utilisateurs, approbations et contenu."}
            </p>
            <span className="dash-welcome__badge">
              <Shield size={13} />
              {lang === "en" ? "Admin Console" : "Console Admin"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button onClick={() => setActiveTab("overview")} className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}>{t("batch.tab.overview")}</button>
        <button onClick={() => setActiveTab("approvals")} className={`tab-btn ${activeTab === "approvals" ? "active" : ""}`}>{t("admin.tab.approvals")}</button>
        <button onClick={() => setActiveTab("categories")} className={`tab-btn ${activeTab === "categories" ? "active" : ""}`}>{t("admin.tab.categories")}</button>
        <button onClick={() => setActiveTab("users")} className={`tab-btn ${activeTab === "users" ? "active" : ""}`}>{t("admin.tab.users")}</button>
        <button onClick={() => setActiveTab("orders")} className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}>{lang === "en" ? "Orders Database" : "Base Commandes"}</button>
        <button onClick={() => setActiveTab("audit")} className={`tab-btn ${activeTab === "audit" ? "active" : ""}`}>{t("admin.tab.audit")}</button>
      </div>

      {message && (
        <div className="form-success-banner" style={{ margin: "16px 0", padding: "16px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{message}</span>
          <button onClick={() => setMessage("")} style={{ color: "inherit", fontWeight: "900", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--color-text-muted)", padding: "40px 0" }}>{lang === "en" ? "Loading platform data..." : "Chargement des données..."}</p>
      ) : (
        <div className="tab-panels">

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <>
              {/* Metrics */}
              <div className="dash-metrics">
                <div className="dash-metric">
                  <div className="dash-metric__header">
                    <span className="dash-metric__label">{t("dash.metric.total_users")}</span>
                    <div className="dash-metric__icon"><Users size={18} /></div>
                  </div>
                  <span className="dash-metric__value">{overview?.totalUsers ?? 0}</span>
                  <span className="dash-metric__desc">{lang === "en" ? "Registered accounts" : "Comptes enregistrés"}</span>
                </div>

                <div className="dash-metric">
                  <div className="dash-metric__header">
                    <span className="dash-metric__label">{lang === "en" ? "Total Farms" : "Fermes"}</span>
                    <div className="dash-metric__icon"><Tractor size={18} /></div>
                  </div>
                  <span className="dash-metric__value">{overview?.totalFarms ?? 0}</span>
                  <span className="dash-metric__desc">{lang === "en" ? "Registered farms" : "Fermes enregistrées"}</span>
                </div>

                <div className="dash-metric">
                  <div className="dash-metric__header">
                    <span className="dash-metric__label">{lang === "en" ? "Total Shops" : "Boutiques"}</span>
                    <div className="dash-metric__icon"><Store size={18} /></div>
                  </div>
                  <span className="dash-metric__value">{overview?.totalShops ?? 0}</span>
                  <span className="dash-metric__desc">{lang === "en" ? "Registered shops" : "Boutiques enregistrées"}</span>
                </div>

                <div className="dash-metric">
                  <div className="dash-metric__header">
                    <span className="dash-metric__label">{lang === "en" ? "Pending Approvals" : "En attente"}</span>
                    <div className={`dash-metric__icon ${totalPending > 0 ? "dash-metric__icon--warn" : ""}`}>
                      <ShieldAlert size={18} />
                    </div>
                  </div>
                  <span className={`dash-metric__value ${totalPending > 0 ? "dash-metric__value--danger" : ""}`}>
                    {totalPending}
                  </span>
                  <span className="dash-metric__desc">{lang === "en" ? "Farms, shops & products" : "Fermes, boutiques et produits"}</span>
                </div>
              </div>

              {/* Charts */}
              <div className="dash-charts">
                {/* Approval Queue */}
                <div className="dash-chart">
                  <div className="dash-chart__header">
                    <h3 className="dash-chart__title">{lang === "en" ? "Approval Queue" : "File d'Approbation"}</h3>
                    <span className="dash-chart__badge">{totalPending} {lang === "en" ? "pending" : "en attente"}</span>
                  </div>
                  <div className="dash-chart__body">
                    <div className="dash-bars">
                      {approvalData.map((d, i) => (
                        <div key={i} className="dash-bars__col">
                          <span className="dash-bars__bar-label">{d.count}</span>
                          <div
                            className="dash-bars__bar"
                            style={{
                              height: `${Math.max((d.count / maxApproval) * 80, 8)}%`,
                              background: d.color,
                            }}
                          />
                          <span className="dash-bars__axis-label">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Platform Composition */}
                <div className="dash-chart">
                  <div className="dash-chart__header">
                    <h3 className="dash-chart__title">{lang === "en" ? "Platform Composition" : "Composition de la Plateforme"}</h3>
                    <span className="dash-chart__badge">{lang === "en" ? "Current" : "Actuel"}</span>
                  </div>
                  <div className="dash-chart__body">
                    <div className="dash-progress-list">
                      <div className="dash-progress">
                        <div className="dash-progress__top">
                          <span className="dash-progress__label">{lang === "en" ? "Users" : "Utilisateurs"}</span>
                          <span className="dash-progress__value">{overview?.totalUsers ?? 0}</span>
                        </div>
                        <div className="dash-progress__track">
                          <div className="dash-progress__fill" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <div className="dash-progress">
                        <div className="dash-progress__top">
                          <span className="dash-progress__label">{lang === "en" ? "Products" : "Produits"}</span>
                          <span className="dash-progress__value">{overview?.totalProducts ?? 0}</span>
                        </div>
                        <div className="dash-progress__track">
                          <div
                            className="dash-progress__fill dash-progress__fill--amber"
                            style={{ width: `${Math.min(((overview?.totalProducts ?? 0) / Math.max(overview?.totalUsers ?? 1, 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="dash-progress">
                        <div className="dash-progress__top">
                          <span className="dash-progress__label">{lang === "en" ? "Orders" : "Commandes"}</span>
                          <span className="dash-progress__value">{overview?.totalOrders ?? 0}</span>
                        </div>
                        <div className="dash-progress__track">
                          <div
                            className="dash-progress__fill dash-progress__fill--muted"
                            style={{ width: `${Math.min(((overview?.totalOrders ?? 0) / Math.max(overview?.totalUsers ?? 1, 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Approvals Tab ── */}
          {activeTab === "approvals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Segment Toggles */}
              <div style={{ display: "flex", gap: "8px", background: "var(--color-bg-elevated)", padding: "6px", borderRadius: "10px", width: "fit-content" }}>
                <button
                  onClick={() => setShowAllFarmsAndShops(false)}
                  style={{
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    background: !showAllFarmsAndShops ? "var(--color-accent)" : "transparent",
                    color: !showAllFarmsAndShops ? "white" : "var(--color-text-secondary)"
                  }}
                >
                  {lang === "en" ? "Pending Approvals Only" : "Approbations en attente uniquement"}
                </button>
                <button
                  onClick={() => setShowAllFarmsAndShops(true)}
                  style={{
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    background: showAllFarmsAndShops ? "var(--color-accent)" : "transparent",
                    color: showAllFarmsAndShops ? "white" : "var(--color-text-secondary)"
                  }}
                >
                  {lang === "en" ? "Manage All Farms & Shops" : "Gérer toutes les fermes & boutiques"}
                </button>
              </div>

              {!showAllFarmsAndShops ? (
                <>
                  {/* Pending Farms */}
                  <div className="dash-section">
                    <div className="dash-section__header">
                      <h2 className="dash-section__title">{lang === "en" ? `Pending Farms (${farms.length})` : `Fermes en Attente (${farms.length})`}</h2>
                    </div>
                    {farms.length === 0 ? (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{lang === "en" ? "No farms waiting approval." : "Aucune ferme en attente."}</p>
                    ) : (
                      <div className="dash-table-wrap">
                        <table className="dash-table">
                          <thead><tr><th>{lang === "en" ? "Farm Name" : "Nom"}</th><th>{lang === "en" ? "Type" : "Type"}</th><th>{lang === "en" ? "Location" : "Lieu"}</th><th>Actions</th></tr></thead>
                          <tbody>
                            {farms.map((f) => (
                              <tr key={f._id}>
                                <td style={{ fontWeight: 700 }}>{f.name}</td>
                                <td>{f.farmType}</td>
                                <td>{f.location}, {f.city}</td>
                                <td>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => handleApprove("farms", f._id)} className="dash-badge dash-badge--approved" style={{ cursor: "pointer", border: "none" }}>{t("admin.approve")}</button>
                                    <button onClick={() => openRejectPrompt("farms", f._id)} className="dash-badge dash-badge--rejected" style={{ cursor: "pointer", border: "none" }}>{t("admin.reject")}</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Pending Shops */}
                  <div className="dash-section">
                    <div className="dash-section__header">
                      <h2 className="dash-section__title">{lang === "en" ? `Pending Shops (${shops.length})` : `Boutiques en Attente (${shops.length})`}</h2>
                    </div>
                    {shops.length === 0 ? (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{lang === "en" ? "No shops waiting approval." : "Aucune boutique en attente."}</p>
                    ) : (
                      <div className="dash-table-wrap">
                        <table className="dash-table">
                          <thead><tr><th>{lang === "en" ? "Shop Name" : "Nom"}</th><th>{lang === "en" ? "Location" : "Lieu"}</th><th>Actions</th></tr></thead>
                          <tbody>
                            {shops.map((s) => (
                              <tr key={s._id}>
                                <td style={{ fontWeight: 700 }}>{s.name}</td>
                                <td>{s.location}, {s.city}</td>
                                <td>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => handleApprove("shops", s._id)} className="dash-badge dash-badge--approved" style={{ cursor: "pointer", border: "none" }}>{t("admin.approve")}</button>
                                    <button onClick={() => openRejectPrompt("shops", s._id)} className="dash-badge dash-badge--rejected" style={{ cursor: "pointer", border: "none" }}>{t("admin.reject")}</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Pending Products */}
                  <div className="dash-section">
                    <div className="dash-section__header">
                      <h2 className="dash-section__title">{lang === "en" ? `Pending Products (${products.length})` : `Produits en Attente (${products.length})`}</h2>
                    </div>
                    {products.length === 0 ? (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{lang === "en" ? "No products waiting approval." : "Aucun produit en attente."}</p>
                    ) : (
                      <div className="dash-table-wrap">
                        <table className="dash-table">
                          <thead><tr><th>{lang === "en" ? "Product" : "Produit"}</th><th>{lang === "en" ? "Price" : "Prix"}</th><th>{lang === "en" ? "Qty" : "Qté"}</th><th>Actions</th></tr></thead>
                          <tbody>
                            {products.map((p) => (
                              <tr key={p._id}>
                                <td style={{ fontWeight: 700 }}>{p.name}</td>
                                <td>{(p.price ?? 0).toLocaleString()} XAF</td>
                                <td>{p.quantity} {p.unit}</td>
                                <td>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => handleApprove("products", p._id)} className="dash-badge dash-badge--approved" style={{ cursor: "pointer", border: "none" }}>{t("admin.approve")}</button>
                                    <button onClick={() => openRejectPrompt("products", p._id)} className="dash-badge dash-badge--rejected" style={{ cursor: "pointer", border: "none" }}>{t("admin.reject")}</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* All Farms List */}
                  <div className="dash-section">
                    <div className="dash-section__header">
                      <h2 className="dash-section__title">{t("admin.all_farms")} ({allFarmsList.length})</h2>
                    </div>
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>{lang === "en" ? "Farm Name" : "Nom de la Ferme"}</th>
                            <th>{lang === "en" ? "Type" : "Type"}</th>
                            <th>{lang === "en" ? "Location" : "Adresse"}</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allFarmsList.map((f) => (
                            <tr key={f._id}>
                              <td style={{ fontWeight: 700 }}>{f.name}</td>
                              <td>{f.farmType}</td>
                              <td>📍 {f.location}, {f.city}</td>
                              <td>
                                <span className={`status-badge ${f.status === "suspended" ? "rejected" : f.verificationStatus}`}>
                                  {f.status === "suspended" ? (lang === "en" ? "suspended" : "suspendu") : f.verificationStatus}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  {f.status === "suspended" || f.verificationStatus !== "approved" ? (
                                    <button onClick={() => handleApprove("farms", f._id)} className="dash-badge dash-badge--approved" style={{ border: "none", cursor: "pointer" }}>
                                      {lang === "en" ? "Activate" : "Activer"}
                                    </button>
                                  ) : (
                                    <button onClick={() => handleSuspendResource("farms", f._id)} className="dash-badge dash-badge--rejected" style={{ border: "none", cursor: "pointer" }}>
                                      {t("admin.suspend")}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* All Shops List */}
                  <div className="dash-section">
                    <div className="dash-section__header">
                      <h2 className="dash-section__title">{t("admin.all_shops")} ({allShopsList.length})</h2>
                    </div>
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>{lang === "en" ? "Shop Name" : "Nom de la Boutique"}</th>
                            <th>{lang === "en" ? "Location" : "Adresse"}</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allShopsList.map((s) => (
                            <tr key={s._id}>
                              <td style={{ fontWeight: 700 }}>{s.name}</td>
                              <td>📍 {s.location}, {s.city}</td>
                              <td>
                                <span className={`status-badge ${s.status === "suspended" ? "rejected" : s.verificationStatus}`}>
                                  {s.status === "suspended" ? (lang === "en" ? "suspended" : "suspendu") : s.verificationStatus}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  {s.status === "suspended" || s.verificationStatus !== "approved" ? (
                                    <button onClick={() => handleApprove("shops", s._id)} className="dash-badge dash-badge--approved" style={{ border: "none", cursor: "pointer" }}>
                                      {lang === "en" ? "Activate" : "Activer"}
                                    </button>
                                  ) : (
                                    <button onClick={() => handleSuspendResource("shops", s._id)} className="dash-badge dash-badge--rejected" style={{ border: "none", cursor: "pointer" }}>
                                      {t("admin.suspend")}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Categories Tab ── */}
          {activeTab === "categories" && (
            <div className="dash-columns">
              <div className="dash-section">
                <div className="dash-section__header">
                  <h2 className="dash-section__title">{lang === "en" ? "Product Categories" : "Catégories de Produits"}</h2>
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>{lang === "en" ? "Name" : "Nom"}</th><th>Slug</th></tr></thead>
                    <tbody>
                      {categories.map((c) => (
                        <tr key={c._id}>
                          <td style={{ fontWeight: 700 }}>{c.name}</td>
                          <td><code style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{c.slug}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="dash-section">
                <div className="dash-section__header">
                  <h2 className="dash-section__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Plus size={18} style={{ color: "var(--color-accent)" }} />
                    {lang === "en" ? "Create Category" : "Créer une Catégorie"}
                  </h2>
                </div>
                <div className="dash-entity" style={{ padding: 24 }}>
                  <form onSubmit={handleCreateCategory} className="connected-form">
                    <div className="form-group">
                      <label>{lang === "en" ? "Category Name" : "Nom de la catégorie"}</label>
                      <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} required placeholder="Feed Supplies" />
                    </div>
                    <div className="form-group">
                      <label>Slug</label>
                      <input type="text" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} required placeholder="feed-supplies" />
                    </div>
                    <button type="submit" className="dash-welcome__action" style={{ width: "100%", justifyContent: "center" }}>
                      {lang === "en" ? "Create" : "Créer"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === "users" && (
            <div className="dash-section">
              <div className="dash-section__header">
                <h2 className="dash-section__title">{lang === "en" ? "Platform Users" : "Utilisateurs"}</h2>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>{lang === "en" ? "Name" : "Nom"}</th>
                      <th>Email</th>
                      <th>{lang === "en" ? "Roles" : "Rôles"}</th>
                      <th>{lang === "en" ? "Status" : "Statut"}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                        <td>{u.email}</td>
                        <td>
                          {u.roles.map((r: string, idx: number) => (
                            <span key={idx} className="dash-badge dash-badge--approved" style={{ marginRight: 4 }}>{r}</span>
                          ))}
                        </td>
                        <td>
                          <span className={`dash-badge ${u.status === "active" ? "dash-badge--approved" : "dash-badge--rejected"}`}>
                            {u.status === "active" ? (lang === "en" ? "active" : "actif") : (lang === "en" ? "suspended" : "suspendu")}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleUserStatus(u._id, u.status)}
                            className={`dash-badge ${u.status === "active" ? "dash-badge--rejected" : "dash-badge--approved"}`}
                            style={{ cursor: "pointer", border: "none" }}
                          >
                            {u.status === "active" ? (lang === "en" ? "Suspend" : "Suspendre") : (lang === "en" ? "Activate" : "Activer")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Orders Tab ── */}
          {activeTab === "orders" && (
            <div className="dash-section">
              <div className="dash-section__header">
                <h2 className="dash-section__title">{lang === "en" ? "Orders Database" : "Base de Commandes"}</h2>
              </div>
              {allOrders.length === 0 ? (
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                  {lang === "en" ? "No orders placed on the platform." : "Aucune commande sur la plateforme."}
                </p>
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>{t("order.number")}</th>
                        <th>{lang === "en" ? "Date" : "Date"}</th>
                        <th>Total</th>
                        <th>{t("order.payment")}</th>
                        <th>{t("order.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders.map((o) => {
                        const isExpanded = expandedOrderId === o._id;
                        return (
                          <Fragment key={o._id}>
                            <tr key={o._id} style={{ cursor: "pointer" }} onClick={() => setExpandedOrderId(isExpanded ? null : o._id)}>
                              <td>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                              <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                              <td style={{ fontWeight: 700 }}>{(o.totalAmount ?? 0).toLocaleString()} XAF</td>
                              <td><span className={`status-badge ${o.paymentStatus}`}>{o.paymentStatus}</span></td>
                              <td><span className={`status-badge ${o.orderStatus}`}>{o.orderStatus}</span></td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${o._id}-admin-details`}>
                                <td></td>
                                <td colSpan={5} style={{ background: "var(--color-bg-elevated)", padding: "16px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <h4 style={{ margin: 0, fontWeight: 800, color: "var(--color-accent)", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "6px" }}>
                                      {t("order.items_title")}
                                    </h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                      {o.items?.map((item: any, idx: number) => (
                                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderBottom: "1px dashed var(--color-border-subtle)", paddingBottom: "4px" }}>
                                          <span><strong>{item.productNameSnapshot}</strong> x {item.quantity}</span>
                                          <span style={{ fontWeight: "700" }}>{((item.unitPriceSnapshot ?? 0) * (item.quantity ?? 0)).toLocaleString()} XAF</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                      <div><strong>Customer ID:</strong> {o.customerId}</div>
                                      <div><strong>Seller ID:</strong> {o.sellerId}</div>
                                      <div><strong>Delivery Method:</strong> {o.deliveryMethod}</div>
                                      <div><strong>Delivery Address:</strong> {o.deliveryAddress || "Pickup"}</div>
                                      {o.notes && <div><strong>Notes:</strong> {o.notes}</div>}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Audit Tab ── */}
          {activeTab === "audit" && (
            <div className="dash-section">
              <div className="dash-section__header">
                <h2 className="dash-section__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={18} style={{ color: "var(--color-accent)" }} />
                  {lang === "en" ? "Audit Logs" : "Journaux d'Audit"}
                </h2>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>{lang === "en" ? "Time" : "Date"}</th>
                      <th>{lang === "en" ? "Role" : "Rôle"}</th>
                      <th>{lang === "en" ? "Action" : "Action"}</th>
                      <th>{lang === "en" ? "Resource" : "Ressource"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>{lang === "en" ? "No audit records." : "Aucun enregistrement."}</td></tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id}>
                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                          <td><code style={{ fontSize: "0.78rem" }}>{log.actorRole}</code></td>
                          <td style={{ fontWeight: 700 }}>{log.action}</td>
                          <td>{log.entityType}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontWeight: 800, fontSize: "1.1rem" }}>{t("admin.rejection_reason")}</h3>
            <form onSubmit={handleRejectSubmit} className="connected-form">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                placeholder={lang === "en" ? "Rejection feedback..." : "Motif du rejet..."}
                rows={3}
                style={{ padding: 10 }}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button type="submit" className="dash-welcome__action" style={{ background: "#ef4444", flex: 1, justifyContent: "center" }}>
                  {lang === "en" ? "Confirm Rejection" : "Confirmer le rejet"}
                </button>
                <button type="button" onClick={() => { setRejectResource(""); setRejectId(""); }} style={{ flex: 1, padding: "10px 22px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-bg-elevated)", color: "var(--color-text)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                  {lang === "en" ? "Cancel" : "Annuler"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
