"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Farm } from "@/lib/types";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Layers,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Tractor,
  Warehouse
} from "lucide-react";
import Link from "next/link";

export default function FarmerFarmsPage() {
  const { token, user } = useAuth();
  const { lang, t } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [farmType, setFarmType] = useState("broiler");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [docName, setDocName] = useState("");
  const [docDataUrl, setDocDataUrl] = useState("");
  
  const [msg, setMsg] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const MAX_DOC_BYTES = 2 * 1024 * 1024;

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  const farmTypes = [
    { value: "broiler", label: lang === "en" ? "Broiler production" : "Poulets de chair", hint: lang === "en" ? "Fast growth cycles" : "Cycles de croissance rapides" },
    { value: "layer", label: lang === "en" ? "Layer production" : "Pondeuses", hint: lang === "en" ? "Egg laying flocks" : "Lots de ponte" },
    { value: "chick_production", label: lang === "en" ? "Chick production" : "Production de poussins", hint: lang === "en" ? "Hatchery and brooding" : "Couvoir et démarrage" },
    { value: "egg_production", label: lang === "en" ? "Egg production" : "Production d'oeufs", hint: lang === "en" ? "Commercial egg sales" : "Vente commerciale d'oeufs" },
    { value: "mixed_poultry", label: lang === "en" ? "Mixed poultry" : "Aviculture mixte", hint: lang === "en" ? "Multiple flock types" : "Plusieurs types de lots" },
    { value: "local_chicken", label: lang === "en" ? "Local chicken" : "Poulet local", hint: lang === "en" ? "Village and hardy breeds" : "Races locales résistantes" }
  ];

  const selectedFarmType = farmTypes.find((type) => type.value === farmType) ?? farmTypes[0];

  const farmStats = useMemo(() => {
    const approved = farms.filter((farm) => farm.verificationStatus === "approved").length;
    const pending = farms.filter((farm) => farm.verificationStatus === "pending").length;
    const rejected = farms.filter((farm) => farm.verificationStatus === "rejected").length;
    return { approved, pending, rejected };
  }, [farms]);

  const fallbackCity = lang === "en" ? "City pending" : "Ville à renseigner";
  const fallbackRegion = lang === "en" ? "Region pending" : "Région à renseigner";

  const fetchFarms = async () => {
    if (!token) return;
    try {
      const res = await api.list<Farm>("/farms/my", undefined, token);
      setFarms(res.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchFarms();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!docDataUrl || !docName) {
      setMsg(
        lang === "en"
          ? "Upload an official document that proves this farm is legitimate."
          : "Téléversez un document officiel prouvant que cet élevage est légitime."
      );
      return;
    }
    setFormLoading(true);
    setMsg("");

    try {
      const res = await api.create<Farm>("/farms", {
        name,
        farmType,
        location,
        city,
        region,
        description,
        phone,
        verificationDocument: docDataUrl,
        verificationDocumentName: docName,
        pickupAvailable: true,
        openingHours: "08:00 - 18:00"
      }, token);

      // Add to list and clear form
      setFarms((prev) => [res.data, ...prev]);
      setName("");
      setLocation("");
      setCity("");
      setRegion("");
      setDescription("");
      setPhone("");
      setDocName("");
      setDocDataUrl("");
      setMsg(lang === "en" ? "Farm registered! Pending admin verification." : "Élevage enregistré ! En attente d'approbation.");
      
      // Update local storage roles if user is now a farmer
      if (user && !user.roles.includes("farmer")) {
        const nextUser = { ...user, roles: [...user.roles, "farmer"] };
        localStorage.setItem("poultryhub-user", JSON.stringify(nextUser));
        window.location.reload(); // Refresh session layout roles
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="farm-create-page">
        <section className="farm-create-hero">
          <div className="farm-create-hero__content">
            <p className="resource-kicker">{t("dash.sidebar.farmer")}</p>
            <h1>{lang === "en" ? "Build your farm command center." : "Créez le centre de pilotage de votre élevage."}</h1>
            <p>
              {lang === "en"
                ? "Register a poultry site, submit it for verification, then manage batches, feed, mortality, vaccines, sales, and reports from one trusted workspace."
                : "Enregistrez votre site avicole, soumettez-le à la vérification, puis gérez lots, aliment, mortalité, vaccins, ventes et rapports depuis un espace fiable."}
            </p>
            <div className="farm-create-hero__signals" aria-label="Farm registration status">
              <span><BadgeCheck size={16} /> {farmStats.approved} {lang === "en" ? "approved" : "approuvé(s)"}</span>
              <span><Clock size={16} /> {farmStats.pending} {lang === "en" ? "pending" : "en attente"}</span>
              <span><AlertCircle size={16} /> {farmStats.rejected} {lang === "en" ? "needs review" : "à corriger"}</span>
            </div>
            <Link href="/dashboard/farmer/manage" className="fm-btn fm-btn--primary" style={{ marginTop: 12 }}>
              {lang === "en" ? "Open Farm Management" : "Ouvrir Gestion de ferme"}
            </Link>
          </div>
          <div className="farm-create-hero__panel">
            <ShieldCheck size={24} />
            <span>{lang === "en" ? "Verification protects buyers, sellers, and farm data integrity." : "La vérification protège les acheteurs, vendeurs et données d'élevage."}</span>
          </div>
        </section>

        <div className="farm-create-layout">
          <section className="farm-create-main">
            <div className="dash-section__header">
              <div>
                <p className="resource-kicker">{lang === "en" ? "Portfolio" : "Portefeuille"}</p>
                <h2 className="dash-section__title">{lang === "en" ? "My Farms" : "Mes Élevages"}</h2>
              </div>
            </div>

            {loading ? (
              <div className="farm-create-loading">
                <Tractor size={26} />
                <span>{lang === "en" ? "Loading your farms..." : "Chargement de vos élevages..."}</span>
              </div>
            ) : farms.length === 0 ? (
              <div className="farm-create-empty">
                <div className="farm-create-empty__icon"><Warehouse size={30} /></div>
                <h3>{lang === "en" ? "No registered farms yet" : "Aucun élevage enregistré"}</h3>
                <p>{lang === "en" ? "Create your first farm to unlock batch tracking and performance reporting." : "Créez votre premier élevage pour débloquer le suivi des lots et les rapports."}</p>
              </div>
            ) : (
              <div className="farm-create-list">
                {farms.map((farm) => (
                  <article key={farm._id} className="farm-create-card">
                    <div className="farm-create-card__top">
                      <div className="farm-create-card__mark">
                        <Tractor size={20} />
                      </div>
                      <div>
                        <h3>{farm.name}</h3>
                        <span>{farm.farmType.replace(/_/g, " ")}</span>
                      </div>
                      <span className={`dash-badge dash-badge--${farm.verificationStatus}`}>
                        {t(`farm.status.${farm.verificationStatus}`)}
                      </span>
                    </div>

                    {farm.rejectionReason && (
                      <div className="farm-create-card__alert">
                        <AlertCircle size={16} />
                        <span><strong>{lang === "en" ? "Review note:" : "Note :"}</strong> {farm.rejectionReason}</span>
                      </div>
                    )}

                    <div className="farm-create-card__meta">
                      <span><MapPin size={15} /> {farm.city || fallbackCity}, {farm.region || fallbackRegion}</span>
                      {farm.phone && <span><Phone size={15} /> {farm.phone}</span>}
                    </div>

                    <div className="farm-create-card__bottom">
                      <span>{farm.description || (lang === "en" ? "Farm details will appear here after verification." : "Les détails de l'élevage apparaîtront ici après vérification.")}</span>
                      {farm.verificationStatus === "approved" ? (
                        <Link href={`/dashboard/farmer/farms/${farm._id}`}>
                          {lang === "en" ? "Manage batches" : "Gérer les lots"}
                          <ChevronRight size={16} />
                        </Link>
                      ) : (
                        <span className="farm-create-card__pending">
                          {lang === "en" ? "Awaiting approval" : "Validation en cours"}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="farm-create-aside">
            <div className="farm-create-form-card">
              <div className="farm-create-form-card__head">
                <div className="farm-create-form-card__icon">
                  <Plus size={20} />
                </div>
                <div>
                  <p className="resource-kicker">{lang === "en" ? "New site" : "Nouveau site"}</p>
                  <h2>{t("farm.create.title")}</h2>
                </div>
              </div>

              <div className="farm-create-type-preview">
                <Layers size={18} />
                <div>
                  <strong>{selectedFarmType.label}</strong>
                  <span>{selectedFarmType.hint}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="connected-form farm-create-form">
                <div className="form-group">
                  <label>{t("farm.create.name")}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder={lang === "en" ? "Akwa Poultry Farm" : "Ferme avicole Akwa"} />
                </div>

                <div className="form-group">
                  <label>{t("farm.create.type")}</label>
                  <select value={farmType} onChange={(e) => setFarmType(e.target.value)}>
                    {farmTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="farm-create-form__split">
                  <div className="form-group">
                    <label>{t("farm.create.phone")}</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6xx xxx xxx" />
                  </div>

                  <div className="form-group">
                    <label>{t("farm.create.city")}</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Douala" />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("farm.create.location")}</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder={lang === "en" ? "Street, quarter, landmark" : "Rue, quartier, repère"} />
                </div>

                <div className="form-group">
                  <label>{t("farm.create.region")}</label>
                  <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Littoral" />
                </div>

                <div className="form-group">
                  <label>{t("farm.create.desc")}</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder={lang === "en" ? "Describe capacity, poultry focus, housing, and sales intent." : "Décrivez la capacité, le type d'élevage, le bâtiment et l'objectif de vente."} />
                </div>

                <div className="form-group register-doc-field">
                  <label htmlFor="farmProofDoc">
                    {lang === "en" ? "Official farm proof document" : "Document officiel de la ferme"}
                  </label>
                  <p className="register-doc-hint">
                    <ShieldCheck size={14} />
                    {lang === "en"
                      ? "Required for every new farm. Upload registration, cooperative card, or similar proof (PDF/image, max 2 MB)."
                      : "Obligatoire pour chaque nouvelle ferme. Téléversez un enregistrement ou preuve similaire (PDF/image, max 2 Mo)."}
                  </p>
                  <label htmlFor="farmProofDoc" className="register-doc-drop">
                    <Plus size={18} />
                    <span>{docName || (lang === "en" ? "Choose file to upload" : "Choisir un fichier")}</span>
                  </label>
                  <input
                    id="farmProofDoc"
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png"
                    required
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > MAX_DOC_BYTES) {
                        setMsg(lang === "en" ? "Document too large (max 2 MB)." : "Document trop volumineux (max 2 Mo).");
                        e.target.value = "";
                        return;
                      }
                      try {
                        const dataUrl = await readFileAsDataUrl(file);
                        setDocName(file.name);
                        setDocDataUrl(dataUrl);
                      } catch {
                        setMsg(lang === "en" ? "Could not read document." : "Impossible de lire le document.");
                      }
                    }}
                  />
                </div>

                <button type="submit" className="farm-create-submit" disabled={formLoading}>
                  {formLoading ? (lang === "en" ? "Registering..." : "Enregistrement...") : t("farm.create.btn")}
                  <ArrowRight size={17} />
                </button>

                {msg && (
                  <p className={msg.includes("registered") || msg.includes("enregistré") ? "form-success-banner" : "form-error-banner"}>
                    {msg}
                  </p>
                )}
              </form>
            </div>

            <div className="farm-create-checklist">
              <div>
                <ClipboardCheck size={19} />
                <strong>{lang === "en" ? "Verification checklist" : "Liste de vérification"}</strong>
              </div>
              <ul>
                <li>{lang === "en" ? "Use a recognizable farm name." : "Utilisez un nom d'élevage reconnaissable."}</li>
                <li>{lang === "en" ? "Add a precise city, region, and location." : "Ajoutez ville, région et localisation précise."}</li>
                <li>{lang === "en" ? "Describe your flock focus and capacity." : "Décrivez votre production et capacité."}</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
