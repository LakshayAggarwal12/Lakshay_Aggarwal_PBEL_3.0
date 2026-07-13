import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LuSearch, LuUser, LuBriefcase } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { useAppData } from "../../context/AppDataContext";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { candidates, jobDescriptions } = useAppData();

  // "/" focuses search from anywhere, unless typing in a field already
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return { candidates: [], jobs: [] };
    const q = query.toLowerCase();
    return {
      candidates: candidates
        .filter((c) => c.full_name?.toLowerCase().includes(q) || c.filename?.toLowerCase().includes(q))
        .slice(0, 4),
      jobs: jobDescriptions.filter((j) => j.title.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [query, candidates, jobDescriptions]);

  const hasResults = results.candidates.length > 0 || results.jobs.length > 0;

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search candidates, jobs..."
          className="pl-9 pr-12 py-2 text-sm rounded-lg border border-border bg-canvas
            focus:bg-surface focus:border-accent outline-none transition-colors w-56 sm:w-72"
        />
        <kbd className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center justify-center h-5 min-w-5 px-1 rounded border border-border text-[10px] font-mono text-ink-soft bg-surface">
          /
        </kbd>
      </div>

      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-30"
          >
            {!hasResults ? (
              <p className="text-sm text-ink-soft text-center py-6">No matches for "{query}"</p>
            ) : (
              <div className="max-h-80 overflow-y-auto py-1.5">
                {results.candidates.length > 0 && (
                  <div className="px-2">
                    <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide px-2 py-1.5">
                      Candidates
                    </p>
                    {results.candidates.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => goTo(`/candidates/${c.id}`)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-canvas transition-colors"
                      >
                        <LuUser className="h-3.5 w-3.5 text-ink-soft shrink-0" />
                        <span className="text-sm text-ink truncate">{c.full_name || c.filename}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.jobs.length > 0 && (
                  <div className="px-2">
                    <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide px-2 py-1.5">
                      Job descriptions
                    </p>
                    {results.jobs.map((j) => (
                      <button
                        key={j.id}
                        onClick={() => goTo(`/jobs/${j.id}`)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-canvas transition-colors"
                      >
                        <LuBriefcase className="h-3.5 w-3.5 text-ink-soft shrink-0" />
                        <span className="text-sm text-ink truncate">{j.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
