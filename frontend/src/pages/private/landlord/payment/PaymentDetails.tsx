import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  Home,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Send,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getPaymentDetailsRequest, 
  updatePaymentStatusRequest,
  sendPaymentReminderRequest,
  type PaymentDetails
} from "@/api/landlordPaymentApi";
import { toast } from "sonner";

const PaymentDetails = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [editing, setEditing] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "",
    note: "",
  });

  useEffect(() => {
    if (!paymentId) return;

    const fetchPaymentDetails = async () => {
      setLoading(true);
      try {
        const response = await getPaymentDetailsRequest(paymentId);
        setPayment(response.data);
        setUpdateData({
          status: response.data.status,
          note: response.data.note || "",
        });
      } catch (err: any) {
        console.error("Error fetching payment details:", err);
        toast.error("Failed to load payment details");
        navigate("/landlord/payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId, navigate]);

  const handleUpdateStatus = async () => {
    if (!paymentId) return;

    try {
      await updatePaymentStatusRequest(paymentId, {
        status: updateData.status as "PENDING" | "PAID",
        note: updateData.note,
      });
      
      toast.success("Payment status updated successfully");
      setEditing(false);
      
      // Refresh payment details
      const response = await getPaymentDetailsRequest(paymentId);
      setPayment(response.data);
    } catch (err: any) {
      console.error("Error updating payment status:", err);
      toast.error("Failed to update payment status");
    }
  };

  const handleSendReminder = async () => {
    if (!payment?.lease.id) return;

    try {
      await sendPaymentReminderRequest(payment.lease.id, {
        message: `Payment reminder for ${payment.lease?.leaseNickname || 'this lease'}`,
        reminderType: "GENERAL",
      });
      
      toast.success("Payment reminder sent successfully");
    } catch (err: any) {
      console.error("Error sending reminder:", err);
      toast.error("Failed to send payment reminder");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTimingBadge = (timingStatus: string) => {
    switch (timingStatus) {
      case "ONTIME":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On Time</Badge>;
      case "LATE":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Late</Badge>;
      case "ADVANCE":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Advance</Badge>;
      default:
        return <Badge variant="secondary">{timingStatus}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not paid";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Payment not found</h3>
        <p className="text-gray-500 mb-4">The payment you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => navigate("/landlord/payments")}>
          Back to Payments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/landlord/payments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Details</h1>
          <p className="text-gray-600 mt-1">Transaction ID: {payment.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                {!editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={updateData.status} onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      value={updateData.note}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="Add a note about this payment..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={handleUpdateStatus}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Amount</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <div className="mt-1">{getStatusBadge(payment.status)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Timing Status</p>
                      <div className="mt-1">{getTimingBadge(payment.timingStatus)}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Payment Method</p>
                      <p className="text-gray-900">{payment.method || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Paid At</p>
                      <p className="text-gray-900">{formatDate(payment.paidAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Created At</p>
                      <p className="text-gray-900">{formatDate(payment.createdAt)}</p>
                    </div>
                  </div>

                  {payment.providerTxnId && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Transaction ID</p>
                      <p className="text-gray-900 font-mono text-sm">{payment.providerTxnId}</p>
                    </div>
                  )}

                  {payment.isPartial && (
                    <div>
                      <Badge variant="outline">Partial Payment</Badge>
                    </div>
                  )}

                  {payment.note && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Note</p>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{payment.note}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
                  <p className="text-sm font-medium text-gray-600">Lease Name</p>
                  <p className="text-gray-900">{payment.lease?.leaseNickname || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Rent Amount</p>
                  <p className="text-gray-900">{formatCurrency(payment.lease?.rentAmount || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Interval</p>
                  <p className="text-gray-900">{payment.lease?.interval || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Lease Period</p>
                  <p className="text-gray-900">
                    {formatDate(payment.lease?.startDate)} - {formatDate(payment.lease?.endDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property & Tenant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property & Tenant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Property</p>
                <p className="text-gray-900">{payment.lease?.unit?.property?.title || 'N/A'}</p>
                {payment.lease?.unit?.property?.address && (
                  <p className="text-sm text-gray-500">{payment.lease.unit.property.address}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Unit</p>
                <p className="text-gray-900">{payment.lease?.unit?.label || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Tenant</p>
                <div className="flex items-center gap-3">
                  {payment.lease?.tenant?.avatarUrl ? (
                    <img 
                      src={payment.lease.tenant.avatarUrl} 
                      alt="Tenant" 
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-gray-900">
                      {payment.lease?.tenant?.firstName || 'N/A'} {payment.lease?.tenant?.lastName || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">{payment.lease?.tenant?.email || 'N/A'}</p>
                    {payment.lease?.tenant?.phoneNumber && (
                      <p className="text-sm text-gray-500">{payment.lease.tenant.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/landlord/leases/${payment.lease?.id}/payments`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Payment History
              </Button>

              {payment.status === "PENDING" && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSendReminder}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // In a real app, this would generate and download a receipt
                  toast.info("Receipt download feature coming soon");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
