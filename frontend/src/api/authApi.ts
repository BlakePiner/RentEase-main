import { publicApi, privateApi } from "./axios";

// ---- Public Endpoints ----
export const registerRequest = (data: any) =>
  publicApi.post("/auth/register", data);

export const loginRequest = (data: any) =>
  publicApi.post("/auth/login", data, { withCredentials: true });

export const forgotPasswordRequest = (data: any) =>
  publicApi.post("/auth/forgot-password", data);

export const resetPasswordRequest = (data: any) =>
  publicApi.post("/auth/reset-password", data);

export const verifyEmailRequest = (data: any) =>
  publicApi.post("/auth/verify-email", data);

export const resendVerificationRequest = (data: any) =>
  publicApi.post("/auth/resend-verification", data);

export const refreshTokenRequest = (options?: { signal?: AbortSignal }) =>
  publicApi.post("/auth/refresh", {}, { withCredentials: true, signal: options?.signal });

export const logoutRequest = () =>
  publicApi.post("/auth/logout", {}, { withCredentials: true });

export const checkAuthStatusRequest = (options?: { signal?: AbortSignal }) =>
  publicApi.get("/auth/status", { withCredentials: true, signal: options?.signal });

// ---- Private Endpoints ----
export const getUserInfoRequest = (options?: { signal?: AbortSignal }) =>
  privateApi.get("/auth/me", { signal: options?.signal });

export const onboardingRequest = (data: any, options?: { signal?: AbortSignal }) =>
  privateApi.put("/auth/onboarding", data, { signal: options?.signal });

// 🔹 Update profile (protected)
export const updateProfileRequest = (data: any, options?: { signal?: AbortSignal }) =>
  privateApi.put("/auth/update-profile", data, { signal: options?.signal });