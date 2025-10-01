import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getPaymentStatsRequest,
  type PaymentStats
} from "@/api/landlordPaymentApi";
import { toast } from "sonner";

const PaymentReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await getPaymentStatsRequest({ period });
        setStats(response.data);
      } catch (err: any) {
        console.error("Error fetching payment stats:", err);
        toast.error("Failed to load payment statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/landlord/payments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Reports</h1>
          <p className="text-gray-600 mt-1">Analytics and insights for payment performance</p>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={(value: "week" | "month" | "quarter" | "year") => setPeriod(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast.info("Export feature coming soon")}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.summary.totalAmount)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.summary.paidPayments} paid payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.summary.pendingAmount)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.summary.pendingPayments} pending payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.summary.onTimeRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.timing.onTime} on-time payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Late Rate</p>
                    <p className="text-2xl font-bold text-red-600">{stats.summary.lateRate.toFixed(1)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.timing.late} late payments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.distribution.methods).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.distribution.methods).map(([method, count]) => (
                      <div key={method} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{method}</span>
                        <span className="text-sm text-gray-500">{count} payments</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No payment method data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.trend.length > 0 ? (
                  <div className="space-y-3">
                    {stats.trend.map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{month.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">{month.count} payments</span>
                          <span className="text-sm font-bold text-green-600">{formatCurrency(month.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timing Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Payment Timing Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.timing.onTime}</div>
                  <div className="text-sm text-gray-600">On-Time Payments</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.timing.late}</div>
                  <div className="text-sm text-gray-600">Late Payments</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.timing.advance}</div>
                  <div className="text-sm text-gray-600">Advance Payments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PaymentReports;
