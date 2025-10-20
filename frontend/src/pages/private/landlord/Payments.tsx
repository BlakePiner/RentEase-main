import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Eye,
  Send,
  Calendar,
  User,
  Home,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  getLandlordPaymentsRequest, 
  getPaymentStatsRequest,
  type Payment,
  type PaymentStats
} from "@/api/landlordPaymentApi";
import { toast } from "sonner";

const Payments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: "ALL",
    timingStatus: "ALL",
    search: "",
  });

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, statsRes] = await Promise.all([
          getLandlordPaymentsRequest({
            status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
            timingStatus: filters.timingStatus && filters.timingStatus !== "ALL" ? filters.timingStatus : undefined,
            page: pagination.page,
            limit: pagination.limit,
          }),
          getPaymentStatsRequest({ period: "month" }),
        ]);

        setPayments(paymentsRes.data.payments);
        setPagination(paymentsRes.data.pagination);
        setStats(statsRes.data);
      } catch (err: any) {
        console.error("Error fetching payments:", err);
        toast.error("Failed to load payments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, pagination.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTimingBadge = (timingStatus: string) => {
    switch (timingStatus) {
      case "ONTIME":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On Time</Badge>;
      case "LATE":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Late</Badge>;
      case "ADVANCE":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Advance</Badge>;
      default:
        return <Badge variant="secondary">{timingStatus}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not paid";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track and manage all payment transactions</p>
        </div>
        <Button onClick={() => navigate("/landlord/payments/reports")} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          View Reports
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.summary.totalAmount)}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">₱</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.summary.paidPayments} of {stats.summary.totalPayments} payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.summary.pendingAmount)}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.summary.pendingPayments} pending payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.onTimeRate.toFixed(1)}%</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.timing.onTime} on-time payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Late Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.lateRate.toFixed(1)}%</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.timing.late} late payments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search payments..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timing</label>
              <Select value={filters.timingStatus} onValueChange={(value) => handleFilterChange("timingStatus", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All timing</SelectItem>
                  <SelectItem value="ONTIME">On Time</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ADVANCE">Advance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({ status: "ALL", timingStatus: "ALL", search: "" });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">No payment transactions match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </h3>
                        {getStatusBadge(payment.status)}
                        {getTimingBadge(payment.timingStatus)}
                        {payment.isPartial && (
                          <Badge variant="outline">Partial</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          <span>{payment.lease.unit.property.title} - {payment.lease.unit.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{payment.lease.tenant.firstName} {payment.lease.tenant.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Paid: {formatDate(payment.paidAt)}</span>
                        </div>
                      </div>

                      {payment.method && (
                        <div className="mt-2 text-sm text-gray-500">
                          Method: {payment.method}
                        </div>
                      )}

                      {payment.note && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {payment.note}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/landlord/payments/${payment.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {payment.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/landlord/leases/${payment.lease.id}/payments`)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Remind
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
