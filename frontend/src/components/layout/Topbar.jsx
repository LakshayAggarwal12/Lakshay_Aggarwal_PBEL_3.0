import { Link } from "react-router-dom";
import { LuSearch, LuMenu, LuSettings } from "react-icons/lu";
import GlobalSearch from "./GlobalSearch";
import NotificationsBell from "./NotificationsBell";
import ApiStatusPill from "../ui/ApiStatusPill";
import ThemeToggle from "../ui/ThemeToggle";
import Avatar from "../ui/Avatar";
import { useSidebarUI } from "../../context/SidebarUIContext";

export default function Topbar({ title, subtitle, actions }) {
  const { openMobile } = useSidebarUI();

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={openMobile}
          className="md:hidden h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-ink-soft hover:bg-canvas"
          aria-label="Open menu"
        >
          <LuMenu className="h-4.5 w-4.5" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-[15px] leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-ink-soft mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="hidden lg:block">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {actions}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border-soft">
          <ApiStatusPill />
          <ThemeToggle compact />
          <NotificationsBell />
          <Link
            to="/settings"
            className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
            aria-label="Settings"
          >
            <LuSettings className="h-4 w-4" />
          </Link>
          <Avatar name="Recruiter" size="sm" />
        </div>
      </div>
    </header>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-canvas
          focus:bg-surface focus:border-accent outline-none transition-colors w-64"
      />
    </div>
  );
}
