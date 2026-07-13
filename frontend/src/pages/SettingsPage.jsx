import { useState } from "react";
import toast from "react-hot-toast";
import { LuTrash2, LuRefreshCw, LuCheck } from "react-icons/lu";
import Topbar from "../components/layout/Topbar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import { usePreferences, ACCENT_PRESETS } from "../context/PreferencesContext";
import { useApiStatus } from "../hooks/useApiStatus";
import { useAppData } from "../context/AppDataContext";

const SHORTCUTS = [
  { keys: ["/"], description: "Focus global search" },
  { keys: ["Esc"], description: "Close search or dropdown" },
  { keys: ["["], description: "Collapse or expand sidebar" },
];

function SectionCard({ title, description, children }) {
  return (
    <Card>
      <h3 className="font-display font-semibold text-sm">{title}</h3>
      {description && <p className="text-xs text-ink-soft mt-1 mb-4">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </Card>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-md border border-border bg-canvas text-[11px] font-mono text-ink-soft">
      {children}
    </kbd>
  );
}

export default function SettingsPage() {
  const { accent, setAccent, reducedMotion, setReducedMotion } = usePreferences();
  const { status, latencyMs, lastChecked, recheck } = useApiStatus();
  const { candidates, jobDescriptions, clearAll } = useAppData();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleClear = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    clearAll();
    toast.success("Session data cleared");
    setConfirmingClear(false);
  };

  return (
    <>
      <Topbar title="Settings" subtitle="Appearance, data, and system status" />

      <div className="p-6 max-w-3xl space-y-6">
        <SectionCard title="Appearance" description="Choose how Talence looks on this device.">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-ink-soft mb-2">Theme</p>
              <ThemeToggle />
            </div>

            <div>
              <p className="text-xs font-medium text-ink-soft mb-2">Accent color</p>
              <div className="flex gap-2.5">
                {Object.entries(ACCENT_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setAccent(key)}
                    aria-label={preset.label}
                    title={preset.label}
                    className="h-8 w-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: preset.accent }}
                  >
                    {accent === key && <LuCheck className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Animations" description="Turn off motion effects app-wide, independent of your OS setting.">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-ink">Reduce motion</span>
            <button
              role="switch"
              aria-checked={reducedMotion}
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                reducedMotion ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  reducedMotion ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </SectionCard>

        <SectionCard title="System status" description="Live connection to your FastAPI backend.">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "online" ? "bg-score-high" : status === "offline" ? "bg-score-low" : "bg-ink-soft"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-ink capitalize">{status}</p>
                <p className="text-xs text-ink-soft">
                  {status === "online" && latencyMs !== null
                    ? `Responding in ${latencyMs}ms`
                    : status === "offline"
                    ? "Could not reach the backend"
                    : "Checking..."}
                  {lastChecked && ` · Last checked ${lastChecked.toLocaleTimeString()}`}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" icon={LuRefreshCw} onClick={recheck}>
              Recheck
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Keyboard shortcuts">
          <div className="space-y-2.5">
            {SHORTCUTS.map((s) => (
              <div key={s.description} className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">{s.description}</span>
                <div className="flex gap-1">
                  {s.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="About">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Product</span>
              <span className="text-ink font-medium">Talence</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Version</span>
              <span className="text-ink font-mono text-xs">1.0.0 — Day 3 build</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Frontend</span>
              <span className="text-ink text-xs">React (Vite) · Tailwind CSS v4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Backend</span>
              <span className="text-ink text-xs">FastAPI · spaCy · sentence-transformers</span>
            </div>
          </div>
        </SectionCard>

        <Card className="border-score-low/30">
          <h3 className="font-display font-semibold text-sm text-score-low">Danger zone</h3>
          <p className="text-xs text-ink-soft mt-1 mb-4">
            Clears {candidates.length} candidate(s) and {jobDescriptions.length} job description(s) tracked
            in this browser session. This does not delete records from the backend database — only from
            this browser's local view of them.
          </p>
          <Button
            variant="danger"
            size="sm"
            icon={LuTrash2}
            onClick={handleClear}
            onBlur={() => setConfirmingClear(false)}
          >
            {confirmingClear ? "Click again to confirm" : "Clear session data"}
          </Button>
        </Card>
      </div>
    </>
  );
}
