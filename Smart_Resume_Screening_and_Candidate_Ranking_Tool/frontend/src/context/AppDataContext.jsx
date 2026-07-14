import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { listCandidates } from "../services/candidateService";
import { listJobDescriptions } from "../services/jobService";

/**
 * Now backed by real list endpoints (GET /api/candidates, GET
 * /api/job-descriptions) — the backend is the source of truth, fetched on
 * mount. localStorage is kept only as a best-effort offline cache so the
 * UI isn't empty for a moment on slow connections; it's overwritten by the
 * server response as soon as that arrives.
 */
const AppDataContext = createContext(null);

const CANDIDATES_KEY = "resume_screener_candidates";
const JDS_KEY = "resume_screener_jds";

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function AppDataProvider({ children }) {
  const [candidates, setCandidates] = useState(() => loadFromStorage(CANDIDATES_KEY));
  const [jobDescriptions, setJobDescriptions] = useState(() => loadFromStorage(JDS_KEY));
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [candidatesData, jdData] = await Promise.all([
        listCandidates(),
        listJobDescriptions(),
      ]);
      setCandidates(candidatesData);
      setJobDescriptions(jdData);
    } catch {
      // Backend unreachable — keep whatever was cached in localStorage
      // rather than wiping the screen, and let ApiStatusPill surface the
      // outage separately.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem(JDS_KEY, JSON.stringify(jobDescriptions));
  }, [jobDescriptions]);

  const addCandidate = useCallback((candidate, atsReport) => {
    setCandidates((prev) => {
      const withoutDupe = prev.filter((c) => c.id !== candidate.id);
      return [{ ...candidate, ats_report: atsReport }, ...withoutDupe];
    });
  }, []);

  const addJobDescription = useCallback((jd) => {
    setJobDescriptions((prev) => {
      const withoutDupe = prev.filter((j) => j.id !== jd.id);
      return [jd, ...withoutDupe];
    });
  }, []);

  const getCandidateById = useCallback(
    (id) => candidates.find((c) => c.id === id),
    [candidates]
  );

  const getJobDescriptionById = useCallback(
    (id) => jobDescriptions.find((j) => j.id === id),
    [jobDescriptions]
  );

  const clearAll = useCallback(() => {
    setCandidates([]);
    setJobDescriptions([]);
    localStorage.removeItem(CANDIDATES_KEY);
    localStorage.removeItem(JDS_KEY);
  }, []);

  const value = {
    candidates,
    jobDescriptions,
    loading,
    refresh,
    addCandidate,
    addJobDescription,
    getCandidateById,
    getJobDescriptionById,
    clearAll,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
