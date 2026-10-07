"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle, Trash2, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PostMedia, { postMediaItems } from "../../components/PostMedia";
import type { PlatformPost } from "../page";
import { getRoleBadgeLabel } from "../platform-utils";
import CommentThread from "./CommentThread";

function timeAgo(dateStr: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return lang === "en" ? "just now" : "à l'instant";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === "en" ? `${m}m ago` : `il y a ${m}min`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === "en" ? `${h}h ago` : `il y a ${h}h`;
  }
  const d = Math.floor(diff / 86400);
  return lang === "en" ? `${d}d ago` : `il y a ${d}j`;
}

function hashtagify(text: string): React.ReactNode[] {
  const parts = text.split(/(#[\w-]+)/g);
  return parts.map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className="platform-post-hashtag">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function getUserId(user: any): string {
  return String(user?._id ?? user?.id ?? "");
}

type Props = {
  post: PlatformPost;
  currentUser: any;
  token: string | null | undefined;
  onDeleted: (id: string) => void;
};

export default function PostCard({ post, currentUser, token, onDeleted }: Props) {
  const lang = typeof window !== "undefined" && document.documentElement.lang === "fr" ? "fr" : "en";

  const [likes, setLikes] = useState<string[]>(post.likes);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shared, setShared] = useState(false);

  const currentUserId = getUserId(currentUser);
  const isLiked = Boolean(currentUserId && likes.map(String).includes(currentUserId));
  const isAuthor = Boolean(currentUserId && String(post.authorId._id) === currentUserId);
  const isAdmin = currentUser?.roles?.some((r: string) => ["admin", "super_admin"].includes(r));

  const authorInitial = post.authorId.fullName?.charAt(0).toUpperCase() ?? "?";

  const handleLike = async () => {
    if (!token || liking) return;
    setLiking(true);
    try {
      const res = await apiFetch<any>(`/platform/posts/${post._id}/like`, {
        method: "POST",
        token,
      });
      if (res.liked) {
        setLikes((prev) => (currentUserId ? Array.from(new Set([...prev.map(String), currentUserId])) : prev));
      } else {
        setLikes((prev) => prev.filter((id) => String(id) !== currentUserId));
      }
    } catch {}
    setLiking(false);
  };

  const handleDelete = async () => {
    if (!token || deleting) return;
    if (!confirm(lang === "en" ? "Delete this post?" : "Supprimer ce message ?")) return;
    setDeleting(true);
    try {
      await apiFetch(`/platform/posts/${post._id}`, { method: "DELETE", token });
      onDeleted(post._id);
    } catch {}
    setDeleting(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/platform?post=${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  const roleBadgeClass = `platform-role-badge role-${post.authorRole}`;

  return (
    <article className={`platform-post-card${post.isPinned ? " pinned" : ""}`}>
      {post.isPinned && (
        <div className="platform-post-pinned-label">{lang === "en" ? "Pinned" : "Épinglé"}</div>
      )}

      {/* Author row */}
      <div className="platform-post-author">
        <div className="platform-post-avatar">
          {post.authorId.avatar ? (
            <img src={post.authorId.avatar} alt={post.authorId.fullName} />
          ) : (
            <span>{authorInitial}</span>
          )}
        </div>
        <div className="platform-post-author-info">
          <strong>{post.authorId.fullName}</strong>
          <div className="platform-post-meta">
            <span className={roleBadgeClass}>
              {getRoleBadgeLabel(post.authorRole, lang)}
            </span>
            {post.authorId.city && (
              <span className="platform-post-city">{post.authorId.city}</span>
            )}
            <span className="platform-post-time">{timeAgo(post.createdAt, lang)}</span>
          </div>
        </div>

        {(isAuthor || isAdmin) && (
          <button
            className="platform-post-delete"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete post"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="platform-post-content">
        <p>{hashtagify(post.content)}</p>
      </div>

      {/* Media */}
      <PostMedia items={postMediaItems(post)} alt={post.authorId.fullName} />

      {/* Promoted product */}
      {post.productId && (
        <Link href={`/products/${post.productId._id}`} className="post-product-link">
          {post.productId.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.productId.images[0]} alt="" />
          )}
          <span>
            <strong>{post.productId.name}</strong>
            {post.productId.price !== undefined && (
              <small>
                {post.productId.price.toLocaleString()} FCFA{post.productId.unit ? ` / ${post.productId.unit}` : ""}
              </small>
            )}
          </span>
          <em>{lang === "en" ? "Buy" : "Acheter"}</em>
        </Link>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="platform-post-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="platform-post-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="platform-post-actions">
        <button
          className={`platform-action-btn${isLiked ? " liked" : ""}`}
          onClick={handleLike}
          disabled={!token || liking}
          aria-label="Like post"
        >
          <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
          <span>{likes.length}</span>
        </button>

        <button
          className="platform-action-btn"
          onClick={() => setShowComments((v) => !v)}
          aria-label="Toggle comments"
        >
          <MessageCircle size={17} />
          <span>{commentCount}</span>
          {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <button
          className={`platform-action-btn${shared ? " shared" : ""}`}
          onClick={handleShare}
          aria-label="Share post"
        >
          <Share2 size={17} />
          <span>{shared ? (lang === "en" ? "Copied!" : "Copié!") : lang === "en" ? "Share" : "Partager"}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentThread
          postId={post._id}
          currentUser={currentUser}
          token={token}
          onCommentAdded={() => setCommentCount((c) => c + 1)}
        />
      )}
    </article>
  );
}
