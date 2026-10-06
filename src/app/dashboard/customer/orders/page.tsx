"use client";

import { Fragment, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import CustomerBottomNav from "../../../components/CustomerBottomNav";
import { ClipboardList, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export default function CustomerOrdersPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await api.list<any>("/orders/my", undefined, token);
      setOrders(res.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleCancelOrder = async (orderId: string) => {
    if (!token) return;
    try {
      await api.update(`/orders/${orderId}/cancel`, {}, token);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: "cancelled" } : o))
      );
    } catch (err) {}
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const steps = ["pending", "confirmed", "processing", "ready", "delivered"];
  const stepLabelsEn = ["Pending", "Confirmed", "Processing", "Ready", "Delivered"];
  const stepLabelsFr = ["En attente", "Confirmé", "Préparation", "Prêt", "Livré"];

  return (
    <DashboardShell mediaMode>
      <div className="dash-page">
        <div className="dash-page-head">
          <div>
            <p className="resource-kicker">{t("dash.sidebar.customer")}</p>
            <h1>{lang === "en" ? "My Purchases & Orders" : "Mes Commandes & Achats"}</h1>
            <p>
              {lang === "en"
                ? "Track delivery and pickup orders from confirmation to completion."
                : "Suivez livraisons et retraits de la confirmation à la finalisation."}
            </p>
          </div>
          <div className="dash-page-head__icon">
            <ClipboardList size={24} />
          </div>
        </div>

        {loading ? (
          <p>{lang === "en" ? "Loading orders..." : "Chargement des commandes..."}</p>
        ) : orders.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty__icon"><ClipboardList size={24} /></div>
            <p className="dash-empty__text">{lang === "en" ? "You have not made any purchases yet." : "Vous n'avez pas encore passé de commande."}</p>
          </div>
        ) : (
        <div className="dash-panel">
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order._id;
                  const isTerminated = ["cancelled", "rejected"].includes(order.orderStatus);
                  const currentIndex = steps.indexOf(order.orderStatus);

                  return (
                    <Fragment key={order._id}>
                      <tr style={{ cursor: "pointer" }} onClick={() => toggleExpand(order._id)}>
                        <td>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td style={{ fontWeight: "700" }}>{order.orderNumber}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: "700" }}>{(order.totalAmount ?? 0).toLocaleString()} XAF</td>
                        <td>
                          <span className={`status-badge ${order.paymentStatus}`}>{order.paymentStatus}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${order.orderStatus}`}>{order.orderStatus}</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {order.orderStatus === "pending" && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="status-badge rejected"
                              style={{ border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <Trash2 size={12} />
                              {lang === "en" ? "Cancel Order" : "Annuler"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${order._id}-details`}>
                          <td></td>
                          <td colSpan={6} style={{ background: "var(--color-bg-elevated)", padding: "20px", borderRadius: "8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                                {order.fulfillmentMethod === "pickup" && (
                                  <span>
                                    {lang === "en" ? "Pickup status:" : "Statut retrait :"}{" "}
                                    <strong>{order.pickupStatus || "pending"}</strong>
                                  </span>
                                )}
                                <span>{lang === "en" ? "Delivery Fee:" : "Frais de port :"} <strong>{order.deliveryFee} XAF</strong></span>
                                <span>{lang === "en" ? "Total amount paid:" : "Montant total payé :"} <strong>{order.totalAmount} XAF</strong></span>
                              </div>
                              {order.notes && (
                                <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                                  <strong>{lang === "en" ? "Notes for seller:" : "Notes pour le vendeur :"}</strong> {order.notes}
                                </div>
                              )}

                              {/* Visual tracker progress */}
                              <div style={{ marginTop: "12px" }}>
                                <h5 style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", marginBottom: "12px", textTransform: "uppercase" }}>
                                  {lang === "en" ? "Order Delivery Progress" : "Suivi de livraison de la commande"}
                                </h5>

                                {isTerminated ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.06)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                                    <span style={{ fontWeight: "700", color: "#ef4444", fontSize: "0.82rem" }}>
                                      {lang === "en" 
                                        ? `This order was ${order.orderStatus}.` 
                                        : `Cette commande a été ${order.orderStatus === "cancelled" ? "annulée" : "rejetée"}.`
                                      }
                                    </span>
                                  </div>
                                ) : (
                                  <div className="order-stepper" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", margin: "16px 0", padding: "0 12px" }}>
                                    {/* Connecting Line */}
                                    <div style={{ position: "absolute", top: "12px", left: "6%", right: "6%", height: "4px", background: "var(--color-border)", zIndex: 1 }} />
                                    <div style={{ position: "absolute", top: "12px", left: "6%", width: `${(currentIndex / (steps.length - 1)) * 88}%`, height: "4px", background: "var(--color-accent)", zIndex: 1, transition: "width 0.3s ease" }} />

                                    {/* Steps */}
                                    {steps.map((step, idx) => {
                                      const isPastOrCurrent = idx <= currentIndex;
                                      const isCurrent = idx === currentIndex;
                                      const label = lang === "en" ? stepLabelsEn[idx] : stepLabelsFr[idx];
                                      return (
                                        <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, position: "relative" }}>
                                          <div style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background: isPastOrCurrent ? "var(--color-accent)" : "var(--color-bg-elevated)",
                                            border: `3px solid ${isPastOrCurrent ? "var(--color-accent)" : "var(--color-border)"}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: isPastOrCurrent ? "white" : "var(--color-text-muted)",
                                            fontSize: "0.7rem",
                                            fontWeight: "800"
                                          }}>
                                            {isPastOrCurrent ? "✓" : idx + 1}
                                          </div>
                                          <span style={{ fontSize: "0.72rem", fontWeight: isCurrent ? "800" : "600", color: isCurrent ? "var(--color-accent)" : "var(--color-text-secondary)", marginTop: "6px" }}>
                                            {label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
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
        </div>
        )}
      </div>
      <CustomerBottomNav />
    </DashboardShell>
  );
}
