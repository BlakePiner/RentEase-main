import { privateApi } from "./axios";

// Types for tenant management data
export interface TenantWithBehavior {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  currentLease: {
    id: string;
    leaseNickname: string;
    status: string;
    rentAmount: number;
    interval: string;
    startDate: string;
    endDate: string | null;
    property: {
      id: string;
      title: string;
      address: string;
    };
    unit: {
      id: string;
      label: string;
      status: string;
    };
  } | null;
  behaviorAnalysis: {
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    paymentReliability: number;
    totalPayments: number;
    onTimePayments: number;
    maintenanceRequestsCount: number;
    recentMaintenanceCount: number;
    hasFrequentComplaints: boolean;
    aiRiskScore: number;
    aiSummary: string;
    lastAnalysisDate: string;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    timingStatus: string;
  }>;
  recentMaintenanceRequests: Array<{
    id: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
}

export interface TenantDetails extends TenantWithBehavior {
  leases: Array<{
    id: string;
    leaseNickname: string;
    status: string;
    rentAmount: number;
    interval: string;
    startDate: string;
    endDate: string | null;
    unit: {
      id: string;
      label: string;
      status: string;
      property: {
        id: string;
        title: string;
        address: string;
      };
    };
    payments: Array<{
      id: string;
      amount: number;
      status: string;
      paidAt: string | null;
      timingStatus: string;
      dueDate: string;
    }>;
    TenantBehaviorAnalysis: Array<{
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
    }>;
  }>;
  maintenanceRequests: Array<{
    id: string;
    description: string;
    status: string;
    createdAt: string;
    property: {
      id: string;
      title: string;
      address: string;
    };
    unit: {
      id: string;
      label: string;
    };
  }>;
  behaviorAnalysis: {
    overallRiskLevel: "LOW" | "MEDIUM" | "HIGH";
    paymentRiskLevel: "LOW" | "MEDIUM" | "HIGH";
    maintenanceRiskLevel: "LOW" | "MEDIUM" | "HIGH";
    paymentReliability: number;
    totalPayments: number;
    onTimePayments: number;
    latePayments: number;
    advancePayments: number;
    averagePaymentDelay: number;
    maintenanceRequestsCount: number;
    recentMaintenanceCount: number;
    hasFrequentComplaints: boolean;
    aiRiskScore: number;
    aiSummary: string;
    aiCategory: string;
    lastAnalysisDate: string;
  };
  screeningInfo: {
    id: string;
    screeningRiskLevel: string | null;
    aiScreeningSummary: string | null;
    createdAt: string;
    status: string;
  } | null;
}

export interface ScreeningResult {
  id: string;
  tenantId: string;
  unitId: string;
  riskLevel: string;
  summary: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  recommendations: string[];
  screeningData: {
    creditScore: number;
    criminalBackground: boolean;
    evictionHistory: boolean;
    employmentVerification: boolean;
    incomeVerification: boolean;
  };
}

export interface BehaviorReport {
  tenant: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    joinedDate: string;
  };
  reportType: string;
  generatedAt: string;
  summary: {
    overallRiskLevel: "LOW" | "MEDIUM" | "HIGH";
    paymentReliability: number;
    maintenanceRequestsCount: number;
    recentMaintenanceCount: number;
    averagePaymentDelay: number;
  };
  detailedAnalysis: {
    paymentBehavior: {
      totalPayments: number;
      onTimePayments: number;
      latePayments: number;
      advancePayments: number;
      reliability: number;
      trend: string;
    };
    maintenanceBehavior: {
      totalRequests: number;
      recentRequests: number;
      averageResponseTime: number;
      requestTypes: {
        plumbing: number;
        electrical: number;
        hvac: number;
        general: number;
        emergency: number;
      };
    };
    leaseHistory: {
      totalLeases: number;
      activeLeases: number;
      averageLeaseDuration: number;
      renewalRate: number;
    };
  };
  recommendations: string[];
  riskFactors: string[];
}

export interface TenantStats {
  overview: {
    totalTenants: number;
    activeTenants: number;
    overallPaymentReliability: number;
    totalMaintenanceRequests: number;
    averageMaintenancePerTenant: number;
  };
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  performance: {
    averagePaymentDelay: number;
    tenantRetentionRate: number;
    screeningCompletionRate: number;
  };
}

export interface RunScreeningData {
  tenantId: string;
  unitId: string;
}

// API functions
export const getLandlordTenantsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<TenantWithBehavior[]>("/landlord/tenants", {
    signal: params?.signal,
  });
  return response;
};

export const getTenantDetailsRequest = async (tenantId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<TenantDetails>(`/landlord/tenants/${tenantId}`, {
    signal: params?.signal,
  });
  return response;
};

export const getTenantStatsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<TenantStats>("/landlord/tenants/stats", {
    signal: params?.signal,
  });
  return response;
};

export const runTenantScreeningRequest = async (data: RunScreeningData) => {
  const response = await privateApi.post("/landlord/tenants/screening", data);
  return response;
};

export const getScreeningResultsRequest = async (tenantId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<ScreeningResult[]>(`/landlord/tenants/${tenantId}/screening`, {
    signal: params?.signal,
  });
  return response;
};

export const generateBehaviorReportRequest = async (tenantId: string, reportType: string = "comprehensive", params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<BehaviorReport>(`/landlord/tenants/${tenantId}/behavior-report?reportType=${reportType}`, {
    signal: params?.signal,
  });
  return response;
};
