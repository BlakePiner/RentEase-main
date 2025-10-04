import { useState, useEffect } from "react";
import { 
  Activity, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Clock,
  Calendar,
  User,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Monitor,
  Wifi,
  WifiOff,
  UserPlus
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
  getSystemLogsRequest, 
  getSystemLogsAnalyticsRequest,
  type SystemLog, 
  type SystemLogsResponse,
  type SystemLogsAnalytics
} from "@/api/adminApi";

const SystemLogs = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [analytics, setAnalytics] = useState<SystemLogsAnalytics | null>(null);
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
    role: "",
    activityType: "",
    page: 1,
    limit: 10,
  });
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [period, setPeriod] = useState('24h');

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getSystemLogsRequest({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        role: filters.role || undefined,
        activityType: filters.activityType || undefined,
      });

      const data: SystemLogsResponse = response.data;
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error("Error fetching system logs:", error);
      
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission to view system logs.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.code === 'ERR_NETWORK') {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to fetch system logs. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await getSystemLogsAnalyticsRequest({
        period
      });

      setAnalytics(response.data);
    } catch (error: any) {
      console.error("Error fetching system logs analytics:", error);
      toast.error("Failed to fetch system logs analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  // Handle role filter
  const handleRoleFilter = (value: string) => {
    setFilters(prev => ({ ...prev, role: value === "all" ? "" : value, page: 1 }));
  };

  // Handle activity type filter
  const handleActivityTypeFilter = (value: string) => {
    setFilters(prev => ({ ...prev, activityType: value === "all" ? "" : value, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle view log
  const handleViewLog = (log: SystemLog) => {
    setSelectedLog(log);
    setIsLogModalOpen(true);
  };

  // Get activity status badge variant
  const getActivityStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online':
        return 'default';
      case 'offline':
        return 'secondary';
      case 'new_user':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Get activity status icon
  const getActivityStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-gray-600" />;
      case 'new_user':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Format time duration
  const formatTimeDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours * 10) / 10}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round((hours % 24) * 10) / 10;
      if (days >= 32) {
        return `32d (max)`;
      }
      return `${days}d ${remainingHours}h`;
    }
  };

  // Get period label
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '1h':
        return 'Last Hour';
      case '24h':
        return 'Last 24 Hours';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      default:
        return 'Last 24 Hours';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-1">
            Monitor user activity and online/offline status
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalUsers}</p>
                  <p className="text-xs text-gray-500">All registered users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-50">
                  <Wifi className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Online Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.onlineUsers}</p>
                  <p className="text-xs text-gray-500">Active in last 2h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-gray-50">
                  <WifiOff className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Offline Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.offlineUsers}</p>
                  <p className="text-xs text-gray-500">Inactive &gt; 2h (max 32d)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-purple-50">
                  <UserPlus className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.newUsers}</p>
                  <p className="text-xs text-gray-500">Never logged in</p>
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
                <div className="p-2 rounded-lg bg-emerald-50">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Logins</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.recentLogins}</p>
                  <p className="text-xs text-gray-500">{getPeriodLabel(period)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-orange-50">
                  <UserPlus className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Registrations</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.userRegistrations}</p>
                  <p className="text-xs text-gray-500">{getPeriodLabel(period)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Monitor className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activity Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.summary.totalUsers > 0 
                      ? Math.round((analytics.summary.onlineUsers / analytics.summary.totalUsers) * 100)
                      : 0
                    }%
                  </p>
                  <p className="text-xs text-gray-500">Users online</p>
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
                  <p className="text-sm font-medium text-gray-600">Inactive Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.summary.totalUsers > 0 
                      ? Math.round((analytics.summary.offlineUsers / analytics.summary.totalUsers) * 100)
                      : 0
                    }%
                  </p>
                  <p className="text-xs text-gray-500">Users offline</p>
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
                  placeholder="Search users by name or email..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.role || "all"} onValueChange={handleRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="LANDLORD">Landlord</SelectItem>
                  <SelectItem value="TENANT">Tenant</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.activityType || "all"} onValueChange={handleActivityTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="new_user">New User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Activity Logs ({pagination.totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity logs found</h3>
              <p className="text-gray-600">
                {filters.search || filters.role !== "" || filters.activityType !== ""
                  ? "Try adjusting your search or filter criteria."
                  : "No user activity has been recorded yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                {log.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {log.name}
                              </h3>
                              <p className="text-sm text-gray-600">{log.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {log.role.toLowerCase()}
                            </Badge>
                            <Badge variant={getActivityStatusBadgeVariant(log.activityStatus)}>
                              {getActivityStatusIcon(log.activityStatus)}
                              <span className="ml-1 capitalize">{log.activityStatus.replace('_', ' ')}</span>
                            </Badge>
                            {log.isDisabled && (
                              <Badge variant="destructive">Disabled</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building2 size={14} />
                              <span>{log.propertiesCount} properties</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>{log.leasesCount} leases</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>Joined {new Date(log.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Activity Details */}
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-gray-700">Last Activity</p>
                                <p className="text-gray-600">
                                  {log.lastActivity 
                                    ? new Date(log.lastActivity).toLocaleString()
                                    : 'Never'
                                  }
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">Time Online</p>
                                <p className="text-gray-600">
                                  {log.timeOnline > 0 ? formatTimeDuration(log.timeOnline) : '0m'}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">Time Offline</p>
                                <p className="text-gray-600">
                                  {log.timeOffline > 0 ? formatTimeDuration(log.timeOffline) : '0m'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewLog(log)}>
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
                            <User className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Activity className="h-4 w-4 mr-2" />
                            Activity History
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Building2 className="h-4 w-4 mr-2" />
                            View Properties
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
                {pagination.totalCount} logs
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

      {/* Log Details Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User Activity Details
            </DialogTitle>
            <DialogDescription>
              View detailed activity information for this user.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 blur-2xl opacity-70" />
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 blur-3xl opacity-70" />
                </div>

                <div className="relative p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xl font-semibold">
                        {selectedLog.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {selectedLog.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {selectedLog.role.toLowerCase()}
                        </Badge>
                        <Badge variant={getActivityStatusBadgeVariant(selectedLog.activityStatus)}>
                          {getActivityStatusIcon(selectedLog.activityStatus)}
                          <span className="ml-1 capitalize">{selectedLog.activityStatus.replace('_', ' ')}</span>
                        </Badge>
                        {selectedLog.isDisabled && (
                          <Badge variant="destructive">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{selectedLog.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Activity Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Current Status
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 flex items-center gap-2">
                        {getActivityStatusIcon(selectedLog.activityStatus)}
                        <span className="capitalize">{selectedLog.activityStatus.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Last Activity
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedLog.lastActivity 
                          ? new Date(selectedLog.lastActivity).toLocaleString()
                          : 'Never'
                        }
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Time Online
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedLog.timeOnline > 0 ? formatTimeDuration(selectedLog.timeOnline) : '0m'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Time Offline
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedLog.timeOffline > 0 ? formatTimeDuration(selectedLog.timeOffline) : '0m'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Account Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Role
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 capitalize">
                        {selectedLog.role.toLowerCase()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Account Status
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 flex items-center gap-2">
                        {selectedLog.isDisabled ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">Disabled</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Active</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Properties
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedLog.propertiesCount} {selectedLog.propertiesCount === 1 ? 'property' : 'properties'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Leases
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedLog.leasesCount} {selectedLog.leasesCount === 1 ? 'lease' : 'leases'}
                      </div>
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
                      Account Created
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                      {new Date(selectedLog.createdAt).toLocaleDateString('en-US', {
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
                      {new Date(selectedLog.updatedAt).toLocaleDateString('en-US', {
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

export default SystemLogs;
