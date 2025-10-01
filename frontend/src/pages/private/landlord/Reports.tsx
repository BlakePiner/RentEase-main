import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Download,
  Filter,
  PieChart,
  LineChart,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Home,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  getPropertyPerformanceReport,
  getFinancialTrendsReport,
  getTenantAnalyticsReport,
  getOccupancyAnalyticsReport,
  type PropertyPerformanceReport,
  type FinancialTrendsReport,
  type TenantAnalyticsReport,
  type OccupancyAnalyticsReport,
} from "@/api/landlordReportsApi";

const Reports = () => {
  const [propertyReport, setPropertyReport] = useState<PropertyPerformanceReport | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialTrendsReport | null>(null);
  const [tenantReport, setTenantReport] = useState<TenantAnalyticsReport | null>(null);
  const [occupancyReport, setOccupancyReport] = useState<OccupancyAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("year");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [propertyData, financialData, tenantData, occupancyData] = await Promise.all([
        getPropertyPerformanceReport(selectedPeriod),
        getFinancialTrendsReport(selectedPeriod),
        getTenantAnalyticsReport(),
        getOccupancyAnalyticsReport(selectedPeriod),
      ]);

      setPropertyReport(propertyData);
      setFinancialReport(financialData);
      setTenantReport(tenantData);
      setOccupancyReport(occupancyData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports data");
    } finally {
      setLoading(false);
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
      month: "short",
      day: "numeric",
    });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into your property portfolio</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your property portfolio</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "financial", label: "Financial", icon: DollarSign },
          { id: "tenants", label: "Tenants", icon: Users },
          { id: "occupancy", label: "Occupancy", icon: Building2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && propertyReport && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {propertyReport.overallMetrics.totalProperties}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {propertyReport.overallMetrics.totalUnits} total units
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {propertyReport.overallMetrics.overallOccupancyRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {propertyReport.overallMetrics.totalOccupiedUnits} occupied
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(propertyReport.overallMetrics.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedPeriod} period
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Income</p>
                    <p className={`text-2xl font-bold ${
                      propertyReport.overallMetrics.totalNetIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(propertyReport.overallMetrics.totalNetIncome)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {propertyReport.overallMetrics.averageROI}% avg ROI
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    propertyReport.overallMetrics.totalNetIncome >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <TrendingUp className={`h-6 w-6 ${
                      propertyReport.overallMetrics.totalNetIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Property Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Property</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Occupancy</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Revenue</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Expenses</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Net Income</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyReport.propertyPerformance.map((property) => (
                      <tr key={property.propertyId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{property.propertyTitle}</p>
                            <p className="text-sm text-gray-600">{property.address}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {property.propertyType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{property.occupancyRate}%</p>
                            <p className="text-sm text-gray-600">
                              {property.occupiedUnits}/{property.totalUnits} units
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-green-600">
                            {formatCurrency(property.totalRevenue)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-red-600">
                            {formatCurrency(property.totalExpenses)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className={`font-medium ${
                            property.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(property.netIncome)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className={`font-medium ${
                            property.roi >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {property.roi}%
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === "financial" && financialReport && (
        <div className="space-y-6">
          {/* Financial Trends Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialReport.trends.revenue.map((trend) => (
                    <div key={trend.period} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{trend.period}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((trend.amount / Math.max(...financialReport.trends.revenue.map(t => t.amount))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="font-medium text-green-600 w-20 text-right">
                          {formatCurrency(trend.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <span className={`font-medium ${
                      financialReport.growthRates.revenue >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {financialReport.growthRates.revenue >= 0 ? '+' : ''}{financialReport.growthRates.revenue}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Expense Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialReport.trends.expenses.map((trend) => (
                    <div key={trend.period} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{trend.period}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((trend.amount / Math.max(...financialReport.trends.expenses.map(t => t.amount))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="font-medium text-red-600 w-20 text-right">
                          {formatCurrency(trend.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <span className={`font-medium ${
                      financialReport.growthRates.expenses >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {financialReport.growthRates.expenses >= 0 ? '+' : ''}{financialReport.growthRates.expenses}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Net Income Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Net Income Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialReport.trends.netIncome.map((trend) => (
                  <div key={trend.period} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{trend.period}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            trend.amount >= 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(Math.abs(trend.amount) / Math.max(...financialReport.trends.netIncome.map(t => Math.abs(t.amount))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className={`font-medium w-20 text-right ${
                        trend.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(trend.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tenants Tab */}
      {activeTab === "tenants" && tenantReport && (
        <div className="space-y-6">
          {/* Tenant Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tenantReport.totalTenants}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Active leases
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Reliability</p>
                    <p className="text-2xl font-bold text-green-600">
                      {tenantReport.paymentReliability}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      On-time payments
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {tenantReport.paymentSuccessRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Paid vs pending
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Maintenance</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {tenantReport.averageMetrics.maintenanceRequests}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requests per tenant
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(tenantReport.riskDistribution).map(([risk, count]) => (
                    <div key={risk} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          risk === 'low' ? 'bg-green-500' : 
                          risk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">{risk} Risk</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              risk === 'low' ? 'bg-green-500' : 
                              risk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${(count / tenantReport.totalTenants) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Payment Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Payments</span>
                    <span className="font-medium text-gray-900">{tenantReport.totalPayments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paid Payments</span>
                    <span className="font-medium text-green-600">{tenantReport.paidPayments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">On-time Payments</span>
                    <span className="font-medium text-green-600">{tenantReport.onTimePayments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Late Payments</span>
                    <span className="font-medium text-red-600">{tenantReport.latePayments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tenant Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tenant Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Tenant</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Property</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Reliability</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Maintenance</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantReport.tenantDetails.slice(0, 10).map((tenant) => (
                      <tr key={tenant.tenantId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{tenant.tenantName}</p>
                            <p className="text-sm text-gray-600">{tenant.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{tenant.propertyTitle}</p>
                            <p className="text-sm text-gray-600">{tenant.unitLabel}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">
                            {Math.round(tenant.paymentReliability * 100)}%
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">
                            {tenant.maintenanceRequestsCount}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRiskColor(tenant.riskLevel)}`}
                          >
                            {tenant.riskLevel}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Occupancy Tab */}
      {activeTab === "occupancy" && occupancyReport && (
        <div className="space-y-6">
          {/* Occupancy Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Units</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {occupancyReport.overallMetrics.totalUnits}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Across all properties
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Occupied Units</p>
                    <p className="text-2xl font-bold text-green-600">
                      {occupancyReport.overallMetrics.currentlyOccupied}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Currently rented
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Units</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {occupancyReport.overallMetrics.currentlyAvailable}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ready to rent
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {occupancyReport.overallMetrics.overallOccupancyRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Overall rate
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Occupancy by Property Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Occupancy by Property Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(occupancyReport.occupancyByType).map(([type, data]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{type}</span>
                        <span className="text-sm text-gray-600">{data.occupancyRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${data.occupancyRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {data.occupied}/{data.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Average Rent by Property Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(occupancyReport.averageRentByType).map(([type, rent]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{type}</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(rent)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
