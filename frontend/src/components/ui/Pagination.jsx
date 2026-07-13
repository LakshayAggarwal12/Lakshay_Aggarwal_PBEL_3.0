import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-ink-soft hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <LuChevronLeft className="h-3.5 w-3.5" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-8 min-w-8 px-2 rounded-lg text-xs font-medium font-mono transition-colors
            ${p === page ? "bg-accent text-white" : "text-ink-soft hover:bg-canvas border border-transparent"}`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-ink-soft hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <LuChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
