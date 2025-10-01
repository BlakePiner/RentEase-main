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
  Send,
  TrendingUp,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  getLeasePaymentHistoryRequest, 
  sendPaymentReminderRequest,
  type PaymentHistory
} from "@/api/landlordPaymentApi";
import { toast } from "sonner";

const LeasePaymentHistory = () => {
  const { leaseId } = useParams<{ leaseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");

  useEffect(() => {
    if (!leaseId) return;

    const fetchPaymentHistory = async () => {
      setLoading(true);
      try {
        const response = await getLeasePaymentHistoryRequest(leaseId);
        setPaymentHistory(response.data);
      } catch (err: any) {
        console.error("Error fetching payment history:", err);
        toast.error("Failed to load payment history");
        navigate("/landlord/payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [leaseId, navigate]);

  const handleSendReminder = async () => {
    if (!leaseId) return;

    setSendingReminder(true);
    try {
      await sendPaymentReminderRequest(leaseId, {
        message: reminderMessage || undefined,
        reminderType: "GENERAL",
      });
      
      toast.success("Payment reminder sent successfully");
      setReminderMessage("");
    } catch (err: any) {
      console.error("Error sending reminder:", err);
      toast.error("Failed to send payment reminder");
    } finally {
      setSendingReminder(false);
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
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate payment statistics
  const calculateStats = () => {
    if (!paymentHistory) return null;

    const payments = paymentHistory.payments;
    const paidPayments = payments.filter(p => p.status === "PAID");
    const pendingPayments = payments.filter(p => p.status === "PENDING");
    
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const onTimePayments = paidPayments.filter(p => p.timingStatus === "ONTIME");
    const latePayments = paidPayments.filter(p => p.timingStatus === "LATE");
    
    const onTimeRate = paidPayments.length > 0 ? (onTimePayments.length / paidPayments.length) * 100 : 0;

    return {
      totalPaid,
      totalPending,
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
      onTimeRate,
      onTimeCount: onTimePayments.length,
      lateCount: latePayments.length,
    };
  };

  const stats = calculateStats();

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
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentHistory) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Payment history not found</h3>
        <p className="text-gray-500 mb-4">The payment history you're looking for doesn't exist or you don't have access to it.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">{paymentHistory.lease.leaseNickname}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Paid</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.paidCount} payments</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.totalPending)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.pendingCount} payments</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
                      <p className="text-xl font-bold text-blue-600">{stats.onTimeRate.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.onTimeCount} on-time</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentHistory.payments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
                  <p className="text-gray-500">No payment transactions have been recorded for this lease.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.payments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </h3>
                            {getStatusBadge(payment.status)}
                            {getTimingBadge(payment.timingStatus)}
                            {payment.isPartial && (
                              <Badge variant="outline">Partial</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Paid: {formatDate(payment.paidAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Created: {formatDateTime(payment.createdAt)}</span>
                            </div>
                          </div>

                          {payment.method && (
                            <div className="mt-2 text-sm text-gray-500">
                              Method: {payment.method}
                            </div>
                          )}

                          {payment.note && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {payment.note}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/landlord/payments/${payment.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lease Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lease Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Lease Name</p>
                <p className="text-gray-900">{paymentHistory.lease.leaseNickname}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Rent Amount</p>
                <p className="text-gray-900">{formatCurrency(paymentHistory.lease.rentAmount)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Payment Interval</p>
                <p className="text-gray-900">{paymentHistory.lease.interval}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Lease Period</p>
                <p className="text-gray-900">
                  {formatDate(paymentHistory.lease.startDate)} - {formatDate(paymentHistory.lease.endDate)}
                </p>
              </div>
            </CardContent>
          </Card>

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
                <p className="text-gray-900">{paymentHistory.lease.unit.property.title}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Unit</p>
                <p className="text-gray-900">{paymentHistory.lease.unit.label}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Tenant</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-900">
                      {paymentHistory.lease.tenant.firstName} {paymentHistory.lease.tenant.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{paymentHistory.lease.tenant.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Reminder */}
          {stats && stats.pendingCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Reminder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Send a payment reminder to the tenant for {stats.pendingCount} pending payment(s) 
                    totaling {formatCurrency(stats.totalPending)}.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminderMessage">Custom Message (Optional)</Label>
                  <Textarea
                    id="reminderMessage"
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    placeholder="Add a custom message to the reminder..."
                    rows={3}
                  />
                </div>

                <Button 
                  className="w-full"
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingReminder ? "Sending..." : "Send Reminder"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/landlord/leases/${paymentHistory.lease.id}`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Lease Details
              </Button>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // In a real app, this would generate and download a payment report
                  toast.info("Payment report download feature coming soon");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeasePaymentHistory;
