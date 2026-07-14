import { getScoreBand, SCORE_COLORS } from "../../utils/scoring";

export function ScoreBadge({ score, children }) {
  const band = getScoreBand(score ?? 0);
  const { text, bg } = SCORE_COLORS[band];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold font-mono ${text} ${bg}`}>
      {children ?? `${Math.round(score)}`}
    </span>
  );
}

const TONES = {
  neutral: "bg-canvas text-ink-soft border border-border-soft",
  accent: "bg-accent-soft text-accent-ink",
  outline: "bg-transparent text-ink-soft border border-border",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
