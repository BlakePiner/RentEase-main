
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  FileText,
  CreditCard,
  Wrench,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  DollarSign,
  MapPin,
  BedDouble,
  Maximize,
  ArrowRight,
  Plus,
  MessageSquare,
  Bell,
  Star,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTenantDashboardData, type TenantDashboardData } from "@/api/tenantApi";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

const TenantDashboard = () => {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const controller = new AbortController();
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await getTenantDashboardData({
          signal: controller.signal,
        });
        setData(res.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("=== FRONTEND DASHBOARD ERROR ===");
          console.error("Error fetching dashboard data:", err);
          console.error("Error response:", err.response);
          console.error("Error status:", err.response?.status);
          console.error("Error data:", err.response?.data);
          console.error("================================");
          toast.error("Failed to fetch dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    return () => controller.abort();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    
    switch (status.toLowerCase()) {
      case "paid":
      case "completed":
      case "active":
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "in_progress":
      case "open":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
      case "late":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTimingStatusColor = (status?: string) => {
    if (!status) return "text-gray-600";
    
    switch (status.toLowerCase()) {
      case "ontime":
      case "advance":
        return "text-green-600";
      case "late":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.firstName || "Tenant"}! Here's your rental overview.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.firstName || "Tenant"}! Here's your rental overview.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Lease</h3>
            <p className="text-gray-600 mb-4">
              You don't have an active lease yet. Browse available properties to get started.
            </p>
            <Button asChild>
              <Link to="/tenant/browse-properties">
                <Plus className="h-4 w-4 mr-2" />
                Browse Properties
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.firstName || "Tenant"}! Here's your rental overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/tenant/browse-properties">
              <Eye className="h-4 w-4 mr-2" />
              Browse Properties
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/tenant/messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Lease</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.overview.activeLeases}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.currentLease ? "Current lease active" : "No active lease"}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Reliability</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.financialSummary.paymentReliability}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overview.onTimePayments} of {data.overview.totalPayments} on time
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.overview.pendingPayments}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overview.upcomingPayments} upcoming
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.overview.maintenanceRequests}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overview.leaseEndingSoon} lease ending soon
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Current Lease */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Current Lease
              </CardTitle>
              {data.currentLease && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/tenant/lease">
                    <Eye className="h-4 w-4 mr-2" />
                    View Lease Details
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.currentLease ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Property:</span>
                    <p className="font-medium text-gray-900">{data.currentLease.unit.property.title}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Unit:</span>
                    <p className="font-medium text-gray-900">{data.currentLease.unit.label}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Tenant:</span>
                    <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Rent:</span>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(data.currentLease.rentAmount)} {data.currentLease.interval?.toLowerCase() || ''}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(data.currentLease.status)}`}
                    >
                      {data.currentLease.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Lease</h3>
                <p className="text-gray-600 mb-4">
                  You don't have an active lease. Browse available properties to get started.
                </p>
                <Button asChild>
                  <Link to="/tenant/browse-properties">
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Properties
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {task.type === "payment" ? (
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      ) : task.type === "maintenance" ? (
                        <Wrench className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(task.status)}`}
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/tenant/tasks">View All Tasks</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Tasks</h3>
                <p className="text-gray-600 mb-4">
                  You're all caught up! No pending tasks at the moment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Payments
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/tenant/payments">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {data.recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {payment.status === "PAID" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Due: {formatDate(payment.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(payment.status)}`}
                      >
                        {payment.status}
                      </Badge>
                      <p className={`text-xs mt-1 ${getTimingStatusColor(payment.timingStatus)}`}>
                        {payment.timingStatus}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Payments</h3>
                <p className="text-gray-600 mb-4">
                  Payment history will appear here once you make your first payment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Maintenance Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Recent Maintenance Requests
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/tenant/maintenance">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentMaintenanceRequests.length > 0 ? (
              <div className="space-y-3">
                {data.recentMaintenanceRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Maintenance Request</h4>
                      {request.priority && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(request.priority)}`}
                        >
                          {request.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {request.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {request.unit?.label || 'N/A'} • {request.property?.title || 'N/A'}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(request.status)}`}
                      >
                        {request.status || 'OPEN'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Requests</h3>
                <p className="text-gray-600 mb-4">
                  Submit a maintenance request if you need any repairs or assistance.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/tenant/maintenance">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Request
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/tenant/payments">View Details</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(data.financialSummary.totalPaid)}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Due</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(data.financialSummary.totalDue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Outstanding</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Next Payment</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(data.financialSummary.nextPaymentAmount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Due: {formatDate(data.financialSummary.nextPaymentDue)}
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Payment Score</p>
              <p className="text-xl font-bold text-purple-600">
                {data.financialSummary.paymentReliability}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Reliability</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantDashboard;