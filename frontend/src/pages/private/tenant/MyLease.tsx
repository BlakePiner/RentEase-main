import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Home,
  MapPin,
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
  BedDouble,
  Maximize,
  Wifi,
  Car,
  Shield,
  Utensils,
  Dumbbell,
  Waves,
  TreePine,
  Camera,
  MessageSquare,
  CreditCard,
  Wrench,
  Star,
  ChevronRight,
  Building,
  Users,
  Calendar as CalendarIcon,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTenantLeaseDetails, type TenantLeaseDetails } from "@/api/tenantApi";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

const MyLease = () => {
  const [lease, setLease] = useState<TenantLeaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const controller = new AbortController();
    const fetchLeaseDetails = async () => {
      setLoading(true);
      try {
        const response = await getTenantLeaseDetails({
          signal: controller.signal,
        });
        setLease(response.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("=== FRONTEND LEASE ERROR ===");
          console.error("Error fetching lease details:", err);
          console.error("Error response:", err.response);
          console.error("Error status:", err.response?.status);
          console.error("Error data:", err.response?.data);
          console.error("=============================");
          
          // Handle 404 as "no lease found" - this is expected behavior
          if (err.response?.status === 404) {
            console.log("No lease found for tenant - this is expected");
            setLease(null);
          } else {
            toast.error("Failed to fetch lease details");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaseDetails();
    return () => controller.abort();
  }, []);

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

  const getTimingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ontime":
      case "advance":
        return "text-green-600";
      case "late":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getAmenityIcon = (amenityName: string) => {
    const name = amenityName.toLowerCase();
    if (name.includes("wifi") || name.includes("internet")) return <Wifi className="h-4 w-4" />;
    if (name.includes("parking")) return <Car className="h-4 w-4" />;
    if (name.includes("security")) return <Shield className="h-4 w-4" />;
    if (name.includes("kitchen") || name.includes("cooking")) return <Utensils className="h-4 w-4" />;
    if (name.includes("gym") || name.includes("fitness")) return <Dumbbell className="h-4 w-4" />;
    if (name.includes("pool") || name.includes("swimming")) return <Waves className="h-4 w-4" />;
    if (name.includes("garden") || name.includes("balcony")) return <TreePine className="h-4 w-4" />;
    if (name.includes("camera") || name.includes("cctv")) return <Camera className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
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
            <Link to="/tenant">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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
            <Link to="/tenant">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-green-100 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Lease</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You don't have an active lease yet. Browse available properties to find your perfect home.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/tenant/browse-properties">
                <Home className="h-4 w-4 mr-2" />
                Browse Properties
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/tenant/messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Link>
            </Button>
          </div>
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
            <Link to="/tenant">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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
            <Link to="/tenant/payments">
              <CreditCard className="h-4 w-4 mr-2" />
              View Payments
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/tenant/messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Landlord
            </Link>
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
                  <p className="text-gray-900 font-medium">{lease.leaseType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Rent Amount</label>
                  <p className="text-gray-900 font-semibold text-lg">
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
                  <Building className="h-4 w-4 text-gray-400" />
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Max Occupancy:</span>
                  <span className="font-medium text-gray-900">{lease.unit.maxOccupancy} people</span>
                </div>
                {lease.unit.floorNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Floor:</span>
                    <span className="font-medium text-gray-900">{lease.unit.floorNumber}</span>
                  </div>
                )}
              </div>

              {lease.unit.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Unit Description</label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{lease.unit.description}</p>
                </div>
              )}

              {/* Amenities */}
              {lease.unit.amenities.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {lease.unit.amenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        {getAmenityIcon(amenity.name)}
                        <span className="text-sm text-gray-700">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Landlord Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Landlord Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium">
                  {lease.landlord.firstName?.charAt(0) || "L"}
                  {lease.landlord.lastName?.charAt(0) || ""}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {lease.landlord.firstName} {lease.landlord.lastName}
                  </h3>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{lease.landlord.email}</span>
                    </div>
                    {lease.landlord.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{lease.landlord.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/tenant/messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lease Rules */}
          {lease.leaseRules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Lease Rules & Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lease.leaseRules.map((rule) => (
                    <div key={rule.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{rule.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                          <Badge variant="outline" className="text-xs mt-2">
                            {rule.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/tenant/payments">
                  <CreditCard className="h-4 w-4 mr-2" />
                  View Payment History
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/tenant/maintenance">
                  <Wrench className="h-4 w-4 mr-2" />
                  Submit Maintenance Request
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/tenant/messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Landlord
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Payments */}
          {lease.upcomingPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Upcoming Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lease.upcomingPayments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Due: {formatDate(payment.dueDate)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          payment.status === "PENDING" ? "bg-orange-100 text-orange-800 border-orange-200" :
                          "bg-green-100 text-green-800 border-green-200"
                        }`}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                  {lease.upcomingPayments.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to="/tenant/payments">
                        View All Payments
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLease;
