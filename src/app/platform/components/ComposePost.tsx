"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, api, uploadMedia, type UploadedMedia } from "@/lib/api";
import { BarChart3, HelpCircle, ImagePlus, Megaphone, Package, Send, Tag, Video, X } from "lucide-react";
import { useLanguage } from "../../LanguageContext";
import type { PlatformPost } from "../page";

const MAX_FILES = 4;
const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 50;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm";

type Attachment = {
  id: string;
  file: File;
  preview: string;
  kind: "image" | "video";
  progress: number;
  status: "uploading" | "done" | "error";
  uploaded?: UploadedMedia;
  error?: string;
};

const ALL_TAGS = [
  "broiler", "layer", "chick", "egg", "local-chicken",
  "disease", "vaccination", "feed", "market-prices",
  "business", "tips", "news", "question", "general",
];

const STARTERS = [
  {
    tag: "question",
    icon: HelpCircle,
    en: "Ask the network",
    fr: "Question au réseau",
    textEn: "I need advice on ",
    textFr: "J'ai besoin de conseils sur ",
  },
  {
    tag: "disease",
    icon: Megaphone,
    en: "Share an alert",
    fr: "Partager une alerte",
    textEn: "Field alert: ",
    textFr: "Alerte terrain : ",
  },
  {
    tag: "market-prices",
    icon: BarChart3,
    en: "Market signal",
    fr: "Signal du marché",
    textEn: "Market update: ",
    textFr: "Mise à jour du marché : ",
  },
];

type Props = {
  token: string;
  user: any;
  onPostCreated: (post: PlatformPost) => void;
  /** Pre-selects one of the seller's products (e.g. from "Promote" on the products page). */
  initialProductId?: string;
};

type MyProduct = { _id: string; name: string; price?: number; unit?: string };

