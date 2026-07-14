/**
 * Single source of truth for score → color-band mapping. Every score
 * visualization in the app (ScoreRing, Badge, table cells) calls this so
 * a 72 always means the same thing everywhere.
 */
export function getScoreBand(score) {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

export const SCORE_COLORS = {
  high: { text: "text-score-high", bg: "bg-score-high-soft", ring: "#16a34a" },
  mid: { text: "text-score-mid", bg: "bg-score-mid-soft", ring: "#d97706" },
  low: { text: "text-score-low", bg: "bg-score-low-soft", ring: "#dc2626" },
};

export function formatScore(score) {
  if (score === null || score === undefined) return "—";
  return Math.round(score * 10) / 10;
}
