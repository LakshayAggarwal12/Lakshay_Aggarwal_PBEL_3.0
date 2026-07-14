import { LuCheck, LuX } from "react-icons/lu";

export default function AtsChecklist({ checks }) {
  return (
    <div className="divide-y divide-border-soft">
      {checks.map((check) => (
        <div key={check.name} className="flex items-start gap-3 py-3">
          <div
            className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5
              ${check.passed ? "bg-score-high-soft text-score-high" : "bg-score-low-soft text-score-low"}`}
          >
            {check.passed ? <LuCheck className="h-3 w-3" /> : <LuX className="h-3 w-3" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-ink">{check.name}</p>
              <span className="text-[11px] font-mono text-ink-soft">{check.weight}pts</span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">{check.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
