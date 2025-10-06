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
    rentAmount: number;
    interval: string;
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

// Submit Maintenance Request Types
export interface MaintenanceRequestSubmission {
  description: string;
  photoUrl: string;
}

export const submitMaintenanceRequest = async (data: FormData) => {
  const response = await privateApi.post("/tenant/maintenance-requests", data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const clearMaintenanceRequest = async (requestId: string) => {
  const response = await privateApi.patch(`/tenant/maintenance-requests/${requestId}/clear`);
  return response;
};

// Browse Properties Types
export interface BrowseProperty {
  id: string;
  title: string;
  type: string;
  street: string;
  barangay: string;
  zipCode: string | null;
  mainImageUrl: string | null;
  nearInstitutions: any;
  createdAt: string;
  address: string;
  location: string;
  availableUnitsCount: number;
  totalViews: number;
  priceRange: {
    min: number;
    max: number;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    tenantName: string;
  }>;
  avgRating: number;
  reviewCount: number;
  amenities: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  sampleUnit: {
    id: string;
    label: string;
    maxOccupancy: number;
    floorNumber: number | null;
  } | null;
}

export interface BrowsePropertiesResponse {
  properties: BrowseProperty[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Property Details Types
export interface PropertyUnit {
  id: string;
  label: string;
  description: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  mainImageUrl: string | null;
  otherImages: any;
  viewCount: number;
  targetPrice: number;
  securityDeposit: number;
  maxOccupancy: number;
  floorNumber: number | null;
  unitLeaseRules: any;
  requiresScreening: boolean;
  createdAt: string;
  listedAt: string;
  amenities: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    tenantName: string;
  }>;
  avgRating: number;
  reviewCount: number;
}

export interface PropertyDetails {
  id: string;
  title: string;
  type: string;
  street: string;
  barangay: string;
  zipCode: string | null;
  mainImageUrl: string | null;
  nearInstitutions: any;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  address: string;
  location: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
  };
  availableUnits: PropertyUnit[];
  totalAvailableUnits: number;
  priceRange: {
    min: number;
    max: number;
  };
  totalViews: number;
  allAmenities: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  allReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    tenantName: string;
    unitLabel: string;
  }>;
  avgRating: number;
  totalReviews: number;
}

// Browse Properties API
export const browseApprovedPropertiesRequest = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  amenities?: string[];
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  sortBy?: string;
  signal?: AbortSignal;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.location) queryParams.append('location', params.location);
  if (params.amenities && params.amenities.length > 0) {
    params.amenities.forEach(amenity => queryParams.append('amenities', amenity));
  }
  if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.propertyType) queryParams.append('propertyType', params.propertyType);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);

  const response = await privateApi.get<BrowsePropertiesResponse>(`/tenant/browse-properties?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response;
};

// Get Property Details API
export const getPropertyDetailsRequest = async (propertyId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<PropertyDetails>(`/tenant/properties/${propertyId}`, {
    signal: params?.signal,
  });
  return response;
};

// Application Types
export interface TenantApplication {
  id: string;
  status: string;
  submittedAt: string;
  riskLevel: string;
  aiRiskScore: number;
  unit: {
    id: string;
    label: string;
    targetPrice: number;
    property: {
      id: string;
      title: string;
      address: string;
      location: string;
      mainImageUrl: string | null;
    };
  };
}

export interface ApplicationFormData {
  // Personal Information
  fullName?: string;
  birthdate?: string;
  governmentIdNumber?: string;
  
  // Employment & Financial
  employmentStatus?: string;
  employerName?: string;
  monthlyIncome?: number;
  
  // Background & References
  previousLandlordName?: string;
  previousLandlordContact?: string;
  rentalHistoryNotes?: string;
  characterReferences?: any;
  
  // Lifestyle
  isSmoker?: boolean;
  hasPets?: boolean;
  petTypes?: string;
  otherLifestyle?: any;
  
  // Document URLs (if uploaded)
  idImageUrl?: string;
  selfieUrl?: string;
  nbiClearanceUrl?: string;
  biodataUrl?: string;
  proofOfIncomeUrl?: string;
}

// Application API functions
export const submitTenantApplicationRequest = async (unitId: string, applicationData: ApplicationFormData | FormData) => {
  const response = await privateApi.post(`/tenant/applications/${unitId}`, applicationData, {
    headers: {
      'Content-Type': applicationData instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  });
  return response;
};

export const getTenantApplicationsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<TenantApplication[]>("/tenant/applications", {
    signal: params?.signal,
  });
  return response;
};

// Download lease PDF
export const downloadLeasePDF = async (leaseId: string): Promise<Blob> => {
  const response = await privateApi.get(`/tenant/lease/${leaseId}/pdf`, {
    responseType: 'blob'
  });
  return response.data;
};

// Submit tenant payment (sandbox)
export interface TenantPaymentRequest {
  amount: number;
  method: string;
  note?: string;
}

export interface TenantPaymentResponse {
  message: string;
  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
    providerTxnId: string;
    paidAt: string;
    note: string;
  };
  sandbox: boolean;
}

export const submitTenantPayment = async (paymentData: TenantPaymentRequest): Promise<{ data: TenantPaymentResponse }> => {
  const response = await privateApi.post<TenantPaymentResponse>("/tenant/payments", paymentData);
  return response;
};