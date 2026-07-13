export default function Card({ children, className = "", padded = true, interactive = false, ...props }) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl
        ${padded ? "p-5" : ""}
        ${interactive ? "hover-lift" : ""}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
