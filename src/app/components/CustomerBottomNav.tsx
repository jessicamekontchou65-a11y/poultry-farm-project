"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Package, PlusCircle, User } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";

export default function CustomerBottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const canCreate = user?.roles?.some((r) => r === "farmer" || r === "shopkeeper");

  const items = [
    {
      href: "/dashboard/customer",
      label: lang === "en" ? "Home" : "Accueil",
      icon: Home,
      match: (p: string) => p === "/dashboard/customer",
    },
    {
      href: "/dashboard/customer/explore",
      label: lang === "en" ? "Explore" : "Explorer",
      icon: Compass,
      match: (p: string) => p.startsWith("/dashboard/customer/explore"),
    },
    {
      href: canCreate ? "/platform" : "/marketplace",
      label: lang === "en" ? "Create" : "Créer",
      icon: PlusCircle,
      match: () => false,
    },
    {
      href: "/dashboard/customer/orders",
      label: lang === "en" ? "Orders" : "Commandes",
      icon: Package,
      match: (p: string) => p.startsWith("/dashboard/customer/orders") || p.startsWith("/dashboard/customer/checkout"),
    },
    {
      href: "/dashboard/customer/profile",
      label: lang === "en" ? "Profile" : "Profil",
      icon: User,
      match: (p: string) => p.startsWith("/dashboard/customer/profile"),
    },
  ];

  return (
    <nav className="media-bottom-nav" aria-label="Customer navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`media-bottom-nav__item ${active ? "is-active" : ""}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
