import { useState, useEffect } from "react";
import { 
  Users, 
  Building2, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Home,
  UserCheck,
  BarChart3,
  Eye,
  UserX,
  ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAdminDashboardStatsRequest, type AdminDashboardStats } from "@/api/adminApi";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await getAdminDashboardStatsRequest({ signal: controller.signal });
        setStats(response.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching admin dashboard stats:", err);
          toast.error("Failed to fetch dashboard statistics");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    return () => controller.abort();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'landlord': return 'bg-blue-100 text-blue-800';
      case 'tenant': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load dashboard</h3>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/users">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.totalUsers.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {stats.growth.userGrowthRate >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${stats.growth.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(stats.growth.userGrowthRate)}% this month
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.totalProperties.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  {stats.growth.newPropertiesThisMonth} new this month
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.financial.monthlyRevenue)}</p>
              <div className="flex items-center mt-1">
                <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  {stats.financial.paidPayments} payments
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.systemHealth.occupancyRate}%</p>
              <div className="flex items-center mt-1">
                <Home className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">
                  {stats.overview.occupiedUnits}/{stats.overview.totalUnits} units
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Home className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Active Users</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  {stats.systemHealth.activeUsers}/{stats.systemHealth.totalUsers}
                </span>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(stats.systemHealth.activeUsers / stats.systemHealth.totalUsers) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">Payment Success Rate</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{stats.systemHealth.paymentSuccessRate}%</span>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${stats.systemHealth.paymentSuccessRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-sm text-gray-600">Maintenance Response</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{stats.systemHealth.maintenanceResponseRate}%</span>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${stats.systemHealth.maintenanceResponseRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <UserCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">{stats.overview.totalLandlords}</p>
              <p className="text-sm text-blue-600">Landlords</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-900">{stats.overview.totalTenants}</p>
              <p className="text-sm text-purple-600">Tenants</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{stats.overview.activeLeases}</p>
              <p className="text-sm text-green-600">Active Leases</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-900">{stats.overview.pendingMaintenance}</p>
              <p className="text-sm text-orange-600">Pending Issues</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/users">
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(user.role)}>
                        {user.role}
                      </Badge>
                      {user.isDisabled && (
                        <UserX className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatDate(user.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Properties</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/properties">
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.properties.map((property) => (
              <div key={property.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{property.title}</p>
                    <p className="text-xs text-gray-500">{property.location}</p>
                    <p className="text-xs text-gray-400">by {property.owner}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatDate(property.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/payments">
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500">{payment.tenant}</p>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
