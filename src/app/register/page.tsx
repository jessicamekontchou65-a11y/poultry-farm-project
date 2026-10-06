"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { FileUp, ShieldCheck } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import ThemeToggle from "../ThemeToggle";

type AccountRole = "customer" | "farmer" | "shopkeeper";

const ACCOUNT_ROLES: AccountRole[] = ["customer", "farmer", "shopkeeper"];
const MAX_DOC_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<AccountRole>("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [docName, setDocName] = useState("");
  const [docDataUrl, setDocDataUrl] = useState("");
  const [docMime, setDocMime] = useState("");

  const needsProof = role === "farmer" || role === "shopkeeper";

  async function onDocumentChange(e: ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) {
      setDocName("");
      setDocDataUrl("");
      setDocMime("");
      return;
    }

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      setError(
        lang === "en"
          ? "Please upload a PDF or image (JPG, PNG, WEBP)."
          : "Veuillez téléverser un PDF ou une image (JPG, PNG, WEBP)."
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_DOC_BYTES) {
      setError(
        lang === "en"
          ? "Document is too large. Maximum size is 2 MB."
          : "Document trop volumineux. Taille maximale : 2 Mo."
      );
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setDocName(file.name);
      setDocDataUrl(dataUrl);
      setDocMime(file.type || "application/octet-stream");
    } catch {
      setError(lang === "en" ? "Could not read the document." : "Impossible de lire le document.");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(lang === "en" ? "Passwords do not match" : "Les mots de passe ne correspondent pas");
      return;
    }

    if (!ACCOUNT_ROLES.includes(role)) {
      setError(lang === "en" ? "Please choose an account role" : "Veuillez choisir un rôle");
      return;
    }

    if (needsProof && !docDataUrl) {
      setError(
        role === "farmer"
          ? lang === "en"
            ? "Upload an official document that proves you are a farmer."
            : "Téléversez un document officiel prouvant que vous êtes éleveur."
          : lang === "en"
            ? "Upload an official document that proves you are a shopkeeper."
            : "Téléversez un document officiel prouvant que vous êtes boutiquier."
      );
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName,
        email,
        phone: phone || "",
        password,
        role,
        ...(needsProof
          ? {
              verificationDocument: docDataUrl,
              verificationDocumentName: docName,
              verificationDocumentMimeType: docMime,
            }
          : {}),
      });
      router.push(`/dashboard/${role}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === "en"
            ? "Registration failed"
            : "Échec de l'inscription"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page auth-layout auth-layout-register">
      <header className="auth-header">
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
          <p className="resource-kicker">{t("auth.create_account")}</p>
          <h1 className="auth-brand-heading">PoultryHub</h1>
          <p className="auth-subtext">{t("auth.register_sub")}</p>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">🛒</span>
              <div>
                <strong>{lang === "en" ? "Customer accounts welcome" : "Comptes clients bienvenus"}</strong>
                <p>
                  {lang === "en"
                    ? "Create a customer account and start shopping right away."
                    : "Créez un compte client et commencez vos achats immédiatement."}
                </p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">📄</span>
              <div>
                <strong>{lang === "en" ? "Verified professionals" : "Professionnels vérifiés"}</strong>
                <p>
                  {lang === "en"
                    ? "Farmers and shopkeepers upload an official document for trust and certification."
                    : "Éleveurs et boutiquiers téléversent un document officiel pour certification."}
                </p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">🔒</span>
              <div>
                <strong>{lang === "en" ? "Secure platform" : "Plateforme sécurisée"}</strong>
                <p>
                  {lang === "en"
                    ? "Verified directories help keep transactions clean and reliable."
                    : "Des répertoires vérifiés garantissent des transactions saines."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form className="connected-form" onSubmit={submit}>
          <div className="form-group">
            <label>{t("auth.fullname")}</label>
            <input
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@doe.com"
              required
            />
          </div>

          <div className="form-group">
            <label>{t("auth.phone")}</label>
            <input
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 6xx xxx xxx"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">{lang === "en" ? "Account role" : "Rôle du compte"}</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as AccountRole);
                setDocName("");
                setDocDataUrl("");
                setDocMime("");
                setError("");
              }}
              required
            >
              <option value="customer">{lang === "en" ? "Customer" : "Client"}</option>
              <option value="farmer">{lang === "en" ? "Farmer" : "Éleveur"}</option>
              <option value="shopkeeper">{lang === "en" ? "Shopkeeper" : "Boutiquier"}</option>
            </select>
          </div>

          {needsProof && (
            <div className="form-group register-doc-field">
              <label htmlFor="verificationDocument">
                {role === "farmer"
                  ? lang === "en"
                    ? "Official farmer proof document"
                    : "Document officiel d'éleveur"
                  : lang === "en"
                    ? "Official shopkeeper proof document"
                    : "Document officiel de boutiquier"}
              </label>
              <p className="register-doc-hint">
                <ShieldCheck size={14} />
                {role === "farmer"
                  ? lang === "en"
                    ? "Upload a farm registration, cooperative card, or other official document. PDF or image, max 2 MB."
                    : "Téléversez un enregistrement de ferme ou document officiel. PDF ou image, max 2 Mo."
                  : lang === "en"
                    ? "Upload a trade license, shop registration, or other official document. PDF or image, max 2 MB."
                    : "Téléversez une licence commerciale ou document officiel. PDF ou image, max 2 Mo."}
              </p>
              <label htmlFor="verificationDocument" className="register-doc-drop">
                <FileUp size={18} />
                <span>
                  {docName
                    ? docName
                    : lang === "en"
                      ? "Choose file to upload"
                      : "Choisir un fichier"}
                </span>
              </label>
              <input
                id="verificationDocument"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png"
                onChange={onDocumentChange}
                required={needsProof}
              />
            </div>
          )}

          <div className="form-group">
            <label>{t("auth.password")}</label>
            <input
              name="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>{t("auth.confirm_password")}</label>
            <input
              name="confirmPassword"
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? lang === "en"
                ? "Creating..."
                : "Création en cours..."
              : t("auth.register_btn")}
          </button>

          {error ? <p className="form-error-banner">{error}</p> : null}

          <p className="auth-footer-link">
            {t("auth.has_account")}{" "}
            <Link href="/login" style={{ color: "var(--color-accent)", fontWeight: "600" }}>
              {t("auth.login_btn")}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
