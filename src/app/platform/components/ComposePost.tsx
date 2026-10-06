"use client";

import { useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { BarChart3, HelpCircle, Image, Megaphone, Send, Tag, X } from "lucide-react";
import type { PlatformPost } from "../page";

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
};

export default function ComposePost({ token, user, onPostCreated }: Props) {
  const lang = typeof window !== "undefined" && document.documentElement.lang === "fr" ? "fr" : "en";

  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState("");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 2000;
  const charLeft = MAX_CHARS - content.length;
  const canSubmit = content.trim().length > 0 && charLeft >= 0 && !submitting;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)
    );
  };

  const addMedia = () => {
    const url = mediaInput.trim();
    if (!url || mediaUrls.length >= 4) return;

    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setError(lang === "en" ? "Only http or https image URLs are supported." : "Seules les URLs http ou https sont acceptées.");
        return;
      }
      setMediaUrls((prev) => [...prev, parsed.toString()].slice(0, 4));
      setMediaInput("");
      setError("");
    } catch {
      setError(lang === "en" ? "Enter a valid image URL." : "Entrez une URL d'image valide.");
    }
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
        body: JSON.stringify({ content, tags: selectedTags, mediaUrls }),
      });
      onPostCreated(post);
      setContent("");
      setSelectedTags([]);
      setMediaUrls([]);
      setShowTagPicker(false);
      setShowMediaInput(false);
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

      {/* Media previews */}
      {mediaUrls.length > 0 && (
        <div className="compose-media-preview">
          {mediaUrls.map((url, i) => (
            <div key={i} className="compose-media-item">
              <img src={url} alt={`Preview ${i + 1}`} />
              <button
                className="compose-media-remove"
                onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Media URL input */}
      {showMediaInput && (
        <div className="compose-media-input-row">
          <input
            type="url"
            className="compose-input"
            placeholder={lang === "en" ? "Paste image URL..." : "Coller l'URL de l'image..."}
            value={mediaInput}
            onChange={(e) => setMediaInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMedia()}
          />
          <button className="compose-add-media-btn" onClick={addMedia} disabled={!mediaInput.trim()}>
            {lang === "en" ? "Add" : "Ajouter"}
          </button>
        </div>
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
          <button
            className={`compose-tool-btn ${showMediaInput ? "active" : ""}`}
            onClick={() => setShowMediaInput((v) => !v)}
            title={lang === "en" ? "Add image URL" : "Ajouter URL image"}
          >
            <Image size={17} />
          </button>
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
