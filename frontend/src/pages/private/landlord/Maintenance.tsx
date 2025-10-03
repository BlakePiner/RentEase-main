import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  MapPin,
  Home,
  User,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getLandlordMaintenanceRequestsRequest, 
  getMaintenanceStatsRequest,
  type MaintenanceRequest,
  type MaintenanceStats 
} from "@/api/landlordMaintenanceApi";
import { toast } from "sonner";

const Maintenance = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const [requestsRes, statsRes] = await Promise.all([
          getLandlordMaintenanceRequestsRequest({ signal: controller.signal }),
          getMaintenanceStatsRequest({ signal: controller.signal }),
        ]);
        setRequests(requestsRes.data);
        setStats(statsRes.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching maintenance data:", err);
          // Only show error toast for actual network/server errors, not for empty results
          if (err.response?.status >= 500 || !err.response) {
            toast.error("Failed to fetch maintenance data");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  // Filter and sort requests
  const filteredAndSortedRequests = requests
    .filter((request) => {
      const matchesSearch = 
        request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.unit && request.unit.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
        request.reporter.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "priority":
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "status":
          const statusOrder = { OPEN: 3, IN_PROGRESS: 2, RESOLVED: 1 };
          return statusOrder[b.status] - statusOrder[a.status];
        case "days-open":
          return b.daysOpen - a.daysOpen;
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800 border-red-200";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "RESOLVED":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <AlertTriangle className="h-4 w-4" />;
      case "MEDIUM":
        return <AlertCircle className="h-4 w-4" />;
      case "LOW":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-gray-600 mt-1">Manage maintenance requests for your properties</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600 mt-1">Manage maintenance requests for your properties</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/maintenance/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.totalRequests}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.overview.resolutionRate}% resolved
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.openRequests}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.overview.urgentRequests} urgent
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.inProgressRequests}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Being worked on
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Resolution</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.overview.averageResolutionTime} days
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Time to resolve
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search requests by description, property, unit, or reporter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="days-open">Days Open</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-emerald-500">{filteredAndSortedRequests.length}</span> of{" "}
          <span className="font-medium">{requests.length}</span> requests
        </p>
      </div>

      {/* Requests Grid */}
      {filteredAndSortedRequests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                      {request.description}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(request.priority)}`}>
                        {getPriorityIcon(request.priority)}
                        <span className="ml-1">{request.priority}</span>
                      </Badge>
                      {request.daysOpen >= 7 && request.status === "OPEN" && (
                        <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Property & Unit Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Home className="h-4 w-4" />
                    <span className="font-medium">{request.property.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{request.property.address}</span>
                  </div>
                  {request.unit && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Unit:</span>
                      <span>{request.unit.label}</span>
                    </div>
                  )}
                </div>

                {/* Reporter Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{request.reporter.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="line-clamp-1">{request.reporter.email}</span>
                  </div>
                  {request.reporter.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{request.reporter.phoneNumber}</span>
                    </div>
                  )}
                </div>

                {/* Time Information */}
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Submitted</span>
                    <span className="text-sm text-gray-900">{request.timeAgo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Days Open</span>
                    <span className={`text-sm font-medium ${
                      request.daysOpen >= 7 ? 'text-red-600' : 
                      request.daysOpen >= 3 ? 'text-yellow-600' : 
                      'text-gray-900'
                    }`}>
                      {request.daysOpen} days
                    </span>
                  </div>
                </div>

                {/* Photo Preview */}
                {request.photoUrl && (
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Photo</span>
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={`http://localhost:5000${request.photoUrl}`}
                        alt="Maintenance request photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/landlord/maintenance/${request.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/landlord/maintenance/${request.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Update
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-emerald-100 to-sky-100 flex items-center justify-center mb-3">
            <Wrench className="h-6 w-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all" ? "No requests found" : "No maintenance requests yet"}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all" 
              ? "Try adjusting your search or filter criteria."
              : "Maintenance requests from tenants will appear here when they are submitted."
            }
          </p>
        </Card>
      )}
    </div>
  );
};

export default Maintenance;
