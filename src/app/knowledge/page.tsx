"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Bird, CalendarClock, ChevronRight, Search, Syringe, X } from "lucide-react";
import { api } from "@/lib/api";
import AppNav from "../components/AppNav";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import { ArticleCard, Disclaimer } from "./components";
import { type KnowledgeSummary, pick, SECTION_ORDER, SECTIONS, type SectionKey, SYMPTOM_CHIPS } from "./knowledge-data";

type FlockAdvice = {
  batch: {
    _id: string;
    name: string;
    farmName?: string;
    poultryType: string;
    breed?: string;
    ageDays: number;
    currentQuantity: number;
  };
  articles: KnowledgeSummary[];
  vaccinationsDue: { _id: string; vaccineName: string; scheduledDate: string }[];
  mortalityAlert: { deathsLast24h: number; usualPerDay: number; articleSlug: string } | null;
};

export default function KnowledgeCenterPage() {
  const { lang } = useLanguage();
  const { token, user } = useAuth();
  const [counts, setCounts] = useState<Partial<Record<SectionKey, number>>>({});
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [flocks, setFlocks] = useState<FlockAdvice[]>([]);
  const isFarmer = !!user?.roles?.includes("farmer");

  useEffect(() => {
    api
      .get<{ key: SectionKey; count: number }[]>("/knowledge/sections")
      .then((res) => setCounts(Object.fromEntries(res.data.map((s) => [s.key, s.count]))))
      .catch(() => {});

    // Allow links such as /knowledge?q=toux (used by PoultryBot).
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) setQuery(initial);
  }, []);

  useEffect(() => {
    if (!token || !isFarmer) return;
    api
      .get<FlockAdvice[]>("/knowledge/for-my-flocks", token)
      .then((res) => setFlocks(res.data))
      .catch(() => {});
  }, [token, isFarmer]);

  // Search as the user types, with a short pause to avoid a request per keystroke.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      api
        .list<KnowledgeSummary>("/knowledge/articles", { q })
        .then((res) => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <AppNav />
      <main className="app-page kc-page">
        <section className="kc-hero">
          <div className="kc-hero__text">
            <span className="kc-kicker">
              <BookOpen size={15} />
              {lang === "en" ? "Guides, checklists & safe practices" : "Guides, check-lists & bonnes pratiques"}
            </span>
            <h1>{lang === "en" ? "Poultry Knowledge Center" : "Centre de connaissances avicoles"}</h1>
            <p>
              {lang === "en"
                ? "Short, clear guidance for every stage of your flock. Search a sign you observe, or browse a topic."
                : "Des conseils courts et clairs pour chaque étape de votre élevage. Cherchez un signe observé ou parcourez un thème."}
            </p>
          </div>

          <form className="kc-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "en" ? "Search a sign: coughing, diarrhea, drop in eggs…" : "Cherchez un signe : toux, diarrhée, baisse de ponte…"}
              aria-label={lang === "en" ? "Search the Knowledge Center" : "Rechercher dans le centre de connaissances"}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label={lang === "en" ? "Clear search" : "Effacer"}>
                <X size={18} />
              </button>
            )}
          </form>

          <div className="kc-chips" aria-label={lang === "en" ? "Common signs" : "Signes fréquents"}>
            {SYMPTOM_CHIPS.map((chip) => {
              const label = pick(chip, lang);
              return (
                <button
                  key={chip.en}
                  type="button"
                  className={`kc-chip ${query.toLowerCase() === label.toLowerCase() ? "is-active" : ""}`}
                  onClick={() => setQuery(label)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <div className="kc-container">
          <Disclaimer lang={lang} />

          {results !== null && (
            <section className="kc-block" aria-live="polite">
              <div className="kc-block__head">
                <h2>
                  {searching
                    ? lang === "en"
                      ? "Searching…"
                      : "Recherche…"
                    : lang === "en"
                      ? `${results.length} guide${results.length === 1 ? "" : "s"} for “${query.trim()}”`
                      : `${results.length} fiche${results.length === 1 ? "" : "s"} pour « ${query.trim()} »`}
                </h2>
              </div>
              {!searching && results.length === 0 ? (
                <p className="kc-empty">
                  {lang === "en"
                    ? "No guide matches this search. Try another word, or check the observation guide."
                    : "Aucune fiche ne correspond. Essayez un autre mot, ou consultez le guide d'observation."}{" "}
                  <Link href="/knowledge/article/daily-observation-guide">
                    {lang === "en" ? "Observation guide" : "Guide d'observation"}
                  </Link>
                </p>
              ) : (
                <div className="kc-grid">
                  {results.map((article) => (
                    <ArticleCard key={article.slug} article={article} lang={lang} showSection />
                  ))}
                </div>
              )}
            </section>
          )}

          <Link href="/knowledge/emergency" className="kc-emergency">
            <AlertTriangle size={26} />
            <div>
              <strong>{lang === "en" ? "Many birds sick or dying suddenly?" : "Beaucoup d'oiseaux malades ou morts subitement ?"}</strong>
              <span>
                {lang === "en"
                  ? "See the warning signs that need a veterinarian today."
                  : "Voyez les signes d'alerte qui demandent un vétérinaire aujourd'hui."}
              </span>
            </div>
            <ChevronRight size={20} />
          </Link>

          {isFarmer && flocks.length > 0 && (
            <section className="kc-block">
              <div className="kc-block__head">
                <h2>{lang === "en" ? "For your flocks" : "Pour vos lots"}</h2>
                <p>
                  {lang === "en"
                    ? "Guides matched to each active flock's type and age, from your farm records."
                    : "Fiches adaptées au type et à l'âge de chaque lot actif, d'après vos registres."}
                </p>
              </div>
              <div className="kc-flocks">
                {flocks.map((flock) => (
                  <article key={flock.batch._id} className="kc-flock">
                    <header>
                      <span className="kc-flock__icon">
                        <Bird size={18} />
                      </span>
                      <div>
                        <h3>{flock.batch.name}</h3>
                        <p>
                          {[flock.batch.farmName, flock.batch.poultryType, flock.batch.breed].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </header>
                    <dl className="kc-flock__facts">
                      <div>
                        <dt>{lang === "en" ? "Age" : "Âge"}</dt>
                        <dd>
                          {flock.batch.ageDays} {lang === "en" ? "days" : "jours"}
                        </dd>
                      </div>
                      <div>
                        <dt>{lang === "en" ? "Birds" : "Oiseaux"}</dt>
                        <dd>{flock.batch.currentQuantity.toLocaleString()}</dd>
                      </div>
                    </dl>

                    {flock.mortalityAlert && (
                      <Link href={`/knowledge/article/${flock.mortalityAlert.articleSlug}`} className="kc-flock__alert">
                        <AlertTriangle size={16} />
                        {lang === "en"
                          ? `${flock.mortalityAlert.deathsLast24h} deaths in 24h (usual ≈ ${flock.mortalityAlert.usualPerDay}/day). Check when to call a vet.`
                          : `${flock.mortalityAlert.deathsLast24h} morts en 24 h (habituel ≈ ${flock.mortalityAlert.usualPerDay}/jour). Voir quand appeler un vétérinaire.`}
                      </Link>
                    )}

                    {flock.vaccinationsDue.map((v) => (
                      <p key={v._id} className="kc-flock__due">
                        <Syringe size={15} />
                        {v.vaccineName} — {new Date(v.scheduledDate).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR")}
                      </p>
                    ))}

                    {flock.articles.length > 0 ? (
                      <ul className="kc-flock__links">
                        {flock.articles.map((article) => (
                          <li key={article.slug}>
                            <Link href={`/knowledge/article/${article.slug}`}>
                              {pick(article.title, lang)}
                              <ChevronRight size={14} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="kc-muted">
                        <CalendarClock size={14} />
                        {lang === "en" ? "No specific guide for this age yet." : "Pas encore de fiche spécifique pour cet âge."}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="kc-block">
            <div className="kc-block__head">
              <h2>{lang === "en" ? "Browse by topic" : "Parcourir par thème"}</h2>
            </div>
            <div className="kc-sections">
              {SECTION_ORDER.map((key) => {
                const section = SECTIONS[key];
                const Icon = section.icon;
                return (
                  <Link key={key} href={`/knowledge/${key}`} className={`kc-section-card kc-section-card--${key}`}>
                    <span className="kc-section-card__icon">
                      <Icon size={22} />
                    </span>
                    <h3>{pick(section.title, lang)}</h3>
                    <p>{pick(section.description, lang)}</p>
                    <span className="kc-section-card__count">
                      {counts[key] ?? 0}{" "}
                      {lang === "en" ? ((counts[key] ?? 0) === 1 ? "guide" : "guides") : (counts[key] ?? 0) === 1 ? "fiche" : "fiches"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
