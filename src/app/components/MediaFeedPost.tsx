"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  Share2,
  ShoppingBag,
  Store,
  Tractor,
  Truck,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import CommentThread from "../platform/components/CommentThread";
import PostMedia, { type PostMediaItem, postMediaItems } from "./PostMedia";
import { useLanguage } from "../LanguageContext";

export type MediaPost = {
  _id: string;
  authorId: {
    _id: string;
    fullName: string;
    avatar?: string;
    roles: string[];
    city?: string;
    isVerified?: boolean;
  };
  authorRole: string;
  content: string;
  tags: string[];
  mediaUrls: string[];
  media?: PostMediaItem[];
  likes: string[];
  saves?: string[];
  commentCount: number;
  locationLabel?: string;
  productId?: {
    _id: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    images?: string[];
    farmId?: string;
    shopId?: string;
  } | null;
  farmId?: {
    _id: string;
    name: string;
    city?: string;
    region?: string;
    location?: string;
    verificationStatus?: string;
    pickupAvailable?: boolean;
    openingHours?: string;
    phone?: string;
  } | null;
  shopId?: {
    _id: string;
    name: string;
    city?: string;
    region?: string;
    location?: string;
    verificationStatus?: string;
    pickupAvailable?: boolean;
    openingHours?: string;
    phone?: string;
  } | null;
  createdAt: string;
};

function timeAgo(dateStr: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return lang === "en" ? "just now" : "à l'instant";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === "en" ? `${m}m` : `${m} min`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === "en" ? `${h}h` : `${h} h`;
  }
  const d = Math.floor(diff / 86400);
  return lang === "en" ? `${d}d` : `${d} j`;
}

type Props = {
  post: MediaPost;
  currentUserId?: string;
  token?: string | null;
  /** Needed to post comments; comments are read-only without it. */
  currentUser?: unknown;
};

