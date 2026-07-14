import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import router from "./routes/router";
import { AppDataProvider } from "./context/AppDataContext";
import { PreferencesProvider } from "./context/PreferencesContext";

export default function App() {
  return (
    <PreferencesProvider>
      <AppDataProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: "13px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-ink)",
            },
          }}
        />
      </AppDataProvider>
    </PreferencesProvider>
  );
}
