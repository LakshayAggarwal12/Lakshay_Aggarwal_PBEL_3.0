import { motion } from "framer-motion";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="h-12 w-12 rounded-full bg-gradient-to-br from-canvas to-border-soft border border-border-soft flex items-center justify-center mb-4"
        >
          <Icon className="h-5 w-5 text-ink-soft" />
        </motion.div>
      )}
      <h3 className="font-display font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-soft max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}
