import { privateApi } from "./axios";

// ---------------------------------------------- INTERFACES ----------------------------------------------

export interface PropertyPerformanceReport {
  period: string;
  startDate: string;
  endDate: string;
  overallMetrics: {
    totalProperties: number;
    totalUnits: number;
    totalOccupiedUnits: number;
    overallOccupancyRate: number;
    totalRevenue: number;
    totalExpenses: number;
    totalNetIncome: number;
    averageROI: number;
  };
  propertyPerformance: Array<{
    propertyId: string;
    propertyTitle: string;
    propertyType: string;
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    roi: number;
    address: string;
    city: string;
  }>;
}

export interface FinancialTrendsReport {
  period: string;
  groupBy: string;
  startDate: string;
  endDate: string;
  trends: {
    revenue: Array<{
      period: string;
      amount: number;
    }>;
    expenses: Array<{
      period: string;
      amount: number;
    }>;
    netIncome: Array<{
      period: string;
      amount: number;
    }>;
  };
  growthRates: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
}

export interface TenantAnalyticsReport {
  totalTenants: number;
  totalPayments: number;
  paidPayments: number;
  onTimePayments: number;
  latePayments: number;
  paymentReliability: number;
  paymentSuccessRate: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  averageMetrics: {
    paymentReliability: number;
    maintenanceRequests: number;
  };
  tenantDetails: Array<{
    tenantId: string;
    tenantName: string;
    email: string;
    phoneNumber: string | null;
    propertyTitle: string;
    unitLabel: string;
    leaseStartDate: string;
    paymentReliability: number;
    maintenanceRequestsCount: number;
    riskLevel: string;
    aiRiskScore: number;
    aiSummary: string;
    recentPayments: Array<{
      amount: number;
      status: string;
      timingStatus: string;
      paidAt: string | null;
    }>;
  }>;
}

export interface OccupancyAnalyticsReport {
  period: string;
  startDate: string;
  endDate: string;
  overallMetrics: {
    totalUnits: number;
    currentlyOccupied: number;
    currentlyAvailable: number;
    overallOccupancyRate: number;
  };
  occupancyByType: Record<string, {
    total: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  }>;
  averageRentByType: Record<string, number>;
}

// ---------------------------------------------- API FUNCTIONS ----------------------------------------------

// Get property performance report
export const getPropertyPerformanceReport = async (period: string = 'year'): Promise<PropertyPerformanceReport> => {
  const response = await privateApi.get(`/landlord/reports/property-performance?period=${period}`);
  return response.data;
};

// Get financial trends report
export const getFinancialTrendsReport = async (period: string = 'year'): Promise<FinancialTrendsReport> => {
  const response = await privateApi.get(`/landlord/reports/financial-trends?period=${period}`);
  return response.data;
};

// Get tenant analytics report
export const getTenantAnalyticsReport = async (): Promise<TenantAnalyticsReport> => {
  const response = await privateApi.get('/landlord/reports/tenant-analytics');
  return response.data;
};

// Get occupancy analytics report
export const getOccupancyAnalyticsReport = async (period: string = 'year'): Promise<OccupancyAnalyticsReport> => {
  const response = await privateApi.get(`/landlord/reports/occupancy-analytics?period=${period}`);
  return response.data;
};
