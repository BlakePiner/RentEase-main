import { privateApi } from "./axios";

// Types for tenant data
export interface Tenant {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: string;
  isVerified: boolean;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// API functions
export const getTenantsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<Tenant[]>("/landlord/tenants/available", {
    signal: params?.signal,
  });
  return response;
};

export const getTenantDetailsRequest = async (tenantId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<Tenant>(`/landlord/tenants/${tenantId}`, {
    signal: params?.signal,
  });
  return response;
};
