"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Egg,
  MessageSquare,
  Search,
  Sparkles,
} from "lucide-react";
import { api, apiFetch } from "@/lib/api";
import { useAuth } from "../../AuthContext";
import { useLanguage } from "../../LanguageContext";
import DashboardShell from "../../components/DashboardShell";
import CustomerBottomNav from "../../components/CustomerBottomNav";
import MediaFeedPost, { type MediaPost } from "../../components/MediaFeedPost";
import ThemeToggle from "../../ThemeToggle";

type Story = {
  id: string;
  type: string;
  label: string;
  subtitle: string;
  image: string;
  href: string;
};

const FALLBACK_STORIES: Story[] = [
  {
    id: "s1",
    type: "harvest",
    label: "Fresh harvest today",
    subtitle: "Eggs & layers",
    image: "/images/seed/eggs-poultry-products.png",
    href: "/marketplace",
  },
  {
    id: "s2",
    type: "product",
    label: "Fresh chicken available",
    subtitle: "Poultry",
    image: "/images/seed/modern-poultry-farm.png",
    href: "/marketplace",
  },
  {
    id: "s3",
    type: "shop",
    label: "Feed promo this week",
    subtitle: "Shops",
    image: "/images/seed/shop-supplies.png",
    href: "/shops",
  },
  {
    id: "s4",
    type: "farm",
    label: "New chicks in stock",
    subtitle: "Farms",
    image: "/images/hero/chick-nursery-hero.png",
    href: "/farms",
  },
];

export default function CustomerMediaHome() {
  const { token, user } = useAuth();
  const { lang } = useLanguage();
  const [stories, setStories] = useState<Story[]>(FALLBACK_STORIES);
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [storyRes, feedRes] = await Promise.all([
        apiFetch<{ data: Story[] }>("/platform/stories").catch(() => ({ data: FALLBACK_STORIES })),
        apiFetch<{ data: MediaPost[] }>("/platform/posts?limit=20"),
      ]);
      if (storyRes.data?.length) setStories(storyRes.data);
      setPosts(feedRes.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }

    if (token) {
      api
        .list<any>("/notifications", { limit: 5 }, token)
        .then((res) => setNotifCount(res.data.filter((n: any) => !n.readAt).length))
        .catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const userId = String(user?._id ?? user?.id ?? "");

  return (
    <DashboardShell mediaMode>
      <div className="media-home">
        <header className="media-topbar">
          <Link href="/dashboard/customer" className="media-topbar__brand">
            <Egg size={20} />
            <span>PoultryHub</span>
          </Link>
          <div className="media-topbar__actions">
            <Link href="/dashboard/customer/explore" className="media-icon-btn" aria-label="Search">
              <Search size={18} />
            </Link>
            <Link href="/dashboard/customer" className="media-icon-btn" aria-label="Notifications">
              <Bell size={18} />
              {notifCount > 0 && <i>{notifCount > 9 ? "9+" : notifCount}</i>}
            </Link>
            <Link href="/dashboard/customer/messages" className="media-icon-btn" aria-label="Messages">
              <MessageSquare size={18} />
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="media-stories" aria-label="Stories">
          <div className="media-stories__track">
            {stories.map((story) => (
              <Link key={story.id} href={story.href} className="media-story">
                <div className="media-story__ring">
                  <img src={story.image} alt="" />
                </div>
                <strong>{story.label}</strong>
                <span>{story.subtitle}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="media-feed">
          <div className="media-feed__intro">
            <Sparkles size={16} />
            <p>
              {lang === "en"
                ? "Discover farms, shops, and products near you — social feed meets marketplace."
                : "Découvrez fermes, boutiques et produits près de vous — feed social et marketplace."}
            </p>
          </div>

          {loading && (
            <p className="media-feed__status">
              {lang === "en" ? "Loading your feed..." : "Chargement du fil..."}
            </p>
          )}

          {!loading && posts.length === 0 && (
            <div className="media-empty">
              <p>
                {lang === "en"
                  ? "No posts yet. Explore farms and shops, or check the marketplace."
                  : "Aucun post pour l'instant. Explorez fermes et boutiques, ou le marketplace."}
              </p>
              <Link href="/dashboard/customer/explore" className="media-btn media-btn--primary">
                {lang === "en" ? "Explore nearby" : "Explorer à proximité"}
              </Link>
            </div>
          )}

          {posts.map((post) => (
            <MediaFeedPost
              key={post._id}
              post={post}
              currentUserId={userId}
              token={token}
            />
          ))}
        </section>
      </div>
      <CustomerBottomNav />
    </DashboardShell>
  );
}
