import api from "./api";

export async function listJobDescriptions() {
  const { data } = await api.get("/api/job-descriptions");
  return data;
}

export async function createJobDescription({ title, raw_text }) {
  const { data } = await api.post("/api/job-descriptions", { title, raw_text });
  return data;
}

export async function getJobDescription(jdId) {
  const { data } = await api.get(`/api/job-descriptions/${jdId}`);
  return data;
}

/**
 * Ranks every candidate currently stored in the backend against this JD.
 * No request body — jd_id in the URL is the only input, per the backend
 * route signature (rank_all_candidates(jd_id: int, ...)).
 */
export async function rankCandidates(jdId) {
  const { data } = await api.post(`/api/job-descriptions/${jdId}/rank`);
  return data;
}
