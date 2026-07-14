import { useState } from "react";
import { Link } from "react-router-dom";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { ScoreBadge } from "../ui/Badge";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import { formatScore } from "../../utils/scoring";

const RANK_MEDAL = ["🥇", "🥈", "🥉"];
const GRID_COLS = "2.25rem_3rem_1fr_7rem_7rem_7rem_2.5rem";

export default function RankingTable({ rankings, selectedIds = [], onToggleSelect }) {
  const [expandedId, setExpandedId] = useState(null);
  const selectable = typeof onToggleSelect === "function";

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div
        className="grid gap-3 px-5 py-3 border-b border-border bg-canvas/50 text-[11px] font-semibold text-ink-soft uppercase tracking-wide"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        <span></span>
        <span>Rank</span>
        <span>Candidate</span>
        <span className="text-center">Semantic</span>
        <span className="text-center">Skill match</span>
        <span className="text-center">Composite</span>
        <span></span>
      </div>

      {rankings.map((r, idx) => {
        const isExpanded = expandedId === r.candidate_id;
        const isSelected = selectedIds.includes(r.candidate_id);
        return (
          <motion.div
            key={r.candidate_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: idx * 0.04, ease: "easeOut" }}
            className={`border-b border-border-soft last:border-b-0 ${isSelected ? "bg-accent-soft/30" : ""}`}
          >
            <div
              className="w-full grid gap-3 px-5 py-3.5 items-center hover:bg-canvas/40 transition-colors"
              style={{ gridTemplateColumns: GRID_COLS }}
            >
              {selectable ? (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(r)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-border accent-[var(--color-accent)] cursor-pointer"
                  aria-label={`Select ${r.full_name || r.filename} for comparison`}
                />
              ) : (
                <span />
              )}

              <button
                onClick={() => setExpandedId(isExpanded ? null : r.candidate_id)}
                className="text-sm font-mono text-ink-soft text-left"
              >
                {RANK_MEDAL[idx] || `#${idx + 1}`}
              </button>

              <button
                onClick={() => setExpandedId(isExpanded ? null : r.candidate_id)}
                className="flex items-center gap-3 min-w-0 text-left"
              >
                <Avatar name={r.full_name || r.filename} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {r.full_name || r.filename}
                  </p>
                  <p className="text-xs text-ink-soft truncate">{r.filename}</p>
                </div>
              </button>

              <button
                onClick={() => setExpandedId(isExpanded ? null : r.candidate_id)}
                className="text-sm font-mono text-center text-ink-soft"
              >
                {formatScore(r.semantic_similarity)}
              </button>
              <button
                onClick={() => setExpandedId(isExpanded ? null : r.candidate_id)}
                className="text-sm font-mono text-center text-ink-soft"
              >
                {formatScore(r.skill_overlap_pct)}%
              </button>
              <button
                onClick={() => setExpandedId(isExpanded ? null : r.candidate_id)}
                className="flex justify-center"
              >
                <ScoreBadge score={r.composite_score}>{formatScore(r.composite_score)}</ScoreBadge>
              </button>
              <button
                onClick={() => setExpandedId(isExpanded ? null : r.candidate_id)}
                className="flex justify-center text-ink-soft"
              >
                {isExpanded ? <LuChevronUp className="h-4 w-4" /> : <LuChevronDown className="h-4 w-4" />}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 pt-1 bg-canvas/30 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                        Matched skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.matched_skills.length > 0 ? (
                          r.matched_skills.map((s) => <Badge key={s} tone="accent">{s}</Badge>)
                        ) : (
                          <span className="text-xs text-ink-soft">None matched</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                        Missing skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.missing_skills.length > 0 ? (
                          r.missing_skills.map((s) => <Badge key={s}>{s}</Badge>)
                        ) : (
                          <span className="text-xs text-ink-soft">None missing</span>
                        )}
                      </div>
                    </div>
                    {r.suggestions?.length > 0 && (
                      <div className="col-span-2 pt-2 border-t border-border-soft">
                        <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                          Suggestions
                        </p>
                        <ul className="space-y-1.5">
                          {r.suggestions.map((s, i) => (
                            <li key={i} className="text-xs text-ink-soft leading-relaxed flex gap-2">
                              <span className="text-accent shrink-0">—</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="col-span-2 pt-2">
                      <Link
                        to={`/candidates/${r.candidate_id}`}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        View full candidate profile →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
