import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Phone,
  Mail,
  Building2,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  Eye
} from "lucide-react";
import { getTenantLeasesRequest, type TenantLeasesResponse, type TenantLeaseInfo } from "@/api/adminApi";
import { toast } from "sonner";

interface AdminViewLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
}

const AdminViewLeaseModal = ({ isOpen, onClose, tenantId, tenantName }: AdminViewLeaseModalProps) => {
  const [data, setData] = useState<TenantLeasesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchTenantLeases();
    }
  }, [isOpen, tenantId]);

  const fetchTenantLeases = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTenantLeasesRequest(tenantId);
      setData(response.data);
    } catch (err: any) {
      console.error("Error fetching tenant leases:", err);
      setError("Failed to load lease information");
      toast.error("Failed to load lease information");
    } finally {
      setLoading(false);
    }
  };

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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      DRAFT: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      EXPIRED: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: XCircle },
      TERMINATED: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PAID: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      OVERDUE: { color: "bg-red-100 text-red-800", icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Lease - {tenantName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600">Loading lease information...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !data) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Lease - {tenantName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">{error || "Failed to load lease information"}</p>
              <Button onClick={fetchTenantLeases} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            View Lease - {data.tenant.firstName} {data.tenant.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tenant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={data.tenant.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
                    {data.tenant.firstName?.charAt(0)}{data.tenant.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {data.tenant.firstName} {data.tenant.lastName}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {data.tenant.email}
                        </div>
                        {data.tenant.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {data.tenant.phoneNumber}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Joined: {formatDate(data.tenant.createdAt)}
                        </div>
                        {data.tenant.lastLogin && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Last login: {formatDate(data.tenant.lastLogin)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={data.tenant.isDisabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                        {data.tenant.isDisabled ? "Disabled" : "Active"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lease Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{data.leaseStats.total}</div>
                <div className="text-sm text-gray-600">Total Leases</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{data.leaseStats.active}</div>
                <div className="text-sm text-gray-600">Active Leases</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{data.leaseStats.draft}</div>
                <div className="text-sm text-gray-600">Draft Leases</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{data.leaseStats.expired + data.leaseStats.terminated}</div>
                <div className="text-sm text-gray-600">Ended Leases</div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{data.paymentStats.paid}</div>
                  <div className="text-sm text-gray-600">Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">{data.paymentStats.pending}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{data.paymentStats.onTime}</div>
                  <div className="text-sm text-gray-600">On Time</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{data.paymentStats.late}</div>
                  <div className="text-sm text-gray-600">Late</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Paid Amount:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(data.paymentStats.totalPaidAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Pending Amount:</span>
                  <span className="font-semibold text-yellow-600">{formatCurrency(data.paymentStats.totalPendingAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leases List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Lease Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.leases.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No leases found for this tenant.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.leases.map((lease) => (
                    <Card key={lease.id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{lease.leaseNickname}</h3>
                              {getStatusBadge(lease.status)}
                            </div>
                            <p className="text-sm text-gray-600">{lease.leaseType} Lease</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              {formatCurrency(lease.rentAmount)}
                            </div>
                            <div className="text-sm text-gray-500">per {lease.interval.toLowerCase()}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Lease Information */}
                          <div>
                            <h4 className="font-medium mb-3">Lease Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Start Date:</span>
                                <span>{formatDate(lease.startDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">End Date:</span>
                                <span>{lease.endDate ? formatDate(lease.endDate) : "No end date"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Created:</span>
                                <span>{formatDate(lease.createdAt)}</span>
                              </div>
                              {lease.notes && (
                                <div className="mt-2">
                                  <span className="text-gray-600">Notes:</span>
                                  <p className="text-sm mt-1">{lease.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Property Information */}
                          <div>
                            <h4 className="font-medium mb-3">Property Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{lease.unit.property.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span>{lease.unit.property.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-gray-500" />
                                <span>Unit: {lease.unit.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>Max {lease.unit.maxOccupancy} occupants</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Landlord Information */}
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-3">Landlord Information</h4>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={lease.unit.property.owner.avatarUrl || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                                {lease.unit.property.owner.firstName?.charAt(0)}{lease.unit.property.owner.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {lease.unit.property.owner.firstName} {lease.unit.property.owner.lastName}
                              </div>
                              <div className="text-sm text-gray-600">{lease.unit.property.owner.email}</div>
                              {lease.unit.property.owner.phoneNumber && (
                                <div className="text-sm text-gray-600">{lease.unit.property.owner.phoneNumber}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Recent Payments */}
                        {lease.payments.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium mb-3">Recent Payments</h4>
                            <div className="space-y-2">
                              {lease.payments.slice(0, 3).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    {getPaymentStatusBadge(payment.status)}
                                    <span className="text-sm">{formatDate(payment.createdAt)}</span>
                                  </div>
                                  <div className="text-sm font-medium">
                                    {formatCurrency(payment.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminViewLeaseModal;
