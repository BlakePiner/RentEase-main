import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  BarChart3,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Home,
  Calendar,
  DollarSign,
  Wrench,
  MoreHorizontal,
  Download,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getLandlordTenantsRequest, 
  getTenantStatsRequest,
  type TenantWithBehavior,
  type TenantStats 
} from "@/api/landlordTenantApi";
import { toast } from "sonner";

const Tenants = () => {
  const [tenants, setTenants] = useState<TenantWithBehavior[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tenantsRes, statsRes] = await Promise.all([
          getLandlordTenantsRequest({ signal: controller.signal }),
          getTenantStatsRequest({ signal: controller.signal }),
        ]);
        setTenants(tenantsRes.data);
        setStats(statsRes.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching tenant data:", err);
          // Only show error toast for actual network/server errors, not for empty results
          if (err.response?.status >= 500 || !err.response) {
            toast.error("Failed to fetch tenant data");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  // Filter and sort tenants
  const filteredAndSortedTenants = tenants
    .filter((tenant) => {
      const matchesSearch = 
        tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.phoneNumber && tenant.phoneNumber.includes(searchQuery)) ||
        (tenant.currentLease && tenant.currentLease.property.title.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRisk = riskFilter === "all" || tenant.behaviorAnalysis.riskLevel === riskFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && tenant.currentLease?.status === "ACTIVE") ||
        (statusFilter === "inactive" && (!tenant.currentLease || tenant.currentLease.status !== "ACTIVE"));
      
      return matchesSearch && matchesRisk && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "risk":
          const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return riskOrder[b.behaviorAnalysis.riskLevel] - riskOrder[a.behaviorAnalysis.riskLevel];
        case "reliability":
          return b.behaviorAnalysis.paymentReliability - a.behaviorAnalysis.paymentReliability;
        case "name":
          return a.fullName.localeCompare(b.fullName);
        default:
          return 0;
      }
    });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
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

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "HIGH":
        return <AlertTriangle className="h-4 w-4" />;
      case "MEDIUM":
        return <Clock className="h-4 w-4" />;
      case "LOW":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 90) return "text-green-600";
    if (reliability >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
            <p className="text-gray-600 mt-1">Manage tenants and monitor behavior patterns</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Manage tenants and monitor behavior patterns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
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
                  <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.totalTenants}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.overview.activeTenants} active
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Reliability</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.overallPaymentReliability}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    On-time payments
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
                  <p className="text-sm font-medium text-gray-600">High Risk Tenants</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.riskDistribution.high}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Need attention
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.performance.tenantRetentionRate)}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tenant satisfaction
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-purple-600" />
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
                placeholder="Search tenants by name, email, phone, or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="LOW">Low Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                <SelectItem value="HIGH">High Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="risk">Risk Level</SelectItem>
                <SelectItem value="reliability">Payment Reliability</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-emerald-500">{filteredAndSortedTenants.length}</span> of{" "}
          <span className="font-medium">{tenants.length}</span> tenants
        </p>
      </div>

      {/* Tenants Grid */}
      {filteredAndSortedTenants.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedTenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium">
                      {tenant.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {tenant.fullName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${getRiskColor(tenant.behaviorAnalysis.riskLevel)}`}>
                          {getRiskIcon(tenant.behaviorAnalysis.riskLevel)}
                          <span className="ml-1">{tenant.behaviorAnalysis.riskLevel} Risk</span>
                        </Badge>
                        {tenant.isVerified && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="line-clamp-1">{tenant.email}</span>
                  </div>
                  {tenant.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{tenant.phoneNumber}</span>
                    </div>
                  )}
                </div>

                {/* Current Lease Info */}
                {tenant.currentLease && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Home className="h-4 w-4" />
                      <span className="font-medium">{tenant.currentLease.property.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Unit:</span>
                      <span>{tenant.currentLease.unit.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>₱{tenant.currentLease.rentAmount.toLocaleString()} / {tenant.currentLease.interval.toLowerCase()}</span>
                    </div>
                  </div>
                )}

                {/* Behavior Analysis */}
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment Reliability</span>
                    <span className={`text-sm font-medium ${getReliabilityColor(tenant.behaviorAnalysis.paymentReliability)}`}>
                      {tenant.behaviorAnalysis.paymentReliability}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Payments</span>
                    <span className="text-sm text-gray-900">{tenant.behaviorAnalysis.totalPayments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Maintenance Requests</span>
                    <span className="text-sm text-gray-900">{tenant.behaviorAnalysis.maintenanceRequestsCount}</span>
                  </div>
                  {tenant.behaviorAnalysis.hasFrequentComplaints && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Frequent complaints</span>
                    </div>
                  )}
                </div>

                {/* AI Summary */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-600">AI Analysis</span>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {tenant.behaviorAnalysis.aiSummary}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/landlord/tenants/${tenant.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/landlord/tenants/${tenant.id}/behavior-report`}>
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Report
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
            <Users className="h-6 w-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">
            {searchQuery || riskFilter !== "all" || statusFilter !== "all" ? "No tenants found" : "No tenants yet"}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {searchQuery || riskFilter !== "all" || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria."
              : "Tenants will appear here when they have active leases with your properties."
            }
          </p>
        </Card>
      )}
    </div>
  );
};

export default Tenants;
