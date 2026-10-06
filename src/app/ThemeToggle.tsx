"use client";

import { useCallback, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useLanguage } from "./LanguageContext";

type ThemeMode = "light" | "dark";

export default function ThemeToggle() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = localStorage.getItem("color-scheme");
    if (stored === "light" || stored === "dark") {
      setMode(stored);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setMode(prefersDark ? "dark" : "light");
  }, []);

  const applyTheme = useCallback((newMode: ThemeMode) => {
    const meta = document.querySelector('meta[name="color-scheme"]');
    const html = document.documentElement;
    if (meta) meta.setAttribute("content", newMode);
    html.setAttribute("data-theme", newMode);
    localStorage.setItem("color-scheme", newMode);
  }, []);

  const toggle = useCallback(() => {
    const next: ThemeMode = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyTheme(next);
  }, [mode, applyTheme]);

  const isDark = mode === "dark";

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={t("theme.toggle")}
      title={
        isDark
          ? (t("theme.toggle") || "Switch to light mode")
          : (t("theme.toggle") || "Switch to dark mode")
      }
      type="button"
    >
      <span className="theme-icon" data-visible={isDark ? "moon" : "sun"}>
        <Sun size={18} className="icon-sun" />
        <Moon size={18} className="icon-moon" />
      </span>
    </button>
  );
}