export default function ComposePost({ token, user, onPostCreated, initialProductId }: Props) {
  const { lang } = useLanguage();
  const en = lang === "en";
  const roles: string[] = user?.roles ?? [];
  const isSeller = roles.some((r) => ["farmer", "shopkeeper", "admin", "super_admin"].includes(r));

  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [products, setProducts] = useState<MyProduct[]>([]);
  const [productId, setProductId] = useState(initialProductId ?? "");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);

  const MAX_CHARS = 2000;
  const charLeft = MAX_CHARS - content.length;
  const uploading = attachments.some((a) => a.status === "uploading");
  const canSubmit = content.trim().length > 0 && charLeft >= 0 && !submitting && !uploading;

  useEffect(() => {
    if (!isSeller || !token) return;
    api
      .list<MyProduct>("/products/my", { limit: 100 }, token)
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, [isSeller, token]);

  useEffect(() => {
    if (initialProductId) setProductId(initialProductId);
  }, [initialProductId]);

  // Free the local previews when the composer goes away.
  useEffect(() => () => previewsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const updateAttachment = (id: string, patch: Partial<Attachment>) =>
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const room = MAX_FILES - attachments.length;
    if (room <= 0) {
      setError(en ? `Up to ${MAX_FILES} photos or videos per post.` : `${MAX_FILES} photos ou vidéos maximum par publication.`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    for (const file of picked) {
      const kind: Attachment["kind"] = file.type.startsWith("video/") ? "video" : "image";
      const limitMb = kind === "video" ? MAX_VIDEO_MB : MAX_IMAGE_MB;
      if (file.size > limitMb * 1024 * 1024) {
        setError(
          en
            ? `“${file.name}” is too large (max ${limitMb} MB for ${kind === "video" ? "videos" : "photos"}).`
            : `« ${file.name} » est trop lourd (max ${limitMb} Mo pour les ${kind === "video" ? "vidéos" : "photos"}).`
        );
        continue;
      }
      const preview = URL.createObjectURL(file);
      previewsRef.current.push(preview);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setAttachments((prev) => [...prev, { id, file, preview, kind, progress: 0, status: "uploading" }]);
      uploadMedia(file, token, (progress) => updateAttachment(id, { progress }))
        .then((uploaded) => updateAttachment(id, { status: "done", progress: 100, uploaded, kind: uploaded.kind }))
        .catch((err) => updateAttachment(id, { status: "error", error: err instanceof Error ? err.message : "Upload failed" }));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)
    );
  };

  const applyStarter = (starter: (typeof STARTERS)[number]) => {
    setSelectedTags((prev) => Array.from(new Set([starter.tag, ...prev])).slice(0, 5));
    setContent((prev) => {
      if (prev.trim()) return prev;
      return lang === "en" ? starter.textEn : starter.textFr;
    });
    textRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const post = await apiFetch<PlatformPost>("/platform/posts", {
        method: "POST",
        token,
        body: JSON.stringify({
          content,
          tags: selectedTags,
          mediaIds: attachments.filter((a) => a.status === "done").map((a) => a.uploaded!._id),
          ...(productId ? { productId } : {})
        }),
      });
      onPostCreated(post);
      setContent("");
      setSelectedTags([]);
      setAttachments([]);
      setProductId("");
      setShowTagPicker(false);
    } catch (e: any) {
      setError(e?.message ?? (lang === "en" ? "Failed to post." : "Échec de la publication."));
    } finally {
      setSubmitting(false);
    }
  };

  const authorInitial = user.fullName?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="compose-box">
      <div className="compose-top">
        <div className="compose-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.fullName} />
          ) : (
            <span>{authorInitial}</span>
          )}
        </div>
        <textarea
          ref={textRef}
          className="compose-textarea"
          placeholder={
            lang === "en"
              ? "Share an insight, tip, or question with the community..."
              : "Partagez une expérience, un conseil ou une question..."
          }
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
          rows={3}
          aria-label="Post content"
        />
      </div>

      <div className="compose-starters" aria-label={lang === "en" ? "Post starters" : "Modèles de publication"}>
        {STARTERS.map((starter) => {
          const Icon = starter.icon;
          return (
            <button key={starter.tag} className="compose-starter-btn" onClick={() => applyStarter(starter)}>
              <Icon size={14} />
              {lang === "en" ? starter.en : starter.fr}
            </button>
          );
        })}
      </div>

      {/* Photo and video attachments */}
      {attachments.length > 0 && (
        <div className="compose-attachments">
          {attachments.map((a) => (
            <div key={a.id} className={`compose-attachment compose-attachment--${a.status}`}>
              {a.kind === "video" ? (
                <video src={a.preview} muted playsInline preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.preview} alt="" />
              )}
              {a.kind === "video" && (
                <span className="compose-attachment__badge">
                  <Video size={12} />
                </span>
              )}
              {a.status === "uploading" && (
                <span className="compose-attachment__progress" aria-label={`${a.progress}%`}>
                  <span style={{ width: `${a.progress}%` }} />
                </span>
              )}
              {a.status === "error" && <span className="compose-attachment__error">{a.error}</span>}
              <button
                type="button"
                className="compose-media-remove"
                onClick={() => removeAttachment(a.id)}
                aria-label={en ? "Remove" : "Retirer"}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link one of the seller's products so buyers can order from the post */}
      {isSeller && products.length > 0 && (
        <label className="compose-product">
          <Package size={16} />
          <select value={productId} onChange={(e) => setProductId(e.target.value)} aria-label={en ? "Linked product" : "Produit lié"}>
            <option value="">{en ? "Link a product to sell (optional)" : "Lier un produit à vendre (facultatif)"}</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
                {p.price !== undefined ? ` — ${p.price.toLocaleString()} FCFA` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Tag picker */}
      {showTagPicker && (
        <div className="compose-tag-picker">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              className={`compose-tag-option ${selectedTags.includes(tag) ? "selected" : ""}`}
              onClick={() => toggleTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="compose-selected-tags">
          {selectedTags.map((tag) => (
            <span key={tag} className="compose-selected-tag">
              #{tag}
              <button onClick={() => toggleTag(tag)} aria-label={`Remove ${tag}`}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="compose-footer">
        <div className="compose-toolbar">
          {isSeller ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                multiple
                hidden
                onChange={(e) => addFiles(e.target.files)}
              />
              <button
                type="button"
                className="compose-tool-btn compose-tool-btn--media"
                onClick={() => fileRef.current?.click()}
                disabled={attachments.length >= MAX_FILES}
                title={en ? "Add photos or videos" : "Ajouter des photos ou vidéos"}
              >
                <ImagePlus size={17} />
                <span>{en ? "Photo / Video" : "Photo / Vidéo"}</span>
              </button>
            </>
          ) : (
            <span className="compose-hint">
              {en ? "Photos and videos are for farmers and shops." : "Photos et vidéos : réservées aux éleveurs et boutiques."}
            </span>
          )}
          <button
            className={`compose-tool-btn ${showTagPicker ? "active" : ""}`}
            onClick={() => setShowTagPicker((v) => !v)}
            title={lang === "en" ? "Add tags" : "Ajouter des tags"}
          >
            <Tag size={17} />
          </button>
          <span
            className={`compose-char-count ${charLeft < 100 ? (charLeft < 20 ? "danger" : "warning") : ""}`}
          >
            {charLeft}
          </span>
        </div>

        {error && <span className="compose-error">{error}</span>}

        <button
          className="compose-submit-btn"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <span className="compose-spinner" />
          ) : (
            <>
              <Send size={16} />
              {lang === "en" ? "Post" : "Publier"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
