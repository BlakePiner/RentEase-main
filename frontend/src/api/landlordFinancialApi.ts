import { privateApi } from "./axios";

// ---------------------------------------------- INTERFACES ----------------------------------------------

export interface FinancialOverview {
  overview: {
    totalRevenue: number;
    additionalIncome: number;
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    totalPendingAmount: number;
    profitMargin: number;
    period: string;
    startDate: string;
    endDate: string;
  };
  revenueByProperty: Array<{
    propertyId: string;
    propertyTitle: string;
    revenue: number;
    paymentCount: number;
  }>;
  expensesByProperty: Array<{
    propertyId: string;
    propertyTitle: string;
    expenses: number;
    expenseCount: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    paidAt: string;
    method: string | null;
    lease: {
      nickname: string;
      unit: string;
      property: string;
    };
  }>;
  recentExpenses: Array<{
    id: string;
    amount: number;
    description: string;
    date: string;
    property: {
      title: string;
    };
  }>;
  pendingPayments: Array<{
    id: string;
    amount: number;
    createdAt: string;
    lease: {
      nickname: string;
      unit: string;
      property: string;
    };
  }>;
}

export interface FinancialAnalytics {
  period: string;
  groupBy: string;
  revenueTrend: Array<{
    period: string;
    amount: number;
  }>;
  expenseTrend: Array<{
    period: string;
    amount: number;
  }>;
  growthRates: {
    revenue: number;
    expenses: number;
  };
}

export interface IncomeRecord {
  id: string;
  propertyId: string;
  unitId: string | null;
  amount: number;
  description: string;
  date: string;
  property: {
    id: string;
    title: string;
  };
}

export interface ExpenseRecord {
  id: string;
  propertyId: string;
  unitId: string | null;
  amount: number;
  description: string;
  date: string;
  property: {
    id: string;
    title: string;
  };
}

export interface AddIncomeRequest {
  propertyId: string;
  unitId?: string;
  amount: number;
  description: string;
  date?: string;
}

export interface AddExpenseRequest {
  propertyId: string;
  unitId?: string;
  amount: number;
  description: string;
  date?: string;
}

// ---------------------------------------------- API FUNCTIONS ----------------------------------------------

// Get financial overview
export const getFinancialOverview = async (period: string = 'month'): Promise<FinancialOverview> => {
  const response = await privateApi.get(`/landlord/financial/overview?period=${period}`);
  return response.data;
};

// Get financial analytics
export const getFinancialAnalytics = async (period: string = 'year'): Promise<FinancialAnalytics> => {
  const response = await privateApi.get(`/landlord/financial/analytics?period=${period}`);
  return response.data;
};

// Get income records
export const getIncomeRecords = async (propertyId?: string, page: number = 1, limit: number = 20) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (propertyId) {
    params.append('propertyId', propertyId);
  }
  
  const response = await privateApi.get(`/landlord/financial/income?${params}`);
  return response.data;
};

// Get expense records
export const getExpenseRecords = async (propertyId?: string, page: number = 1, limit: number = 20) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (propertyId) {
    params.append('propertyId', propertyId);
  }
  
  const response = await privateApi.get(`/landlord/financial/expenses?${params}`);
  return response.data;
};

// Add income record
export const addIncome = async (data: AddIncomeRequest) => {
  const response = await privateApi.post('/landlord/financial/income', data);
  return response.data;
};

// Add expense record
export const addExpense = async (data: AddExpenseRequest) => {
  const response = await privateApi.post('/landlord/financial/expenses', data);
  return response.data;
};

// Delete income record
export const deleteIncomeRecord = async (incomeId: string) => {
  const response = await privateApi.delete(`/landlord/financial/income/${incomeId}`);
  return response.data;
};

// Delete expense record
export const deleteExpenseRecord = async (expenseId: string) => {
  const response = await privateApi.delete(`/landlord/financial/expenses/${expenseId}`);
  return response.data;
};
