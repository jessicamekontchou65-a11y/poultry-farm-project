"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  type KnowledgeArticle,
  type KnowledgeSummary,
  type Localized,
  pick,
  POULTRY_TYPES,
  SECTION_ORDER,
  SECTIONS
} from "../../knowledge/knowledge-data";

type Draft = {
  _id?: string;
  slug: string;
  section: string;
  status: "draft" | "published";
  alertLevel: "info" | "caution" | "urgent";
  order: number;
  poultryTypes: string[];
  minAgeDays: string;
  maxAgeDays: string;
  title: Localized;
  summary: Localized;
  body: Localized;
  symptoms: string;
  tags: string;
  warnings: Localized[];
  checklist: Localized[];
  references: { title: string; url?: string }[];
  images: string;
};

const EMPTY: Draft = {
  slug: "",
  section: "production",
  status: "draft",
  alertLevel: "info",
  order: 0,
  poultryTypes: [],
  minAgeDays: "",
  maxAgeDays: "",
  title: { en: "", fr: "" },
  summary: { en: "", fr: "" },
  body: { en: "", fr: "" },
  symptoms: "",
  tags: "",
  warnings: [],
  checklist: [],
  references: [],
  images: ""
};

function toDraft(article: KnowledgeArticle): Draft {
  return {
    _id: article._id,
    slug: article.slug,
    section: article.section,
    status: article.status,
    alertLevel: article.alertLevel,
    order: article.order ?? 0,
    poultryTypes: article.poultryTypes ?? [],
    minAgeDays: article.minAgeDays == null ? "" : String(article.minAgeDays),
    maxAgeDays: article.maxAgeDays == null ? "" : String(article.maxAgeDays),
    title: article.title,
    summary: article.summary,
    body: article.body,
    symptoms: (article.symptoms ?? []).join(", "),
    tags: (article.tags ?? []).join(", "),
    warnings: article.warnings ?? [],
    checklist: article.checklist ?? [],
    references: article.references ?? [],
    images: (article.images ?? []).join("\n")
  };
}

const splitList = (value: string, separator: RegExp) =>
  value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);

