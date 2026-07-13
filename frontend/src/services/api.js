import axios from "axios";

// Points at the FastAPI backend from Day 1/2. Override via .env if the
// backend is deployed somewhere other than localhost.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// Normalizes FastAPI's {detail: "..."} error shape into a plain message
// string so every call site can just do error.message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail;
    const message = typeof detail === "string" ? detail : "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;
