"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, BookMarked, ExternalLink, Phone, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import AppNav from "../../../components/AppNav";
import { renderMarkdown } from "../../../components/markdown";
import { useLanguage } from "../../../LanguageContext";
import { AlertBadge, ArticleCard, Checklist, Disclaimer } from "../../components";
import { type KnowledgeArticle, type KnowledgeSummary, pick, SECTIONS } from "../../knowledge-data";

export default function KnowledgeArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setArticle(null);
    setError("");
    api
      .get<KnowledgeArticle>(`/knowledge/articles/${encodeURIComponent(slug)}`)
      .then((res) => setArticle(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [slug]);

  const section = article ? SECTIONS[article.section] : null;
  const healthRelated = article && ["health", "observation", "treatment", "emergency", "followup"].includes(article.section);

  return (
    <>
      <AppNav />
      <main className="app-page kc-page">
        <div className="kc-container kc-container--narrow">
          <Link href={article ? `/knowledge/${article.section}` : "/knowledge"} className="kc-back">
            <ArrowLeft size={16} />
            {section ? pick(section.title, lang) : lang === "en" ? "Knowledge Center" : "Centre de connaissances"}
          </Link>

          {error && (
            <p className="kc-empty">
              {lang === "en" ? "This guide was not found." : "Cette fiche est introuvable."}{" "}
              <Link href="/knowledge">{lang === "en" ? "Back to the Knowledge Center" : "Retour au centre"}</Link>
            </p>
          )}
          {!article && !error && <p className="kc-muted">{lang === "en" ? "Loading…" : "Chargement…"}</p>}

          {article && (
            <article className="kc-article">
              <header className="kc-article__head">
                <div className="kc-article__meta">
                  {section && <span className="kc-article-card__section">{pick(section.title, lang)}</span>}
                  <AlertBadge level={article.alertLevel} lang={lang} />
                </div>
                <h1>{pick(article.title, lang)}</h1>
                <p className="kc-article__summary">{pick(article.summary, lang)}</p>
              </header>

              {article.alertLevel === "urgent" && (
                <div className="kc-urgent" role="alert">
                  <ShieldAlert size={22} />
                  <div>
                    <strong>{lang === "en" ? "Act quickly" : "Agissez vite"}</strong>
                    <p>
                      {lang === "en"
                        ? "If you see these signs, isolate the birds, stop movements and contact a veterinarian today."
                        : "Si vous voyez ces signes, isolez les oiseaux, arrêtez les mouvements et contactez un vétérinaire aujourd'hui."}
                    </p>
                  </div>
                </div>
              )}

              {article.warnings.length > 0 && (
                <ul className="kc-warnings">
                  {article.warnings.map((warning, index) => (
                    <li key={index}>
                      <AlertTriangle size={16} />
                      {pick(warning, lang)}
                    </li>
                  ))}
                </ul>
              )}

              {article.images.length > 0 && (
                <div className="kc-images">
                  {article.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" loading="lazy" />
                  ))}
                </div>
              )}

              <div className="kc-article__body poultrybot-markdown">
                {renderMarkdown(pick(article.body, lang), (href) => router.push(href))}
              </div>

              {article.checklist.length > 0 && <Checklist id={article.slug} items={article.checklist} lang={lang} />}

              {article.symptoms.length > 0 && (
                <div className="kc-tags">
                  <span>{lang === "en" ? "Related signs:" : "Signes liés :"}</span>
                  {article.symptoms.map((symptom) => (
                    <Link key={symptom} href={`/knowledge?q=${encodeURIComponent(symptom)}`} className="kc-chip">
                      {symptom}
                    </Link>
                  ))}
                </div>
              )}

              {healthRelated && (
                <>
                  <Disclaimer lang={lang} />
                  <Link href="/knowledge/article/when-to-seek-help" className="kc-help-link">
                    <Phone size={16} />
                    {lang === "en" ? "When should I call a veterinarian?" : "Quand appeler un vétérinaire ?"}
                  </Link>
                </>
              )}

              {article.references.length > 0 && (
                <section className="kc-references">
                  <h2>
                    <BookMarked size={16} />
                    {lang === "en" ? "References" : "Références"}
                  </h2>
                  <ul>
                    {article.references.map((ref) => (
                      <li key={ref.title}>
                        {ref.url ? (
                          <a href={ref.url} target="_blank" rel="noopener noreferrer">
                            {ref.title}
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          ref.title
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>
          )}

          {article?.related && article.related.length > 0 && (
            <section className="kc-block">
              <div className="kc-block__head">
                <h2>{lang === "en" ? "In the same topic" : "Dans le même thème"}</h2>
              </div>
              <div className="kc-grid">
                {article.related.map((related) => (
                  <ArticleCard
                    key={related.slug}
                    article={{ ...(related as KnowledgeSummary), section: article.section }}
                    lang={lang}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
