"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  Egg,
  LogIn,
  Users,
  Hash,
  TrendingUp,
  Flame,
  Globe,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import PostCard from "./components/PostCard";
import ComposePost from "./components/ComposePost";
import TrendingTags from "./components/TrendingTags";
import { getRoleBadgeLabel } from "./platform-utils";

export type PlatformPost = {
  _id: string;
  authorId: { _id: string; fullName: string; avatar?: string; roles: string[]; city?: string };
  authorRole: string;
  content: string;
  tags: string[];
  mediaUrls: string[];
  media?: { url: string; kind: "image" | "video"; mimeType?: string }[];
  productId?: { _id: string; name: string; price?: number; unit?: string; images?: string[] } | null;
  likes: string[];
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
};

export type PlatformComment = {
  _id: string;
  postId: string;
  authorId: { _id: string; fullName: string; avatar?: string; roles: string[]; city?: string };
  content: string;
  likes: string[];
  parentCommentId?: string;
  createdAt: string;
};

const FEED_LIMIT = 15;
const TOPIC_FILTERS = [
  { tag: "broiler", labelEn: "Broiler", labelFr: "Poulet de chair" },
  { tag: "layer", labelEn: "Layer", labelFr: "Pondeuse" },
  { tag: "disease", labelEn: "Disease", labelFr: "Maladie" },
  { tag: "feed", labelEn: "Feed", labelFr: "Alimentation" },
  { tag: "market-prices", labelEn: "Prices", labelFr: "Prix" },
  { tag: "tips", labelEn: "Tips", labelFr: "Conseils" },
  { tag: "news", labelEn: "News", labelFr: "Actualités" },
  { tag: "question", labelEn: "Q&A", labelFr: "Q&R" },
];

