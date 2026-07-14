import { LuArrowUpDown } from "react-icons/lu";

export default function SortDropdown({ value, onChange, options }) {
  return (
    <div className="relative">
      <LuArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-canvas
          focus:bg-surface focus:border-accent outline-none transition-colors cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