/** Admin screen to write and maintain Knowledge Center content without redeploying. */
export default function AdminKnowledgeManager({ token, lang }: { token: string | null; lang: string }) {
  const en = lang === "en";
  const [articles, setArticles] = useState<KnowledgeSummary[]>([]);
  const [section, setSection] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    api
      .list<KnowledgeSummary>("/admin/knowledge", { section, q: query.trim() || undefined }, token)
      .then((res) => setArticles(res.data))
      .catch((err) => setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" }));
  }, [token, section, query]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const openEditor = async (slug?: string) => {
    setMessage(null);
    if (!slug) {
      setDraft({ ...EMPTY });
      return;
    }
    try {
      const res = await api.get<KnowledgeArticle>(`/admin/knowledge/${slug}`, token);
      setDraft(toDraft(res.data));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" });
    }
  };

  const save = async () => {
    if (!draft || !token) return;
    setSaving(true);
    setMessage(null);
    const payload = {
      slug: draft.slug,
      section: draft.section,
      status: draft.status,
      alertLevel: draft.alertLevel,
      order: Number(draft.order) || 0,
      poultryTypes: draft.poultryTypes,
      minAgeDays: draft.minAgeDays === "" ? null : Number(draft.minAgeDays),
      maxAgeDays: draft.maxAgeDays === "" ? null : Number(draft.maxAgeDays),
      title: draft.title,
      summary: draft.summary,
      body: draft.body,
      symptoms: splitList(draft.symptoms, /,/),
      tags: splitList(draft.tags, /,/),
      warnings: draft.warnings,
      checklist: draft.checklist,
      references: draft.references,
      images: splitList(draft.images, /\n/)
    };
    try {
      const res = draft._id
        ? await api.update<KnowledgeArticle>(`/admin/knowledge/${draft._id}`, payload, token)
        : await api.create<KnowledgeArticle>("/admin/knowledge", payload, token);
      setDraft(toDraft(res.data));
      setMessage({ type: "success", text: en ? "Saved. Changes are live." : "Enregistré. Les changements sont en ligne." });
      load();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (article: { _id?: string; title: Localized }) => {
    if (!article._id || !token) return;
    const confirmed = window.confirm(
      en ? `Delete “${pick(article.title, lang)}”? This cannot be undone.` : `Supprimer « ${pick(article.title, lang)} » ? Action irréversible.`
    );
    if (!confirmed) return;
    try {
      await api.remove(`/admin/knowledge/${article._id}`, token);
      setDraft(null);
      setMessage({ type: "success", text: en ? "Article deleted." : "Fiche supprimée." });
      load();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" });
    }
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  const updateLocalized = (key: "title" | "summary" | "body", locale: "en" | "fr", value: string) =>
    setDraft((prev) => (prev ? { ...prev, [key]: { ...prev[key], [locale]: value } } : prev));

  const banner = message && (
    <p className={message.type === "success" ? "form-success-banner" : "form-error-banner"} role="status">
      {message.text}
    </p>
  );

  if (draft) {
    return (
      <div className="kca">
        <div className="kca-toolbar">
          <button type="button" className="kca-btn kca-btn--ghost" onClick={() => setDraft(null)}>
            <ArrowLeft size={16} />
            {en ? "All articles" : "Toutes les fiches"}
          </button>
          <div className="kca-toolbar__actions">
            {draft._id && draft.status === "published" && (
              <Link href={`/knowledge/article/${draft.slug}`} target="_blank" className="kca-btn kca-btn--ghost">
                <ExternalLink size={15} />
                {en ? "View" : "Voir"}
              </Link>
            )}
            {draft._id && (
              <button type="button" className="kca-btn kca-btn--danger" onClick={() => remove(draft)}>
                <Trash2 size={15} />
                {en ? "Delete" : "Supprimer"}
              </button>
            )}
            <button type="button" className="kca-btn kca-btn--primary" onClick={save} disabled={saving}>
              <Save size={15} />
              {saving ? (en ? "Saving…" : "Enregistrement…") : en ? "Save" : "Enregistrer"}
            </button>
          </div>
        </div>
        {banner}

        <div className="kca-form">
          <fieldset className="kca-card">
            <legend>{en ? "Settings" : "Paramètres"}</legend>
            <div className="kca-grid">
              <label className="kca-field">
                <span>{en ? "Slug (URL)" : "Identifiant (URL)"}</span>
                <input value={draft.slug} onChange={(e) => update("slug", e.target.value)} placeholder="water-management" />
              </label>
              <label className="kca-field">
                <span>{en ? "Section" : "Section"}</span>
                <select value={draft.section} onChange={(e) => update("section", e.target.value)}>
                  {SECTION_ORDER.map((key) => (
                    <option key={key} value={key}>
                      {pick(SECTIONS[key].title, lang)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="kca-field">
                <span>{en ? "Status" : "Statut"}</span>
                <select value={draft.status} onChange={(e) => update("status", e.target.value as Draft["status"])}>
                  <option value="draft">{en ? "Draft (hidden)" : "Brouillon (masqué)"}</option>
                  <option value="published">{en ? "Published" : "Publié"}</option>
                </select>
              </label>
              <label className="kca-field">
                <span>{en ? "Warning level" : "Niveau d'alerte"}</span>
                <select value={draft.alertLevel} onChange={(e) => update("alertLevel", e.target.value as Draft["alertLevel"])}>
                  <option value="info">{en ? "Information" : "Information"}</option>
                  <option value="caution">{en ? "Caution" : "Prudence"}</option>
                  <option value="urgent">{en ? "Urgent" : "Urgent"}</option>
                </select>
              </label>
              <label className="kca-field">
                <span>{en ? "Order in section" : "Ordre dans la section"}</span>
                <input type="number" value={draft.order} onChange={(e) => update("order", Number(e.target.value))} />
              </label>
              <label className="kca-field">
                <span>{en ? "Min age (days)" : "Âge min (jours)"}</span>
                <input type="number" min={0} value={draft.minAgeDays} onChange={(e) => update("minAgeDays", e.target.value)} />
              </label>
              <label className="kca-field">
                <span>{en ? "Max age (days)" : "Âge max (jours)"}</span>
                <input type="number" min={0} value={draft.maxAgeDays} onChange={(e) => update("maxAgeDays", e.target.value)} />
              </label>
            </div>
            <div className="kca-field">
              <span>{en ? "Poultry types (none = all)" : "Types de volaille (aucun = tous)"}</span>
              <div className="kca-checks">
                {POULTRY_TYPES.map((type) => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={draft.poultryTypes.includes(type)}
                      onChange={(e) =>
                        update(
                          "poultryTypes",
                          e.target.checked ? [...draft.poultryTypes, type] : draft.poultryTypes.filter((t) => t !== type)
                        )
                      }
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="kca-card">
            <legend>{en ? "Content" : "Contenu"}</legend>
            <p className="kca-hint">
              {en
                ? "Write in simple words. Health content must describe signs, never diagnose, and point to a veterinarian. The body supports Markdown: ## headings, - lists, | tables |, **bold**."
                : "Écrivez simplement. Le contenu santé décrit des signes, ne diagnostique jamais et renvoie vers un vétérinaire. Le texte accepte le Markdown : ## titres, - listes, | tableaux |, **gras**."}
            </p>
            <div className="kca-bilingual">
              {(["fr", "en"] as const).map((locale) => (
                <div key={locale} className="kca-lang">
                  <h4>{locale === "fr" ? "Français" : "English"}</h4>
                  <label className="kca-field">
                    <span>{en ? "Title" : "Titre"}</span>
                    <input value={draft.title[locale]} onChange={(e) => updateLocalized("title", locale, e.target.value)} />
                  </label>
                  <label className="kca-field">
                    <span>{en ? "Summary" : "Résumé"}</span>
                    <textarea rows={2} value={draft.summary[locale]} onChange={(e) => updateLocalized("summary", locale, e.target.value)} />
                  </label>
                  <label className="kca-field">
                    <span>{en ? "Body (Markdown)" : "Texte (Markdown)"}</span>
                    <textarea rows={14} className="kca-mono" value={draft.body[locale]} onChange={(e) => updateLocalized("body", locale, e.target.value)} />
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="kca-card">
            <legend>{en ? "Search" : "Recherche"}</legend>
            <label className="kca-field">
              <span>{en ? "Symptoms / signs (comma separated, both languages)" : "Symptômes / signes (séparés par des virgules, deux langues)"}</span>
              <input value={draft.symptoms} onChange={(e) => update("symptoms", e.target.value)} placeholder="coughing, toux, sneezing, éternuements" />
            </label>
            <label className="kca-field">
              <span>{en ? "Tags (comma separated)" : "Mots-clés (séparés par des virgules)"}</span>
              <input value={draft.tags} onChange={(e) => update("tags", e.target.value)} />
            </label>
          </fieldset>

          <LocalizedListEditor
            title={en ? "Warnings" : "Avertissements"}
            items={draft.warnings}
            onChange={(items) => update("warnings", items)}
            lang={lang}
            multiline
          />
          <LocalizedListEditor
            title={en ? "Checklist items" : "Éléments de check-list"}
            items={draft.checklist}
            onChange={(items) => update("checklist", items)}
            lang={lang}
          />

          <fieldset className="kca-card">
            <legend>{en ? "References & images" : "Références & images"}</legend>
            {draft.references.map((ref, index) => (
              <div key={index} className="kca-row">
                <input
                  value={ref.title}
                  placeholder={en ? "Title" : "Titre"}
                  onChange={(e) =>
                    update("references", draft.references.map((r, i) => (i === index ? { ...r, title: e.target.value } : r)))
                  }
                />
                <input
                  value={ref.url ?? ""}
                  placeholder="https://"
                  onChange={(e) =>
                    update("references", draft.references.map((r, i) => (i === index ? { ...r, url: e.target.value } : r)))
                  }
                />
                <button
                  type="button"
                  className="kca-icon-btn"
                  aria-label={en ? "Remove reference" : "Retirer la référence"}
                  onClick={() => update("references", draft.references.filter((_, i) => i !== index))}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button type="button" className="kca-btn kca-btn--ghost" onClick={() => update("references", [...draft.references, { title: "", url: "" }])}>
              <Plus size={15} />
              {en ? "Add reference" : "Ajouter une référence"}
            </button>
            <label className="kca-field">
              <span>{en ? "Image URLs (one per line, https)" : "URL d'images (une par ligne, https)"}</span>
              <textarea rows={3} value={draft.images} onChange={(e) => update("images", e.target.value)} />
            </label>
          </fieldset>
        </div>
      </div>
    );
  }

  return (
    <div className="kca">
      <div className="kca-toolbar">
        <div className="kca-filters">
          <label className="kca-search">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={en ? "Search articles" : "Rechercher une fiche"} />
          </label>
          <select value={section} onChange={(e) => setSection(e.target.value)} aria-label="Section">
            <option value="">{en ? "All sections" : "Toutes les sections"}</option>
            {SECTION_ORDER.map((key) => (
              <option key={key} value={key}>
                {pick(SECTIONS[key].title, lang)}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="kca-btn kca-btn--primary" onClick={() => openEditor()}>
          <Plus size={16} />
          {en ? "New article" : "Nouvelle fiche"}
        </button>
      </div>
      {banner}

      <div className="kca-table-wrap">
        <table className="kca-table">
          <thead>
            <tr>
              <th>{en ? "Title" : "Titre"}</th>
              <th>{en ? "Section" : "Section"}</th>
              <th>{en ? "Level" : "Niveau"}</th>
              <th>{en ? "Status" : "Statut"}</th>
              <th aria-label={en ? "Actions" : "Actions"} />
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article._id}>
                <td>
                  <strong>{pick(article.title, lang)}</strong>
                  <small>/{article.slug}</small>
                </td>
                <td>{pick(SECTIONS[article.section]?.title, lang)}</td>
                <td>
                  <span className={`kca-pill kca-pill--${article.alertLevel}`}>
                    {article.alertLevel === "urgent" ? "Urgent" : article.alertLevel === "caution" ? (en ? "Caution" : "Prudence") : "Info"}
                  </span>
                </td>
                <td>
                  <span className={`kca-pill kca-pill--${article.status}`}>
                    {article.status === "published" ? (en ? "Published" : "Publié") : en ? "Draft" : "Brouillon"}
                  </span>
                </td>
                <td>
                  <div className="kca-actions">
                  <button type="button" className="kca-icon-btn" onClick={() => openEditor(article.slug)} aria-label={en ? "Edit" : "Modifier"}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" className="kca-icon-btn kca-icon-btn--danger" onClick={() => remove(article)} aria-label={en ? "Delete" : "Supprimer"}>
                    <Trash2 size={16} />
                  </button>
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={5} className="kca-empty">
                  {en ? "No articles match." : "Aucune fiche ne correspond."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LocalizedListEditor({
  title,
  items,
  onChange,
  lang,
  multiline = false
}: {
  title: string;
  items: Localized[];
  onChange: (items: Localized[]) => void;
  lang: string;
  multiline?: boolean;
}) {
  const en = lang === "en";
  const set = (index: number, locale: "en" | "fr", value: string) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [locale]: value } : item)));
  const Field = multiline ? "textarea" : "input";
  return (
    <fieldset className="kca-card">
      <legend>{title}</legend>
      {items.map((item, index) => (
        <div key={index} className="kca-row">
          <Field value={item.fr} placeholder="Français" onChange={(e) => set(index, "fr", e.target.value)} {...(multiline ? { rows: 2 } : {})} />
          <Field value={item.en} placeholder="English" onChange={(e) => set(index, "en", e.target.value)} {...(multiline ? { rows: 2 } : {})} />
          <button
            type="button"
            className="kca-icon-btn"
            aria-label={en ? "Remove" : "Retirer"}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="kca-btn kca-btn--ghost" onClick={() => onChange([...items, { en: "", fr: "" }])}>
        <Plus size={15} />
        {en ? "Add" : "Ajouter"}
      </button>
    </fieldset>
  );
}
