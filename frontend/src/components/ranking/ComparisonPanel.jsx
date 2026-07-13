import { LuX } from "react-icons/lu";
import Avatar from "../ui/Avatar";
import ScoreRing from "../ui/ScoreRing";
import Badge from "../ui/Badge";

export default function ComparisonPanel({ candidates, onRemove, onClose }) {
  if (candidates.length === 0) return null;

  return (
    <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-soft bg-accent-soft/40">
        <p className="text-sm font-display font-semibold text-ink">
          Comparing {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
        </p>
        <button onClick={onClose} className="text-ink-soft hover:text-ink" aria-label="Close comparison">
          <LuX className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-px bg-border-soft min-w-max"
          style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(220px, 1fr))` }}
        >
          {candidates.map((c) => (
            <div key={c.candidate_id} className="bg-surface p-4 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={c.full_name || c.filename} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{c.full_name || c.filename}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(c.candidate_id)}
                  className="text-ink-soft hover:text-score-low shrink-0"
                  aria-label="Remove from comparison"
                >
                  <LuX className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex justify-center py-2">
                <ScoreRing score={c.composite_score} size="md" label="Composite" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-sm font-mono font-semibold text-ink">{Math.round(c.semantic_similarity)}</p>
                  <p className="text-[10px] text-ink-soft uppercase tracking-wide mt-0.5">Semantic</p>
                </div>
                <div>
                  <p className="text-sm font-mono font-semibold text-ink">{Math.round(c.skill_overlap_pct)}%</p>
                  <p className="text-[10px] text-ink-soft uppercase tracking-wide mt-0.5">Skills</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                  Matched ({c.matched_skills.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {c.matched_skills.length > 0 ? (
                    c.matched_skills.map((s) => <Badge key={s} tone="accent">{s}</Badge>)
                  ) : (
                    <span className="text-xs text-ink-soft">None</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                  Missing ({c.missing_skills.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {c.missing_skills.length > 0 ? (
                    c.missing_skills.map((s) => <Badge key={s}>{s}</Badge>)
                  ) : (
                    <span className="text-xs text-ink-soft">None</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
