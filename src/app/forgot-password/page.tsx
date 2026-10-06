"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import ThemeToggle from "../ThemeToggle";

export default function ForgotPasswordPage() {
  const { lang, setLang, t } = useLanguage();
  const [success, setSuccess] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(true);
  }

  return (
    <main className="app-page auth-layout">
      {/* Mini top bar */}
      <header className="auth-header">
        <Link href="/" className="dashboard-logo">
          PoultryHub
        </Link>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="nav-btn lang-toggle-btn"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
          >
            {lang === "en" ? "FR" : "EN"}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <section className="auth-panel glass-card">
        <div className="auth-panel-heading">
          <p className="resource-kicker">{t("auth.forgot_password")}</p>
          <h1 className="auth-brand-heading">PoultryHub</h1>
          <p className="auth-subtext">
            {lang === "en"
              ? "Enter your email to receive a password reset link."
              : "Saisissez votre e-mail pour recevoir un lien de réinitialisation."}
          </p>
          
          <div className="auth-features-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">🔒</span>
              <div>
                <strong>{lang === "en" ? "Password Recovery" : "Récupération de compte"}</strong>
                <p>{lang === "en" ? "We will send a secure credentials update link directly to your inbox." : "Nous enverrons un lien sécurisé de mise à jour directement à votre boîte mail."}</p>
              </div>
            </div>
          </div>
        </div>

        {success ? (
          <div className="form-success-banner" style={{ padding: "20px", borderRadius: "8px", margin: "20px 0" }}>
            <p style={{ color: "#10b981", fontWeight: "600" }}>
              {lang === "en"
                ? "If your email is registered, we have sent a reset link."
                : "Si votre e-mail est enregistré, nous avons envoyé un lien."}
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                marginTop: "16px",
                color: "var(--color-accent)",
                fontWeight: "600"
              }}
            >
              {t("auth.login_btn")}
            </Link>
          </div>
        ) : (
          <form className="connected-form" onSubmit={submit}>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" placeholder="john@doe.com" required />
            </div>

            <button type="submit" className="auth-submit-btn">
              {lang === "en" ? "Send link" : "Envoyer le lien"}
            </button>

            <p className="auth-footer-link">
              <Link href="/login" style={{ color: "var(--color-accent)", fontWeight: "600" }}>
                {lang === "en" ? "Back to Login" : "Retour à la connexion"}
              </Link>
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
