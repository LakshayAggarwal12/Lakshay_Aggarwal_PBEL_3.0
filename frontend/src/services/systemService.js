import api from "./api";

export async function getHealth() {
  const started = performance.now();
  const { data } = await api.get("/health");
  const latencyMs = Math.round(performance.now() - started);
  return { ...data, latencyMs };
}