export default function MediaFeedPost({ post, currentUserId, token, currentUser }: Props) {
  const { lang } = useLanguage();
  const [likes, setLikes] = useState((post.likes ?? []).map(String));
  const [saves, setSaves] = useState((post.saves ?? []).map(String));
  const [busy, setBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

  const liked = Boolean(currentUserId && likes.includes(currentUserId));
  const saved = Boolean(currentUserId && saves.includes(currentUserId));
  const seller = post.farmId || post.shopId;
  const place = seller
    ? [seller.city, seller.region].filter(Boolean).join(", ")
    : post.locationLabel || post.authorId.city || "";

  const mediaItems = postMediaItems(post);
  const fallbackImage = post.mediaUrls?.[0]
    || post.productId?.images?.[0]
    || (post.farmId ? "/images/seed/modern-poultry-farm.png" : "/images/seed/eggs-poultry-products.png");

  const profileHref = post.farmId
    ? `/farms/${post.farmId._id}`
    : post.shopId
      ? `/shops/${post.shopId._id}`
      : "/marketplace";

  const productHref = post.productId ? `/products/${post.productId._id}` : profileHref;

  const toggleLike = async () => {
    if (!token || !currentUserId || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch<{ liked: boolean }>(`/platform/posts/${post._id}/like`, {
        method: "POST",
        token,
      });
      setLikes((prev) =>
        res.liked ? Array.from(new Set([...prev, currentUserId])) : prev.filter((id) => id !== currentUserId)
      );
    } catch {}
    setBusy(false);
  };

  const toggleSave = async () => {
    if (!token || !currentUserId || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch<{ saved: boolean }>(`/platform/posts/${post._id}/save`, {
        method: "POST",
        token,
      });
      setSaves((prev) =>
        res.saved ? Array.from(new Set([...prev, currentUserId])) : prev.filter((id) => id !== currentUserId)
      );
    } catch {}
    setBusy(false);
  };

  const share = async () => {
    const url = `${window.location.origin}/dashboard/customer?post=${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  };

  return (
    <article className="media-post-card">
      <header className="media-post-card__head">
        <Link href={profileHref} className="media-post-card__author">
          <div className="media-post-card__avatar">
            {post.authorId.avatar ? (
              <img src={post.authorId.avatar} alt="" />
            ) : (
              <span>{post.authorId.fullName?.charAt(0) || "?"}</span>
            )}
          </div>
          <div>
            <strong>
              {seller?.name || post.authorId.fullName}
              {(post.authorId.isVerified || seller?.verificationStatus === "approved") && (
                <BadgeCheck size={15} className="media-verified" />
              )}
            </strong>
            <span>
              <MapPin size={12} /> {place || (lang === "en" ? "Nearby" : "À proximité")}
            </span>
          </div>
        </Link>
        <span className="media-post-card__time">{timeAgo(post.createdAt, lang)}</span>
      </header>

      {mediaItems.length > 0 ? (
        <PostMedia items={mediaItems} alt={post.authorId.fullName} />
      ) : (
        <div className="media-post-card__media">
          <img src={fallbackImage} alt="" />
        </div>
      )}

      <div className="media-post-card__actions">
        <button type="button" onClick={toggleLike} className={liked ? "is-on" : ""} aria-label="Like">
          <Heart size={20} fill={liked ? "currentColor" : "none"} />
          <span>{likes.length}</span>
        </button>
        <button
          type="button"
          aria-label={lang === "en" ? "Comments" : "Commentaires"}
          aria-expanded={showComments}
          className={showComments ? "is-on" : ""}
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageCircle size={20} />
          <span>{commentCount}</span>
        </button>
        <button type="button" onClick={share} aria-label="Share">
          <Share2 size={20} />
        </button>
        <button type="button" onClick={toggleSave} className={`media-save ${saved ? "is-on" : ""}`} aria-label="Save">
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <p className="media-post-card__caption">{post.content}</p>

      {showComments && (
        <div className="media-post-card__comments">
          <CommentThread
            postId={post._id}
            currentUser={currentUser}
            token={token}
            onCommentAdded={() => setCommentCount((count) => count + 1)}
          />
        </div>
      )}

      {post.productId && (
        <div className="media-product-card">
          <div className="media-product-card__info">
            <Package size={16} />
            <div>
              <strong>{post.productId.name}</strong>
              <span>
                {(post.productId.price ?? 0).toLocaleString()} FCFA / {post.productId.unit || "unit"}
              </span>
              <em>
                {(post.productId.quantity ?? 0).toLocaleString()} {post.productId.unit || "units"}{" "}
                {lang === "en" ? "available" : "disponibles"}
              </em>
            </div>
          </div>
          <div className="media-product-card__btns">
            <Link href={`${productHref}`} className="media-btn media-btn--primary">
              <ShoppingBag size={14} />
              {lang === "en" ? "Buy Now" : "Acheter"}
            </Link>
            <Link
              href={`/dashboard/customer/checkout?fulfillment=pickup&productId=${post.productId._id}`}
              className="media-btn"
            >
              <Store size={14} />
              {lang === "en" ? "Pickup" : "Retrait"}
            </Link>
            <Link href={profileHref} className="media-btn">
              {post.farmId ? <Tractor size={14} /> : <Store size={14} />}
              {post.farmId
                ? lang === "en"
                  ? "View Farm"
                  : "Voir ferme"
                : lang === "en"
                  ? "View Shop"
                  : "Voir boutique"}
            </Link>
          </div>
          {(seller?.pickupAvailable || seller?.openingHours) && (
            <p className="media-product-card__pickup">
              <Truck size={13} />
              {lang === "en" ? "Pickup" : "Retrait"}{" "}
              {seller?.pickupAvailable !== false
                ? lang === "en"
                  ? "available"
                  : "disponible"
                : lang === "en"
                  ? "unavailable"
                  : "indisponible"}
              {seller?.openingHours ? ` · ${seller.openingHours}` : " · 08:00 - 18:00"}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
