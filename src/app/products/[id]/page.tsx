"use client";

import { useEffect, useState, use } from "react";
import { ApiError, api } from "@/lib/api";
import type { Product, Review } from "@/lib/types";
import AppNav from "../../components/AppNav";
import { ShoppingBag, ArrowLeft, MessageSquare, Store, Star, Tractor, Heart, User, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../AuthContext";
import { useLanguage } from "../../LanguageContext";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const { lang, t } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState(lang === "en" ? "Loading details..." : "Chargement des détails...");
  const [cartMsg, setCartMsg] = useState("");
  const [cartMsgType, setCartMsgType] = useState<"success" | "error">("success");
  const [chatMsg, setChatMsg] = useState("");
  const [cartLoading, setCartLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Review inputs
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");

  useEffect(() => {
    if (status === "Loading details..." || status === "Chargement des détails...") {
      setStatus(lang === "en" ? "Loading details..." : "Chargement des détails...");
    }
  }, [lang, status]);

  useEffect(() => {
    setStatus(lang === "en" ? "Loading details..." : "Chargement des détails...");
    api
      .get<Product>(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setStatus("");
        
        // Fetch seller details
        if (res.data.ownerId) {
          api.get<any>(`/resources/users/${res.data.ownerId}`, token)
            .then((uRes) => setSeller(uRes.data))
            .catch(() => {});
        }
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : (lang === "en" ? "Error loading details" : "Erreur lors du chargement des détails")));

    api
      .get<Review[]>(`/reviews/product/${id}`)
      .then((res) => setReviews(res.data))
      .catch(() => {});
  }, [id, token, lang]);

  const handleAddToCart = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!product) return;

    setCartMsg("");
    setCartLoading(true);
    try {
      await api.create("/cart/items", { productId: id, quantity }, token);
      setCartMsgType("success");
      setCartMsg(lang === "en" ? "Product added to cart. You can review it in your cart." : "Produit ajouté au panier. Vous pouvez le vérifier dans votre panier.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      setCartMsgType("error");
      setCartMsg(err instanceof Error ? err.message : (lang === "en" ? "Failed to add to cart" : "Impossible d'ajouter au panier"));
    } finally {
      setCartLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    const sellerId = seller?._id ?? product?.ownerId;
    if (!sellerId) {
      setChatMsg(lang === "en" ? "Seller details are still loading. Try again in a moment." : "Les informations du vendeur chargent encore. Réessayez dans un instant.");
      return;
    }

    setChatMsg("");
    setChatLoading(true);
    try {
      const res = await api.create<any>("/conversations", {
        participantIds: [sellerId],
        subject: product?.name,
        relatedFarmId: product?.farmId,
        relatedShopId: product?.shopId
      }, token);
      router.push(`/dashboard/customer/messages?conversationId=${res.data._id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      setChatMsg(err instanceof Error ? err.message : (lang === "en" ? "Failed to start conversation" : "Impossible de démarrer la discussion"));
    } finally {
      setChatLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push("/login");
      return;
    }
    setReviewMsg("");
    try {
      const res = await api.create<Review>("/reviews", {
        productId: id,
        rating,
        comment
      }, token);
      setReviews((prev) => [res.data, ...prev]);
      setComment("");
      setReviewMsg(lang === "en" ? "Review posted!" : "Avis publié !");
    } catch (err) {
      setReviewMsg(err instanceof Error ? err.message : (lang === "en" ? "Failed to post review" : "Impossible de publier l'avis"));
    }
  };

  return (
    <main className="app-page">
      <AppNav />
      <div style={{ width: "var(--container)", margin: "32px auto" }}>
        <Link href="/marketplace" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--color-accent)", fontWeight: "600", marginBottom: "24px" }}>
          <ArrowLeft size={16} />
          {lang === "en" ? "Back to Marketplace" : "Retour au Marché"}
        </Link>

        {status && <div className="empty-state">{status}</div>}

        {product && (
          <div className="product-detail-layout-futuristic">
            {/* Left: General info, images, and descriptions */}
            <div className="glass-card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Product Gallery */}
              <div className="product-details-gallery">
                <div className="product-details-main-img-wrapper">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--emerald-600), var(--emerald-900))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShoppingBag size={64} style={{ color: "rgba(255,255,255,0.6)" }} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span className={`marketplace-card-badge ${product.productType === "farm_product" ? "farm" : "shop"}`} style={{ display: "inline-block", marginBottom: "12px" }}>
                  {product.productType === "farm_product" ? (lang === "en" ? "Farm Product" : "Produit de Ferme") : (lang === "en" ? "Shop Supply" : "Fourniture")}
                </span>
                <h1 style={{ fontSize: "2.2rem", fontWeight: "900", letterSpacing: "-0.5px", margin: 0, color: "var(--color-text)" }}>{product.name}</h1>
              </div>

              <div className="product-price" style={{ fontSize: "2.5rem" }}>
                {(product.price ?? 0).toLocaleString()} <span style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--color-text-secondary)" }}>XAF</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "700" }}>
                  {lang === "en" ? "DESCRIPTION" : "DESCRIPTION"}
                </span>
                <p style={{ color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
                  {product.description || (lang === "en" ? "No description provided." : "Aucune description fournie.")}
                </p>
              </div>

              {/* Add to Cart controller */}
              <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  <label style={{ fontWeight: "700", color: "var(--color-text)" }}>{lang === "en" ? "Quantity:" : "Quantité :"}</label>
                  <div style={{ display: "inline-flex", alignItems: "center", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px", overflow: "hidden", height: "40px" }}>
                    <button 
                      type="button" 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{ padding: "0 16px", border: "none", background: "none", color: "var(--color-text)", fontWeight: "800", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", height: "100%" }}
                    >
                      -
                    </button>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "40px", padding: "0 12px", height: "100%", fontWeight: "700", borderLeft: "1px solid var(--color-border-subtle)", borderRight: "1px solid var(--color-border-subtle)", color: "var(--color-text)" }}>
                      {quantity}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      style={{ padding: "0 16px", border: "none", background: "none", color: "var(--color-text)", fontWeight: "800", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", height: "100%" }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                    ({product.quantity} {product.unit} {lang === "en" ? "available" : "disponible"})
                  </span>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="auth-submit-btn marketplace-btn-glow"
                    style={{ margin: 0, flex: "1 1 220px", display: "flex", justifySelf: "center", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "10px", padding: "12px 24px", fontWeight: "700" }}
                    disabled={cartLoading || product.quantity <= 0}
                  >
                    <ShoppingBag size={18} />
                    {cartLoading ? (lang === "en" ? "Adding..." : "Ajout...") : t("market.detail.add_cart")}
                  </button>
                  {cartMsgType === "success" && cartMsg && (
                    <Link href="/dashboard/customer/cart" className="dash-primary-link" style={{ minHeight: "46px" }}>
                      {lang === "en" ? "View Cart" : "Voir le panier"}
                    </Link>
                  )}
                </div>

                {cartMsg && (
                  <p className={cartMsgType === "success" ? "form-success-banner" : "form-error-banner"} style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {cartMsgType === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {cartMsg}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Seller details and reviews */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Seller details card */}
              <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontWeight: "800", fontSize: "1.1rem" }}>{t("market.detail.seller")}</h3>
                {seller ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="user-avatar" style={{ width: "40px", height: "40px" }}>
                        <User size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: "700" }}>{seller.fullName}</h4>
                        <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{seller.email}</p>
                      </div>
                    </div>
                    {seller.phone && <p style={{ fontSize: "0.85rem" }}>☎ {seller.phone}</p>}
                    <button
                      type="button"
                      onClick={handleStartChat}
                      className="auth-submit-btn"
                      style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
                      disabled={chatLoading}
                    >
                      <MessageSquare size={16} />
                      {chatLoading ? (lang === "en" ? "Opening chat..." : "Ouverture...") : t("market.detail.chat")}
                    </button>
                    {chatMsg && (
                      <p className="form-error-banner" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={16} />
                        {chatMsg}
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "var(--color-text-secondary)" }}>{lang === "en" ? "Loading seller information..." : "Chargement des informations du vendeur..."}</p>
                )}
              </div>

              {/* Reviews box */}
              <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <h3 style={{ fontWeight: "800", fontSize: "1.1rem" }}>{t("market.detail.reviews")}</h3>

                {/* Add Review Form */}
                <form onSubmit={submitReview} className="connected-form" style={{ borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "20px" }}>
                  <div className="form-group">
                    <label>{t("market.detail.rating")}</label>
                    <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                      {[5, 4, 3, 2, 1].map((val) => (
                        <option key={val} value={val}>{val} ★</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{lang === "en" ? "Comment" : "Commentaire"}</label>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} required rows={3} placeholder={lang === "en" ? "Write a review..." : "Écrire un avis..."} style={{ padding: "10px" }} />
                  </div>
                  <button type="submit" className="auth-submit-btn" style={{ background: "var(--color-accent)", margin: 0 }}>
                    {lang === "en" ? "Post Review" : "Publier l'avis"}
                  </button>
                  {reviewMsg && <p className="form-success-banner" style={{ marginTop: "10px" }}>{reviewMsg}</p>}
                </form>

                {/* List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {reviews.length === 0 ? (
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", textAlign: "center" }}>
                      {lang === "en" ? "No reviews yet. Be the first!" : "Aucun avis pour le moment."}
                    </p>
                  ) : (
                    reviews.map((rev, index) => (
                      <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "700", fontSize: "0.85rem" }}>{lang === "en" ? "User" : "Utilisateur"}</span>
                          <span style={{ color: "var(--color-gold)", fontWeight: "800" }}>{"★".repeat(rev.rating)}</span>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
