import { createContext, useContext, useState, useCallback, useEffect } from "react";

const SidebarUIContext = createContext(null);
const COLLAPSE_KEY = "HireSense_sidebar_collapsed";

export function SidebarUIProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "true");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Real shortcut: "[" toggles sidebar collapse, ignored while typing
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement.tagName;
      if (e.key === "[" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCollapsed]);

  const value = { collapsed, toggleCollapsed, mobileOpen, openMobile, closeMobile };
  return <SidebarUIContext.Provider value={value}>{children}</SidebarUIContext.Provider>;
}

export function useSidebarUI() {
  const ctx = useContext(SidebarUIContext);
  if (!ctx) throw new Error("useSidebarUI must be used within SidebarUIProvider");
  return ctx;
}
