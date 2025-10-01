import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Home,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getLeaseDetailsRequest, 
  deleteLeaseRequest,
  type LeaseDetails 
} from "@/api/landlordLeaseApi";
import { toast } from "sonner";

const LeaseDetails = () => {
  const { leaseId } = useParams<{ leaseId: string }>();
  const navigate = useNavigate();
  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!leaseId) return;

    const controller = new AbortController();
    const fetchLeaseDetails = async () => {
      setLoading(true);
      try {
        const response = await getLeaseDetailsRequest(leaseId, { signal: controller.signal });
        setLease(response.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching lease details:", err);
          toast.error("Failed to fetch lease details");
          navigate("/landlord/leases");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaseDetails();
    return () => controller.abort();
  }, [leaseId, navigate]);

  const handleDelete = async () => {
    if (!lease || !leaseId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the lease "${lease.leaseNickname}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteLeaseRequest(leaseId);
      toast.success("Lease deleted successfully");
      navigate("/landlord/leases");
    } catch (err: any) {
      console.error("Error deleting lease:", err);
      toast.error(err.response?.data?.message || "Failed to delete lease");
    } finally {
      setDeleting(false);
    }
  };

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
      month: "long",
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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/leases">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leases
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

  if (!lease) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/leases">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leases
            </Link>
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">Lease Not Found</h3>
          <p className="text-gray-600 text-sm mb-4">
            The lease you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link to="/landlord/leases">Back to Leases</Link>
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
            <Link to="/landlord/leases">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leases
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lease.leaseNickname}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${getStatusColor(lease.status)}`}>
                {getStatusIcon(lease.status)}
                <span className="ml-1">{lease.status}</span>
              </Badge>
              {lease.leaseInfo.isExpiringSoon && (
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Expiring Soon
                </Badge>
              )}
              {lease.leaseInfo.isOverdue && (
                <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/landlord/leases/${lease.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Lease
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lease Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lease Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Lease Type</label>
                  <p className="text-gray-900">{lease.leaseType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Rent Amount</label>
                  <p className="text-gray-900 font-semibold">
                    {formatCurrency(lease.rentAmount)} {getIntervalText(lease.interval)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <p className="text-gray-900">{formatDate(lease.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <p className="text-gray-900">
                    {lease.endDate ? formatDate(lease.endDate) : "No end date"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Lease Duration</label>
                  <p className="text-gray-900">
                    {lease.leaseInfo.leaseDuration ? `${lease.leaseInfo.leaseDuration} days` : "Ongoing"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Days Elapsed</label>
                  <p className="text-gray-900">{lease.leaseInfo.daysElapsed} days</p>
                </div>
              </div>
              
              {lease.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Notes</label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{lease.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property & Unit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property & Unit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{lease.unit.property.title}</p>
                    <p className="text-sm text-gray-600">{lease.unit.property.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Unit:</span>
                  <span className="font-medium text-gray-900">{lease.unit.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Unit Status:</span>
                  <Badge variant="outline" className="text-xs">
                    {lease.unit.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium">
                  {lease.tenant.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{lease.tenant.fullName}</h3>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{lease.tenant.email}</span>
                    </div>
                    {lease.tenant.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{lease.tenant.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Payments</span>
                  <span className="font-medium text-gray-900">{lease.paymentStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paid</span>
                  <span className="font-medium text-green-600">{lease.paymentStats.paid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-medium text-orange-600">{lease.paymentStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">On Time</span>
                  <span className="font-medium text-green-600">{lease.paymentStats.onTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Late</span>
                  <span className="font-medium text-red-600">{lease.paymentStats.late}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reliability</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-900">{lease.paymentStats.reliability}%</span>
                    {lease.paymentStats.reliability >= 80 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Paid</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(lease.paymentStats.totalPaidAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Amount</span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(lease.paymentStats.totalPendingAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lease Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lease Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm text-gray-900">{formatDate(lease.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">{formatDate(lease.updatedAt)}</span>
                </div>
                {lease.leaseInfo.daysRemaining !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Days Remaining</span>
                    <span className={`text-sm font-medium ${
                      lease.leaseInfo.isOverdue ? 'text-red-600' : 
                      lease.leaseInfo.isExpiringSoon ? 'text-orange-600' : 
                      'text-gray-900'
                    }`}>
                      {lease.leaseInfo.daysRemaining} days
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Information */}
          {lease.hasFormalDocument && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lease Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Formal document available</span>
                  </div>
                  {lease.leaseDocumentUrl && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.open(lease.leaseDocumentUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = lease.leaseDocumentUrl!;
                          link.download = `lease-${lease.leaseNickname}.pdf`;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Behavior Analysis */}
          {lease.behaviorAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tenant Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lease.behaviorAnalysis.riskLevel && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Risk Level</span>
                    <Badge variant="outline" className={`text-xs ${
                      lease.behaviorAnalysis.riskLevel === 'LOW' ? 'bg-green-100 text-green-800 border-green-200' :
                      lease.behaviorAnalysis.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {lease.behaviorAnalysis.riskLevel}
                    </Badge>
                  </div>
                )}
                {lease.behaviorAnalysis.paymentReliability && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment Reliability</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(lease.behaviorAnalysis.paymentReliability * 100)}%
                    </span>
                  </div>
                )}
                {lease.behaviorAnalysis.maintenanceRequestsCount !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Maintenance Requests</span>
                    <span className="text-sm font-medium text-gray-900">
                      {lease.behaviorAnalysis.maintenanceRequestsCount}
                    </span>
                  </div>
                )}
                {lease.behaviorAnalysis.aiSummary && (
                  <div>
                    <span className="text-sm text-gray-600">AI Summary</span>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                      {lease.behaviorAnalysis.aiSummary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaseDetails;
