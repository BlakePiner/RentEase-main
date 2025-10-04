import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Building2,
  Receipt
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  getPaymentAnalyticsRequest,
  type PaymentAnalytics
} from "@/api/adminApi";

const Transactions = () => {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await getPaymentAnalyticsRequest({
        period
      });

      setAnalytics(response.data);
    } catch (error: any) {
      console.error("Error fetching payment analytics:", error);
      toast.error("Failed to fetch transaction analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Handle period change
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  // Get period label
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '90d':
        return 'Last 90 Days';
      case '1y':
        return 'Last Year';
      default:
        return 'Last 30 Days';
    }
  };

  // Calculate percentages
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">
            Financial analytics and transaction insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : analytics ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-50">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₱{analytics.summary.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{getPeriodLabel(period)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalPayments}</p>
                    <p className="text-xs text-gray-500">{getPeriodLabel(period)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {getPercentage(analytics.summary.paidPayments, analytics.summary.totalPayments)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics.summary.paidPayments} of {analytics.summary.totalPayments} paid
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.summary.pendingPayments}</p>
                    <p className="text-xs text-gray-500">
                      {getPercentage(analytics.summary.pendingPayments, analytics.summary.totalPayments)}% of total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Timing Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  On-Time Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analytics.summary.onTimePayments}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {getPercentage(analytics.summary.onTimePayments, analytics.summary.totalPayments)}% of total payments
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${getPercentage(analytics.summary.onTimePayments, analytics.summary.totalPayments)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Late Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {analytics.summary.latePayments}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {getPercentage(analytics.summary.latePayments, analytics.summary.totalPayments)}% of total payments
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ 
                        width: `${getPercentage(analytics.summary.latePayments, analytics.summary.totalPayments)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Advance Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analytics.summary.advancePayments}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {getPercentage(analytics.summary.advancePayments, analytics.summary.totalPayments)}% of total payments
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${getPercentage(analytics.summary.advancePayments, analytics.summary.totalPayments)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Payment Methods Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No payment method data available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.paymentMethods.map((method, index) => {
                    const percentage = getPercentage(method.count, analytics.summary.totalPayments);
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={method.method} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{method.method}</h3>
                          <Badge variant="outline">{method.count} transactions</Badge>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          ₱{method.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {percentage}% of total transactions
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${color} h-2 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.monthlyRevenue.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No revenue data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.monthlyRevenue.slice(0, 12).map((month, index) => {
                    const maxAmount = Math.max(...analytics.monthlyRevenue.map(m => m.amount));
                    const percentage = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-gray-600">
                          {new Date(month.month).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              ₱{month.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {month.count} transactions
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Receipt className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Partial Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.summary.partialPayments}</p>
                    <p className="text-xs text-gray-500">
                      {getPercentage(analytics.summary.partialPayments, analytics.summary.totalPayments)}% of total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-50">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Paid Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.summary.paidPayments}</p>
                    <p className="text-xs text-gray-500">
                      {getPercentage(analytics.summary.paidPayments, analytics.summary.totalPayments)}% success rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.summary.pendingPayments}</p>
                    <p className="text-xs text-gray-500">
                      {getPercentage(analytics.summary.pendingPayments, analytics.summary.totalPayments)}% pending
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Transaction</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₱{analytics.summary.totalPayments > 0 
                        ? Math.round(analytics.summary.totalAmount / analytics.summary.totalPayments).toLocaleString()
                        : '0'
                      }
                    </p>
                    <p className="text-xs text-gray-500">Per transaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transaction data available</h3>
          <p className="text-gray-600">Transaction analytics will appear here once payments are recorded.</p>
        </div>
      )}
    </div>
  );
};

export default Transactions;
