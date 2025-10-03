import { privateApi } from "./axios";

// Types for lease data
export interface Lease {
  id: string;
  leaseNickname: string;
  leaseType: string;
  startDate: string;
  endDate: string | null;
  rentAmount: number;
  interval: "DAILY" | "WEEKLY" | "MONTHLY";
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";
  hasFormalDocument: boolean;
  leaseDocumentUrl: string | null;
  landlordName: string | null;
  tenantName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  unit: {
    id: string;
    label: string;
    status: string;
    targetPrice: number;
    property: {
      id: string;
      title: string;
      address: string;
    };
  };
  tenant: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    fullName: string;
  };
  paymentStats: {
    total: number;
    paid: number;
    pending: number;
    onTime: number;
    late: number;
    reliability: number;
  };
  leaseInfo: {
    isActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    daysInfo: {
      days: number;
      isOverdue: boolean;
      isExpiringSoon: boolean;
    } | null;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    timingStatus: string;
  }>;
}

export interface LeaseDetails {
  id: string;
  leaseNickname: string;
  leaseType: string;
  startDate: string;
  endDate: string | null;
  rentAmount: number;
  interval: "DAILY" | "WEEKLY" | "MONTHLY";
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";
  hasFormalDocument: boolean;
  leaseDocumentUrl: string | null;
  landlordName: string | null;
  tenantName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  unit: {
    id: string;
    label: string;
    status: string;
    targetPrice: number;
    property: {
      id: string;
      title: string;
      address: string;
    };
  };
  tenant: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    fullName: string;
  };
  paymentStats: {
    total: number;
    paid: number;
    pending: number;
    onTime: number;
    late: number;
    advance: number;
    totalPaidAmount: number;
    totalPendingAmount: number;
    reliability: number;
  };
  leaseInfo: {
    isActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    leaseDuration: number | null;
    daysElapsed: number;
    daysRemaining: number | null;
    isExpiringSoon: boolean;
    isOverdue: boolean;
  };
  behaviorAnalysis: {
    id: string;
    paymentBehavior: string | null;
    paymentReliability: number | null;
    maintenanceRequestsCount: number;
    maintenanceRiskLevel: string | null;
    hasFrequentComplaints: boolean | null;
    aiRiskScore: number | null;
    riskLevel: string | null;
    aiSummary: string | null;
    aiCategory: string | null;
  } | null;
}

export interface LeaseStats {
  overview: {
    totalLeases: number;
    activeLeases: number;
    expiredLeases: number;
    terminatedLeases: number;
    draftLeases: number;
    expiringLeases: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
  };
  payments: {
    totalPayments: number;
    onTimePayments: number;
    latePayments: number;
    paymentReliability: number;
  };
  distribution: {
    leaseTypes: Record<string, number>;
    intervals: Record<string, number>;
  };
}

export interface CreateLeaseData {
  unitId: string;
  tenantId: string;
  leaseNickname: string;
  leaseType: string;
  startDate: string;
  endDate?: string;
  rentAmount: number;
  interval: "DAILY" | "WEEKLY" | "MONTHLY";
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";
  hasFormalDocument?: boolean;
  leaseDocumentUrl?: string;
  landlordName?: string;
  tenantName?: string;
  rules?: any;
  notes?: string;
}

export interface UpdateLeaseData {
  leaseNickname?: string;
  leaseType?: string;
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  interval?: "DAILY" | "WEEKLY" | "MONTHLY";
  status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";
  hasFormalDocument?: boolean;
  leaseDocumentUrl?: string;
  landlordName?: string;
  tenantName?: string;
  rules?: any;
  notes?: string;
}

// API functions
export const getLandlordLeasesRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<Lease[]>("/landlord/leases", {
    signal: params?.signal,
  });
  return response;
};

export const getLeaseDetailsRequest = async (leaseId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<LeaseDetails>(`/landlord/leases/${leaseId}`, {
    signal: params?.signal,
  });
  return response;
};

export const getLeaseStatsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<LeaseStats>("/landlord/leases/stats", {
    signal: params?.signal,
  });
  return response;
};

export const createLeaseRequest = async (data: CreateLeaseData | FormData) => {
  const response = await privateApi.post("/landlord/leases", data, {
    headers: {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
    },
  });
  return response;
};

export const updateLeaseRequest = async (leaseId: string, data: UpdateLeaseData | FormData) => {
  const response = await privateApi.put(`/landlord/leases/${leaseId}`, data, {
    headers: {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
    },
  });
  return response;
};

export const deleteLeaseRequest = async (leaseId: string) => {
  const response = await privateApi.delete(`/landlord/leases/${leaseId}`);
  return response;
};

// Generate lease PDF
export const generateLeasePDF = async (leaseId: string): Promise<Blob> => {
  const response = await privateApi.get(`/landlord/leases/${leaseId}/pdf`, {
    responseType: 'blob'
  });
  return response.data;
};