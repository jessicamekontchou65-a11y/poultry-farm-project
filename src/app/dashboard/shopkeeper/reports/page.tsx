"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Shop, Product } from "@/lib/types";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import { FileText, Store, Calendar, Download, TrendingUp, AlertTriangle, ShoppingBag, Layers } from "lucide-react";

export default function ShopkeeperReportsPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();

  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchShopkeeperData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [shopsRes, productsRes, ordersRes] = await Promise.all([
        api.list<Shop>("/shops/my", undefined, token),
        api.list<Product>("/products/my", { productType: "shop_product" }, token),
        api.list<any>("/orders/seller", undefined, token)
      ]);
      setShops(shopsRes.data || []);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopkeeperData();
  }, [token]);

  // Date filtering logic on orders
  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  // Gross Sales (only delivered orders count as completed revenue)
  const grossSales = filteredOrders
    .filter((o) => o.orderStatus === "delivered")
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  // Pending Sales (confirmed/processing/ready)
  const pendingSales = filteredOrders
    .filter((o) => ["pending", "confirmed", "processing", "ready"].includes(o.orderStatus))
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  const lowStockCount = products.filter((p) => p.quantity < 10).length;

  // CSV Exporter
  const handleExportCSV = (type: "sales" | "inventory") => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (type === "sales") {
      filename = "shop_sales_report.csv";
      headers = ["Order Number", "Date", "Payment Status", "Order Status", "Total Amount (XAF)", "Address"];
      rows = filteredOrders.map((o) => [
        o.orderNumber || "",
        new Date(o.createdAt).toLocaleDateString(),
        o.paymentStatus || "",
        o.orderStatus || "",
        String(o.totalAmount),
        o.deliveryAddress || "Pickup"
      ]);
    } else {
      filename = "shop_inventory_report.csv";
      headers = ["Product Name", "Category ID", "Unit Price (XAF)", "Stock Quantity", "Unit", "Status", "Approval Status"];
      rows = products.map((p) => [
        p.name,
        p.categoryId,
        String(p.price),
        String(p.quantity),
        p.unit || "",
        p.status || "",
        p.approvalStatus || ""
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG graphic relative heights
  const maxSales = Math.max(grossSales, pendingSales, 1);
  const grossPct = Math.max(10, (grossSales / maxSales) * 85);
  const pendingPct = Math.max(10, (pendingSales / maxSales) * 85);

  return (
    <DashboardShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <p className="resource-kicker">{t("dash.sidebar.shopkeeper")}</p>
          <h1 style={{ margin: 0 }}>{lang === "en" ? "Shop Sales & Stock Reports" : "Rapports Ventes & Inventaire"}</h1>
        </div>
        {!loading && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => handleExportCSV("sales")} className="status-badge approved" style={{ cursor: "pointer", border: "none", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={14} />
              {lang === "en" ? "Export Sales" : "Export Ventes"}
            </button>
            <button onClick={() => handleExportCSV("inventory")} className="status-badge pending" style={{ cursor: "pointer", border: "none", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={14} />
              {lang === "en" ? "Export Inventory" : "Export Stock"}
            </button>
          </div>
        )}
      </div>

      {/* Date Filters */}
      <div className="glass-card" style={{ padding: "16px", marginBottom: "24px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={16} style={{ color: "var(--color-text-secondary)" }} />
          <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{lang === "en" ? "Filter Sales Period:" : "Filtrer la période :"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{t("report.start_date")}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{t("report.end_date")}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
          >
            {lang === "en" ? "Clear Filters" : "Réinitialiser"}
          </button>
        )}
      </div>

      {loading ? (
        <p>{lang === "en" ? "Loading business reports..." : "Chargement des analyses de la boutique..."}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Shop Metrics */}
          <div className="overview-stats">
            <div className="stat-card">
              <div className="stat-header">
                <span>{lang === "en" ? "Gross Completed Sales" : "Ventes Réalisées"}</span>
              </div>
              <span className="stat-value" style={{ color: "var(--color-accent)" }}>
                {grossSales.toLocaleString()} XAF
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>{lang === "en" ? "Pending Orders Value" : "Commandes en Cours"}</span>
              </div>
              <span className="stat-value" style={{ color: "var(--gold-400)" }}>
                {pendingSales.toLocaleString()} XAF
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>{lang === "en" ? "Low Stock Items" : "Stock Faible"}</span>
              </div>
              <span className="stat-value" style={{ color: lowStockCount > 0 ? "#ef4444" : "inherit" }}>
                {lowStockCount}
              </span>
            </div>
          </div>

          {/* Visual Sales vs Pending & Stock Health */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            
            {/* Sales Chart */}
            <div className="chart-card" style={{ padding: "24px" }}>
              <h3 style={{ fontWeight: "800", marginBottom: "16px" }}>{lang === "en" ? "Sales Volume Performance" : "Performance du Volume de Ventes"}</h3>
              <div style={{ height: "220px", display: "flex", alignItems: "flex-end", gap: "48px", padding: "16px 32px 0 32px", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--color-accent)" }}>{grossSales.toLocaleString()}</span>
                  <div style={{ width: "100%", maxWidth: "80px", height: `${grossPct}%`, background: "var(--gradient-accent)", borderRadius: "6px 6px 0 0" }} />
                  <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{lang === "en" ? "Delivered" : "Livré"}</span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--gold-400)" }}>{pendingSales.toLocaleString()}</span>
                  <div style={{ width: "100%", maxWidth: "80px", height: `${pendingPct}%`, background: "linear-gradient(to top, var(--gold-400), #fbbf24)", borderRadius: "6px 6px 0 0" }} />
                  <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{lang === "en" ? "Pending" : "En cours"}</span>
                </div>
              </div>
            </div>

            {/* Stock Levels Health List */}
            <div className="chart-card" style={{ padding: "24px" }}>
              <h3 style={{ fontWeight: "800", marginBottom: "16px" }}>{lang === "en" ? "Critical Inventory Stock Levels" : "Niveaux de Stock Critiques"}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "220px", overflowY: "auto", paddingRight: "8px" }}>
                {products.length === 0 ? (
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{lang === "en" ? "No products listed." : "Aucun produit en stock."}</p>
                ) : (
                  [...products].sort((a, b) => a.quantity - b.quantity).slice(0, 5).map((p) => {
                    const pct = Math.min(100, (p.quantity / 50) * 100); // base percentage relative to 50 items target
                    return (
                      <div key={p._id} className="dash-progress" style={{ marginBottom: "4px" }}>
                        <div className="dash-progress__top">
                          <span className="dash-progress__label" style={{ fontWeight: "700" }}>{p.name}</span>
                          <span className="dash-progress__value" style={{ color: p.quantity < 10 ? "#ef4444" : "inherit", fontWeight: "800" }}>
                            {p.quantity} {p.unit}
                          </span>
                        </div>
                        <div className="dash-progress__track">
                          <div className="dash-progress__fill" style={{ width: `${pct}%`, background: p.quantity < 10 ? "#ef4444" : "var(--color-accent)" }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Table of Shops */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Store size={22} style={{ color: "var(--color-accent)" }} />
              {lang === "en" ? "Shops Performance Log" : "Performance de mes Boutiques"}
            </h2>
            {shops.length === 0 ? (
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{lang === "en" ? "No shops created yet." : "Aucune boutique créée."}</p>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{lang === "en" ? "Shop Name" : "Nom de la Boutique"}</th>
                      <th>{lang === "en" ? "Location" : "Adresse"}</th>
                      <th>{lang === "en" ? "Total Items" : "Nombre d'Articles"}</th>
                      <th>{lang === "en" ? "Status" : "Statut"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map((shop) => {
                      const shopProductsCount = products.filter((p) => p.shopId === shop._id).length;
                      return (
                        <tr key={shop._id}>
                          <td style={{ fontWeight: "700" }}>{shop.name}</td>
                          <td>📍 {shop.location}, {shop.city} ({shop.region})</td>
                          <td style={{ fontWeight: "700" }}>{shopProductsCount}</td>
                          <td>
                            <span className={`status-badge ${shop.verificationStatus}`}>
                              {shop.verificationStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </DashboardShell>
  );
}
