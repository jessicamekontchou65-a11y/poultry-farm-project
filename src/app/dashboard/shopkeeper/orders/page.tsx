"use client";

import { Fragment, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import { FileText, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function ShopkeeperOrdersPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await api.list<any>("/orders/seller", undefined, token);
      setOrders(res.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const updateStatus = async (orderId: string, nextStatus: string) => {
    if (!token) return;
    try {
      await api.update(`/orders/${orderId}/status`, {
        orderStatus: nextStatus
      }, token);
      
      // Update list
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: nextStatus } : o))
      );
    } catch (err) {}
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <DashboardShell>
      <p className="resource-kicker">{t("dash.sidebar.shopkeeper")}</p>
      <h1 style={{ marginBottom: "24px" }}>{lang === "en" ? "Incoming Customer Orders" : "Commandes Clients Reçues"}</h1>

      {loading ? (
        <p>{lang === "en" ? "Loading orders..." : "Chargement des commandes..."}</p>
      ) : orders.length === 0 ? (
        <div className="empty-state" style={{ padding: "40px" }}>
          <FileText size={48} style={{ color: "var(--color-text-muted)", marginBottom: "16px" }} />
          <p>{lang === "en" ? "No customer orders received yet." : "Aucune commande client reçue."}</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: "24px" }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>{t("order.number")}</th>
                  <th>Total</th>
                  <th>{t("order.payment")}</th>
                  <th>{t("order.status")}</th>
                  <th>{lang === "en" ? "Address" : "Adresse"}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order._id;
                  return (
                    <Fragment key={order._id}>
                      <tr style={{ cursor: "pointer" }} onClick={() => toggleExpand(order._id)}>
                        <td>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td style={{ fontWeight: "700" }}>{order.orderNumber}</td>
                        <td style={{ fontWeight: "700" }}>{(order.totalAmount ?? 0).toLocaleString()} XAF</td>
                        <td>
                          <span className={`status-badge ${order.paymentStatus}`}>
                            {order.paymentStatus === "pending" ? (lang === "en" ? "pending" : "en attente") : order.paymentStatus === "paid" ? (lang === "en" ? "paid" : "payé") : order.paymentStatus === "failed" ? (lang === "en" ? "failed" : "échoué") : order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${order.orderStatus}`}>
                            {order.orderStatus === "pending" ? (lang === "en" ? "pending" : "en attente") : order.orderStatus === "confirmed" ? (lang === "en" ? "confirmed" : "confirmé") : order.orderStatus === "processing" ? (lang === "en" ? "processing" : "en préparation") : order.orderStatus === "ready" ? (lang === "en" ? "ready" : "prêt") : order.orderStatus === "delivered" ? (lang === "en" ? "delivered" : "livré") : order.orderStatus === "rejected" ? (lang === "en" ? "rejected" : "rejeté") : order.orderStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                          {order.deliveryAddress || (lang === "en" ? "Pickup at source" : "Retrait sur place")}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {order.orderStatus === "pending" && (
                              <>
                                <button
                                  onClick={() => updateStatus(order._id, "confirmed")}
                                  className="status-badge approved"
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", border: "none", cursor: "pointer" }}
                                >
                                  <CheckCircle size={12} />
                                  {t("order.confirm")}
                                </button>
                                <button
                                  onClick={() => updateStatus(order._id, "rejected")}
                                  className="status-badge rejected"
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", border: "none", cursor: "pointer" }}
                                >
                                  <XCircle size={12} />
                                  {t("order.reject")}
                                </button>
                              </>
                            )}

                            {order.orderStatus === "confirmed" && (
                              <button
                                onClick={() => updateStatus(order._id, "processing")}
                                className="status-badge pending"
                                style={{ border: "none", cursor: "pointer" }}
                              >
                                {lang === "en" ? "Start Processing" : "Démarrer Préparation"}
                              </button>
                            )}

                            {order.orderStatus === "processing" && (
                              <button
                                onClick={() => updateStatus(order._id, "ready")}
                                className="status-badge approved"
                                style={{ border: "none", cursor: "pointer" }}
                              >
                                {t("order.complete")}
                              </button>
                            )}

                            {order.orderStatus === "ready" && (
                              <button
                                onClick={() => updateStatus(order._id, "delivered")}
                                className="status-badge approved"
                                style={{ background: "var(--color-accent)", color: "var(--white)", border: "none", cursor: "pointer" }}
                              >
                                {lang === "en" ? "Mark Delivered" : "Marquer Livré"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${order._id}-details`}>
                          <td></td>
                          <td colSpan={6} style={{ background: "var(--color-bg-elevated)", padding: "20px", borderRadius: "8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                              <h4 style={{ fontWeight: "800", color: "var(--color-accent)", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "6px", margin: 0 }}>
                                {t("order.items_title")}
                              </h4>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {order.items?.map((item: any, idx: number) => (
                                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", borderBottom: "1px dashed var(--color-border-subtle)", paddingBottom: "6px" }}>
                                    <span>
                                      <strong>{item.productNameSnapshot}</strong> x {item.quantity}
                                    </span>
                                    <span style={{ fontWeight: "700" }}>
                                      {((item.unitPriceSnapshot ?? 0) * (item.quantity ?? 0)).toLocaleString()} XAF
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.85rem", color: "var(--color-text-secondary)", flexWrap: "wrap", gap: "8px" }}>
                                <span>{lang === "en" ? "Delivery Method:" : "Méthode de livraison :"} <strong>{order.deliveryMethod}</strong></span>
                                <span>{lang === "en" ? "Delivery Fee:" : "Frais de port :"} <strong>{order.deliveryFee} XAF</strong></span>
                                <span>{lang === "en" ? "Total Revenue:" : "Total Revenu :"} <strong>{order.totalAmount} XAF</strong></span>
                              </div>
                              {order.notes && (
                                <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                                  <strong>{lang === "en" ? "Customer Notes:" : "Notes client :"}</strong> {order.notes}
                                </div>
                              )}
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
        </div>
      )}
    </DashboardShell>
  );
}
