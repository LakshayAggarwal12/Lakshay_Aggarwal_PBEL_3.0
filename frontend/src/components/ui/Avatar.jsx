const HUES = [
  ["#3454D1", "#1f3aa8"], // accent blue
  ["#8b5cf6", "#6d28d9"], // violet
  ["#0ea5e9", "#0369a1"], // sky
  ["#14b8a6", "#0f766e"], // teal
  ["#f59e0b", "#b45309"], // amber
  ["#ec4899", "#be185d"], // pink
];

function hashName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  return initials.join("") || "?";
}

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-base",
};

export default function Avatar({ name, size = "md" }) {
  const [from, to] = HUES[hashName(name || "?") % HUES.length];
  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 shadow-sm`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {getInitials(name)}
    </div>
  );
}
