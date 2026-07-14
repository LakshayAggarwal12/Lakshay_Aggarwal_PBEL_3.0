import { LuSun, LuMoon, LuMonitor } from "react-icons/lu";
import { motion } from "framer-motion";
import { usePreferences } from "../../context/PreferencesContext";

const OPTIONS = [
  { value: "light", icon: LuSun, label: "Light" },
  { value: "dark", icon: LuMoon, label: "Dark" },
  { value: "system", icon: LuMonitor, label: "System" },
];

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = usePreferences();

  return (
    <div className="relative inline-flex items-center bg-canvas border border-border rounded-lg p-0.5">
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            aria-label={`${opt.label} theme`}
            aria-pressed={active}
            className={`relative z-10 flex items-center gap-1.5 rounded-md transition-colors
              ${compact ? "px-2 py-1.5" : "px-3 py-1.5 text-xs font-medium"}
              ${active ? "text-accent-ink" : "text-ink-soft hover:text-ink"}`}
          >
            {active && (
              <motion.div
                layoutId="theme-toggle-pill"
                className="absolute inset-0 bg-accent-soft rounded-md -z-10"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Icon className="h-3.5 w-3.5" />
            {!compact && opt.label}
          </button>
        );
      })}
    </div>
  );
}
