"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Egg,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ShoppingBag,
  Store,
  Tractor,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";

export default function AppNav() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const handleLogout = () => {
    closeMobileMenu();
    logout();
  };

  return (
    <>
      <header className="app-nav" aria-label="Primary navigation">
        <Link className="app-brand" href="/" onClick={closeMobileMenu}>
          <span className="app-brand-mark">
            <Egg size={18} />
          </span>
          PoultryHub
        </Link>
        <nav className="app-nav-links">
          <Link href="/marketplace">
            <ShoppingBag size={16} />
            {t("nav.marketplace")}
          </Link>
          <Link href="/farms">
            <Tractor size={16} />
            {t("nav.farms")}
          </Link>
          <Link href="/shops">
            <Store size={16} />
            {t("nav.shops")}
          </Link>
          <Link href="/knowledge">
            <BookOpen size={16} />
            {t("nav.knowledge")}
          </Link>
          <Link href="/dashboard/customer">
            <LayoutDashboard size={16} />
            {t("nav.dashboard")}
          </Link>
        </nav>
        <div className="app-nav-actions">
          <button
            className="nav-btn lang-toggle-btn"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            type="button"
            style={{ marginRight: "12px", background: "none", border: "none", color: "var(--color-text)", cursor: "pointer", fontWeight: "bold" }}
          >
            {lang === "en" ? "FR" : "EN"}
          </button>
          {user ? (
            <>
              <span className="app-user-name">{user.fullName}</span>
              <button type="button" onClick={handleLogout} aria-label={t("nav.logout")}>
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <LogIn size={16} />
                {t("nav.login")}
              </Link>
              <Link className="nav-pill" href="/register">
                <UserPlus size={16} />
                {t("nav.register")}
              </Link>
            </>
          )}
          <button
            className="app-menu-btn"
            type="button"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      <div className={`app-mobile-menu${mobileMenuOpen ? " open" : ""}`} role="dialog" aria-modal="true">
        <Link href="/marketplace" onClick={closeMobileMenu}>
          <ShoppingBag size={18} />
          {t("nav.marketplace")}
        </Link>
        <Link href="/farms" onClick={closeMobileMenu}>
          <Tractor size={18} />
          {t("nav.farms")}
        </Link>
        <Link href="/shops" onClick={closeMobileMenu}>
          <Store size={18} />
          {t("nav.shops")}
        </Link>
        <Link href="/knowledge" onClick={closeMobileMenu}>
          <BookOpen size={18} />
          {t("nav.knowledge")}
        </Link>
        <Link href="/dashboard/customer" onClick={closeMobileMenu}>
          <LayoutDashboard size={18} />
          {t("nav.dashboard")}
        </Link>
        <button
          className="sidebar-link"
          type="button"
          onClick={() => {
            setLang(lang === "en" ? "fr" : "en");
            closeMobileMenu();
          }}
          style={{ width: "100%", justifyContent: "flex-start", background: "none", border: "none", color: "var(--color-text)", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px" }}
        >
          <span style={{ fontWeight: "bold" }}>{lang === "en" ? "Passer en Français" : "Switch to English"}</span>
        </button>
        {user ? (
          <button type="button" onClick={handleLogout}>
            <LogOut size={18} />
            {t("nav.logout")}
          </button>
        ) : (
          <>
            <Link href="/login" onClick={closeMobileMenu}>
              <LogIn size={18} />
              {t("nav.login")}
            </Link>
            <Link href="/register" onClick={closeMobileMenu}>
              <UserPlus size={18} />
              {t("nav.register")}
            </Link>
          </>
        )}
      </div>
    </>
  );
}
