import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/layout/Sidebar";
import { SidebarUIProvider } from "../context/SidebarUIContext";

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <SidebarUIProvider>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </SidebarUIProvider>
  );
}
