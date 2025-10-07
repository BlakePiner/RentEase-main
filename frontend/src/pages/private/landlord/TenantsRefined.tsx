import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Wrench,
  RefreshCw,
  MapPin,
  Building,
  Loader2,
  MessageSquare,
  Trash2,
  UserX,
  Plus,
  Check,
  UserIcon,
  XCircle,
  CreditCard,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getLandlordTenantsRequest, getTenantStatsRequest, removeTenantRequest, getAvailableLeasesForTenantRequest, assignLeaseToTenantRequest } from "@/api/landlordTenantApi";
import TenantApplicationReview from "@/components/TenantApplicationReview";
import AutomatedScreeningModal from "@/components/AutomatedScreeningModal";
import { toast } from "sonner";

interface TenantItem {
  id: string;
  type: 'APPLICATION' | 'APPROVED_TENANT' | 'TENANT';
  status?: string;
  submittedAt?: string;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
    createdAt: string;
  };
  unit?: {
    id: string;
    label: string;
    targetPrice: number;
    property: {
      id: string;
      title: string;
      address: string;
      location: string;
    };
  };
  applicationData?: any;
  riskAssessment?: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    aiRiskScore: number;
    aiScreeningSummary: string;
  };
  behaviorAnalysis?: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  currentLease?: any;
}

