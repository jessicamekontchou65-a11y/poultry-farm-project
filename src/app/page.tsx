"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  ChevronRight,
  Egg,
  LayoutDashboard,
  LineChart,
  MapPin,
  Menu,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Store,
  TabletSmartphone,
  Wheat,
  X,
  Mail,
  Phone,
  MapPinned,
  Twitter,
  Facebook,
  Instagram,
  LogIn,
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import ThemeToggle from "./ThemeToggle";

const heroSlides = [
  {
    src: "/images/poultryhub-hero.png",
    alt: "A modern poultry farmer using a tablet beside healthy chickens and egg trays",
  },
  {
    src: "/images/hero/sunrise-farm-hero.png",
    alt: "A poultry farmer checking healthy layer chickens at sunrise",
  },
  {
    src: "/images/hero/supply-shop-hero.png",
    alt: "A poultry supply shopkeeper managing feed and equipment orders",
  },
  {
    src: "/images/hero/chick-nursery-hero.png",
    alt: "A clean poultry chick nursery with a farmer monitoring healthy chicks",
  },
];

export default function Home() {
  const { lang, setLang, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Sticky header logic
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 32);

      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setPastHero(heroBottom < 60);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll reveal fallback for browsers without scroll-driven animations
  useEffect(() => {
    if (CSS.supports("(animation-timeline: view()) and (animation-range: entry 0% entry 30%)")) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll(".section, .cta-section");
    sections.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "fr" : "en");
  }, [lang, setLang]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const metrics = [
    { value: t("metric.value1"), label: t("metric.label1") },
    { value: t("metric.value2"), label: t("metric.label2") },
    { value: t("metric.value3"), label: t("metric.label3") },
  ];

  const workflows = [
    {
      icon: Sprout,
      title: t("platform.card1_title"),
      text: t("platform.card1_text"),
    },
    {
      icon: Store,
      title: t("platform.card2_title"),
      text: t("platform.card2_text"),
    },
    {
      icon: LineChart,
      title: t("platform.card3_title"),
      text: t("platform.card3_text"),
    },
  ];

  const signals = [
    t("market.signal1"),
    t("market.signal2"),
    t("market.signal3"),
    t("market.signal4"),
    t("market.signal5"),
    t("market.signal6"),
  ];

  return (
    <>
      {/* ============================
          HEADER
          ============================ */}
      <header
        className={`landing-header${scrolled ? " scrolled" : ""}${pastHero ? " past-hero" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="landing-header-inner">
          <Link className="landing-brand" href="/">
            <span className="landing-brand-mark">
              <Egg size={20} />
            </span>
            PoultryHub
          </Link>

          <nav className="landing-nav">
            <Link href="/platform">
              <Sprout size={15} />
              {t("nav.platform")}
            </Link>
            <Link href="/marketplace">
              <ShoppingBag size={15} />
              {t("nav.marketplace")}
            </Link>
            <a href="#insight">
              <BarChart3 size={15} />
              {t("nav.insights")}
            </a>
          </nav>

          <div className="landing-controls">
            <button
              className="landing-lang-toggle"
              onClick={toggleLang}
              aria-label={t("lang.label")}
              title={t("lang.label")}
              type="button"
            >
              {t("lang.toggle")}
            </button>
            <ThemeToggle />
            <Link className="landing-login" href="/login" aria-label="Login">
              <LogIn size={17} />
            </Link>
            <a className="landing-cta" href="#start">
              {t("nav.start")}
              <ChevronRight size={16} />
            </a>
            <button
              className="landing-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t("nav.menu")}
              type="button"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`landing-mobile-menu${mobileMenuOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <Link href="/platform" onClick={closeMobileMenu}>
          {t("nav.platform")}
        </Link>
        <a href="#market" onClick={closeMobileMenu}>
          {t("nav.marketplace")}
        </a>
        <a href="#insight" onClick={closeMobileMenu}>
          {t("nav.insights")}
        </a>
        <Link href="/dashboard/customer" onClick={closeMobileMenu}>
          <LayoutDashboard size={20} />
          {t("nav.dashboard")}
        </Link>
        <Link href="/login" onClick={closeMobileMenu}>
          <LogIn size={20} />
          {t("nav.login")}
        </Link>
        <a
          href="#start"
          className="btn btn-primary"
          onClick={closeMobileMenu}
        >
          {t("nav.start")}
          <ArrowRight size={18} />
        </a>
      </div>

      <main>
        {/* ============================
            HERO SECTION
            ============================ */}
        <section className="hero-section" ref={heroRef}>
          <div className="hero-slideshow" aria-hidden="true">
            {heroSlides.map((slide, index) => (
              <Image
                className="hero-image"
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                priority={index === 0}
                fill
                sizes="100vw"
                style={{ animationDelay: `${index * 6}s` }}
              />
            ))}
          </div>
          <div className="hero-overlay" />

          {/* Spacer for fixed header */}
          <div style={{ height: "76px" }} />

          <div className="hero-content">
            <div className="hero-copy">
              <div className="eyebrow">
                <ShieldCheck size={16} />
                {t("hero.eyebrow")}
              </div>
              <h1>
                {t("hero.title1")}
                <br />
                <span className="hero-title-accent">
                  {t("hero.title2")}
                </span>
              </h1>
              <p className="hero-subtitle">{t("hero.subtitle")}</p>
              <div className="hero-actions" id="start">
                <a className="btn btn-primary" href="#platform">
                  {t("hero.cta_primary")}
                  <ArrowRight size={18} />
                </a>
                <a className="btn btn-secondary" href="#market">
                  {t("hero.cta_secondary")}
                </a>
              </div>
            </div>

            <aside
              className="live-panel"
              aria-label="PoultryHub dashboard preview"
            >
              <div className="panel-top">
                <span>{t("hero.panel_today")}</span>
                <BellRing size={17} />
              </div>
              <div className="egg-count">
                <span>{t("hero.panel_eggs")}</span>
                <strong>{t("hero.panel_eggs_count")}</strong>
              </div>
              <div className="panel-grid">
                <span>
                  <PackageCheck size={15} />
                  {t("hero.panel_orders")}
                </span>
                <span>
                  <Wheat size={15} />
                  {t("hero.panel_feed")}
                </span>
                <span>
                  <MapPin size={15} />
                  {t("hero.panel_location")}
                </span>
                <span>
                  <BarChart3 size={15} />
                  {t("hero.panel_sales")}
                </span>
              </div>
            </aside>
          </div>

          <div className="metric-strip" aria-label="Platform highlights">
            {metrics.map((m) => (
              <div key={m.label}>
                <strong>{m.value}</strong>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============================
            PLATFORM SECTION
            ============================ */}
        <section className="section" id="platform">
          <div className="section-heading">
            <div className="eyebrow on-surface">
              <TabletSmartphone size={16} />
              {t("platform.eyebrow")}
            </div>
            <h2>{t("platform.title")}</h2>
          </div>
          <div className="workflow-grid">
            {workflows.map((w) => {
              const Icon = w.icon;
              return (
                <article className="workflow-card" key={w.title}>
                  <span className="workflow-icon">
                    <Icon size={22} />
                  </span>
                  <h3>{w.title}</h3>
                  <p>{w.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <div className="section-divider" />

        {/* ============================
            MARKETPLACE SECTION
            ============================ */}
        <section className="section" id="market">
          <div className="market-section">
            <div className="market-copy">
              <div className="eyebrow on-surface">
                <ShoppingBag size={16} />
                {t("market.eyebrow")}
              </div>
              <h2>{t("market.title")}</h2>
              <p>{t("market.text")}</p>
            </div>
            <div className="signal-list">
              {signals.map((s) => (
                <div className="signal-item" key={s}>
                  <Check size={17} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* ============================
            INSIGHTS SECTION
            ============================ */}
        <section className="section" id="insight">
          <div className="insight-section">
            <div className="insight-copy">
              <div className="eyebrow on-surface">
                <BarChart3 size={16} />
                {t("insight.eyebrow")}
              </div>
              <h2>{t("insight.title")}</h2>
              <p>{t("insight.text")}</p>
            </div>
            <div className="chart-panel">
              <div className="chart-bars">
                <span style={{ height: "44%" }} />
                <span style={{ height: "68%" }} />
                <span style={{ height: "58%" }} />
                <span style={{ height: "82%" }} />
                <span style={{ height: "74%" }} />
                <span style={{ height: "92%" }} />
              </div>
              <div className="chart-caption">
                <strong>{t("insight.batch")}</strong>
                <span>{t("insight.caption")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================
            CTA SECTION
            ============================ */}
        <section className="cta-section">
          <div className="cta-inner">
            <h2>{t("cta.title")}</h2>
            <p>{t("cta.subtitle")}</p>
            <a className="btn btn-cta" href="#start">
              {t("cta.button")}
              <ArrowRight size={19} />
            </a>
          </div>
        </section>
      </main>

      {/* ============================
          FOOTER
          ============================ */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <span className="brand-mark">
                  <Egg size={16} />
                </span>
                PoultryHub
              </div>
              <p className="footer-description">{t("footer.description")}</p>
            </div>

            <div>
              <div className="footer-title">{t("footer.links_title")}</div>
              <ul className="footer-links">
                <li>
                  <Link href="/platform">{t("footer.link_platform")}</Link>
                </li>
                <li>
                  <a href="#market">{t("footer.link_marketplace")}</a>
                </li>
                <li>
                  <a href="#insight">{t("footer.link_insights")}</a>
                </li>
                <li>
                  <a href="#">{t("footer.link_contact")}</a>
                </li>
              </ul>
            </div>

            <div>
              <div className="footer-title">{t("footer.contact_title")}</div>
              <div className="footer-contact-item">
                <Mail size={16} />
                {t("footer.contact_email")}
              </div>
              <div className="footer-contact-item">
                <Phone size={16} />
                {t("footer.contact_phone")}
              </div>
              <div className="footer-contact-item">
                <MapPinned size={16} />
                {t("footer.contact_location")}
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="footer-copyright">
              {t("footer.copyright")}
            </span>
            <div className="footer-socials">
              <a
                className="footer-social-link"
                href="#"
                aria-label="Twitter"
              >
                <Twitter size={16} />
              </a>
              <a
                className="footer-social-link"
                href="#"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                className="footer-social-link"
                href="#"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
