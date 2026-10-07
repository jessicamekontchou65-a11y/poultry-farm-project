"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import Link from "next/link";
import { CheckCircle, CreditCard, MapPin, Package, Truck } from "lucide-react";

const DELIVERY_FEE = 1000;
const MOBILE_MONEY_METHODS = ["mtn_mobile_money", "orange_money"];
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

type OrderPayment = {
  state: "waiting" | "paid" | "failed" | "submitted" | "error";
  paymentId?: string;
  ussdCode?: string;
  message?: string;
};

export default function CheckoutPage() {
  const { token, user } = useAuth();
  const { lang, t } = useLanguage();

  const [cart, setCart] = useState<any>(null);
  const [wantsDelivery, setWantsDelivery] = useState<boolean | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState("pickup_at_shop");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn_mobile_money");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [createdOrders, setCreatedOrders] = useState<any[] | null>(null);
  const [payerPhone, setPayerPhone] = useState("");
  const [payments, setPayments] = useState<Record<string, OrderPayment>>({});
  const pollTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMobileMoney = MOBILE_MONEY_METHODS.includes(paymentMethod);

  useEffect(() => {
    if (user?.phone) setPayerPhone((current) => current || user.phone || "");
  }, [user]);

  useEffect(() => () => pollTimers.current.forEach(clearTimeout), []);

  const setOrderPayment = (orderId: string, next: OrderPayment) =>
    setPayments((prev) => ({ ...prev, [orderId]: next }));

  useEffect(() => {
    if (!token) return;
    api.get<any>("/cart", token).then((res) => {
      setCart(res.data);
    });

    if (user?._id || user?.id) {
      api.get<any>(`/resources/users/${user._id || user.id}`, token).then((res) => {
        setDeliveryAddress(res.data.address || "");
      }).catch(() => {});
    }
  }, [token, user]);

  const deliveryFee = wantsDelivery === true ? DELIVERY_FEE : 0;
  const effectiveDeliveryMethod =
    wantsDelivery === true ? "home_delivery" : deliveryMethod;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !cart || cart.items.length === 0) return;

    if (wantsDelivery === null) {
      setError(
        lang === "en"
          ? "Please tell us if you want delivery before placing your order."
          : "Indiquez si vous souhaitez une livraison avant de commander."
      );
      return;
    }

    if (wantsDelivery && !deliveryAddress.trim()) {
      setError(
        lang === "en"
          ? "Please enter your delivery address."
          : "Veuillez saisir votre adresse de livraison."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.create<any[]>(
        "/orders",
        {
          deliveryMethod: effectiveDeliveryMethod,
          deliveryAddress: wantsDelivery ? deliveryAddress : "",
          notes,
          deliveryFee
        },
        token
      );

      setCreatedOrders(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const pollPayment = (orderId: string, paymentId: string, startedAt: number) => {
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<any>(`/payments/campay/status/${paymentId}`, token);
        if (res.data.status === "paid") {
          setOrderPayment(orderId, { state: "paid", paymentId });
          return;
        }
        if (res.data.status === "failed") {
          setOrderPayment(orderId, {
            state: "failed",
            paymentId,
            message: lang === "en" ? "Payment was declined or cancelled." : "Paiement refusé ou annulé."
          });
          return;
        }
      } catch {
        // Transient error: keep polling until the timeout.
      }
      if (Date.now() - startedAt < POLL_TIMEOUT_MS) {
        pollPayment(orderId, paymentId, startedAt);
      } else {
        setOrderPayment(orderId, {
          state: "failed",
          paymentId,
          message:
            lang === "en"
              ? "No confirmation received. You can try again."
              : "Aucune confirmation reçue. Vous pouvez réessayer."
        });
      }
    }, POLL_INTERVAL_MS);
    pollTimers.current.push(timer);
  };

  const handlePay = async (orderId: string) => {
    if (!token) return;
    try {
      if (isMobileMoney) {
        const res = await api.create<any>(
          "/payments/campay/initiate",
          { orderId, paymentMethod, phone: payerPhone },
          token
        );
        setOrderPayment(orderId, {
          state: "waiting",
          paymentId: res.data._id,
          ussdCode: res.data.providerResponse?.ussdCode
        });
        pollPayment(orderId, res.data._id, Date.now());
        return;
      }

      await api.create("/payments/initiate", { orderId, paymentMethod }, token);
      setOrderPayment(orderId, { state: "submitted" });
    } catch (err) {
      setOrderPayment(orderId, {
        state: "error",
        message: err instanceof Error ? err.message : lang === "en" ? "Payment failed" : "Échec du paiement"
      });
    }
  };

  if (createdOrders) {
    return (
      <DashboardShell>
        <div className="dash-complete">
          <div className="dash-complete__icon">
            <CheckCircle size={34} />
          </div>
          <h1>{lang === "en" ? "Order Placed Successfully!" : "Commande Validée !"}</h1>
          <p>
            {lang === "en"
              ? "Your orders have been successfully created and sent to the respective sellers."
              : "Vos commandes ont été créées et envoyées aux vendeurs concernés."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
            {createdOrders.map((order: any) => (
              <div key={order._id} className="glass-card" style={{ padding: "20px", textAlign: "left" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontWeight: "700",
                  }}
                >
                  <span>{order.orderNumber}</span>
                  <span style={{ color: "var(--color-accent)" }}>
                    {(order.totalAmount ?? 0).toLocaleString()} XAF
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                  Status: <span className="status-badge pending">{order.orderStatus}</span>
                </p>

                {isMobileMoney && order.paymentStatus === "unpaid" && !payments[order._id] && (
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label>{lang === "en" ? "Mobile money number" : "Numéro mobile money"}</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      placeholder="6XXXXXXXX"
                    />
                  </div>
                )}

                {order.paymentStatus === "unpaid" &&
                  (!payments[order._id] || ["failed", "error"].includes(payments[order._id].state)) && (
                  <button
                    onClick={() => handlePay(order._id)}
                    className="auth-submit-btn"
                    style={{
                      background: "var(--color-gold)",
                      color: "var(--charcoal-900)",
                      marginTop: "16px",
                      marginInline: 0,
                    }}
                  >
                    <CreditCard size={16} style={{ marginRight: "8px", display: "inline" }} />
                    {lang === "en"
                      ? `Pay with ${paymentMethod.replace(/_/g, " ").toUpperCase()}`
                      : `Payer par ${paymentMethod.replace(/_/g, " ").toUpperCase()}`}
                  </button>
                )}

                {payments[order._id]?.state === "waiting" && (
                  <div className="form-success-banner" style={{ marginTop: "12px" }}>
                    {lang === "en"
                      ? "Confirm the payment on your phone (enter your mobile money PIN). Waiting for confirmation…"
                      : "Confirmez le paiement sur votre téléphone (saisissez votre code mobile money). En attente de confirmation…"}
                    {payments[order._id].ussdCode && (
                      <div style={{ marginTop: 6 }}>
                        {lang === "en" ? "No prompt? Dial " : "Pas de notification ? Composez "}
                        <strong>{payments[order._id].ussdCode}</strong>
                      </div>
                    )}
                  </div>
                )}

                {payments[order._id]?.state === "paid" && (
                  <div className="form-success-banner" style={{ marginTop: "12px" }}>
                    {lang === "en" ? "Payment received. Thank you!" : "Paiement reçu. Merci !"}
                  </div>
                )}

                {payments[order._id]?.state === "submitted" && (
                  <div className="form-success-banner" style={{ marginTop: "12px" }}>
                    {lang === "en"
                      ? "Payment method recorded. The seller will confirm."
                      : "Mode de paiement enregistré. Le vendeur confirmera."}
                  </div>
                )}

                {["failed", "error"].includes(payments[order._id]?.state ?? "") && (
                  <p className="form-error-banner" style={{ marginTop: "12px" }}>
                    {payments[order._id].message}
                  </p>
                )}
              </div>
            ))}
          </div>

          <Link href="/dashboard/customer" className="auth-submit-btn" style={{ textDecoration: "none" }}>
            {lang === "en" ? "Go to Dashboard" : "Aller au tableau de bord"}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  if (cart && cart.items.length === 0) {
    return (
      <DashboardShell>
        <div className="dash-complete">
          <div className="dash-complete__icon">
            <Package size={34} />
          </div>
          <h1>{lang === "en" ? "Your cart is empty" : "Votre panier est vide"}</h1>
          <p>
            {lang === "en"
              ? "Add products from the marketplace, then come back here to place your order."
              : "Ajoutez des produits depuis le marché, puis revenez ici pour commander."}
          </p>
          <Link href="/marketplace" className="auth-submit-btn" style={{ textDecoration: "none" }}>
            {lang === "en" ? "Browse the marketplace" : "Parcourir le marché"}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="dash-page">
        <div className="dash-page-head">
          <div>
            <p className="resource-kicker">{t("cart.title")}</p>
            <h1>{t("checkout.title")}</h1>
            <p>
              {lang === "en"
                ? "Choose delivery first, then confirm payment and place your order."
                : "Choisissez d'abord la livraison, puis confirmez le paiement et validez."}
            </p>
          </div>
          <div className="dash-page-head__icon">
            <CreditCard size={24} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="connected-form dash-checkout-grid">
          <div className="dash-panel dash-form-panel">
            <h3
              style={{
                fontWeight: "700",
                borderBottom: "1px solid var(--color-border-subtle)",
                paddingBottom: "8px",
              }}
            >
              {lang === "en" ? "Do you want delivery?" : "Souhaitez-vous une livraison ?"}
            </h3>

            <p className="checkout-delivery-prompt">
              <Truck size={16} />
              {lang === "en"
                ? "Home delivery adds a fixed fee of 1,000 XAF. Only choose Yes if you need it."
                : "La livraison à domicile ajoute des frais fixes de 1 000 XAF. Choisissez Oui uniquement si vous en avez besoin."}
            </p>

            <div className="checkout-delivery-choice">
              <button
                type="button"
                className={`checkout-choice-btn ${wantsDelivery === true ? "is-active" : ""}`}
                aria-pressed={wantsDelivery === true}
                onClick={() => {
                  setWantsDelivery(true);
                  setDeliveryMethod("home_delivery");
                  setError("");
                }}
              >
                <Truck size={18} />
                <strong>{lang === "en" ? "Yes, deliver to me" : "Oui, livrez-moi"}</strong>
                <span>+1,000 XAF</span>
              </button>
              <button
                type="button"
                className={`checkout-choice-btn ${wantsDelivery === false ? "is-active" : ""}`}
                aria-pressed={wantsDelivery === false}
                onClick={() => {
                  setWantsDelivery(false);
                  setDeliveryMethod("pickup_at_shop");
                  setError("");
                }}
              >
                <Package size={18} />
                <strong>{lang === "en" ? "No, I will pick up" : "Non, je retire moi-même"}</strong>
                <span>0 XAF</span>
              </button>
            </div>

            {wantsDelivery === true && (
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>
                  <MapPin size={14} style={{ display: "inline", marginRight: 6 }} />
                  {t("checkout.address")}
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street Address, City"
                  required
                />
              </div>
            )}

            {wantsDelivery === false && (
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>{lang === "en" ? "Pickup location" : "Lieu de retrait"}</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                >
                  <option value="pickup_at_farm">
                    {lang === "en" ? "Pickup at Farm" : "Retrait à la Ferme"}
                  </option>
                  <option value="pickup_at_shop">
                    {lang === "en" ? "Pickup at Shop" : "Retrait en Boutique"}
                  </option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>{t("checkout.notes")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Gate code, instructions..."
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="dash-panel dash-form-panel">
              <h3
                style={{
                  fontWeight: "700",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  paddingBottom: "8px",
                }}
              >
                {t("checkout.pay_method")}
              </h3>

              <div className="form-group">
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="mtn_mobile_money">MTN Mobile Money</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="cash_on_delivery">
                    {lang === "en" ? "Cash on Delivery" : "Paiement à la livraison"}
                  </option>
                  <option value="bank_transfer">
                    {lang === "en" ? "Bank Transfer" : "Virement Bancaire"}
                  </option>
                </select>
              </div>
            </div>

            <div className="dash-panel dash-form-panel">
              <h3
                style={{
                  fontWeight: "700",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  paddingBottom: "8px",
                }}
              >
                {lang === "en" ? "Order Summary" : "Résumé de la commande"}
              </h3>

              {cart && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {cart.items.map((item: any) => (
                    <div
                      key={item._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        color: "var(--color-text-secondary)",
                        gap: "12px",
                      }}
                    >
                      <span>
                        {item.productNameSnapshot} x {item.quantity}
                      </span>
                      <span>
                        {((item.unitPriceSnapshot ?? 0) * (item.quantity ?? 0)).toLocaleString()} XAF
                      </span>
                    </div>
                  ))}

                  <div
                    style={{
                      borderTop: "1px solid var(--color-border-subtle)",
                      paddingTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        gap: "12px",
                      }}
                    >
                      <span>{t("cart.subtotal")}</span>
                      <span>{(cart.subtotal ?? 0).toLocaleString()} XAF</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        gap: "12px",
                      }}
                    >
                      <span>{lang === "en" ? "Delivery Fee" : "Frais de livraison"}</span>
                      <span>
                        {wantsDelivery === true
                          ? "1,000 XAF"
                          : wantsDelivery === false
                            ? "0 XAF"
                            : lang === "en"
                              ? "Choose above"
                              : "À choisir"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "1.1rem",
                        fontWeight: "800",
                        borderTop: "1px solid var(--color-border-subtle)",
                        paddingTop: "8px",
                        gap: "12px",
                      }}
                    >
                      <span>Total</span>
                      <span>
                        {((cart.subtotal ?? 0) + deliveryFee).toLocaleString()} XAF
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                style={{ background: "var(--color-accent)", marginInline: 0 }}
                disabled={loading || wantsDelivery === null}
              >
                {loading
                  ? lang === "en"
                    ? "Processing..."
                    : "Traitement en cours..."
                  : t("checkout.place_order")}
              </button>

              {error && <p className="form-error-banner">{error}</p>}
            </div>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
