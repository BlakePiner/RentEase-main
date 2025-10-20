import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Receipt
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  getAllPaymentsRequest, 
  getPaymentAnalyticsRequest,
  type Payment, 
  type PaymentsResponse,
  type PaymentAnalytics
} from "@/api/adminApi";

const AllPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    method: "",
    timingStatus: "",
    page: 1,
    limit: 10,
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await getAllPaymentsRequest({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        status: filters.status || undefined,
        method: filters.method || undefined,
        timingStatus: filters.timingStatus || undefined,
      });

      const data: PaymentsResponse = response.data;
      setPayments(data.payments);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission to view payments.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.code === 'ERR_NETWORK') {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to fetch payments. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await getPaymentAnalyticsRequest({
        period: '30d'
      });

      setAnalytics(response.data);
    } catch (error: any) {
      console.error("Error fetching payment analytics:", error);
      toast.error("Failed to fetch payment analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, status: value === "all" ? "" : value, page: 1 }));
  };

  // Handle method filter
  const handleMethodFilter = (value: string) => {
    setFilters(prev => ({ ...prev, method: value === "all" ? "" : value, page: 1 }));
  };

  // Handle timing status filter
  const handleTimingStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, timingStatus: value === "all" ? "" : value, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle view payment
  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  // Get payment status badge variant
  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'PENDING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get timing status badge variant
  const getTimingStatusBadgeVariant = (timingStatus: string) => {
    switch (timingStatus) {
      case 'ONTIME':
        return 'default';
      case 'LATE':
        return 'destructive';
      case 'ADVANCE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get payment method badge variant
  const getPaymentMethodBadgeVariant = (method: string | null) => {
    switch (method) {
      case 'CASH':
        return 'default';
      case 'GCASH':
        return 'secondary';
      case 'PAYPAL':
        return 'outline';
      case 'BANK_TRANSFER':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Payments</h1>
          <p className="text-gray-600 mt-1">
            Monitor all payment transactions across the platform
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-50">
                  <span className="text-2xl font-bold text-green-600">₱</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₱{analytics.summary.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-50">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.paidPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-orange-50">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.pendingPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-50">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">On-Time Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.onTimePayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-red-50">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Late Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.latePayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-50">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Advance Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.advancePayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-purple-50">
                  <span className="text-2xl font-bold text-purple-600">₱</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Partial Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.partialPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments by tenant, property, or lease..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.status || "all"} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.method || "all"} onValueChange={handleMethodFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="GCASH">GCash</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.timingStatus || "all"} onValueChange={handleTimingStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Timing</SelectItem>
                  <SelectItem value="ONTIME">On Time</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ADVANCE">Advance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payments ({pagination.totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600">
                {filters.search || filters.status !== "" || filters.method !== "" || filters.timingStatus !== ""
                  ? "Try adjusting your search or filter criteria."
                  : "No payments have been recorded yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Payment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              ₱{payment.amount.toLocaleString()}
                            </h3>
                            <Badge variant={getPaymentStatusBadgeVariant(payment.status)}>
                              {payment.status}
                            </Badge>
                            <Badge variant={getTimingStatusBadgeVariant(payment.timingStatus)}>
                              {payment.timingStatus}
                            </Badge>
                            {payment.isPartial && (
                              <Badge variant="outline">Partial</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            {payment.method && (
                              <Badge variant={getPaymentMethodBadgeVariant(payment.method)}>
                                {payment.method}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <User size={14} />
                              <span>{payment.lease.tenant.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Building2 size={14} />
                              <span>{payment.lease.unit.property.title}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                            <div className="text-sm text-gray-600">
                              {payment.lease.unit.label}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>
                                {payment.paidAt 
                                  ? `Paid ${new Date(payment.paidAt).toLocaleDateString()}`
                                  : `Created ${new Date(payment.createdAt).toLocaleDateString()}`
                                }
                              </span>
                            </div>
                            {payment.providerTxnId && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                                <span className="font-mono text-xs">
                                  {payment.providerTxnId}
                                </span>
                              </>
                            )}
                          </div>

                          {payment.note && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              "{payment.note}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewPayment(payment)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Receipt className="h-4 w-4 mr-2" />
                            Generate Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <User className="h-4 w-4 mr-2" />
                            Contact Tenant
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Building2 className="h-4 w-4 mr-2" />
                            View Lease Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{" "}
                {Math.min(pagination.currentPage * filters.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} payments
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this payment transaction.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-r from-green-100 to-blue-100 blur-2xl opacity-70" />
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-r from-green-100 to-blue-100 blur-3xl opacity-70" />
                </div>

                <div className="relative p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        ₱{selectedPayment.amount.toLocaleString()}
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getPaymentStatusBadgeVariant(selectedPayment.status)}>
                          {selectedPayment.status}
                        </Badge>
                        <Badge variant={getTimingStatusBadgeVariant(selectedPayment.timingStatus)}>
                          {selectedPayment.timingStatus}
                        </Badge>
                        {selectedPayment.isPartial && (
                          <Badge variant="outline">Partial Payment</Badge>
                        )}
                      </div>
                      {selectedPayment.method && (
                        <div className="mt-2">
                          <Badge variant={getPaymentMethodBadgeVariant(selectedPayment.method)}>
                            {selectedPayment.method}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Payment Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Amount
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 text-lg font-semibold">
                        ₱{selectedPayment.amount.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Payment Method
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedPayment.method || 'Not specified'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Transaction ID
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 font-mono text-sm">
                        {selectedPayment.providerTxnId || 'N/A'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Payment Date
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedPayment.paidAt 
                          ? new Date(selectedPayment.paidAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Not paid yet'
                        }
                      </div>
                    </div>

                    {selectedPayment.note && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">
                          Note
                        </label>
                        <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 italic">
                          "{selectedPayment.note}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lease Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Lease Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Lease Nickname
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedPayment.lease.leaseNickname}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Property
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedPayment.lease.unit.property.title}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Unit
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedPayment.lease.unit.label}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Monthly Rent
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        ₱{selectedPayment.lease.rentAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Payment Interval
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedPayment.lease.interval}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="font-semibold text-gray-900 text-lg">
                    Tenant Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">
                      Tenant Name
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                      {selectedPayment.lease.tenant.name}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                      {selectedPayment.lease.tenant.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Information */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <h2 className="font-semibold text-gray-900 text-lg">
                    Timeline
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />
                      Created
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                      {new Date(selectedPayment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Clock size={14} />
                      Last Updated
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                      {new Date(selectedPayment.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllPayments;
