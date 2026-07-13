import { createContext, useContext, useEffect, useState, useCallback } from "react";

const PreferencesContext = createContext(null);

const THEME_KEY = "talence_theme"; // "light" | "dark" | "system"
const ACCENT_KEY = "talence_accent";
const MOTION_KEY = "talence_reduced_motion";

export const ACCENT_PRESETS = {
  cobalt: { label: "Cobalt", accent: "#3454d1", accentInk: "#1f3aa8", accentSoft: "#edf0fc" },
  violet: { label: "Violet", accent: "#7c3aed", accentInk: "#5b21b6", accentSoft: "#f2ecfd" },
  teal: { label: "Teal", accent: "#0d9488", accentInk: "#0a6d63", accentSoft: "#e6f5f3" },
  rose: { label: "Rose", accent: "#e11d48", accentInk: "#a8123a", accentSoft: "#fce8ed" },
  amber: { label: "Amber", accent: "#d97706", accentInk: "#a35a04", accentSoft: "#fdf1e0" },
};

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

function applyAccent(key) {
  const preset = ACCENT_PRESETS[key] || ACCENT_PRESETS.cobalt;
  const root = document.documentElement.style;
  root.setProperty("--color-accent", preset.accent);
  root.setProperty("--color-accent-ink", preset.accentInk);
  root.setProperty("--color-accent-soft", preset.accentSoft);
  root.setProperty("--color-accent-glow", `${preset.accent}33`);
}

function applyMotion(reduced) {
  document.documentElement.classList.toggle("reduce-motion", reduced);
}

export function PreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || "system");
  const [accent, setAccentState] = useState(() => localStorage.getItem(ACCENT_KEY) || "cobalt");
  const [reducedMotion, setReducedMotionState] = useState(
    () => localStorage.getItem(MOTION_KEY) === "true"
  );
  const [resolvedTheme, setResolvedTheme] = useState(theme === "system" ? getSystemTheme() : theme);

  useEffect(() => {
    setResolvedTheme(applyTheme(theme));
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(applyTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  useEffect(() => {
    applyMotion(reducedMotion);
  }, [reducedMotion]);

  const setTheme = useCallback((next) => {
    localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
  }, []);

  const setAccent = useCallback((next) => {
    localStorage.setItem(ACCENT_KEY, next);
    setAccentState(next);
  }, []);

  const setReducedMotion = useCallback((next) => {
    localStorage.setItem(MOTION_KEY, String(next));
    setReducedMotionState(next);
  }, []);

  const value = {
    theme,
    resolvedTheme,
    setTheme,
    accent,
    setAccent,
    reducedMotion,
    setReducedMotion,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
