import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  DollarSign,
  Wrench,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Download,
  RefreshCw,
  Eye,
  MoreHorizontal,
  UserCheck,
  UserX,
  CreditCard,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getTenantDetailsRequest, 
  runTenantScreeningRequest,
  getScreeningResultsRequest,
  generateBehaviorReportRequest,
  type TenantDetails,
  type ScreeningResult,
  type BehaviorReport 
} from "@/api/landlordTenantApi";
import { toast } from "sonner";

const TenantDetails = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [behaviorReport, setBehaviorReport] = useState<BehaviorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningScreening, setRunningScreening] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  useEffect(() => {
    if (!tenantId) return;

    const controller = new AbortController();
    const fetchTenantData = async () => {
      setLoading(true);
      try {
        const [tenantRes, screeningRes] = await Promise.all([
          getTenantDetailsRequest(tenantId, { signal: controller.signal }),
          getScreeningResultsRequest(tenantId, { signal: controller.signal }),
        ]);
        setTenant(tenantRes.data);
        setScreeningResults(screeningRes.data);
        
        // Set default unit for screening
        if (tenantRes.data.currentLease) {
          setSelectedUnit(tenantRes.data.currentLease.unit.id);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching tenant data:", err);
          // Show appropriate error message based on the error type
          if (err.response?.status === 404) {
            toast.error("Tenant not found");
          } else if (err.response?.status >= 500 || !err.response) {
            toast.error("Failed to fetch tenant data");
          } else {
            toast.error("Failed to fetch tenant data");
          }
          navigate("/landlord/tenants");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
    return () => controller.abort();
  }, [tenantId, navigate]);

  const handleRunScreening = async () => {
    if (!tenant || !selectedUnit) {
      toast.error("Please select a unit for screening");
      return;
    }

    setRunningScreening(true);
    try {
      const response = await runTenantScreeningRequest({
        tenantId: tenant.id,
        unitId: selectedUnit,
      });
      
      toast.success("Tenant screening completed successfully");
      
      // Refresh screening results
      const screeningRes = await getScreeningResultsRequest(tenantId!);
      setScreeningResults(screeningRes.data);
    } catch (err: any) {
      console.error("Error running tenant screening:", err);
      toast.error(err.response?.data?.message || "Failed to run tenant screening");
    } finally {
      setRunningScreening(false);
    }
  };

  const handleGenerateReport = async (reportType: string = "comprehensive") => {
    if (!tenantId) return;

    setGeneratingReport(true);
    try {
      const response = await generateBehaviorReportRequest(tenantId, reportType);
      setBehaviorReport(response.data);
      toast.success("Behavior report generated successfully");
    } catch (err: any) {
      console.error("Error generating behavior report:", err);
      toast.error("Failed to generate behavior report");
    } finally {
      setGeneratingReport(false);
    }
  };

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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/tenants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Link>
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/tenants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Link>
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <UserX className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">Tenant Not Found</h3>
          <p className="text-gray-600 text-sm mb-4">
            The tenant you're looking for doesn't exist or you don't have permission to view them.
          </p>
          <Button asChild>
            <Link to="/landlord/tenants">Back to Tenants</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/tenants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tenant Details</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${getRiskColor(tenant.behaviorAnalysis.overallRiskLevel)}`}>
                {getRiskIcon(tenant.behaviorAnalysis.overallRiskLevel)}
                <span className="ml-1">{tenant.behaviorAnalysis.overallRiskLevel} Risk</span>
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleGenerateReport("comprehensive")}
            disabled={generatingReport}
          >
            {generatingReport ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tenant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium text-xl">
                  {tenant.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">{tenant.fullName}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{tenant.email}</span>
                    </div>
                    {tenant.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{tenant.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(tenant.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Lease Information */}
          {tenant.currentLease && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Current Lease
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Home className="h-4 w-4" />
                      <span className="font-medium">{tenant.currentLease.property.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{tenant.currentLease.property.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Unit:</span>
                      <span className="font-medium">{tenant.currentLease.unit.label}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>₱{tenant.currentLease.rentAmount.toLocaleString()} / {tenant.currentLease.interval.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Started {new Date(tenant.currentLease.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getRiskColor(tenant.currentLease.status)}`}>
                        {tenant.currentLease.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Behavior Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Behavior Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{tenant.behaviorAnalysis.paymentReliability}%</div>
                  <div className="text-sm text-gray-600">Payment Reliability</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{tenant.behaviorAnalysis.totalPayments}</div>
                  <div className="text-sm text-gray-600">Total Payments</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{tenant.behaviorAnalysis.maintenanceRequestsCount}</div>
                  <div className="text-sm text-gray-600">Maintenance Requests</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">On-time Payments</span>
                  <span className="text-sm text-gray-900">{tenant.behaviorAnalysis.onTimePayments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Late Payments</span>
                  <span className="text-sm text-gray-900">{tenant.behaviorAnalysis.latePayments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Advance Payments</span>
                  <span className="text-sm text-gray-900">{tenant.behaviorAnalysis.advancePayments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Payment Delay</span>
                  <span className="text-sm text-gray-900">{tenant.behaviorAnalysis.averagePaymentDelay} days</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-600">AI Analysis Summary</span>
                <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                  {tenant.behaviorAnalysis.aiSummary}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Recent Payments</h4>
                {tenant.recentPayments.length > 0 ? (
                  <div className="space-y-2">
                    {tenant.recentPayments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium">₱{payment.amount.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-2">{payment.timingStatus}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent payments</p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Recent Maintenance Requests</h4>
                {tenant.recentMaintenanceRequests.length > 0 ? (
                  <div className="space-y-2">
                    {tenant.recentMaintenanceRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-900 line-clamp-1">{request.description}</p>
                        <div className="flex justify-between items-center mt-1">
                          <Badge variant="outline" className="text-xs">
                            {request.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent maintenance requests</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant Screening */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Tenant Screening
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.currentLease && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Select Unit for Screening</label>
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={tenant.currentLease.unit.id}>
                          {tenant.currentLease.unit.label} - {tenant.currentLease.property.title}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleRunScreening}
                    disabled={runningScreening}
                    className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600"
                  >
                    {runningScreening ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Running Screening...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Run Automated Screening
                      </>
                    )}
                  </Button>
                </div>
              )}

              {screeningResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Latest Screening Results</h4>
                  {screeningResults.slice(0, 1).map((screening) => (
                    <div key={screening.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-xs ${getRiskColor(screening.riskLevel)}`}>
                          {getRiskIcon(screening.riskLevel)}
                          <span className="ml-1">{screening.riskLevel} Risk</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {screening.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {screening.summary}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(screening.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overall Risk</span>
                  <Badge variant="outline" className={`text-xs ${getRiskColor(tenant.behaviorAnalysis.overallRiskLevel)}`}>
                    {getRiskIcon(tenant.behaviorAnalysis.overallRiskLevel)}
                    <span className="ml-1">{tenant.behaviorAnalysis.overallRiskLevel}</span>
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Risk</span>
                  <Badge variant="outline" className={`text-xs ${getRiskColor(tenant.behaviorAnalysis.paymentRiskLevel)}`}>
                    {getRiskIcon(tenant.behaviorAnalysis.paymentRiskLevel)}
                    <span className="ml-1">{tenant.behaviorAnalysis.paymentRiskLevel}</span>
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Maintenance Risk</span>
                  <Badge variant="outline" className={`text-xs ${getRiskColor(tenant.behaviorAnalysis.maintenanceRiskLevel)}`}>
                    {getRiskIcon(tenant.behaviorAnalysis.maintenanceRiskLevel)}
                    <span className="ml-1">{tenant.behaviorAnalysis.maintenanceRiskLevel}</span>
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI Risk Score</span>
                  <span className={`text-sm font-medium ${getReliabilityColor(100 - tenant.behaviorAnalysis.aiRiskScore)}`}>
                    {tenant.behaviorAnalysis.aiRiskScore}/100
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MoreHorizontal className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to={`/landlord/tenants/${tenant.id}/behavior-report`}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Report
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to={`/landlord/tenants/${tenant.id}/screening`}>
                  <Shield className="h-4 w-4 mr-2" />
                  View All Screenings
                </Link>
              </Button>
              {tenant.currentLease && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/landlord/leases/${tenant.currentLease.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Lease Details
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TenantDetails;
