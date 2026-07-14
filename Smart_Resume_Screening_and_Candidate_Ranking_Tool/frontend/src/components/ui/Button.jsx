import { motion } from "framer-motion";

const VARIANTS = {
  primary:
    "bg-gradient-to-b from-[#4362e0] to-accent text-white hover:brightness-[1.06] shadow-md shadow-accent/25",
  secondary: "bg-surface text-ink border border-border hover:bg-canvas hover:border-ink/20",
  ghost: "text-ink-soft hover:bg-canvas hover:text-ink",
  danger: "bg-score-low-soft text-score-low hover:bg-red-100",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-sm px-5 py-3 gap-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-lg
        transition-[background,box-shadow,filter,border-color] duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </motion.button>
  );
}
