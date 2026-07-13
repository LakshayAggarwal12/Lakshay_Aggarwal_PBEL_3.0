import { useState, useRef, useEffect } from "react";
import { LuBell } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
        aria-label="Notifications"
      >
        <LuBell className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-30"
          >
            <div className="px-4 py-3 border-b border-border-soft">
              <p className="text-sm font-semibold text-ink">Notifications</p>
            </div>
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-ink-soft leading-relaxed">
                Nothing here yet. Interview reminders and ranking updates will
                show up here once that's wired up.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
