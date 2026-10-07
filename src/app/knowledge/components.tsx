"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, Info, ShieldAlert } from "lucide-react";
import { type KnowledgeSummary, type Localized, pick, SECTIONS } from "./knowledge-data";

export function AlertBadge({ level, lang }: { level: KnowledgeSummary["alertLevel"]; lang: string }) {
  if (level === "info") return null;
  const label =
    level === "urgent" ? (lang === "en" ? "Urgent" : "Urgent") : lang === "en" ? "Caution" : "Prudence";
  return (
    <span className={`kc-badge kc-badge--${level}`}>
      {level === "urgent" ? <ShieldAlert size={13} /> : <AlertTriangle size={13} />}
      {label}
    </span>
  );
}

export function Disclaimer({ lang }: { lang: string }) {
  return (
    <div className="kc-disclaimer" role="note">
      <Info size={18} />
      <p>
        {lang === "en"
          ? "Educational guidance only. PoultryHub never diagnoses disease or replaces a veterinarian. When in doubt, call a professional."
          : "Conseils éducatifs uniquement. PoultryHub ne pose jamais de diagnostic et ne remplace pas un vétérinaire. En cas de doute, appelez un professionnel."}
      </p>
    </div>
  );
}

export function ArticleCard({ article, lang, showSection = false }: { article: KnowledgeSummary; lang: string; showSection?: boolean }) {
  const section = SECTIONS[article.section];
  const Icon = section?.icon;
  return (
    <Link href={`/knowledge/article/${article.slug}`} className={`kc-article-card kc-article-card--${article.alertLevel}`}>
      <div className="kc-article-card__top">
        {showSection && section && (
          <span className="kc-article-card__section">
            {Icon && <Icon size={13} />}
            {pick(section.title, lang)}
          </span>
        )}
        <AlertBadge level={article.alertLevel} lang={lang} />
      </div>
      <h3>{pick(article.title, lang)}</h3>
      <p>{pick(article.summary, lang)}</p>
      <span className="kc-article-card__more">
        {lang === "en" ? "Read guide" : "Lire la fiche"}
        <ChevronRight size={15} />
      </span>
    </Link>
  );
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Tick-box checklist that remembers today's progress on this device. */
export function Checklist({ id, items, lang }: { id: string; items: Localized[]; lang: string }) {
  const storageKey = `poultryhub:checklist:${id}:${todayKey()}`;
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved)) setDone(items.map((_, index) => Boolean(saved[index])));
    } catch {
      // Storage unavailable: the checklist still works for this visit.
    }
  }, [storageKey, items]);

  const toggle = (index: number) => {
    setDone((prev) => {
      const next = prev.map((value, i) => (i === index ? !value : value));
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Ignore storage errors.
      }
      return next;
    });
  };

  const completed = done.filter(Boolean).length;
  return (
    <div className="kc-checklist">
      <div className="kc-checklist__head">
        <strong>{lang === "en" ? "Checklist for today" : "Check-list du jour"}</strong>
        <span>
          {completed}/{items.length}
        </span>
      </div>
      <div className="kc-progress" aria-hidden="true">
        <span style={{ width: `${items.length ? (completed / items.length) * 100 : 0}%` }} />
      </div>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <label className={done[index] ? "is-done" : ""}>
              <input type="checkbox" checked={done[index] ?? false} onChange={() => toggle(index)} />
              <span>{pick(item, lang)}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
