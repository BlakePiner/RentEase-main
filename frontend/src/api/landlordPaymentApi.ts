import { privateApi } from "./axios";

// ---------------------------------------------- INTERFACES ----------------------------------------------

export interface Payment {
  id: string;
  amount: number;
  paidAt: string | null;
  method: string | null;
  providerTxnId: string | null;
  status: "PENDING" | "PAID";
  timingStatus: "ONTIME" | "LATE" | "ADVANCE";
  isPartial: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lease: {
    id: string;
    leaseNickname: string;
    rentAmount: number;
    interval: string;
    unit: {
      id: string;
      label: string;
      property: {
        id: string;
        title: string;
      };
    };
    tenant: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      phoneNumber: string | null;
    };
  };
}

export interface PaymentDetails extends Payment {
  lease: {
    id: string;
    leaseNickname: string;
    rentAmount: number;
    interval: string;
    startDate: string;
    endDate: string | null;
    unit: {
      id: string;
      label: string;
      property: {
        id: string;
        title: string;
        address: string | null;
      };
    };
    tenant: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      phoneNumber: string | null;
      avatarUrl: string | null;
    };
  };
}

export interface PaymentStats {
  summary: {
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    totalAmount: number;
    pendingAmount: number;
    onTimeRate: number;
    lateRate: number;
  };
  timing: {
    onTime: number;
    late: number;
    advance: number;
  };
  distribution: {
    methods: Record<string, number>;
  };
  trend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export interface PaymentHistory {
  lease: {
    id: string;
    leaseNickname: string;
    rentAmount: number;
    interval: string;
    startDate: string;
    endDate: string | null;
    unit: {
      id: string;
      label: string;
      property: {
        id: string;
        title: string;
      };
    };
    tenant: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string | null;
    method: string | null;
    status: string;
    timingStatus: string;
    isPartial: boolean;
    note: string | null;
    createdAt: string;
  }>;
}

export interface PaymentReminder {
  leaseId: string;
  tenantName: string;
  tenantEmail: string;
  pendingAmount: number;
  pendingCount: number;
  reminderType: string;
  message: string;
  sentAt: string;
}

export interface UpdatePaymentStatusData {
  status?: "PENDING" | "PAID";
  note?: string;
}

export interface SendReminderData {
  message?: string;
  reminderType?: "GENERAL" | "OVERDUE" | "FINAL_NOTICE";
}

// ---------------------------------------------- API FUNCTIONS ----------------------------------------------

export const getLandlordPaymentsRequest = async (params?: {
  status?: string;
  timingStatus?: string;
  leaseId?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}) => {
  const response = await privateApi.get<{
    payments: Payment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>("/landlord/payments", {
    params,
    signal: params?.signal,
  });
  return response;
};

export const getPaymentDetailsRequest = async (paymentId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<PaymentDetails>(`/landlord/payments/${paymentId}`, {
    signal: params?.signal,
  });
  return response;
};

export const updatePaymentStatusRequest = async (paymentId: string, data: UpdatePaymentStatusData) => {
  const response = await privateApi.put<{
    message: string;
    payment: {
      id: string;
      status: string;
      paidAt: string | null;
      note: string | null;
      updatedAt: string;
    };
  }>(`/landlord/payments/${paymentId}/status`, data);
  return response;
};

export const getPaymentStatsRequest = async (params?: { 
  period?: "week" | "month" | "quarter" | "year";
  signal?: AbortSignal;
}) => {
  const response = await privateApi.get<PaymentStats>("/landlord/payments/stats", {
    params,
    signal: params?.signal,
  });
  return response;
};

export const getLeasePaymentHistoryRequest = async (leaseId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<PaymentHistory>(`/landlord/leases/${leaseId}/payments`, {
    signal: params?.signal,
  });
  return response;
};

export const sendPaymentReminderRequest = async (leaseId: string, data?: SendReminderData) => {
  const response = await privateApi.post<{
    message: string;
    reminder: PaymentReminder;
  }>(`/landlord/leases/${leaseId}/reminder`, data);
  return response;
};
