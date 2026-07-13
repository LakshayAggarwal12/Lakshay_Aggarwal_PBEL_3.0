import { useEffect, useState, useCallback } from "react";
import { getHealth } from "../services/systemService";

const POLL_INTERVAL_MS = 30000;

/**
 * Real backend connectivity check — pings the actual /health endpoint from
 * Day 1's main.py. Not a fake status pill; if your backend is down, this
 * will genuinely show "offline".
 */
export function useApiStatus() {
  const [status, setStatus] = useState("checking"); // "online" | "offline" | "checking"
  const [latencyMs, setLatencyMs] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const check = useCallback(async () => {
    try {
      const result = await getHealth();
      setStatus("online");
      setLatencyMs(result.latencyMs);
    } catch {
      setStatus("offline");
      setLatencyMs(null);
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [check]);

  return { status, latencyMs, lastChecked, recheck: check };
}
