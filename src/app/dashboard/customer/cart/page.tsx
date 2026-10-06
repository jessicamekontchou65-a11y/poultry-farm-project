"use client";

import { useEffect, useState } from "react";
import { api, apiFetch } from "@/lib/api";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await api.get<any>("/cart", token);
      setCart(res.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const updateQuantity = async (itemId: string, qty: number) => {
    if (!token) return;
    try {
      const res = await api.update<any>(`/cart/items/${itemId}`, { quantity: qty }, token);
      setCart(res.data);
    } catch (err) {}
  };

  const removeItem = async (itemId: string) => {
    if (!token) return;
    try {
      const res = await apiFetch<any>(`/cart/items/${itemId}`, {
        token,
        method: "DELETE"
      });
      setCart(res.data);
    } catch (err) {}
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      const res = await apiFetch<any>("/cart", {
        token,
        method: "DELETE"
      });
      setCart(res.data);
    } catch (err) {}
  };

  return (
    <DashboardShell>
      <div className="dash-page dash-page--narrow">
        <div className="dash-page-head">
          <div>
            <p className="resource-kicker">{t("nav.marketplace")}</p>
            <h1>{t("cart.title")}</h1>
            <p>{lang === "en" ? "Review your selected poultry products and supplies before checkout." : "Vérifiez vos produits et fournitures avicoles avant le paiement."}</p>
          </div>
          <div className="dash-page-head__icon">
            <ShoppingBag size={24} />
          </div>
        </div>

        {loading ? (
          <p>{lang === "en" ? "Loading cart..." : "Chargement du panier..."}</p>
        ) : !cart || !cart.items || cart.items.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
            <ShoppingBag size={48} style={{ color: "var(--color-text-muted)", marginBottom: "16px" }} />
            <p>{lang === "en" ? "Your cart is empty." : "Votre panier est vide."}</p>
            <Link href="/marketplace" className="auth-submit-btn" style={{ display: "inline-block", marginTop: "16px", textDecoration: "none" }}>
              {t("hero.cta_secondary")}
            </Link>
          </div>
        ) : (
          <div className="dash-stack">
            <div className="dash-panel">
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("product.create.name")}</th>
                      <th>{lang === "en" ? "Price" : "Prix"}</th>
                      <th>{lang === "en" ? "Qty" : "Qté"}</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map((item: any) => (
                      <tr key={item._id}>
                        <td style={{ fontWeight: "700" }}>{item.productNameSnapshot}</td>
                        <td>{(item.unitPriceSnapshot ?? 0).toLocaleString()} XAF</td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item._id, Math.max(1, Number(e.target.value)))}
                            style={{ width: "60px", padding: "6px", borderRadius: "4px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
                          />
                        </td>
                        <td>{((item.unitPriceSnapshot ?? 0) * (item.quantity ?? 0)).toLocaleString()} XAF</td>
                        <td>
                          <button onClick={() => removeItem(item._id)} style={{ color: "#ef4444" }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dash-total-row">
                <button onClick={clearCart} className="dash-danger-btn">
                  {lang === "en" ? "Clear Cart" : "Vider le panier"}
                </button>
                <div className="dash-total-row__amount">
                  <span>{t("cart.subtotal")}</span>
                  <p>
                    {(cart.subtotal ?? 0).toLocaleString()} XAF
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/dashboard/customer/checkout" className="dash-primary-link">
                {t("cart.checkout")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
