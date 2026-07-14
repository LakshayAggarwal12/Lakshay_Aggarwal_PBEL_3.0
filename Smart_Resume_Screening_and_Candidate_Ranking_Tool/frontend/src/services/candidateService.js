import api from "./api";

/**
 * Lists every candidate stored in the backend, each with their latest ATS
 * report nested — the list endpoint that was missing before. This is now
 * the source of truth on load, instead of relying purely on localStorage.
 */
export async function listCandidates() {
  const { data } = await api.get("/api/candidates");
  return data;
}

/**
 * Uploads a resume file (PDF/DOCX) and returns { candidate, ats_report }.
 * This is the only endpoint that creates a Candidate — there is no
 * list-all-candidates endpoint on the backend yet (see README "Known Gaps").
 */
export async function uploadResume(file, onUploadProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/api/upload-resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data;
}

export async function getCandidate(candidateId) {
  const { data } = await api.get(`/api/candidates/${candidateId}`);
  return data;
}

export async function getAtsReport(candidateId) {
  const { data } = await api.get(`/api/candidates/${candidateId}/ats-report`);
  return data;
}

export async function getMatchScore(candidateId, jdId) {
  const { data } = await api.get(`/api/candidates/${candidateId}/match/${jdId}`);
  return data;
}
