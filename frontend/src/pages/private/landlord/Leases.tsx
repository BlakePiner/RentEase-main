import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  MapPin,
  Home,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getLandlordLeasesRequest, 
  getLeaseStatsRequest,
  type Lease,
  type LeaseStats 
} from "@/api/landlordLeaseApi";
import { toast } from "sonner";

const Leases = () => {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [stats, setStats] = useState<LeaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leasesRes, statsRes] = await Promise.all([
          getLandlordLeasesRequest({ signal: controller.signal }),
          getLeaseStatsRequest({ signal: controller.signal }),
        ]);
        setLeases(leasesRes.data);
        setStats(statsRes.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching leases data:", err);
          // Only show error toast for actual network/server errors, not for empty results
          if (err.response?.status >= 500 || !err.response) {
            toast.error("Failed to fetch leases data");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  // Filter and sort leases
  const filteredAndSortedLeases = leases
    .filter((lease) => {
      const matchesSearch = 
        lease.leaseNickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lease.tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lease.unit.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lease.unit.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || lease.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "rent-high":
          return b.rentAmount - a.rentAmount;
        case "rent-low":
          return a.rentAmount - b.rentAmount;
        case "expiring":
          if (!a.endDate && !b.endDate) return 0;
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "EXPIRED":
        return "bg-red-100 text-red-800 border-red-200";
      case "TERMINATED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="h-4 w-4" />;
      case "DRAFT":
        return <Clock className="h-4 w-4" />;
      case "EXPIRED":
        return <XCircle className="h-4 w-4" />;
      case "TERMINATED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getIntervalText = (interval: string) => {
    switch (interval) {
      case "DAILY":
        return "per day";
      case "WEEKLY":
        return "per week";
      case "MONTHLY":
        return "per month";
      default:
        return interval.toLowerCase();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
            <p className="text-gray-600 mt-1">Manage all your rental leases</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
          <p className="text-gray-600 mt-1">Manage all your rental leases</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600">
          <Link to="/landlord/leases/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Lease
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leases</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.totalLeases}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.overview.activeLeases} active
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
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.revenue.monthlyRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(stats.revenue.totalRevenue)} total
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
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
                    {stats.payments.paymentReliability}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.payments.onTimePayments} on-time payments
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.overview.expiringLeases}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Within 30 days
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
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
                placeholder="Search leases by nickname, tenant, property, or unit..."
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="rent-high">Rent: High to Low</SelectItem>
                <SelectItem value="rent-low">Rent: Low to High</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-emerald-500">{filteredAndSortedLeases.length}</span> of{" "}
          <span className="font-medium">{leases.length}</span> leases
        </p>
      </div>

      {/* Leases Grid */}
      {filteredAndSortedLeases.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedLeases.map((lease) => (
            <Card key={lease.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {lease.leaseNickname}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(lease.status)}`}>
                        {getStatusIcon(lease.status)}
                        <span className="ml-1">{lease.status}</span>
                      </Badge>
                      {lease.leaseInfo.daysInfo?.isExpiringSoon && (
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expiring Soon
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
                    <span className="font-medium">{lease.unit.property.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{lease.unit.property.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Unit:</span>
                    <span>{lease.unit.label}</span>
                  </div>
                </div>

                {/* Tenant Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{lease.tenant.fullName}</span>
                  </div>
                  {lease.tenant.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{lease.tenant.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="line-clamp-1">{lease.tenant.email}</span>
                  </div>
                </div>

                {/* Lease Details */}
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rent Amount</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(lease.rentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Interval</span>
                    <span className="text-sm text-gray-900">{getIntervalText(lease.interval)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Start Date</span>
                    <span className="text-sm text-gray-900">{formatDate(lease.startDate)}</span>
                  </div>
                  {lease.endDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">End Date</span>
                      <span className="text-sm text-gray-900">{formatDate(lease.endDate)}</span>
                    </div>
                  )}
                </div>

                {/* Payment Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment Reliability</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-900">
                        {lease.paymentStats.reliability}%
                      </span>
                      {lease.paymentStats.reliability >= 80 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{lease.paymentStats.paid} paid</span>
                    <span>{lease.paymentStats.pending} pending</span>
                    <span>{lease.paymentStats.late} late</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/landlord/leases/${lease.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/landlord/leases/${lease.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
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
            <FileText className="h-6 w-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all" ? "No leases found" : "No leases yet"}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {searchQuery || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria."
              : "Create your first lease to get started with managing your rental agreements."
            }
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button asChild className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600">
              <Link to="/landlord/leases/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Lease
              </Link>
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default Leases;