const TenantsRefined = () => {
  const navigate = useNavigate();
  const [tenantData, setTenantData] = useState<TenantItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // View state - default to pending applications
  const [currentView, setCurrentView] = useState<'pending' | 'approved' | 'active'>('pending');
  
  // Application review modal
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showApplicationReview, setShowApplicationReview] = useState(false);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Lease assignment modal
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [selectedApplicationForLease, setSelectedApplicationForLease] = useState<any>(null);
  const [availableLeases, setAvailableLeases] = useState<any[]>([]);
  const [leaseLoading, setLeaseLoading] = useState(false);
  
  // Tenant details modal
  const [showTenantDetailsModal, setShowTenantDetailsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  
  // Automated screening modal
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const [selectedApplicationForScreening, setSelectedApplicationForScreening] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch tenants first (most important)
        const tenantsRes = await getLandlordTenantsRequest();
        setTenantData(tenantsRes.data || []);
        console.log("✅ Tenant data loaded:", tenantsRes.data);
        
        // Try to fetch stats separately (optional)
        try {
          const statsRes = await getTenantStatsRequest();
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
        console.error("❌ Error fetching tenant data:", err);
        toast.error("Failed to fetch tenant data");
        setTenantData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApplicationReview = (application: any) => {
    setSelectedApplication(application);
    setShowApplicationReview(true);
  };

  const handleAutomateApplication = (application: any) => {
    setSelectedApplicationForScreening(application);
    setShowScreeningModal(true);
  };

  const handleScreeningApprove = async (application: any) => {
    try {
      // TODO: Implement actual approval logic with lease assignment
      console.log("Approving application with lease:", application.selectedLease);
      toast.success("Application approved successfully");
      setShowScreeningModal(false);
      setSelectedApplicationForScreening(null);
      // Refresh data
      const tenantsRes = await getLandlordTenantsRequest();
      setTenantData(tenantsRes.data);
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("Failed to approve application");
    }
  };

  const handleScreeningReject = async (application: any) => {
    try {
      // TODO: Implement actual rejection logic
      console.log("Rejecting application:", application);
      toast.success("Application rejected");
      setShowScreeningModal(false);
      setSelectedApplicationForScreening(null);
      // Refresh data
      const tenantsRes = await getLandlordTenantsRequest();
      setTenantData(tenantsRes.data);
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    }
  };

  const handleViewTenantDetails = (tenant: TenantItem) => {
    setSelectedTenant(tenant);
    setShowTenantDetailsModal(true);
  };

  const handleApplicationUpdate = async () => {
    // Refresh data after application update
    try {
      const tenantsRes = await getLandlordTenantsRequest();
      setTenantData(tenantsRes.data || []);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleCloseReview = () => {
    setShowApplicationReview(false);
    setSelectedApplication(null);
  };

  const handleMessageTenant = (tenant: any) => {
    // Navigate to messages with this tenant pre-selected
    navigate(`/landlord/messages?tenantId=${tenant.tenant.id}&tenantName=${encodeURIComponent(tenant.tenant.firstName + ' ' + tenant.tenant.lastName)}`);
  };

  const handleDeleteTenant = (tenant: any) => {
    setTenantToDelete(tenant);
    setShowDeleteModal(true);
  };

  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    
    setDeleteLoading(true);
    try {
      if (tenantToDelete.type === 'APPROVED_TENANT') {
        // For approved tenants, delete the application record (removes from history)
        const { privateApi } = await import("@/api/axios");
        await privateApi.delete(`/landlord/tenants/approved/${tenantToDelete.id}`);
        toast.success(`Approved application for ${tenantToDelete.tenant.firstName} ${tenantToDelete.tenant.lastName} has been removed from history`);
      } else {
        // For active tenants, remove the tenant completely
        await removeTenantRequest(tenantToDelete.tenant.id);
        toast.success(`${tenantToDelete.tenant.firstName} ${tenantToDelete.tenant.lastName} has been removed and can now reapply`);
      }
      
      // Remove from local state
      setTenantData(prev => prev.filter(item => item.id !== tenantToDelete.id));
      setShowDeleteModal(false);
      setTenantToDelete(null);
    } catch (error: any) {
      console.error("Error deleting tenant:", error);
      toast.error(error.response?.data?.message || "Failed to remove tenant");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAssignLease = async (application: any) => {
    setSelectedApplicationForLease(application);
    setLeaseLoading(true);
    
    try {
      // Get available leases for this tenant and unit
      const response = await getAvailableLeasesForTenantRequest(
        application.tenant.id, 
        application.unitId || application.unit?.id
      );
      
      setAvailableLeases(response.availableLeases || []);
      
      if (response.availableLeases?.length === 0) {
        // No leases available - redirect to lease creation
        toast.info("No available leases found. Redirecting to create a new lease...");
        // Navigate to lease creation page with pre-filled data
        window.location.href = `/landlord/leases/create?unitId=${application.unitId || application.unit?.id}&tenantId=${application.tenant.id}`;
        return;
      }
      
      setShowLeaseModal(true);
    } catch (error: any) {
      console.error("Error fetching available leases:", error);
      toast.error("Failed to fetch available leases");
    } finally {
      setLeaseLoading(false);
    }
  };

  const confirmAssignLease = async (leaseId: string) => {
    if (!selectedApplicationForLease) return;
    
    setLeaseLoading(true);
    try {
      await assignLeaseToTenantRequest(selectedApplicationForLease.id, leaseId);
      
      // Refresh the data
      await refreshData();
      
      toast.success(`Lease assigned to ${selectedApplicationForLease.tenant.firstName} ${selectedApplicationForLease.tenant.lastName}`);
      setShowLeaseModal(false);
      setSelectedApplicationForLease(null);
      setAvailableLeases([]);
    } catch (error: any) {
      console.error("Error assigning lease:", error);
      toast.error(error.response?.data?.message || "Failed to assign lease");
    } finally {
      setLeaseLoading(false);
    }
  };

  // Filter and sort tenant data based on current view
  const filteredAndSortedData = tenantData
    .filter((item) => {
      const tenant = item?.tenant;
      if (!tenant) return false;
      
      // Filter by current view
      const matchesView = 
        (currentView === 'pending' && item.type === 'APPLICATION') ||
        (currentView === 'approved' && item.type === 'APPROVED_TENANT') ||
        (currentView === 'active' && item.type === 'TENANT');
      
      if (!matchesView) return false;
      
      const matchesSearch = 
        tenant.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.phoneNumber && tenant.phoneNumber.includes(searchQuery));
      
      const matchesRisk = riskFilter === "all" || 
        (item.type === "APPLICATION" && item.riskAssessment?.riskLevel === riskFilter) ||
        (item.type === "APPROVED_TENANT" && item.behaviorAnalysis?.riskLevel === riskFilter) ||
        (item.type === "TENANT" && item.behaviorAnalysis?.riskLevel === riskFilter);
      
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          const aDate = a.type === 'APPLICATION' ? a.submittedAt : a.tenant?.createdAt;
          const bDate = b.type === 'APPLICATION' ? b.submittedAt : b.tenant?.createdAt;
          return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime();
        case "oldest":
          const aDateOld = a.type === 'APPLICATION' ? a.submittedAt : a.tenant?.createdAt;
          const bDateOld = b.type === 'APPLICATION' ? b.submittedAt : b.tenant?.createdAt;
          return new Date(aDateOld || 0).getTime() - new Date(bDateOld || 0).getTime();
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

  const applications = tenantData.filter(item => item?.type === 'APPLICATION');
  const approvedTenants = tenantData.filter(item => item?.type === 'APPROVED_TENANT');
  const activeTenants = tenantData.filter(item => item?.type === 'TENANT');

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

        {/* View Tabs */}
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentView('pending')}
            variant={currentView === 'pending' ? 'default' : 'outline'}
            className={`flex items-center gap-2 ${currentView === 'pending' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            <Clock className="h-4 w-4" />
            Pending Applications ({applications.length})
          </Button>
          
          <Button
            onClick={() => setCurrentView('approved')}
            variant={currentView === 'approved' ? 'default' : 'outline'}
            className={`flex items-center gap-2 ${currentView === 'approved' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
          >
            <UserCheck className="h-4 w-4" />
            Approved Tenants ({approvedTenants.length})
          </Button>
          
          <Button
            onClick={() => setCurrentView('active')}
            variant={currentView === 'active' ? 'default' : 'outline'}
            className={`flex items-center gap-2 ${currentView === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <CheckCircle className="h-4 w-4" />
            Active Tenants ({activeTenants.length})
          </Button>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenantData.filter(item => 
                    (item?.type === 'APPLICATION' && item?.riskAssessment?.riskLevel === 'HIGH') ||
                    ((item?.type === 'APPROVED_TENANT' || item?.type === 'TENANT') && item?.behaviorAnalysis?.riskLevel === 'HIGH')
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

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mr-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{tenantData.length}</p>
                <p className="text-xs text-gray-500">All categories</p>
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
                    placeholder={`Search ${currentView === 'pending' ? 'applications' : currentView === 'approved' ? 'approved tenants' : 'active tenants'} by name, email, phone, or property...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentView === 'pending' ? 'No pending applications' :
                   currentView === 'approved' ? 'No approved tenants' :
                   'No active tenants'}
                </h3>
                <p className="text-gray-600">
                  {currentView === 'pending' ? 'Tenant applications will appear here for screening and approval.' :
                   currentView === 'approved' ? 'Approved tenants awaiting lease activation will appear here.' :
                   'Active tenants with signed leases will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedData.map((item) => {
              const tenant = item?.tenant;
              if (!tenant) return null;

              return (
                <Card key={`${item.type}-${item.id || tenant.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={tenant.avatarUrl || undefined} />
                          <AvatarFallback>
                            {tenant.firstName?.[0] || '?'}{tenant.lastName?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {tenant.firstName} {tenant.lastName}
                          </h3>
                          <p className="text-gray-600">{tenant.email}</p>
                          
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
                            
                            {(item.riskAssessment?.riskLevel || item.behaviorAnalysis?.riskLevel) && (
                              <Badge className={getRiskBadgeColor(
                                item.type === 'APPLICATION' 
                                  ? item.riskAssessment?.riskLevel || 'LOW'
                                  : item.behaviorAnalysis?.riskLevel || 'LOW'
                              )}>
                                {item.type === 'APPLICATION' 
                                  ? item.riskAssessment?.riskLevel 
                                  : item.behaviorAnalysis?.riskLevel
                                } Risk
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {item.type === 'APPLICATION' && item.submittedAt && (
                          <div>
                            <p className="text-sm text-gray-500">Applied</p>
                            <p className="font-medium">{formatDate(item.submittedAt)}</p>
                            {item.unit && (
                              <>
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.unit.property.title} - {item.unit.label}
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                  {formatCurrency(item.unit.targetPrice)}/mo
                                </p>
                              </>
                            )}
                          </div>
                        )}
                        
                        {(item.type === 'APPROVED_TENANT' || item.type === 'TENANT') && item.currentLease && (
                          <div>
                            <p className="text-sm text-gray-500">
                              {item.type === 'APPROVED_TENANT' ? 'Approved' : 'Active Since'}
                            </p>
                            <p className="font-medium">{formatDate(tenant.createdAt)}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.currentLease.unit?.property?.title} - {item.currentLease.unit?.label}
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(item.currentLease.rentAmount || 0)}/mo
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      {item.type === 'APPLICATION' && (
                        <>
                          <Button
                            onClick={() => handleApplicationReview(item)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review Application
                          </Button>
                          <Button
                            onClick={() => handleAutomateApplication(item)}
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <Bot className="h-4 w-4 mr-2" />
                            Automate Application
                          </Button>
                          
                          {/* Lease is now pre-assigned during creation, so no separate assign button needed */}
                        </>
                      )}
                      
                      {item.type === 'APPROVED_TENANT' && (
                        <>
                          {item.currentLease && (
                            <Link to={`/landlord/leases/${item.currentLease.id}`}>
                              <Button className="bg-yellow-600 hover:bg-yellow-700">
                                <FileText className="h-4 w-4 mr-2" />
                                Activate Lease
                              </Button>
                            </Link>
                          )}
                          <Button
                            onClick={() => handleMessageTenant(item)}
                            variant="outline"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          <Button
                            onClick={() => handleDeleteTenant(item)}
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </>
                      )}
                      
                      {item.type === 'TENANT' && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => handleViewTenantDetails(item)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            onClick={() => handleMessageTenant(item)}
                            variant="outline"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {tenantToDelete?.tenant?.firstName} {tenantToDelete?.tenant?.lastName}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              className="flex-1"
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteTenant}
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lease Assignment Modal */}
      <Dialog open={showLeaseModal} onOpenChange={setShowLeaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lease</DialogTitle>
            <DialogDescription>
              Choose a lease to assign to {selectedApplicationForLease?.tenant?.firstName} {selectedApplicationForLease?.tenant?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {availableLeases.length > 0 ? (
              <>
                <p className="text-sm text-gray-600">Available leases for this unit:</p>
                <div className="space-y-2">
                  {availableLeases.map((lease: any) => (
                    <div key={lease.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{lease.leaseNickname}</h4>
                          <p className="text-sm text-gray-600">
                            {lease.leaseType} • ₱{lease.rentAmount?.toLocaleString()}/{lease.interval?.toLowerCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                          </p>
                          {lease.notes && (
                            <p className="text-xs text-gray-400 mt-1">{lease.notes}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => confirmAssignLease(lease.id)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={leaseLoading}
                        >
                          {leaseLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Assign
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Leases</h3>
                <p className="text-gray-600 mb-4">
                  There are no available leases for this unit. You'll need to create a new lease.
                </p>
                <Button
                  onClick={() => {
                    window.location.href = `/landlord/leases/create?unitId=${selectedApplicationForLease?.unitId || selectedApplicationForLease?.unit?.id}&tenantId=${selectedApplicationForLease?.tenant?.id}`;
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Lease
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowLeaseModal(false)}
              variant="outline"
              className="flex-1"
              disabled={leaseLoading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenant Details Modal */}
      <Dialog open={showTenantDetailsModal} onOpenChange={setShowTenantDetailsModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Tenant Profile
            </DialogTitle>
            <DialogDescription>
              View detailed information about this tenant.
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 blur-2xl opacity-70" />
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 blur-3xl opacity-70" />
                </div>

                <div className="relative p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                      <AvatarImage src={selectedTenant.tenant.avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xl font-semibold">
                        {selectedTenant.tenant.firstName[0]}{selectedTenant.tenant.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {selectedTenant.tenant.firstName} {selectedTenant.tenant.lastName}
                    </h1>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail size={14} />
                        <span>{selectedTenant.tenant.email}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                      <div className="text-sm text-gray-600 capitalize">
                        Tenant
                      </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                      <Badge
                        variant="default"
                        className="text-xs"
                      >
                        Active
                      </Badge>
                      <Badge
                        variant="default"
                        className="text-xs"
                      >
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                {/* Account Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Account Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 flex items-center justify-between">
                        {selectedTenant.tenant.email}
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          Verified
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Phone Number
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedTenant.tenant.phoneNumber || 'Not provided'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Role
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 capitalize">
                        Tenant
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Account Status
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Activity Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        Joined
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {new Date(selectedTenant.tenant.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                        <Building size={14} />
                        Current Property
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedTenant.unit ? (
                          <div>
                            <div className="font-medium">{selectedTenant.unit.property.title}</div>
                            <div className="text-sm text-gray-600">Unit {selectedTenant.unit.label}</div>
                            <div className="text-sm text-gray-600">{selectedTenant.unit.property.address}</div>
                          </div>
                        ) : 'No current property'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                        <DollarSign size={14} />
                        Monthly Rent
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedTenant.unit ? `₱${selectedTenant.unit.targetPrice.toLocaleString()}` : 'Not set'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                        <CreditCard size={14} />
                        Lease Status
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedTenant.currentLease ? 'Active Lease' : 'No active lease'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment Section */}
              {selectedTenant.riskAssessment && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Risk Assessment
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Risk Level
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        <Badge 
                          variant={
                            selectedTenant.riskAssessment.riskLevel === 'LOW' ? 'default' :
                            selectedTenant.riskAssessment.riskLevel === 'MEDIUM' ? 'secondary' : 'destructive'
                          }
                        >
                          {selectedTenant.riskAssessment.riskLevel}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        AI Risk Score
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedTenant.riskAssessment.aiRiskScore}/100
                      </div>
                    </div>
                  </div>

                  {selectedTenant.riskAssessment.aiScreeningSummary && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        AI Screening Summary
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedTenant.riskAssessment.aiScreeningSummary}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Automated Screening Modal */}
      <AutomatedScreeningModal
        application={selectedApplicationForScreening}
        isOpen={showScreeningModal}
        onClose={() => {
          setShowScreeningModal(false);
          setSelectedApplicationForScreening(null);
        }}
        onApprove={handleScreeningApprove}
        onReject={handleScreeningReject}
      />
    </div>
  );
};

export default TenantsRefined;
