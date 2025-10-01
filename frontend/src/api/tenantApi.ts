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

// Types for tenant dashboard data
export interface TenantDashboardData {
  overview: {
    activeLeases: number;
    totalPayments: number;
    onTimePayments: number;
    pendingPayments: number;
    maintenanceRequests: number;
    upcomingPayments: number;
    leaseEndingSoon: number;
  };
  currentLease: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    unit: {
      id: string;
      label: string;
      property: {
        id: string;
        title: string;
        address: string;
      };
    };
  } | null;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    timingStatus: string;
    dueDate: string;
    paidAt?: string;
    createdAt: string;
  }>;
  recentMaintenanceRequests: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    createdAt: string;
    property: {
      id: string;
      title: string;
    };
    unit: {
      id: string;
      label: string;
    };
  }>;
  upcomingTasks: Array<{
    id: string;
    type: string;
    title: string;
    dueDate: string;
    description: string;
    status: string;
  }>;
  financialSummary: {
    totalPaid: number;
    totalDue: number;
    nextPaymentDue: string;
    nextPaymentAmount: number;
    paymentReliability: number;
  };
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

// Types for tenant lease data
export interface TenantLeaseDetails {
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
    description: string;
    maxOccupancy: number;
    floorNumber: number | null;
    amenities: Array<{
      id: string;
      name: string;
    }>;
    property: {
      id: string;
      title: string;
      address: string;
      type: string;
      description: string;
    };
  };
  landlord: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
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
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    timingStatus: string;
    dueDate: string;
    createdAt: string;
  }>;
  upcomingPayments: Array<{
    id: string;
    amount: number;
    dueDate: string;
    status: string;
  }>;
  leaseRules: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
  }>;
}

// Tenant dashboard API functions
export const getTenantDashboardData = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<TenantDashboardData>("/tenant/dashboard", {
    signal: params?.signal,
  });
  return response;
};

export const getTenantLeaseDetails = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<TenantLeaseDetails>("/tenant/lease", {
    signal: params?.signal,
  });
  return response;
};

export const getTenantPayments = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get("/tenant/payments", {
    signal: params?.signal,
  });
  return response;
};

export const getTenantMaintenanceRequests = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get("/tenant/maintenance-requests", {
    signal: params?.signal,
  });
  return response;
};
