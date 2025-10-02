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
