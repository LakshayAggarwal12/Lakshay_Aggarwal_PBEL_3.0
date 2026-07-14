import { useEffect, useState, useRef } from "react";

function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const numTarget = typeof target === "number" ? target : 0;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(numTarget * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

export default function StatCard({ icon: Icon, label, value, hint }) {
  const isNumeric = typeof value === "number";
  const animated = useCountUp(isNumeric ? value : 0);

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover-lift">
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent-soft to-accent-soft flex items-center justify-center">
          <Icon className="h-4 w-4 text-accent" />
        </div>
      </div>
      <p className="text-2xl font-display font-bold font-tabular text-ink">
        {isNumeric ? animated : value}
      </p>
      <p className="text-xs text-ink-soft mt-1">{label}</p>
      {hint && <p className="text-[11px] text-ink-soft/70 mt-2">{hint}</p>}
    </div>
  );
}
