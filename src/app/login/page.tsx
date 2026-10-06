/**"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import ThemeToggle from "../ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");
    setLoading(true);
    try {
      await login(String(formData.get("identifier")), String(formData.get("password")));
      router.push("/dashboard/customer");
    } catch (err) {
      setError(err instanceof Error ? err.message : (lang === "en" ? "Login failed" : "Échec de la connexion"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page auth-layout auth-layout-login">
      {/* Mini top bar */
    /** <header className="auth-header">
        <Link href="/" className="dashboard-logo">
          PoultryHub
        </Link>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="nav-btn lang-toggle-btn"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            type="button"
          >
            {lang === "en" ? "FR" : "EN"}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <section className="auth-panel glass-card">
        <div className="auth-panel-heading">
          <p className="resource-kicker">{t("auth.welcome")}</p>
          <h1 className="auth-brand-heading">PoultryHub</h1>
          <p className="auth-subtext">{t("auth.login_sub")}</p>
          
          <div className="auth-features-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">🐥</span>
              <div>
                <strong>{lang === "en" ? "Real-time Flock Management" : "Gestion des lots en direct"}</strong>
                <p>{lang === "en" ? "Track feeding, vaccinations, mortality, and egg production logs." : "Suivez l'alimentation, les vaccins, les décès et la ponte."}</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">🏪</span>
              <div>
                <strong>{lang === "en" ? "Integrated Marketplace" : "Marché Intégré"}</strong>
                <p>{lang === "en" ? "Buy farm supplies or sell directly to verified local buyers." : "Achetez du matériel ou vendez à des acheteurs locaux vérifiés."}</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">📊</span>
              <div>
                <strong>{lang === "en" ? "Smart Analytics & Reports" : "Analyses & Rapports Intelligents"}</strong>
                <p>{lang === "en" ? "Understand profit margins, mortality trends, and feed efficiency." : "Visualisez vos marges bénéficiaires, la mortalité et l'alimentation."}</p>
              </div>
            </div>
          </div>
        </div>

        <form className="connected-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("auth.email_phone")}</label>
            <input name="identifier" type="text" placeholder="name@domain.com" required />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>{t("auth.password")}</label>
              <Link href="/forgot-password" style={{ fontSize: "0.8rem", color: "var(--color-accent)" }}>
                {t("auth.forgot_password")}
              </Link>
            </div>
            <input name="password" type="password" placeholder="••••••••" required />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (lang === "en" ? "Logging in..." : "Connexion en cours...") : t("auth.login_btn")}
          </button>

          {error ? <p className="form-error-banner">{error}</p> : null}

          <p className="auth-footer-link">
            {t("auth.no_account")}{" "}
            <Link href="/register" style={{ color: "var(--color-accent)", fontWeight: "600" }}>
              {t("auth.create_account")}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
**/


"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import ThemeToggle from "../ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const identifier = String(
      formData.get("identifier") || ""
    );

    const password = String(
      formData.get("password") || ""
    );

    setError("");
    setLoading(true);

    try {
      const user = await login(
        identifier,
        password
      );

      /*
       * Get the role returned by the backend.
       *
       * toLowerCase() makes these equivalent:
       * ADMIN
       * Admin
       * admin
       */
      const roles = Array.isArray(user?.roles)
        ? user.roles.map((role) => role.toLowerCase().trim())
        : [];

      if (roles.includes("admin") || roles.includes("super_admin")) {
          router.push("/dashboard/admin");
          return;
      }

      if (roles.includes("farmer")) {
          router.push("/dashboard/farmer");
          return;
      }

      if (roles.includes("shopkeeper")) {
          router.push("/dashboard/shopkeeper");
          return;
      }

      if (roles.includes("customer")) {
          router.push("/dashboard/customer");
          return;
      }

      setError(
        lang === "en"
          ? "Your account does not have a valid role."
          : "Votre compte n'a pas de rôle valide."
      );

      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === "en"
            ? "Login failed"
            : "Échec de la connexion"
      );

      setLoading(false);
    }
  }

  return (
    <main className="app-page auth-layout auth-layout-login">
      {/* Mini top bar */}
      <header className="auth-header">
        <Link
          href="/"
          className="dashboard-logo"
        >
          PoultryHub
        </Link>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <button
            className="nav-btn lang-toggle-btn"
            onClick={() =>
              setLang(
                lang === "en" ? "fr" : "en"
              )
            }
            type="button"
          >
            {lang === "en" ? "FR" : "EN"}
          </button>

          <ThemeToggle />
        </div>
      </header>

      <section className="auth-panel glass-card">
        <div className="auth-panel-heading">
          <p className="resource-kicker">
            {t("auth.welcome")}
          </p>

          <h1 className="auth-brand-heading">
            PoultryHub
          </h1>

          <p className="auth-subtext">
            {t("auth.login_sub")}
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                🐥
              </span>

              <div>
                <strong>
                  {lang === "en"
                    ? "Real-time Flock Management"
                    : "Gestion des lots en direct"}
                </strong>

                <p>
                  {lang === "en"
                    ? "Track feeding, vaccinations, mortality, and egg production logs."
                    : "Suivez l'alimentation, les vaccins, les décès et la ponte."}
                </p>
              </div>
            </div>

            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                🏪
              </span>

              <div>
                <strong>
                  {lang === "en"
                    ? "Integrated Marketplace"
                    : "Marché Intégré"}
                </strong>

                <p>
                  {lang === "en"
                    ? "Buy farm supplies or sell directly to verified local buyers."
                    : "Achetez du matériel ou vendez à des acheteurs locaux vérifiés."}
                </p>
              </div>
            </div>

            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                📊
              </span>

              <div>
                <strong>
                  {lang === "en"
                    ? "Smart Analytics & Reports"
                    : "Analyses & Rapports Intelligents"}
                </strong>

                <p>
                  {lang === "en"
                    ? "Understand profit margins, mortality trends, and feed efficiency."
                    : "Visualisez vos marges bénéficiaires, la mortalité et l'alimentation."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form
          className="connected-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label>
              {t("auth.email_phone")}
            </label>

            <input
              name="identifier"
              type="text"
              placeholder="name@domain.com"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>
                {t("auth.password")}
              </label>

              <Link
                href="/forgot-password"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-accent)",
                }}
              >
                {t("auth.forgot_password")}
              </Link>
            </div>

            <input
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading
              ? lang === "en"
                ? "Logging in..."
                : "Connexion en cours..."
              : t("auth.login_btn")}
          </button>

          {error ? (
            <p className="form-error-banner">
              {error}
            </p>
          ) : null}

          <p className="auth-footer-link">
            {t("auth.no_account")}{" "}

            <Link
              href="/register"
              style={{
                color: "var(--color-accent)",
                fontWeight: "600",
              }}
            >
              {t("auth.create_account")}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
