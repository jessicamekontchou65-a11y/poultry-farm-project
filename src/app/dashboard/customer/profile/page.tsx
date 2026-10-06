"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import { api } from "@/lib/api";
import { 
  Camera, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  CheckCircle, 
  Store, 
  Tractor, 
  UploadCloud, 
  ShieldCheck, 
  Lock, 
  X,
  AlertCircle,
  Save,
  Sparkles,
  BadgeCheck
} from "lucide-react";

// Inline vector presets (properly encoded for CSS/image safety)
const PRESET_AVATARS = [
  {
    name: "Chick",
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23FEF08A"/><circle cx="35" cy="45" r="6" fill="%231E293B"/><circle cx="65" cy="45" r="6" fill="%231E293B"/><polygon points="42,55 58,55 50,70" fill="%23EA580C"/><circle cx="28" cy="52" r="4" fill="%23F87171" opacity="0.4"/><circle cx="72" cy="52" r="4" fill="%23F87171" opacity="0.4"/></svg>`
  },
  {
    name: "Farmer",
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23A7F3D0"/><path d="M25,80 Q50,55 75,80" fill="%23047857"/><circle cx="50" cy="45" r="18" fill="%23FDBA74"/><path d="M25,35 Q50,20 75,35 Q50,28 25,35" fill="%23B45309"/></svg>`
  },
  {
    name: "Shopkeeper",
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23BFDBFE"/><rect x="25" y="65" width="50" height="35" rx="8" fill="%231E3A8A"/><circle cx="50" cy="45" r="16" fill="%23FDBA74"/><path d="M20,35 H80 V45 H20 Z" fill="%233B82F6"/></svg>`
  },
  {
    name: "Eggs",
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23FED7AA"/><ellipse cx="50" cy="50" rx="18" ry="24" fill="%23FFF" transform="rotate(-15 50 50)"/><ellipse cx="50" cy="50" rx="14" ry="20" fill="%23FFF" opacity="0.9" transform="rotate(-15 50 50)"/></svg>`
  }
];

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const { lang, t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("Cameroon");
  const [roles, setRoles] = useState<string[]>(["customer"]);
  const [isVerified, setIsVerified] = useState(false);
  const [status, setStatus] = useState("active");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = fullName || (lang === "en" ? "Profile Information" : "Informations de Profil");
  const firstName = fullName?.split(" ")[0] || (lang === "en" ? "Member" : "Membre");
  const profileFields = [fullName, phone, email, address, city, region, country, avatar];
  const completion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  const primaryRole = roles.includes("farmer")
    ? t("auth.profile.role_farmer")
    : roles.includes("shopkeeper")
      ? t("auth.profile.role_shopkeeper")
      : t("auth.profile.role_customer");

  // Synchronize state from user context or fetch fresh from API
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setAvatar(user.avatar || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setRegion(user.region || "");
      setCountry(user.country || "Cameroon");
      setRoles(user.roles || ["customer"]);
      setIsVerified(user.isVerified || false);
      setStatus(user.status || "active");

      if (token && user._id) {
        api.get<any>(`/resources/users/${user._id}`, token)
          .then((res) => {
            const data = res.data;
            setFullName(data.fullName || "");
            setPhone(data.phone || "");
            setEmail(data.email || "");
            setAvatar(data.avatar || "");
            setAddress(data.address || "");
            setCity(data.city || "");
            setRegion(data.region || "");
            setCountry(data.country || "Cameroon");
            setRoles(data.roles || ["customer"]);
            setIsVerified(data.isVerified || false);
            setStatus(data.status || "active");
          })
          .catch(() => {});
      }
    }
  }, [user, token]);

  // Clear toast notifications after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle personal profile and address details submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?._id) return;
    setLoading(true);
    setMessage("");

    try {
      await api.update(`/resources/users/${user._id}`, {
        fullName,
        phone,
        address,
        city,
        region,
        country
      }, token);

      // Refresh authentication context state
      const nextUser = {
        ...user,
        fullName,
        phone,
        address,
        city,
        region,
        country,
        roles,
        isVerified,
        status
      };
      updateUser(nextUser);

      setMessage(t("auth.profile.success"));
      setMessageType("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Save profile photo avatar (Base64 data or SVG preset)
  const handleSaveAvatar = async (nextAvatar: string) => {
    if (!token || !user?._id) return;
    setLoading(true);
    setMessage("");

    try {
      await api.update(`/resources/users/${user._id}`, {
        avatar: nextAvatar
      }, token);

      setAvatar(nextAvatar);
      const nextUser = { ...user, avatar: nextAvatar };
      updateUser(nextUser);

      setMessage(t("auth.profile.success"));
      setMessageType("success");
      setShowAvatarModal(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update avatar");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Convert uploaded image file to Base64 string
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setMessage(lang === "en" ? "Image size must be less than 1MB" : "L'image doit faire moins de 1 Mo");
      setMessageType("error");
      setShowAvatarModal(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleSaveAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Activate role on-demand
  const handleActivateRole = async (role: "farmer" | "shopkeeper") => {
    if (!token || !user?._id) return;
    if (roles.includes(role)) return;

    setLoading(true);
    setMessage("");

    try {
      const nextRoles = [...roles, role];
      await api.update(`/resources/users/${user._id}`, {
        roles: nextRoles
      }, token);

      setRoles(nextRoles);
      const nextUser = { ...user, roles: nextRoles };
      updateUser(nextUser);

      const roleName = role === "farmer" 
        ? (lang === "en" ? "Farmer Space" : "Espace Éleveur")
        : (lang === "en" ? "Shopkeeper Space" : "Espace Boutique");
      
      setMessage(lang === "en" ? `${roleName} successfully unlocked!` : `${roleName} déverrouillé avec succès !`);
      setMessageType("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to activate role");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="profile-container">
        
        {/* Cover Banner */}
        <div className="profile-cover">
          <div className="profile-cover__content">
            <button type="button" className="profile-cover__avatar-container" onClick={() => setShowAvatarModal(true)}>
              {avatar ? (
                <img src={avatar} alt={displayName} className="profile-cover__avatar" />
              ) : (
                <div className="profile-cover__avatar-fallback">
                  {fullName ? fullName.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <div className="profile-avatar-edit-overlay">
                <Camera size={18} />
                <span>{lang === "en" ? "Edit" : "Modifier"}</span>
              </div>
            </button>
            <div className="profile-cover__info">
              <span className="profile-cover__eyebrow">
                <Sparkles size={14} />
                {lang === "en" ? "Premium account workspace" : "Espace compte premium"}
              </span>
              <h1>{displayName}</h1>
              <div className="profile-cover__meta">
                <span><Mail size={14} />{email || (lang === "en" ? "Email pending" : "Email en attente")}</span>
                <span><Globe size={14} />{country}</span>
                <span><BadgeCheck size={14} />{primaryRole}</span>
              </div>
              <div className="profile-badge-row">
                {roles.map((role) => (
                  <span key={role} className={`profile-badge profile-badge--${role}`}>
                    {role === "customer" && t("auth.profile.role_customer")}
                    {role === "farmer" && t("auth.profile.role_farmer")}
                    {role === "shopkeeper" && t("auth.profile.role_shopkeeper")}
                    {role === "admin" && "Admin"}
                    {role === "super_admin" && "Super Admin"}
                  </span>
                ))}
                {isVerified && (
                  <span className="profile-badge profile-badge--verified">
                    <ShieldCheck size={13} style={{ marginRight: "3px" }} />
                    {lang === "en" ? "Verified" : "Vérifié"}
                  </span>
                )}
              </div>
            </div>
            <div className="profile-cover__aside">
              <span>{lang === "en" ? "Profile strength" : "Niveau du profil"}</span>
              <strong>{completion}%</strong>
              <div className="profile-strength" aria-hidden="true">
                <span style={{ width: `${completion}%` }} />
              </div>
              <small>
                {lang === "en"
                  ? `${firstName}, keep your details current for smoother orders.`
                  : `${firstName}, gardez vos informations à jour pour simplifier vos commandes.`}
              </small>
            </div>
          </div>
        </div>

        {/* Success/Error Banner */}
        {message && (
          <div 
            className={`profile-alert ${messageType === "success" ? "form-success-banner" : "form-error-banner"}`} 
          >
            {messageType === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="profile-dashboard-grid">
            
            {/* Left Column - Form Details */}
            <div className="profile-left-col">
              
              {/* Card 1: Personal Info */}
              <div className="profile-card">
                <div className="profile-card__title">
                  <div className="profile-card__title-left">
                    <UserIcon size={18} />
                    <span>{t("auth.profile.personal_info")}</span>
                  </div>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label>{t("auth.profile.fullname")}</label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Jane Doe" 
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label>{t("auth.phone")}</label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+237 6xx xxx xxx" 
                    />
                  </div>

                  <div className="profile-field profile-field--wide">
                    <label>Email</label>
                    <div className="profile-email-lock">
                      <input 
                        type="email" 
                        value={email} 
                        disabled 
                      />
                      <Lock size={15} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Delivery & Shipping Address */}
              <div className="profile-card">
                <div className="profile-card__title">
                  <div className="profile-card__title-left">
                    <MapPin size={18} />
                    <span>{t("auth.profile.shipping_info")}</span>
                  </div>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-field profile-field--wide">
                    <label>{t("auth.profile.address")}</label>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      placeholder="Rue de la joie, Akwa" 
                    />
                  </div>

                  <div className="profile-field">
                    <label>{t("auth.profile.city")}</label>
                    <input 
                      type="text" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      placeholder="Douala" 
                    />
                  </div>

                  <div className="profile-field">
                    <label>{t("auth.profile.region")}</label>
                    <input 
                      type="text" 
                      value={region} 
                      onChange={(e) => setRegion(e.target.value)} 
                      placeholder="Littoral" 
                    />
                  </div>

                  <div className="profile-field profile-field--wide">
                    <label>{t("auth.profile.country")}</label>
                    <select value={country} onChange={(e) => setCountry(e.target.value)}>
                      <option value="Cameroon">Cameroon</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Gabon">Gabon</option>
                      <option value="Chad">Chad</option>
                      <option value="Congo">Congo</option>
                      <option value="Central African Republic">Central African Republic</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <button 
                type="submit" 
                className="profile-save-btn" 
                disabled={loading}
              >
                <Save size={17} />
                {loading ? (lang === "en" ? "Saving..." : "Enregistrement...") : t("auth.profile.save")}
              </button>
            </div>

            {/* Right Column - Roles & Spaces */}
            <div className="profile-right-col">
              <div className="profile-card">
                <div className="profile-card__title">
                  <div className="profile-card__title-left">
                    <Store size={18} />
                    <span>{t("auth.profile.roles_management")}</span>
                  </div>
                </div>

                <div className="role-card-list">
                  
                  {/* Customer Space */}
                  <div className="role-card-item role-card-item--active">
                    <div className="role-card-item__info">
                      <div className="role-card-item__icon">
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <div className="role-card-item__title">{t("auth.profile.role_customer")}</div>
                        <div className="role-card-item__desc">
                          {lang === "en" 
                            ? "Browse marketplace products, make purchases, and message sellers." 
                            : "Parcourir les produits du marché, acheter, et contacter les vendeurs."}
                        </div>
                      </div>
                    </div>
                    <div className="role-card-item__status-text">
                      <CheckCircle size={14} />
                      <span>{t("auth.profile.role_active")}</span>
                    </div>
                  </div>

                  {/* Farmer Space */}
                  <div className={`role-card-item ${roles.includes("farmer") ? "role-card-item--active" : ""}`}>
                    <div className="role-card-item__info">
                      <div className="role-card-item__icon">
                        <Tractor size={18} />
                      </div>
                      <div>
                        <div className="role-card-item__title">{t("auth.profile.role_farmer")}</div>
                        <div className="role-card-item__desc">
                          {lang === "en" 
                            ? "Track batches, vaccines, and record egg production & sales." 
                            : "Suivre les lots, les vaccins, la production d'œufs et les ventes."}
                        </div>
                      </div>
                    </div>
                    {roles.includes("farmer") ? (
                      <div className="role-card-item__status-text">
                        <CheckCircle size={14} />
                        <span>{t("auth.profile.role_active")}</span>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => handleActivateRole("farmer")}
                        className="role-card-item__action-btn"
                        disabled={loading}
                      >
                        {t("auth.profile.role_activate")}
                      </button>
                    )}
                  </div>

                  {/* Shopkeeper Space */}
                  <div className={`role-card-item ${roles.includes("shopkeeper") ? "role-card-item--active" : ""}`}>
                    <div className="role-card-item__info">
                      <div className="role-card-item__icon">
                        <Store size={18} />
                      </div>
                      <div>
                        <div className="role-card-item__title">{t("auth.profile.role_shopkeeper")}</div>
                        <div className="role-card-item__desc">
                          {lang === "en" 
                            ? "Launch shops, publish feeds & equipment, and fulfill buyer orders." 
                            : "Lancer des boutiques, publier aliments & matériel, gérer les commandes."}
                        </div>
                      </div>
                    </div>
                    {roles.includes("shopkeeper") ? (
                      <div className="role-card-item__status-text">
                        <CheckCircle size={14} />
                        <span>{t("auth.profile.role_active")}</span>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => handleActivateRole("shopkeeper")}
                        className="role-card-item__action-btn"
                        disabled={loading}
                      >
                        {t("auth.profile.role_activate")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* Profile Avatar Editor Modal */}
        {showAvatarModal && (
          <div className="avatar-modal-backdrop" onClick={() => setShowAvatarModal(false)}>
            <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
              <div className="avatar-modal__header">
                <h3>{t("auth.profile.avatar_title")}</h3>
                <button className="avatar-modal__close" onClick={() => setShowAvatarModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Upload Zone */}
              <div className="avatar-modal__upload-zone" onClick={() => fileInputRef.current?.click()}>
                <UploadCloud size={32} />
                <span>{t("auth.profile.avatar_upload")}</span>
                <p>{lang === "en" ? "PNG, JPG up to 1MB" : "PNG, JPG jusqu'à 1 Mo"}</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg" 
                  style={{ display: "none" }} 
                />
              </div>

              <div style={{ margin: "20px 0 10px", fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)" }}>
                {t("auth.profile.avatar_select_preset")}
              </div>

              {/* Preset Avatars Grid */}
              <div className="avatar-preset-grid">
                {PRESET_AVATARS.map((preset, idx) => (
                  <div 
                    key={idx} 
                    className={`avatar-preset-item ${avatar === preset.url ? "avatar-preset-item--selected" : ""}`}
                    onClick={() => handleSaveAvatar(preset.url)}
                  >
                    <img src={preset.url} alt={preset.name} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
