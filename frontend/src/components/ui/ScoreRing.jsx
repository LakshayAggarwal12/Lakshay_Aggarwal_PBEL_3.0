import { useEffect, useRef, useState } from "react";
import { getScoreBand, SCORE_COLORS, formatScore } from "../../utils/scoring";

const SIZES = {
  sm: { box: 44, stroke: 4, font: "text-xs" },
  md: { box: 64, stroke: 5, font: "text-base" },
  lg: { box: 96, stroke: 6, font: "text-2xl" },
};

const GRADIENTS = {
  high: ["#22c55e", "#0f9d4f"],
  mid: ["#f59e0b", "#c2660a"],
  low: ["#f87171", "#dc2626"],
};

let gradientCounter = 0;

/**
 * Circular score visualization used for ATS score, semantic similarity,
 * skill overlap, and composite match score — one consistent shape for
 * every number this product produces. Fills from 0 on mount and uses a
 * subtle two-tone gradient per score band instead of a flat stroke.
 */
export default function ScoreRing({ score, size = "md", label }) {
  const { box, stroke, font } = SIZES[size];
  const band = getScoreBand(score ?? 0);
  const [gradId] = useState(() => `score-ring-grad-${gradientCounter++}`);
  const [animatedScore, setAnimatedScore] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = Math.max(0, Math.min(100, score ?? 0));
    const start = performance.now();
    const duration = 700;

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(target * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animatedScore / 100);
  const [from, to] = GRADIENTS[band];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: box, height: box }}>
        <svg width={box} height={box} className="-rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border-soft)"
            strokeWidth={stroke}
          />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-mono font-semibold ${font}`}>
          {formatScore(animatedScore)}
        </div>
      </div>
      {label && <span className="text-xs text-ink-soft font-medium">{label}</span>}
    </div>
  );
}
