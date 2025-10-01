// src/api.ts
import axios, { type AxiosResponse } from "axios";
import { refreshTokenRequest } from "./authApi";
import { useAuthStore } from "@/stores/useAuthStore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// --- Public API ---
export const publicApi = axios.create({ baseURL: BACKEND_URL });

// --- Private API ---
export const privateApi = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

// --- Track single refresh globally ---
let refreshPromise: Promise<AxiosResponse<any>> | null = null;

// --- Response interceptor ---
privateApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // --- If account disabled (403) → force logout ---
    if (status === 403) {
      const { setUser } = useAuthStore.getState();
      setUser(null);

      window.history.pushState({}, "", "/auth/login");
      window.dispatchEvent(new PopStateEvent("popstate"));

      return Promise.reject(error);
    }

    // --- If expired token (401) → attempt refresh ---
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshTokenRequest()
          .then((res: AxiosResponse<any>) => res)
          .catch((err) => {
            const { setUser } = useAuthStore.getState();
            setUser(null);

            window.history.pushState({}, "", "/auth/login");
            window.dispatchEvent(new PopStateEvent("popstate"));

            throw err;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        return privateApi(originalRequest); // retry original
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

