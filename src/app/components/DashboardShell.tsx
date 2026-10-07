"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import ThemeToggle from "../ThemeToggle";
import {
  BookOpen,
  FileDown,
  Tractor,
  Store,
  ShoppingBag,
  Egg,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  MessageSquare,
  Bell,
  User,
  PlusCircle,
  FileText,
  DollarSign,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Globe,
  Compass,
  Package,
  ClipboardList,
} from "lucide-react";
import { api } from "@/lib/api";

type SidebarItem = {
  labelKey: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
};

export default function DashboardShell({
  children,
  mediaMode = false,
}: {
  children: ReactNode;
  mediaMode?: boolean;
}) {
  const { user, token, logout, loading } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [activeRole, setActiveRole] = useState<string>("customer");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Set active role from pathname
  useEffect(() => {
    if (pathname.includes("/dashboard/admin")) setActiveRole("admin");
    else if (pathname.includes("/dashboard/farmer")) setActiveRole("farmer");
    else if (pathname.includes("/dashboard/shopkeeper")) setActiveRole("shopkeeper");
    else setActiveRole("customer");
  }, [pathname]);

  // Fetch notifications
  useEffect(() => {
    if (!token || !user) return;
    api
      .list<any>("/notifications", { limit: 5 }, token)
      .then((res) => setNotifications(res.data))
      .catch(() => {});
  }, [token, user]);

  const markAllRead = async () => {
    if (!token) return;
    try {
      await api.update("/notifications/read-all", {}, token);
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
    } catch (err) {}
  };

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          {lang === "en" ? "Loading session..." : "Chargement de la session..."}
        </p>
      </div>
    );
  }

  // Sidebar menu configs per role
  const menuConfig: Record<string, { label: string; items: SidebarItem[] }> = {
    customer: {
      label: lang === "en" ? "Customer" : "Client",
      items: [
        { labelKey: "dash.sidebar.customer", path: "/dashboard/customer", icon: LayoutDashboard },
        { labelKey: "nav.explore", path: "/dashboard/customer/explore", icon: Compass },
        { labelKey: "nav.marketplace", path: "/marketplace", icon: ShoppingBag },
        { labelKey: "cart.title", path: "/dashboard/customer/cart", icon: PlusCircle },
        { labelKey: "orders.title", path: "/dashboard/customer/orders", icon: Package },
        { labelKey: "msg.chat_title", path: "/dashboard/customer/messages", icon: MessageSquare },
        { labelKey: "auth.profile.title", path: "/dashboard/customer/profile", icon: User },
        { labelKey: "nav.knowledge", path: "/knowledge", icon: BookOpen },
        { labelKey: "nav.platform", path: "/platform", icon: Globe },
      ],
    },
    farmer: {
      label: lang === "en" ? "Farmer" : "Éleveur",
      items: [
        { labelKey: "dash.sidebar.farmer", path: "/dashboard/farmer", icon: LayoutDashboard },
        { labelKey: "farm.manage.title", path: "/dashboard/farmer/manage", icon: Layers },
        { labelKey: "farm.manage.daily", path: "/dashboard/farmer/manage/daily", icon: ClipboardList },
        { labelKey: "farm.create.title", path: "/dashboard/farmer/farms", icon: Tractor },
        { labelKey: "dash.sidebar.products", path: "/dashboard/farmer/products", icon: ShoppingBag },
        { labelKey: "dash.sidebar.expenses", path: "/dashboard/farmer/expenses", icon: DollarSign },
        { labelKey: "dash.sidebar.sales", path: "/dashboard/farmer/sales", icon: FileText },
        { labelKey: "dash.sidebar.farm_reports", path: "/dashboard/farmer/reports", icon: Egg },
        { labelKey: "dash.sidebar.records_pdf", path: "/dashboard/farmer/records", icon: FileDown },
        { labelKey: "nav.knowledge", path: "/knowledge", icon: BookOpen },
        { labelKey: "nav.platform", path: "/platform", icon: Globe },
      ],
    },
    shopkeeper: {
      label: lang === "en" ? "Shopkeeper" : "Boutiquier",
      items: [
        { labelKey: "dash.sidebar.shopkeeper", path: "/dashboard/shopkeeper", icon: LayoutDashboard },
        { labelKey: "shop.create.title", path: "/dashboard/shopkeeper/shops", icon: Store },
        { labelKey: "cart.checkout", path: "/dashboard/shopkeeper/orders", icon: ShoppingBag },
        { labelKey: "dash.sidebar.reports", path: "/dashboard/shopkeeper/reports", icon: FileText },
        { labelKey: "nav.knowledge", path: "/knowledge", icon: BookOpen },
        { labelKey: "nav.platform", path: "/platform", icon: Globe },
      ],
    },
    admin: {
      label: "Admin",
      items: [
        { labelKey: "dash.sidebar.admin", path: "/dashboard/admin", icon: LayoutDashboard },
        { labelKey: "admin.tab.approvals", path: "/dashboard/admin?tab=approvals", icon: Tractor },
        { labelKey: "admin.tab.categories", path: "/dashboard/admin?tab=categories", icon: Layers },
        { labelKey: "admin.tab.users", path: "/dashboard/admin?tab=users", icon: Users },
        { labelKey: "admin.tab.knowledge", path: "/dashboard/admin?tab=knowledge", icon: BookOpen },
        { labelKey: "admin.tab.audit", path: "/dashboard/admin?tab=audit", icon: Settings },
        { labelKey: "nav.platform", path: "/platform", icon: Globe },
      ],
    },
  };

  const currentConfig = menuConfig[activeRole] || menuConfig.customer;
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // Breadcrumb
  // Most specific matching menu entry, so /dashboard/farmer/records shows "Records", not the dashboard.
  const breadcrumbLabel = currentConfig.items
    .filter((item) => pathname.startsWith(item.path.split("?")[0]) && item.path !== "/marketplace")
    .sort((a, b) => b.path.split("?")[0].length - a.path.split("?")[0].length)[0]?.labelKey;

  const handleRoleSwitch = (nextRole: string) => {
    setActiveRole(nextRole);
    setSidebarOpen(false);
    router.push(`/dashboard/${nextRole}`);
  };

  return (
    <div className={`ds-layout ${mediaMode ? "ds-layout--media" : ""}`}>
      {/* ── Navbar ── */}
      <header className={`ds-navbar ${mediaMode ? "ds-navbar--media-compact" : ""}`}>
        <div className="ds-navbar__left">
          <button
            className="ds-navbar__toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
          <Link href="/" className="ds-navbar__logo">
            <Egg size={20} />
            PoultryHub
          </Link>
        </div>

        {/* Breadcrumb */}
        <div className="ds-navbar__center">
          <span>{lang === "en" ? "Dashboard" : "Tableau de bord"}</span>
          <ChevronRight size={14} className="ds-navbar__breadcrumb-sep" />
          <span className="ds-navbar__breadcrumb-active">
            {currentConfig.label}
          </span>
          {breadcrumbLabel && (
            <>
              <ChevronRight size={14} className="ds-navbar__breadcrumb-sep" />
              <span className="ds-navbar__breadcrumb-active">{t(breadcrumbLabel)}</span>
            </>
          )}
        </div>

        <div className="ds-navbar__right">
          {/* Role Switcher */}
          <select
            value={activeRole}
            onChange={(e) => handleRoleSwitch(e.target.value)}
            className="ds-navbar__role-pill"
          >
            <option value="customer">{lang === "en" ? "Customer" : "Client"}</option>
            {user.roles.includes("farmer") && (
              <option value="farmer">{lang === "en" ? "Farmer" : "Éleveur"}</option>
            )}
            {user.roles.includes("shopkeeper") && (
              <option value="shopkeeper">{lang === "en" ? "Shopkeeper" : "Boutiquier"}</option>
            )}
            {(user.roles.includes("admin") || user.roles.includes("super_admin")) && (
              <option value="admin">Admin</option>
            )}
          </select>

          {/* Language */}
          <button className="ds-navbar__btn" onClick={() => setLang(lang === "en" ? "fr" : "en")}>
            {lang === "en" ? "FR" : "EN"}
          </button>

          {/* Theme */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="notification-wrapper">
            <button
              className="ds-navbar__btn"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="ds-navbar__notif-dot" />}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <button onClick={markAllRead} className="mark-read-btn">
                    {lang === "en" ? "Mark read" : "Marquer lu"}
                  </button>
                </div>
                <div className="dropdown-body">
                  {notifications.length === 0 ? (
                    <p className="no-notif">
                      {lang === "en" ? "No notifications yet" : "Aucune notification"}
                    </p>
                  ) : (
                    notifications.map((notif) => {
                      // Moderation notices carry both languages; older ones only have title/body.
                      const text = notif.data?.i18n?.[lang] ?? { title: notif.title, body: notif.body };
                      const open = async () => {
                        setShowNotifications(false);
                        if (!notif.readAt && token) {
                          setNotifications((prev) =>
                            prev.map((n) => (n._id === notif._id ? { ...n, readAt: new Date().toISOString() } : n))
                          );
                          api.update(`/notifications/${notif._id}/read`, {}, token).catch(() => {});
                        }
                        if (typeof notif.data?.link === "string" && notif.data.link.startsWith("/")) {
                          router.push(notif.data.link);
                        }
                      };
                      return (
                        <button
                          type="button"
                          key={notif._id}
                          className={`notif-item ${!notif.readAt ? "unread" : ""}`}
                          onClick={open}
                        >
                          <h4>{text.title}</h4>
                          <p>{text.body}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="ds-navbar__user">
            <div className="ds-navbar__avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.fullName} className="ds-navbar__avatar-img" />
              ) : (
                <User size={15} />
              )}
            </div>
            <div className="ds-navbar__user-info">
              <span className="ds-navbar__user-name">{user.fullName}</span>
              <span className="ds-navbar__user-role">{currentConfig.label}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="ds-container">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className={`ds-backdrop ds-backdrop--visible`} onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`ds-sidebar ${sidebarCollapsed ? "ds-sidebar--collapsed" : ""} ${sidebarOpen ? "ds-sidebar--open" : ""}`}
        >
          <div>
            <p className="ds-sidebar__section-label">
              {lang === "en" ? "Navigation" : "Navigation"}
            </p>
            <Suspense fallback={<SidebarNav items={currentConfig.items} activeRole={activeRole} pathname={pathname} tab={null} onNavigate={() => setSidebarOpen(false)} />}>
              <SidebarNavWithTab items={currentConfig.items} activeRole={activeRole} pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
            </Suspense>
          </div>

          <div className="ds-sidebar__footer">
            <button
              onClick={logout}
              className="ds-sidebar__link ds-sidebar__link--logout"
            >
              <LogOut size={18} />
              <span>{t("dash.sidebar.logout")}</span>
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ds-sidebar__collapse-btn"
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              <span>{lang === "en" ? "Collapse" : "Réduire"}</span>
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className={`ds-content ${mediaMode ? "ds-content--media" : ""}`}>{children}</main>
      </div>
    </div>
  );
}

type SidebarNavProps = {
  items: SidebarItem[];
  activeRole: string;
  pathname: string;
  onNavigate: () => void;
};

// useSearchParams needs a Suspense boundary; this wrapper keeps the rest of the shell static.
function SidebarNavWithTab(props: SidebarNavProps) {
  const tab = useSearchParams().get("tab");
  return <SidebarNav {...props} tab={tab} />;
}

function SidebarNav({ items, activeRole, pathname, tab, onNavigate }: SidebarNavProps & { tab: string | null }) {
  const { t } = useLanguage();
  const home = `/dashboard/${activeRole}`;

  const isActive = (itemPath: string) => {
    const [path, query] = itemPath.split("?");
    const itemTab = new URLSearchParams(query ?? "").get("tab");
    if (itemTab) return pathname === path && tab === itemTab;
    if (path === home) return pathname === home && !tab;
    return pathname === path || (path !== "/marketplace" && pathname.startsWith(`${path}/`));
  };

  return (
    <nav className="ds-sidebar__nav">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`ds-sidebar__link ${active ? "ds-sidebar__link--active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            <Icon size={18} />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
