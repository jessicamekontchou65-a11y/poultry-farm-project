"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Send, Trash2 } from "lucide-react";
import type { PlatformComment } from "../page";
import { getRoleBadgeLabel } from "../platform-utils";

function timeAgo(dateStr: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return lang === "en" ? "just now" : "à l'instant";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === "en" ? `${m}m ago` : `il y a ${m}min`;
  }
  const h = Math.floor(diff / 3600);
  if (h < 24) return lang === "en" ? `${h}h ago` : `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return lang === "en" ? `${d}d ago` : `il y a ${d}j`;
}

function getUserId(user: any): string {
  return String(user?._id ?? user?.id ?? "");
}

type Props = {
  postId: string;
  currentUser: any;
  token: string | null | undefined;
  onCommentAdded: () => void;
};

export default function CommentThread({ postId, currentUser, token, onCommentAdded }: Props) {
  const lang = typeof window !== "undefined" && document.documentElement.lang === "fr" ? "fr" : "en";

  const [comments, setComments] = useState<PlatformComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await apiFetch<any>(`/platform/posts/${postId}/comments`, { method: "GET" });
        setComments(res.data ?? []);
      } catch {}
      setLoading(false);
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async () => {
    if (!token || !newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const body: any = { content: newComment.trim() };
      if (replyTo) body.parentCommentId = replyTo;

      const comment = await apiFetch<PlatformComment>(`/platform/posts/${postId}/comments`, {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      setReplyTo(null);
      onCommentAdded();
    } catch {}
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!token) return;
    try {
      await apiFetch(`/platform/comments/${commentId}`, { method: "DELETE", token });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {}
  };

  // Group into top-level and replies
  const topLevel = comments.filter((c) => !c.parentCommentId);
  const replies = (parentId: string) => comments.filter((c) => c.parentCommentId === parentId);

  const renderComment = (comment: PlatformComment, isReply = false) => {
    const isAuthor = Boolean(getUserId(currentUser) && String(comment.authorId._id) === getUserId(currentUser));
    const isAdmin = currentUser?.roles?.some((r: string) => ["admin", "super_admin"].includes(r));
    const initial = comment.authorId.fullName?.charAt(0).toUpperCase() ?? "?";

    return (
      <div key={comment._id} className={`comment-item${isReply ? " comment-reply" : ""}`}>
        <div className="comment-avatar">
          {comment.authorId.avatar ? (
            <img src={comment.authorId.avatar} alt={comment.authorId.fullName} />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="comment-body">
          <div className="comment-header">
            <strong>{comment.authorId.fullName}</strong>
            <span className={`platform-role-badge role-${comment.authorId.roles?.[0] ?? "customer"} badge-sm`}>
              {getRoleBadgeLabel(comment.authorId.roles?.[0] ?? "customer", lang)}
            </span>
            <span className="comment-time">{timeAgo(comment.createdAt, lang)}</span>
          </div>
          <p className="comment-text">{comment.content}</p>
          <div className="comment-actions-row">
            {token && !isReply && (
              <button
                className="comment-reply-btn"
                onClick={() => setReplyTo(comment._id === replyTo ? null : comment._id)}
              >
                {replyTo === comment._id
                  ? lang === "en" ? "Cancel" : "Annuler"
                  : lang === "en" ? "Reply" : "Répondre"}
              </button>
            )}
            {(isAuthor || isAdmin) && (
              <button
                className="comment-delete-btn"
                onClick={() => handleDelete(comment._id)}
                aria-label="Delete comment"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* Reply composer */}
          {replyTo === comment._id && (
            <div className="comment-reply-composer">
              <input
                type="text"
                className="comment-input"
                placeholder={lang === "en" ? `Reply to ${comment.authorId.fullName}...` : `Répondre à ${comment.authorId.fullName}...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                maxLength={1000}
              />
              <button className="comment-submit-btn" onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
                <Send size={14} />
              </button>
            </div>
          )}

          {/* Nested replies */}
          {replies(comment._id).map((r) => renderComment(r, true))}
        </div>
      </div>
    );
  };

  return (
    <div className="comment-thread">
      {/* Top-level comment input (shown when not replying) */}
      {token && !replyTo && (
        <div className="comment-composer">
          <div className="comment-composer-avatar">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.fullName} />
            ) : (
              <span>{currentUser?.fullName?.charAt(0).toUpperCase() ?? "?"}</span>
            )}
          </div>
          <input
            type="text"
            className="comment-input"
            placeholder={lang === "en" ? "Write a comment..." : "Écrire un commentaire..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={1000}
          />
          <button
            className="comment-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
          >
            <Send size={15} />
          </button>
        </div>
      )}

      {/* Comments list */}
      <div className="comment-list">
        {loading ? (
          <div className="comment-loading">
            {lang === "en" ? "Loading comments..." : "Chargement des commentaires..."}
          </div>
        ) : topLevel.length === 0 ? (
          <p className="comment-empty">
            {lang === "en" ? "No comments yet. Be first!" : "Aucun commentaire pour l'instant."}
          </p>
        ) : (
          topLevel.map((c) => renderComment(c))
        )}
      </div>
    </div>
  );
}