export default function PlatformPage() {
  const { user, token } = useAuth();
  const { lang } = useLanguage();

  const [posts, setPosts] = useState<PlatformPost[]>([]);
  // ?product=<id> comes from the "Promote" button on a seller's products page.
  const [promoteProductId, setPromoteProductId] = useState<string | undefined>(undefined);
  useEffect(() => {
    setPromoteProductId(new URLSearchParams(window.location.search).get("product") ?? undefined);
  }, []);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTag, setActiveTag] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch feed
  const fetchPosts = useCallback(
    async (reset = false, tagFilter = activeTag, pageNum = 1) => {
      try {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        const params: Record<string, string> = {
          limit: String(FEED_LIMIT),
          page: String(pageNum),
        };
        if (tagFilter) params.tag = tagFilter;

        const res = await apiFetch<any>(`/platform/posts?${new URLSearchParams(params)}`);
        const data = res as any;

        if (reset || pageNum === 1) {
          setPosts(data.data);
        } else {
          setPosts((prev) => [...prev, ...data.data]);
        }
        setTotalPages(data.pages ?? 1);
        setPage(pageNum);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTag]
  );

  // Fetch trending tags
  const fetchTrending = useCallback(async () => {
    try {
      const res = await apiFetch<any>("/platform/trending-tags");
      setTrendingTags((res as any).data ?? []);
    } catch {}
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await apiFetch<any>("/platform/suggestions", { token });
      setSuggestions((res as any).data ?? []);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchPosts(true, activeTag, 1);
  }, [activeTag]);

  useEffect(() => {
    fetchTrending();
    fetchSuggestions();
  }, [fetchTrending, fetchSuggestions]);

  const handleTagSelect = (tag: string) => {
    setActiveTag(tag === activeTag ? "" : tag);
  };

  const handlePostCreated = (newPost: PlatformPost) => {
    setPosts((prev) => [newPost, ...prev]);
    fetchTrending();
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleToggleFollow = async (targetId: string) => {
    if (!token) return;
    try {
      const res = await apiFetch<{ following: boolean }>(`/platform/follow/${targetId}`, {
        method: "POST",
        token,
      });
      setSuggestions((prev) =>
        prev.map((suggestion) =>
          suggestion._id === targetId ? { ...suggestion, following: res.following } : suggestion
        )
      );
    } catch {}
  };

  return (
    <div className="platform-page">
      {/* ── Top Nav ── */}
      <header className="platform-nav">
        <div className="platform-nav-inner">
          <Link href="/" className="platform-nav-brand">
            <Egg size={20} />
            <span>PoultryHub</span>
          </Link>

          <nav className="platform-nav-links">
            <Link href="/marketplace" className="platform-nav-link">
              {lang === "en" ? "Marketplace" : "Marché"}
            </Link>
            <Link href="/platform" className="platform-nav-link active">
              {lang === "en" ? "Community" : "Communauté"}
            </Link>
          </nav>

          <div className="platform-nav-actions">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard/customer" className="platform-nav-dash-btn">
                {lang === "en" ? "Dashboard" : "Tableau"}
              </Link>
            ) : (
              <Link href="/login" className="platform-nav-login">
                <LogIn size={16} />
                {lang === "en" ? "Login" : "Connexion"}
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="platform-hero">
        <div className="platform-hero-content">
          <div className="platform-hero-kicker">
            <Sparkles size={15} />
            {lang === "en" ? "Professional poultry network" : "Réseau avicole professionnel"}
          </div>
          <h1>
            {lang === "en"
              ? "Build with farmers, sellers, and experts who understand the work."
              : "Construisez avec des éleveurs, vendeurs et experts qui comprennent le terrain."}
          </h1>
          <p>
            {lang === "en"
              ? "Ask field questions, compare market signals, share disease alerts, and follow the people moving poultry commerce forward."
              : "Posez vos questions terrain, comparez les prix, partagez les alertes sanitaires et suivez les acteurs qui font avancer la filière."}
          </p>
          <div className="platform-hero-actions">
            <a href="#community-feed" className="platform-hero-primary">
              <MessageSquare size={16} />
              {lang === "en" ? "Open feed" : "Voir le fil"}
            </a>
            <a href="#platform-discovery" className="platform-hero-secondary">
              <Search size={16} />
              {lang === "en" ? "Discover people" : "Découvrir"}
            </a>
          </div>
        </div>
        <div className="platform-hero-stats" aria-label={lang === "en" ? "Community signals" : "Signaux communautaires"}>
          <div className="platform-hero-stat">
            <span>{posts.length}</span>
            <p>{lang === "en" ? "live posts loaded" : "publications chargées"}</p>
          </div>
          <div className="platform-hero-stat amber">
            <span>{trendingTags.length}</span>
            <p>{lang === "en" ? "active topics" : "sujets actifs"}</p>
          </div>
          <div className="platform-hero-stat blue">
            <span>{suggestions.length}</span>
            <p>{lang === "en" ? "people to meet" : "personnes à suivre"}</p>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="platform-body">
        {/* Left sidebar */}
        <aside className="platform-sidebar-left">
          <div className="platform-sidebar-card">
            <div className="platform-sidebar-heading">
              <TrendingUp size={16} />
              {lang === "en" ? "Trending Topics" : "Sujets Tendance"}
            </div>
            <TrendingTags
              tags={trendingTags}
              activeTag={activeTag}
              onSelect={handleTagSelect}
            />
          </div>

          {/* Filter chips */}
          <div className="platform-sidebar-card platform-filter-card">
            <div className="platform-sidebar-heading">
              <Hash size={16} />
              {lang === "en" ? "Browse by Topic" : "Parcourir par sujet"}
            </div>
            <div className="platform-tag-grid">
              {TOPIC_FILTERS.map(({ tag, labelEn, labelFr }) => (
                <button
                  key={tag}
                  className={`platform-tag-chip ${activeTag === tag ? "active" : ""}`}
                  onClick={() => handleTagSelect(tag)}
                >
                  {lang === "en" ? labelEn : labelFr}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main Feed ── */}
        <main id="community-feed" className="platform-feed">
          <div className="platform-mobile-topics">
            <div className="platform-mobile-topics-header">
              <Hash size={15} />
              <span>{lang === "en" ? "Browse topics" : "Parcourir les sujets"}</span>
            </div>
            <div className="platform-mobile-topic-scroll">
              {TOPIC_FILTERS.map(({ tag, labelEn, labelFr }) => (
                <button
                  key={tag}
                  className={`platform-tag-chip ${activeTag === tag ? "active" : ""}`}
                  onClick={() => handleTagSelect(tag)}
                >
                  {lang === "en" ? labelEn : labelFr}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter banner */}
          {activeTag && (
            <div className="platform-filter-banner">
              <Flame size={15} />
              {lang === "en" ? `Showing posts tagged` : "Articles avec le tag"}{" "}
              <strong>#{activeTag}</strong>
              <button
                className="platform-filter-clear"
                onClick={() => setActiveTag("")}
                aria-label="Clear filter"
              >
                ×
              </button>
            </div>
          )}

          {/* Compose */}
          {user ? (
            <ComposePost
              token={token!}
              user={user}
              onPostCreated={handlePostCreated}
              initialProductId={promoteProductId}
            />
          ) : (
            <div className="platform-guest-prompt">
              <Globe size={22} />
              <div>
                <strong>{lang === "en" ? "Join the conversation" : "Rejoignez la conversation"}</strong>
                <p>
                  {lang === "en"
                    ? "Log in to share insights, ask questions, and connect with fellow poultry professionals."
                    : "Connectez-vous pour partager vos expériences et interagir avec la communauté avicole."}
                </p>
              </div>
              <Link href="/login" className="platform-join-btn">
                {lang === "en" ? "Log in to post" : "Se connecter"}
              </Link>
            </div>
          )}

          {/* Posts */}
          {loading ? (
            <div className="platform-skeleton-list">
              {[1, 2, 3].map((n) => (
                <div key={n} className="platform-skeleton-card" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="platform-empty">
              <Egg size={40} />
              <p>
                {lang === "en"
                  ? activeTag
                    ? `No posts tagged #${activeTag} yet. Be the first!`
                    : "No posts yet. Start the conversation!"
                  : "Aucune publication pour l'instant. Lancez la discussion !"}
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  token={token}
                  onDeleted={handlePostDeleted}
                />
              ))}

              {page < totalPages && (
                <button
                  className="platform-load-more"
                  onClick={() => fetchPosts(false, activeTag, page + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? lang === "en" ? "Loading..." : "Chargement..."
                    : lang === "en" ? "Load more posts" : "Charger plus"}
                </button>
              )}
            </>
          )}
        </main>

        {/* Right sidebar */}
        <aside id="platform-discovery" className="platform-sidebar-right">
          {/* Community stats */}
          <div className="platform-sidebar-card platform-community-card">
            <div className="platform-community-header">
              <Egg size={22} />
              <span>{lang === "en" ? "PoultryHub Community" : "Communauté PoultryHub"}</span>
            </div>
            <p className="platform-community-desc">
              {lang === "en"
                ? "The professional network for poultry farmers, shopkeepers, and agribusiness across Cameroon and Africa."
                : "Le réseau professionnel des éleveurs, boutiquier et agro-entrepreneurs en Afrique."}
            </p>
            <div className="platform-community-proof">
              <span><ShieldCheck size={14} /> {lang === "en" ? "Verified roles" : "Rôles vérifiés"}</span>
              <span><BadgeCheck size={14} /> {lang === "en" ? "Trade-ready profiles" : "Profils commerciaux"}</span>
            </div>
            {!user && (
              <div className="platform-community-ctas">
                <Link href="/register" className="platform-join-btn full">
                  {lang === "en" ? "Join Community" : "Rejoindre"}
                </Link>
                <Link href="/login" className="platform-login-link">
                  {lang === "en" ? "Already a member? Log in" : "Déjà membre ? Se connecter"}
                </Link>
              </div>
            )}
          </div>

          {/* Who to follow */}
          {suggestions.length > 0 && (
            <div className="platform-sidebar-card">
              <div className="platform-sidebar-heading">
                <Users size={16} />
                {lang === "en" ? "People to Follow" : "Personnes à suivre"}
              </div>
              <div className="platform-suggestions">
                {suggestions.map((s) => (
                  <div key={s._id} className="platform-suggestion-item">
                    <div className="platform-suggestion-avatar">
                      {s.avatar ? (
                        <img src={s.avatar} alt={s.fullName} />
                      ) : (
                        <span>{s.fullName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="platform-suggestion-info">
                      <strong>{s.fullName}</strong>
                      <span>{getRoleBadgeLabel(s.roles?.[0] ?? "customer", lang)}{s.city ? ` · ${s.city}` : ""}</span>
                    </div>
                    {user && (
                      <button
                        className={`platform-follow-btn${s.following ? " following" : ""}`}
                        onClick={() => handleToggleFollow(s._id)}
                        aria-label={s.following ? "Unfollow" : "Follow"}
                      >
                        {s.following ? <Check size={14} /> : <UserPlus size={14} />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="platform-sidebar-card platform-collab-card">
            <div className="platform-sidebar-heading">
              <MessageSquare size={16} />
              {lang === "en" ? "Collaboration Rooms" : "Espaces de collaboration"}
            </div>
            <div className="platform-room-list">
              {[
                [lang === "en" ? "Disease watch" : "Veille maladie", lang === "en" ? "Rapid field alerts and prevention notes." : "Alertes terrain rapides et prévention."],
                [lang === "en" ? "Market signals" : "Signaux du marché", lang === "en" ? "Prices, demand shifts, buyers, and supply." : "Prix, demande, acheteurs et approvisionnement."],
                [lang === "en" ? "Growth playbooks" : "Guides de croissance", lang === "en" ? "Feed, mortality, batches, and farm systems." : "Aliment, mortalité, lots et systèmes d'élevage."],
              ].map(([title, description]) => (
                <div key={title} className="platform-room-item">
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer links */}
          <div className="platform-sidebar-card platform-footer-links">
            <Link href="/">← {lang === "en" ? "Back to Home" : "Retour à l'accueil"}</Link>
            <Link href="/marketplace">{lang === "en" ? "Marketplace" : "Marché"}</Link>
            <span className="platform-footer-copy">© 2025 PoultryHub</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
