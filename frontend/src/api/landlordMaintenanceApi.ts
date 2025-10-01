import { privateApi } from "./axios";

// Types for maintenance request data
export interface MaintenanceRequest {
  id: string;
  description: string;
  photoUrl: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  updatedAt: string;
  timeAgo: string;
  daysOpen: number;
  property: {
    id: string;
    title: string;
    address: string;
  };
  unit: {
    id: string;
    label: string;
    status: string;
  } | null;
  reporter: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    role: string;
    fullName: string;
  };
}

export interface MaintenanceRequestDetails extends MaintenanceRequest {
  timeInfo: {
    timeAgo: string;
    daysOpen: number;
    hoursOpen: number;
    createdAt: string;
    updatedAt: string;
  };
  property: {
    id: string;
    title: string;
    address: string;
    mainImageUrl: string | null;
  };
  unit: {
    id: string;
    label: string;
    status: string;
    description: string;
    mainImageUrl: string | null;
  } | null;
  reporter: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    role: string;
    fullName: string;
    createdAt: string;
  };
}

export interface MaintenanceStats {
  overview: {
    totalRequests: number;
    openRequests: number;
    inProgressRequests: number;
    resolvedRequests: number;
    urgentRequests: number;
    resolutionRate: number;
    averageResolutionTime: number;
  };
  byProperty: Record<string, {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  }>;
}

export interface UpdateMaintenanceStatusData {
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  notes?: string;
}

// API functions
export const getLandlordMaintenanceRequestsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<MaintenanceRequest[]>("/landlord/maintenance", {
    signal: params?.signal,
  });
  return response;
};

export const getMaintenanceRequestDetailsRequest = async (requestId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<MaintenanceRequestDetails>(`/landlord/maintenance/${requestId}`, {
    signal: params?.signal,
  });
  return response;
};

export const getMaintenanceStatsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<MaintenanceStats>("/landlord/maintenance/stats", {
    signal: params?.signal,
  });
  return response;
};

export const updateMaintenanceRequestStatusRequest = async (requestId: string, data: UpdateMaintenanceStatusData) => {
  const response = await privateApi.put(`/landlord/maintenance/${requestId}/status`, data);
  return response;
};

export const deleteMaintenanceRequestRequest = async (requestId: string) => {
  const response = await privateApi.delete(`/landlord/maintenance/${requestId}`);
  return response;
};
