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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  getLandlordTenantsRequest, 
  getTenantStatsRequest,
  updateTenantApplicationStatusRequest,
  type TenantManagementItem,
  type TenantApplication,
  type ActiveTenant,
  type TenantStats 
} from "@/api/landlordTenantApi";
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
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tenantsRes, statsRes] = await Promise.all([
          getLandlordTenantsRequest({ signal: controller.signal }),
          getTenantStatsRequest({ signal: controller.signal }),
        ]);
        setTenantData(tenantsRes.data);
        setStats(statsRes.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching tenant data:", err);
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
    setShowApplicationModal(true);
    setReviewNotes("");
  };

  const handleApproveApplication = async () => {
    if (!selectedApplication) return;
    
    setReviewLoading(true);
    try {
      await updateTenantApplicationStatusRequest(selectedApplication.id, {
        status: 'APPROVED',
        notes: reviewNotes
      });
      
      toast.success("Application approved! Lease has been created.");
      setShowApplicationModal(false);
      setSelectedApplication(null);
      
      // Refresh data
      const tenantsRes = await getLandlordTenantsRequest();
      setTenantData(tenantsRes.data);
    } catch (error: any) {
      console.error("Error approving application:", error);
      toast.error(error.response?.data?.message || "Failed to approve application");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication) return;
    
    setReviewLoading(true);
    try {
      await updateTenantApplicationStatusRequest(selectedApplication.id, {
        status: 'REJECTED',
        notes: reviewNotes
      });
      
      toast.success("Application rejected.");
      setShowApplicationModal(false);
      setSelectedApplication(null);
      
      // Refresh data
      const tenantsRes = await getLandlordTenantsRequest();
      setTenantData(tenantsRes.data);
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      toast.error(error.response?.data?.message || "Failed to reject application");
    } finally {
      setReviewLoading(false);
    }
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
      const tenant = item.type === 'APPLICATION' ? item.tenant : item.tenant;
      const matchesSearch = 
        tenant.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.phoneNumber && tenant.phoneNumber.includes(searchQuery));
      
      const matchesType = typeFilter === "all" || 
        (typeFilter === "applications" && item.type === "APPLICATION") ||
        (typeFilter === "tenants" && item.type === "TENANT");
      
      const matchesRisk = riskFilter === "all" || 
        (item.type === "APPLICATION" && item.riskAssessment.riskLevel === riskFilter) ||
        (item.type === "TENANT" && item.behaviorAnalysis.riskLevel === riskFilter);
      
      return matchesSearch && matchesType && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          const aDate = a.type === 'APPLICATION' ? a.submittedAt : a.tenant.createdAt;
          const bDate = b.type === 'APPLICATION' ? b.submittedAt : b.tenant.createdAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        case "oldest":
          const aDateOld = a.type === 'APPLICATION' ? a.submittedAt : a.tenant.createdAt;
          const bDateOld = b.type === 'APPLICATION' ? b.submittedAt : b.tenant.createdAt;
          return new Date(aDateOld).getTime() - new Date(bDateOld).getTime();
        case "risk":
          const aRisk = a.type === 'APPLICATION' ? a.riskAssessment.riskLevel : a.behaviorAnalysis.riskLevel;
          const bRisk = b.type === 'APPLICATION' ? b.riskAssessment.riskLevel : b.behaviorAnalysis.riskLevel;
          const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (riskOrder[bRisk as keyof typeof riskOrder] || 0) - (riskOrder[aRisk as keyof typeof riskOrder] || 0);
        default:
          return 0;
      }
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
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
  const activeTenants = tenantData.filter(item => item.type === 'TENANT') as ActiveTenant[];

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
              <p className="text-gray-600">Manage tenant applications and monitor behavior patterns</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                  <p className="text-2xl font-bold text-gray-900">{activeTenants.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Risk</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tenantData.filter(item => 
                      (item.type === 'APPLICATION' && item.riskAssessment.riskLevel === 'HIGH') ||
                      (item.type === 'TENANT' && item.behaviorAnalysis.riskLevel === 'HIGH')
                    ).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(activeTenants.reduce((sum, tenant) => 
                      sum + (tenant.currentLease?.rentAmount || 0), 0
                    ))}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <span className="text-2xl font-bold text-purple-600">₱</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
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
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="applications">Applications</SelectItem>
                  <SelectItem value="tenants">Active Tenants</SelectItem>
                </SelectContent>
              </Select>
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

        {/* Tenant Data List */}
        <div className="space-y-4">
          {filteredAndSortedData.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants yet</h3>
                <p className="text-gray-600">
                  {searchQuery || typeFilter !== "all" || riskFilter !== "all"
                    ? "No tenants match your current filters."
                    : "Tenants will appear here when they have active leases with your properties."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedData.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {item.type === 'APPLICATION' ? (
                    /* Application Card */
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={item.tenant.avatarUrl || undefined} />
                            <AvatarFallback>
                              {item.tenant.firstName?.[0]}{item.tenant.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.tenant.firstName} {item.tenant.lastName}
                            </h3>
                            <p className="text-gray-600">{item.tenant.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                <Clock className="h-3 w-3 mr-1" />
                                Application
                              </Badge>
                              <Badge className={getRiskBadgeColor(item.riskAssessment.riskLevel)}>
                                {item.riskAssessment.riskLevel} Risk
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Applied {formatDate(item.submittedAt)}</p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleApplicationExpansion(item.id)}
                            >
                              {expandedApplications.has(item.id) ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Less Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  View Details
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApplicationReview(item)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Property Info */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.unit.property.title}</h4>
                            <p className="text-sm text-gray-600">Unit {item.unit.label} • {item.unit.property.address}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(item.unit.targetPrice)}/month</p>
                            <p className="text-sm text-gray-600">{item.unit.property.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedApplications.has(item.id) && (
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Personal Info</h5>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-gray-600">Full Name:</span> {item.applicationData.fullName}</p>
                                <p><span className="text-gray-600">Birthdate:</span> {item.applicationData.birthdate ? formatDate(item.applicationData.birthdate) : 'Not provided'}</p>
                                <p><span className="text-gray-600">ID Number:</span> {item.applicationData.governmentIdNumber || 'Not provided'}</p>
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Employment</h5>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-gray-600">Status:</span> {item.applicationData.employmentStatus || 'Not provided'}</p>
                                <p><span className="text-gray-600">Employer:</span> {item.applicationData.employerName || 'Not provided'}</p>
                                <p><span className="text-gray-600">Income:</span> {item.applicationData.monthlyIncome ? formatCurrency(item.applicationData.monthlyIncome) : 'Not provided'}</p>
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Lifestyle</h5>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-gray-600">Smoker:</span> {item.applicationData.isSmoker ? 'Yes' : 'No'}</p>
                                <p><span className="text-gray-600">Pets:</span> {item.applicationData.hasPets ? `Yes (${item.applicationData.petTypes})` : 'No'}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Documents */}
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">Documents</h5>
                            <div className="flex flex-wrap gap-2">
                              {item.applicationData.idImageUrl && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Government ID
                                </Badge>
                              )}
                              {item.applicationData.selfieUrl && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Selfie with ID
                                </Badge>
                              )}
                              {item.applicationData.nbiClearanceUrl && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  <FileText className="h-3 w-3 mr-1" />
                                  NBI Clearance
                                </Badge>
                              )}
                              {item.applicationData.proofOfIncomeUrl && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Proof of Income
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Active Tenant Card */
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={item.tenant.avatarUrl || undefined} />
                          <AvatarFallback>
                            {item.tenant.firstName?.[0]}{item.tenant.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.tenant.fullName}</h3>
                          <p className="text-gray-600">{item.tenant.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active Tenant
                            </Badge>
                            <Badge className={getRiskBadgeColor(item.behaviorAnalysis.riskLevel)}>
                              {item.behaviorAnalysis.riskLevel} Risk
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {item.currentLease && (
                          <div className="mb-2">
                            <p className="font-medium text-gray-900">{item.currentLease.unit.property.title}</p>
                            <p className="text-sm text-gray-600">Unit {item.currentLease.unit.label}</p>
                            <p className="text-sm font-medium text-green-600">{formatCurrency(item.currentLease.rentAmount)}/month</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Link to={`/landlord/tenants/${item.tenant.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Application Review Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Tenant Application</DialogTitle>
            <DialogDescription>
              Review the tenant's credentials and decide whether to approve or reject their application.
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Tenant Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedApplication.tenant.avatarUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {selectedApplication.tenant.firstName?.[0]}{selectedApplication.tenant.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedApplication.tenant.firstName} {selectedApplication.tenant.lastName}</h3>
                  <p className="text-gray-600">{selectedApplication.tenant.email}</p>
                  <p className="text-sm text-gray-500">Applied on {formatDate(selectedApplication.submittedAt)}</p>
                </div>
                <div className="ml-auto">
                  <Badge className={getRiskBadgeColor(selectedApplication.riskAssessment.riskLevel)}>
                    {selectedApplication.riskAssessment.riskLevel} Risk ({selectedApplication.riskAssessment.aiRiskScore}%)
                  </Badge>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Property Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Property</p>
                    <p className="font-medium">{selectedApplication.unit.property.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unit</p>
                    <p className="font-medium">{selectedApplication.unit.label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rent</p>
                    <p className="font-medium">{formatCurrency(selectedApplication.unit.targetPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{selectedApplication.unit.property.location}</p>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Personal Information</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-medium">{selectedApplication.applicationData.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date of Birth</p>
                        <p className="font-medium">{selectedApplication.applicationData.birthdate ? formatDate(selectedApplication.applicationData.birthdate) : 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Government ID</p>
                        <p className="font-medium">{selectedApplication.applicationData.governmentIdNumber || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Employment & Financial</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Employment Status</p>
                        <p className="font-medium">{selectedApplication.applicationData.employmentStatus || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Employer</p>
                        <p className="font-medium">{selectedApplication.applicationData.employerName || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Monthly Income</p>
                        <p className="font-medium">{selectedApplication.applicationData.monthlyIncome ? formatCurrency(selectedApplication.applicationData.monthlyIncome) : 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Rental History</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Previous Landlord</p>
                        <p className="font-medium">{selectedApplication.applicationData.previousLandlordName || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-medium">{selectedApplication.applicationData.previousLandlordContact || 'Not provided'}</p>
                      </div>
                      {selectedApplication.applicationData.rentalHistoryNotes && (
                        <div>
                          <p className="text-sm text-gray-600">Notes</p>
                          <p className="font-medium">{selectedApplication.applicationData.rentalHistoryNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Lifestyle</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Smoking</p>
                        <p className="font-medium">{selectedApplication.applicationData.isSmoker ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pets</p>
                        <p className="font-medium">
                          {selectedApplication.applicationData.hasPets 
                            ? `Yes${selectedApplication.applicationData.petTypes ? ` (${selectedApplication.applicationData.petTypes})` : ''}`
                            : 'No'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-semibold mb-3">Submitted Documents</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedApplication.applicationData.idImageUrl && (
                    <div className="p-3 border rounded-lg text-center">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Government ID</p>
                      <Button size="sm" variant="outline" className="mt-2">View</Button>
                    </div>
                  )}
                  {selectedApplication.applicationData.selfieUrl && (
                    <div className="p-3 border rounded-lg text-center">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Selfie with ID</p>
                      <Button size="sm" variant="outline" className="mt-2">View</Button>
                    </div>
                  )}
                  {selectedApplication.applicationData.nbiClearanceUrl && (
                    <div className="p-3 border rounded-lg text-center">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">NBI Clearance</p>
                      <Button size="sm" variant="outline" className="mt-2">View</Button>
                    </div>
                  )}
                  {selectedApplication.applicationData.proofOfIncomeUrl && (
                    <div className="p-3 border rounded-lg text-center">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Proof of Income</p>
                      <Button size="sm" variant="outline" className="mt-2">View</Button>
                    </div>
                  )}
                  {selectedApplication.applicationData.biodataUrl && (
                    <div className="p-3 border rounded-lg text-center">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Biodata/Resume</p>
                      <Button size="sm" variant="outline" className="mt-2">View</Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes (Optional)
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about your decision..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowApplicationModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={reviewLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectApplication}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  disabled={reviewLoading}
                >
                  {reviewLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={handleApproveApplication}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={reviewLoading}
                >
                  {reviewLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve & Create Lease
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantManagement;
