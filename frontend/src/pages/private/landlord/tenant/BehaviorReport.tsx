import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Wrench,
  Home,
  Calendar,
  User,
  Phone,
  Mail,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  generateBehaviorReportRequest,
  type BehaviorReport 
} from "@/api/landlordTenantApi";
import { toast } from "sonner";

const BehaviorReport = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<BehaviorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<string>("comprehensive");

  useEffect(() => {
    if (!tenantId) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await generateBehaviorReportRequest(tenantId, reportType);
        setReport(response.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching behavior report:", err);
          toast.error("Failed to fetch behavior report");
          navigate("/landlord/tenants");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [tenantId, reportType, navigate]);

  const handleGenerateNewReport = async () => {
    if (!tenantId) return;

    setGenerating(true);
    try {
      const response = await generateBehaviorReportRequest(tenantId, reportType);
      setReport(response.data);
      toast.success("Behavior report generated successfully");
    } catch (err: any) {
      console.error("Error generating behavior report:", err);
      toast.error("Failed to generate behavior report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;

    const reportData = {
      tenant: report.tenant,
      reportType: report.reportType,
      generatedAt: report.generatedAt,
      summary: report.summary,
      detailedAnalysis: report.detailedAnalysis,
      recommendations: report.recommendations,
      riskFactors: report.riskFactors,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `tenant-behavior-report-${report.tenant.fullName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DECLINING":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "STABLE":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
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

  if (!report) {
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
            <FileText className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">Report Not Found</h3>
          <p className="text-gray-600 text-sm mb-4">
            Unable to generate or load the behavior report for this tenant.
          </p>
          <Button onClick={handleGenerateNewReport} disabled={generating}>
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
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
            <h1 className="text-2xl font-bold text-gray-900">Behavior Analysis Report</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive analysis for {report.tenant.fullName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comprehensive">Comprehensive</SelectItem>
              <SelectItem value="payment">Payment Analysis</SelectItem>
              <SelectItem value="maintenance">Maintenance Analysis</SelectItem>
              <SelectItem value="summary">Summary Only</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGenerateNewReport}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Report Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tenant Behavior Analysis Report</h2>
              <p className="text-sm text-gray-600">
                Generated on {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-sm ${getRiskColor(report.summary.overallRiskLevel)}`}>
                {getRiskIcon(report.summary.overallRiskLevel)}
                <span className="ml-1">{report.summary.overallRiskLevel} Risk</span>
              </Badge>
              <Badge variant="outline" className="text-sm">
                {report.reportType}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Tenant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium">
                  {report.tenant.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{report.tenant.fullName}</h3>
                  <p className="text-sm text-gray-600">{report.tenant.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                {report.tenant.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{report.tenant.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(report.tenant.joinedDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Summary Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{report.summary.paymentReliability}%</div>
                  <div className="text-sm text-gray-600">Payment Reliability</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{report.summary.maintenanceRequestsCount}</div>
                  <div className="text-sm text-gray-600">Maintenance Requests</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{report.summary.recentMaintenanceCount}</div>
                  <div className="text-sm text-gray-600">Recent Requests</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{report.summary.averagePaymentDelay}</div>
                  <div className="text-sm text-gray-600">Avg. Delay (days)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Behavior Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Behavior Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Payments</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.paymentBehavior.totalPayments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">On-time Payments</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.paymentBehavior.onTimePayments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Late Payments</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.paymentBehavior.latePayments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Advance Payments</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.paymentBehavior.advancePayments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reliability Rate</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.paymentBehavior.reliability}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Trend</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(report.detailedAnalysis.paymentBehavior.trend)}
                    <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.paymentBehavior.trend}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Maintenance Behavior Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Behavior Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.maintenanceBehavior.totalRequests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recent Requests</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.maintenanceBehavior.recentRequests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Response Time</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.maintenanceBehavior.averageResponseTime} days</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-600">Request Types</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Plumbing:</span>
                    <span className="font-medium">{report.detailedAnalysis.maintenanceBehavior.requestTypes.plumbing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Electrical:</span>
                    <span className="font-medium">{report.detailedAnalysis.maintenanceBehavior.requestTypes.electrical}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HVAC:</span>
                    <span className="font-medium">{report.detailedAnalysis.maintenanceBehavior.requestTypes.hvac}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>General:</span>
                    <span className="font-medium">{report.detailedAnalysis.maintenanceBehavior.requestTypes.general}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Emergency:</span>
                    <span className="font-medium">{report.detailedAnalysis.maintenanceBehavior.requestTypes.emergency}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lease History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Lease History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Leases</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.leaseHistory.totalLeases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Leases</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.leaseHistory.activeLeases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Lease Duration</span>
                  <span className="text-sm font-medium text-gray-900">{report.detailedAnalysis.leaseHistory.averageLeaseDuration} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Renewal Rate</span>
                  <span className="text-sm font-medium text-gray-900">{Math.round(report.detailedAnalysis.leaseHistory.renewalRate)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.riskFactors.length > 0 ? (
                <div className="space-y-2">
                  {report.riskFactors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>No significant risk factors identified</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.recommendations.length > 0 ? (
              report.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>No specific recommendations at this time</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BehaviorReport;
