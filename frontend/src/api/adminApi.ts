import { privateApi } from "./axios";

// Types for admin dashboard data
export interface AdminDashboardStats {
  overview: {
    totalUsers: number;
    totalLandlords: number;
    totalTenants: number;
    disabledUsers: number;
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    availableUnits: number;
    maintenanceUnits: number;
    totalLeases: number;
    activeLeases: number;
    totalPayments: number;
    pendingPayments: number;
    overduePayments: number;
    totalMaintenanceRequests: number;
    pendingMaintenance: number;
  };
  financial: {
    totalRevenue: number;
    monthlyRevenue: number;
    paidPayments: number;
    pendingPayments: number;
    overduePayments: number;
  };
  growth: {
    newUsersThisMonth: number;
    newUsersLastMonth: number;
    userGrowthRate: number;
    newPropertiesThisMonth: number;
    newLeasesThisMonth: number;
  };
  systemHealth: {
    totalUsers: number;
    activeUsers: number;
    occupancyRate: number;
    paymentSuccessRate: number;
    maintenanceResponseRate: number;
  };
  recentActivity: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
      isDisabled: boolean;
    }>;
    properties: Array<{
      id: string;
      title: string;
      type: string;
      location: string;
      createdAt: string;
      owner: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
      createdAt: string;
      paidAt: string | null;
      tenant: string;
      property: string;
      unit: string;
    }>;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isDisabled: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
  propertiesCount: number;
  leasesCount: number;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SystemAnalytics {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  trends: {
    userRegistrations: number;
    propertyCreations: number;
    totalRevenue: number;
    totalTransactions: number;
  };
  topProperties: Array<{
    id: string;
    title: string;
    location: string;
    unitsCount: number;
    totalRevenue: number;
  }>;
}

// API functions
export const getAdminDashboardStatsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<AdminDashboardStats>("/admin/dashboard/stats", {
    signal: params?.signal,
  });
  return response;
};

export const getAllUsersRequest = async (params: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  signal?: AbortSignal;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.role) queryParams.append('role', params.role);
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);

  const response = await privateApi.get<UsersResponse>(`/admin/users?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response;
};

export const toggleUserStatusRequest = async (userId: string) => {
  const response = await privateApi.patch(`/admin/users/${userId}/toggle-status`);
  return response;
};

export const getSystemAnalyticsRequest = async (params: {
  period?: string;
  signal?: AbortSignal;
}) => {
  const queryParams = new URLSearchParams();
  if (params.period) queryParams.append('period', params.period);

  const response = await privateApi.get<SystemAnalytics>(`/admin/analytics?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response;
};

// Property Requests Types
export interface PropertyRequest {
  id: string;
  status: string;
  amount: number;
  paymentStatus: string;
  attemptCount: number;
  riskLevel: string;
  fraudRiskScore: number;
  adminNotes: any[];
  createdAt: string;
  updatedAt: string;
  unit: {
    id: string;
    label: string;
    description: string;
    status: string;
    targetPrice: number;
    securityDeposit: number;
    maxOccupancy: number;
    floorNumber: number;
    mainImageUrl: string | null;
    amenities: Array<{
      id: string;
      name: string;
      category: string;
    }>;
    property: {
      id: string;
      title: string;
      type: string;
      address: string;
      location: string;
      mainImageUrl: string | null;
    };
  };
  landlord: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface PropertyRequestsResponse {
  listings: PropertyRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Property Requests API functions
export const getPropertyRequestsRequest = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  signal?: AbortSignal;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);

  const response = await privateApi.get<PropertyRequestsResponse>(`/admin/property-requests?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response;
};

export const updatePropertyRequestStatusRequest = async (listingId: string, data: {
  status: 'APPROVED' | 'REJECTED' | 'BLOCKED';
  adminNotes?: string;
}) => {
  const response = await privateApi.patch(`/admin/property-requests/${listingId}`, data);
  return response;
};

// All Properties Types
export interface Property {
  id: string;
  title: string;
  type: string;
  address: string;
  city: string;
  zipCode: string | null;
  mainImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    isDisabled: boolean;
  };
  unitsCount: number;
  maintenanceRequestsCount: number;
  units: Array<{
    id: string;
    label: string;
    status: string;
    targetPrice: number;
  }>;
}

export interface PropertiesResponse {
  properties: Property[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// All Properties API functions
export const getAllPropertiesRequest = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  signal?: AbortSignal;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.type) queryParams.append('type', params.type);
  if (params.status) queryParams.append('status', params.status);

  const response = await privateApi.get<PropertiesResponse>(`/admin/properties?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response;
};

// All Payments Types
export interface Payment {
  id: string;
  amount: number;
  paidAt: string | null;
  method: string | null;
  providerTxnId: string | null;
  status: string;
  timingStatus: string;
  isPartial: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lease: {
    id: string;
    leaseNickname: string;
    leaseType: string;
    startDate: string;
    endDate: string | null;
    rentAmount: number;
    interval: string;
    status: string;
    tenant: {
      id: string;
      name: string;
      email: string;
      isDisabled: boolean;
    };
    unit: {
      id: string;
      label: string;
      property: {
        id: string;
        title: string;
        address: string;
        owner: {
          id: string;
          name: string;
          email: string;
        };
      };
    };
  };
}

export interface PaymentsResponse {
  payments: Payment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaymentAnalytics {
  summary: {
    totalPayments: number;
    totalAmount: number;
    paidPayments: number;
    pendingPayments: number;
    onTimePayments: number;
    latePayments: number;
    advancePayments: number;
    partialPayments: number;
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    totalAmount: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

// All Payments API functions
export const getAllPaymentsRequest = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  method?: string;
  timingStatus?: string;
  signal?: AbortSignal;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);
  if (params.method) queryParams.append('method', params.method);
  if (params.timingStatus) queryParams.append('timingStatus', params.timingStatus);

  const response = await privateApi.get<PaymentsResponse>(`/admin/payments?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response;
};

export const getPaymentAnalyticsRequest = async (params: {
  period?: string;
  signal?: AbortSignal;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.period) queryParams.append('period', params.period);

  const response = await privateApi.get<PaymentAnalytics>(`/admin/payments/analytics?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response;
};

// System Logs Types
export interface SystemLog {
  id: string;
  name: string;
  email: string;
  role: string;
  isDisabled: boolean;
  activityStatus: 'online' | 'offline' | 'new_user';
  activityType: 'online' | 'offline' | 'new_user';
  lastActivity: string | null;
  timeOnline: number;
  timeOffline: number;
  createdAt: string;
  updatedAt: string;
  propertiesCount: number;
  leasesCount: number;
}

export interface SystemLogsResponse {
  logs: SystemLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SystemLogsAnalytics {
  summary: {
    totalUsers: number;
    onlineUsers: number;
    offlineUsers: number;
    newUsers: number;
    recentLogins: number;
    userRegistrations: number;
  };
  roleBreakdown: Array<{
    role: string;
    count: number;
  }>;
}

// System Logs API functions
export const getSystemLogsRequest = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  activityType?: string;
  signal?: AbortSignal;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.role) queryParams.append('role', params.role);
  if (params.activityType) queryParams.append('activityType', params.activityType);

  const response = await privateApi.get<SystemLogsResponse>(`/admin/system-logs?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response;
};

export const getSystemLogsAnalyticsRequest = async (params: {
  period?: string;
  signal?: AbortSignal;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.period) queryParams.append('period', params.period);

  const response = await privateApi.get<SystemLogsAnalytics>(`/admin/system-logs/analytics?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response;
};
