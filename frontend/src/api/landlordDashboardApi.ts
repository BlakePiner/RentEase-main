import { privateApi } from "./axios";

// Types for recent activity
export interface RecentActivity {
  id: string;
  type: 'APPLICATION' | 'MAINTENANCE' | 'PAYMENT' | 'MESSAGE';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  priority?: string;
  amount?: number;
  property?: {
    id: string;
    title: string;
    address: string;
  };
  unit?: {
    id: string;
    label: string;
  };
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatarUrl?: string;
  };
  metadata?: {
    riskLevel?: string;
    aiRiskScore?: number;
    timingStatus?: string;
    method?: string;
  };
}

// Types for upcoming tasks
export interface UpcomingTask {
  id: string;
  type: 'APPLICATION_REVIEW' | 'LEASE_RENEWAL' | 'INSPECTION' | 'MAINTENANCE_FOLLOWUP';
  title: string;
  description: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'OVERDUE' | 'COMPLETED';
  property?: {
    id: string;
    title: string;
    address: string;
  };
  unit?: {
    id: string;
    label: string;
  };
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatarUrl?: string;
  };
  metadata?: {
    daysUntilDue?: number;
    isOverdue?: boolean;
    riskLevel?: string;
    aiRiskScore?: number;
  };
}

// API functions
export const getRecentActivityRequest = async (params?: { 
  limit?: number;
  signal?: AbortSignal;
}) => {
  const response = await privateApi.get<RecentActivity[]>("/landlord/dashboard/recent-activity", {
    params: { limit: params?.limit || 10 },
    signal: params?.signal,
  });
  return response;
};

export const getUpcomingTasksRequest = async (params?: { 
  limit?: number;
  signal?: AbortSignal;
}) => {
  const response = await privateApi.get<UpcomingTask[]>("/landlord/dashboard/upcoming-tasks", {
    params: { limit: params?.limit || 10 },
    signal: params?.signal,
  });
  return response;
};
