import { useApiStatus } from "../../hooks/useApiStatus";

const CONFIG = {
  online: { color: "bg-score-high", label: "API online" },
  offline: { color: "bg-score-low", label: "API offline" },
  checking: { color: "bg-ink-soft", label: "Checking..." },
};

export default function ApiStatusPill({ showLabel = false }) {
  const { status, latencyMs } = useApiStatus();
  const { color, label } = CONFIG[status];

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border bg-canvas"
      title={status === "online" ? `Backend responding in ${latencyMs}ms` : label}
    >
      <span className="relative flex h-1.5 w-1.5">
        {status === "online" && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${color}`} />
      </span>
      {showLabel && <span className="text-[11px] font-medium text-ink-soft">{label}</span>}
    </div>
  );
}
