import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuLayoutDashboard,
  LuUpload,
  LuBriefcase,
  LuTrophy,
  LuUser,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuX,
  LuSettings,
} from "react-icons/lu";
import { useSidebarUI } from "../../context/SidebarUIContext";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LuLayoutDashboard, end: true },
  { to: "/candidates", label: "Candidates", icon: LuUpload },
  { to: "/jobs", label: "Job Descriptions", icon: LuBriefcase },
];

function NavItem({ item, collapsed, onNavigate }) {
  const location = useLocation();
  const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className="group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 bg-accent-soft rounded-lg"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <Icon className={`relative h-4 w-4 shrink-0 ${active ? "text-accent-ink" : "text-ink-soft"}`} />
      {!collapsed && (
        <span className={`relative truncate ${active ? "text-accent-ink" : "text-ink-soft"}`}>
          {item.label}
        </span>
      )}

      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-ink text-white text-xs font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

function SidebarContent({ collapsed, onToggleCollapse, onNavigate, showCollapseControl }) {
  return (
    <>
      <div className={`h-16 flex items-center border-b border-border ${collapsed ? "justify-center px-2" : "gap-2.5 px-5"}`}>
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-accent to-accent-ink flex items-center justify-center shadow-sm shadow-accent/30 shrink-0">
          <LuTrophy className="h-4 w-4 text-white" />
        </div>
        {!collapsed && <span className="font-display font-bold text-[15px] tracking-tight">HireSense</span>}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-border-soft space-y-1">
        <NavItem
          item={{ to: "/settings", label: "Settings", icon: LuSettings }}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-ink to-ink-soft flex items-center justify-center shrink-0">
              <LuUser className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink truncate">Recruiter session</p>
              <p className="text-[11px] text-ink-soft truncate">Local - not synced</p>
            </div>
          </div>
        )}

        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-2"} pt-1`}>
          {!collapsed && <p className="text-[10px] text-ink-soft/70">HireSense v1.0 · Day 3</p>}
          {showCollapseControl && (
            <button
              onClick={onToggleCollapse}
              className="h-7 w-7 rounded-md flex items-center justify-center text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <LuPanelLeftOpen className="h-4 w-4" /> : <LuPanelLeftClose className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useSidebarUI();

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="hidden md:flex shrink-0 border-r border-border bg-surface/95 backdrop-blur h-screen sticky top-0 flex-col overflow-hidden"
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapsed} showCollapseControl />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-border z-50 flex flex-col md:hidden"
            >
              <button
                onClick={closeMobile}
                className="absolute top-4 right-3 h-7 w-7 rounded-md flex items-center justify-center text-ink-soft hover:bg-canvas"
                aria-label="Close menu"
              >
                <LuX className="h-4 w-4" />
              </button>
              <SidebarContent collapsed={false} onNavigate={closeMobile} showCollapseControl={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
