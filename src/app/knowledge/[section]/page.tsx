"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import AppNav from "../../components/AppNav";
import { useLanguage } from "../../LanguageContext";
import { ArticleCard, Disclaimer } from "../components";
import { isSectionKey, type KnowledgeSummary, pick, SECTIONS } from "../knowledge-data";

export default function KnowledgeSectionPage() {
  const { section } = useParams<{ section: string }>();
  const { lang } = useLanguage();
  const [articles, setArticles] = useState<KnowledgeSummary[] | null>(null);
  const [error, setError] = useState("");
  const valid = isSectionKey(section);

  useEffect(() => {
    if (!valid) return;
    api
      .list<KnowledgeSummary>("/knowledge/articles", { section })
      .then((res) => setArticles(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [section, valid]);

  const meta = valid ? SECTIONS[section] : null;
  const Icon = meta?.icon;

  return (
    <>
      <AppNav />
      <main className="app-page kc-page">
        <div className="kc-container kc-container--narrow">
          <Link href="/knowledge" className="kc-back">
            <ArrowLeft size={16} />
            {lang === "en" ? "Knowledge Center" : "Centre de connaissances"}
          </Link>

          {!meta ? (
            <p className="kc-empty">{lang === "en" ? "This topic does not exist." : "Ce thème n'existe pas."}</p>
          ) : (
            <>
              <header className={`kc-section-head kc-section-card--${section}`}>
                <span className="kc-section-card__icon">{Icon && <Icon size={26} />}</span>
                <div>
                  <h1>{pick(meta.title, lang)}</h1>
                  <p>{pick(meta.description, lang)}</p>
                </div>
              </header>

              {(section === "health" || section === "observation" || section === "treatment") && <Disclaimer lang={lang} />}

              {error && <p className="form-error-banner">{error}</p>}
              {articles === null && !error && <p className="kc-muted">{lang === "en" ? "Loading…" : "Chargement…"}</p>}
              {articles?.length === 0 && (
                <p className="kc-empty">{lang === "en" ? "No guides in this topic yet." : "Pas encore de fiche dans ce thème."}</p>
              )}
              <div className="kc-grid">
                {articles?.map((article) => <ArticleCard key={article.slug} article={article} lang={lang} />)}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
