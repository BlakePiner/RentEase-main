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
  Eye,
  FileText,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Home,
  Calendar,
  DollarSign,
  Wrench,
  Download,
  RefreshCw,
  Send,
  X,
  Check,
  Star,
  MapPin,
  Building,
  CreditCard,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  getLandlordTenantsRequest, 
  getTenantStatsRequest,
  type TenantManagementItem,
  type TenantApplication,
  type ApprovedTenant,
  type ActiveTenant,
  type TenantStats 
} from "@/api/landlordTenantApi";
import TenantApplicationReview from "@/components/TenantApplicationReview";
import { toast } from "sonner";

const TenantManagement = () => {
  const [tenantData, setTenantData] = useState<TenantManagementItem[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Application review modal
  const [selectedApplication, setSelectedApplication] = useState<TenantApplication | null>(null);
  const [showApplicationReview, setShowApplicationReview] = useState(false);
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch tenants first (most important)
        const tenantsRes = await getLandlordTenantsRequest({ signal: controller.signal });
        setTenantData(tenantsRes.data);
        console.log("✅ Tenant data loaded:", tenantsRes.data);
        
        // Try to fetch stats separately (optional)
        try {
          const statsRes = await getTenantStatsRequest({ signal: controller.signal });
          setStats(statsRes.data);
          console.log("✅ Stats data loaded:", statsRes.data);
        } catch (statsErr: any) {
          console.warn("⚠️ Stats failed to load:", statsErr);
          // Set default stats if stats API fails
          setStats({
            totalTenants: 0,
            activeTenants: 0,
            pendingApplications: 0,
            totalRevenue: 0,
            averageRent: 0,
            occupancyRate: 0
          });
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("❌ Error fetching tenant data:", err);
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

  const handleApplicationReview = (application: TenantApplication) => {
    setSelectedApplication(application);
    setShowApplicationReview(true);
  };

  const handleApplicationUpdate = async () => {
    // Refresh data after application update
    try {
      const tenantsRes = await getLandlordTenantsRequest();
      setTenantData(tenantsRes.data);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleCloseReview = () => {
    setShowApplicationReview(false);
    setSelectedApplication(null);
  };

  const toggleApplicationExpansion = (applicationId: string) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedApplications(newExpanded);
  };

  // Filter and sort tenant data
  const filteredAndSortedData = tenantData
    .filter((item) => {
      const tenant = item.tenant;
      if (!tenant) return false;
      
      const matchesSearch = 
        tenant.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.phoneNumber && tenant.phoneNumber.includes(searchQuery));
      
      const matchesType = typeFilter === "all" || 
        (typeFilter === "applications" && item.type === "APPLICATION") ||
        (typeFilter === "approved" && item.type === "APPROVED_TENANT") ||
        (typeFilter === "tenants" && item.type === "TENANT");
      
      const matchesRisk = riskFilter === "all" || 
        (item.type === "APPLICATION" && item.riskAssessment?.riskLevel === riskFilter) ||
        (item.type === "APPROVED_TENANT" && item.behaviorAnalysis?.riskLevel === riskFilter) ||
        (item.type === "TENANT" && item.behaviorAnalysis?.riskLevel === riskFilter);
      
      return matchesSearch && matchesType && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          const aDate = a.type === 'APPLICATION' ? a.submittedAt : (a.tenant?.createdAt || new Date().toISOString());
          const bDate = b.type === 'APPLICATION' ? b.submittedAt : (b.tenant?.createdAt || new Date().toISOString());
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        case "oldest":
          const aDateOld = a.type === 'APPLICATION' ? a.submittedAt : (a.tenant?.createdAt || new Date().toISOString());
          const bDateOld = b.type === 'APPLICATION' ? b.submittedAt : (b.tenant?.createdAt || new Date().toISOString());
          return new Date(aDateOld).getTime() - new Date(bDateOld).getTime();
        case "risk":
          const aRisk = a.type === 'APPLICATION' ? a.riskAssessment?.riskLevel : a.behaviorAnalysis?.riskLevel;
          const bRisk = b.type === 'APPLICATION' ? b.riskAssessment?.riskLevel : b.behaviorAnalysis?.riskLevel;
          const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (riskOrder[bRisk as keyof typeof riskOrder] || 0) - (riskOrder[aRisk as keyof typeof riskOrder] || 0);
        default:
          return 0;
      }
    });

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

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const applications = tenantData.filter(item => item.type === 'APPLICATION') as TenantApplication[];
  const approvedTenants = tenantData.filter(item => item.type === 'APPROVED_TENANT') as ApprovedTenant[];
  const activeTenants = tenantData.filter(item => item.type === 'TENANT') as ActiveTenant[];

  // Show application review if selected
  if (showApplicationReview && selectedApplication) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TenantApplicationReview
          application={selectedApplication}
          onApplicationUpdate={handleApplicationUpdate}
          onClose={handleCloseReview}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tenant management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
            <p className="text-gray-600 mt-1">
              Review applications, manage tenants, and monitor behavior
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                <p className="text-xs text-gray-500">Awaiting review</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mr-4">
                <UserCheck className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{approvedTenants.length}</p>
                <p className="text-xs text-gray-500">Awaiting lease activation</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{activeTenants.length}</p>
                <p className="text-xs text-gray-500">Current residents</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenantData.filter(item => 
                    (item.type === 'APPLICATION' && item.riskAssessment?.riskLevel === 'HIGH') ||
                    ((item.type === 'APPROVED_TENANT' || item.type === 'TENANT') && item.behaviorAnalysis?.riskLevel === 'HIGH')
                  ).length}
                </p>
                <p className="text-xs text-gray-500">Requires attention</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mr-4">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₱{stats?.totalRevenue || 0}</p>
                <p className="text-xs text-gray-500">Monthly income</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search tenants by name, email, phone, or property..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="applications">Applications</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="tenants">Active Tenants</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="LOW">Low Risk</SelectItem>
                  <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                  <SelectItem value="HIGH">High Risk</SelectItem>
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
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Data */}
        <div className="space-y-6">
          {filteredAndSortedData.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tenant data yet</h3>
                <p className="text-gray-600">
                  Tenant applications and lease information will appear here. Applications show immediately for screening and approval.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedData.map((item) => {
              if (!item || !item.tenant) return null;
              return (
              <Card key={`${item.type}-${item.id || item.tenant?.id || Math.random()}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={item.tenant.avatarUrl || undefined} />
                        <AvatarFallback>
                          {item.tenant.firstName?.[0]}{item.tenant.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {item.tenant.firstName} {item.tenant.lastName}
                        </h3>
                        <p className="text-gray-600">{item.tenant.email}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {item.type === 'APPLICATION' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Pending Application
                            </Badge>
                          )}
                          {item.type === 'APPROVED_TENANT' && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              Approved - Pending Lease
                            </Badge>
                          )}
                          {item.type === 'TENANT' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Active Tenant
                            </Badge>
                          )}
                          
                          <Badge className={getRiskBadgeColor(
                            item.type === 'APPLICATION' 
                              ? item.riskAssessment.riskLevel 
                              : item.behaviorAnalysis.riskLevel
                          )}>
                            {item.type === 'APPLICATION' 
                              ? item.riskAssessment.riskLevel 
                              : item.behaviorAnalysis.riskLevel
                            } Risk
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {item.type === 'APPLICATION' && (
                        <div>
                          <p className="text-sm text-gray-500">Applied</p>
                          <p className="font-medium">{formatDate(item.submittedAt)}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.unit.property.title} - {item.unit.label}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(item.unit.targetPrice)}/mo
                          </p>
                        </div>
                      )}
                      
                      {(item.type === 'APPROVED_TENANT' || item.type === 'TENANT') && (
                        <div>
                          <p className="text-sm text-gray-500">
                            {item.type === 'APPROVED_TENANT' ? 'Approved' : 'Active Since'}
                          </p>
                          <p className="font-medium">{formatDate(item.lease.createdAt)}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.lease.unit.property.title} - {item.lease.unit.label}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(item.lease.monthlyRent)}/mo
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    {item.type === 'APPLICATION' && (
                      <Button
                        onClick={() => handleApplicationReview(item)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review Application
                      </Button>
                    )}
                    
                    {item.type === 'APPROVED_TENANT' && (
                      <Link to={`/landlord/leases/${item.lease.id}`}>
                        <Button className="bg-yellow-600 hover:bg-yellow-700">
                          <FileText className="h-4 w-4 mr-2" />
                          Activate Lease
                        </Button>
                      </Link>
                    )}
                    
                    {item.type === 'TENANT' && (
                      <Link to={`/landlord/tenants/${item.tenant.id}`}>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
              );
            }).filter(Boolean)
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;