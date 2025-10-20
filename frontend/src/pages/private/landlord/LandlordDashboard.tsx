import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  Wrench,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Plus,
  BarChart3,
  Home,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDashboardStatsRequest } from "@/api/landlordPropertyApi";
import { getRecentActivityRequest, getUpcomingTasksRequest, type RecentActivity, type UpcomingTask } from "@/api/landlordDashboardApi";
import { toast } from "sonner";

// Types for dashboard data
interface DashboardData {
  overview: {
    totalProperties: number;
    totalUnits: number;
    occupancyRate: number;
    monthlyRevenue: number;
    pendingMaintenance: number;
    activeTenants: number;
    vacantUnits: number;
  };
  properties: Array<{
    id: string;
    name: string;
    address: string;
    totalUnits: number;
    occupiedUnits: number;
    monthlyRevenue: number;
    status: string;
  }>;
  financialSummary: {
    monthlyIncome: number;
    monthlyExpenses: number;
    netIncome: number;
    outstandingPayments: number;
    previousMonthIncome: number;
    previousMonthExpenses: number;
  };
}

const LandlordDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, activityRes, tasksRes] = await Promise.all([
          getDashboardStatsRequest({ signal: controller.signal }),
          getRecentActivityRequest({ limit: 5, signal: controller.signal }),
          getUpcomingTasksRequest({ limit: 5, signal: controller.signal })
        ]);
        
        setData(statsRes.data);
        setRecentActivity(activityRes.data);
        setUpcomingTasks(tasksRes.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching dashboard data:", err);
          toast.error("Failed to fetch dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    return () => controller.abort();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening with your properties.
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
              Welcome back! Here's what's happening with your properties.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first property to see dashboard statistics.
            </p>
            <Button asChild>
              <Link to="/landlord/properties">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200";
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "unread":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };


  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Helper functions for activity and tasks
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'PAYMENT':
        return <span className="text-green-600 font-bold">₱</span>;
      case 'MESSAGE':
        return <Clock className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_REVIEW':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'LEASE_RENEWAL':
        return <Calendar className="h-4 w-4 text-green-600" />;
      case 'INSPECTION':
        return <Building2 className="h-4 w-4 text-orange-600" />;
      case 'MAINTENANCE_FOLLOWUP':
        return <Wrench className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const formatDueDate = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffInDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) {
      return `${Math.abs(diffInDays)} days overdue`;
    } else if (diffInDays === 0) {
      return 'Due today';
    } else if (diffInDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffInDays} days`;
    }
  };

  const incomeChange = calculatePercentageChange(
    data.financialSummary.monthlyIncome,
    data.financialSummary.previousMonthIncome
  );

  const expenseChange = calculatePercentageChange(
    data.financialSummary.monthlyExpenses,
    data.financialSummary.previousMonthExpenses
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your properties.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/landlord/properties">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.overview.totalProperties}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overview.totalUnits} total units
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.overview.occupancyRate}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overview.activeTenants} active tenants
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.overview.monthlyRevenue)}
                </p>
                <div className="flex items-center mt-1">
                  {incomeChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-xs ${
                      incomeChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {Math.abs(incomeChange).toFixed(1)}% from last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">₱</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.overview.pendingMaintenance}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overview.vacantUnits} vacant units
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                      {activity.property && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {activity.property.title} - {activity.unit?.label}
                          </span>
                          {activity.amount && (
                            <span className="text-xs font-medium text-green-600">
                              {formatCurrency(activity.amount)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/landlord/tenants">View All Activity</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                <p className="text-gray-600 mb-4">
                  Activity from payments, maintenance requests, and messages will appear here.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/landlord/tenants">View All Activity</Link>
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
            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          task.status === 'OVERDUE' ? 'text-red-600 font-medium' : 'text-gray-500'
                        }`}>
                          {formatDueDate(task.dueDate)}
                        </span>
                        {task.property && (
                          <span className="text-xs text-gray-500 truncate ml-2">
                            {task.property.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/landlord/tenants">View All Tasks</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Tasks</h3>
                <p className="text-gray-600 mb-4">
                  Lease renewals, inspections, and maintenance tasks will appear here.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/landlord/tenants">View All Tasks</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Properties Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Properties Overview
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/landlord/properties">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.properties.map((property) => (
                <div
                  key={property.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{property.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <p className="text-sm text-gray-600">{property.address}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(property.status)}`}
                    >
                      {property.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Units:</span>
                      <span className="font-medium">
                        {property.occupiedUnits}/{property.totalUnits}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly Revenue:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(property.monthlyRevenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${
                            property.totalUnits > 0 ? (property.occupiedUnits / property.totalUnits) * 100 : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/landlord/property/${property.id}/details`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Yet</h3>
              <p className="text-gray-600 mb-4">
                Add your first property to see it displayed here.
              </p>
              <Button asChild>
                <Link to="/landlord/properties">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Financial Summary
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/landlord/financials">View Details</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Monthly Income</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(data.financialSummary.monthlyIncome)}
              </p>
              <div className="flex items-center justify-center mt-1">
                {incomeChange >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span
                  className={`text-xs ${
                    incomeChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(incomeChange).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Monthly Expenses</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(data.financialSummary.monthlyExpenses)}
              </p>
              <div className="flex items-center justify-center mt-1">
                {expenseChange >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
                )}
                <span
                  className={`text-xs ${
                    expenseChange >= 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {Math.abs(expenseChange).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Net Income</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(data.financialSummary.netIncome)}
              </p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-xl font-bold text-yellow-600">
                {formatCurrency(data.financialSummary.outstandingPayments)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Pending payments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandlordDashboard;
