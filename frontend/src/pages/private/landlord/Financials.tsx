import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Trash2,
  Building2,
  AlertCircle,
  BarChart3,
  LineChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getFinancialOverview,
  getFinancialAnalytics,
  getIncomeRecords,
  getExpenseRecords,
  addIncome,
  addExpense,
  deleteIncomeRecord,
  deleteExpenseRecord,
  type FinancialOverview,
  type FinancialAnalytics,
  type IncomeRecord,
  type ExpenseRecord,
  type AddIncomeRequest,
  type AddExpenseRequest,
} from "@/api/landlordFinancialApi";
import { getLandlordPropertiesRequest } from "@/api/landlordPropertyApi";

const Financials = () => {
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedAnalyticsPeriod, setSelectedAnalyticsPeriod] = useState("year");
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newIncome, setNewIncome] = useState<AddIncomeRequest>({
    propertyId: "",
    amount: 0,
    description: "",
  });
  const [newExpense, setNewExpense] = useState<AddExpenseRequest>({
    propertyId: "",
    amount: 0,
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedAnalyticsPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewData, analyticsData, incomeData, expenseData, propertiesData] = await Promise.all([
        getFinancialOverview(selectedPeriod),
        getFinancialAnalytics(selectedAnalyticsPeriod),
        getIncomeRecords(),
        getExpenseRecords(),
        getLandlordPropertiesRequest(),
      ]);

      setOverview(overviewData);
      setAnalytics(analyticsData);
      setIncomeRecords(incomeData.incomeRecords || []);
      setExpenseRecords(expenseData.expenseRecords || []);
      console.log("Properties data:", propertiesData); // Debug log
      setProperties(propertiesData || []);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Failed to fetch financial data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async () => {
    try {
      await addIncome(newIncome);
      toast.success("Income record added successfully");
      setShowAddIncome(false);
      setNewIncome({ propertyId: "", amount: 0, description: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding income:", error);
      toast.error("Failed to add income record");
    }
  };

  const handleAddExpense = async () => {
    try {
      await addExpense(newExpense);
      toast.success("Expense record added successfully");
      setShowAddExpense(false);
      setNewExpense({ propertyId: "", amount: 0, description: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense record");
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    try {
      await deleteIncomeRecord(incomeId);
      toast.success("Income record deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error("Failed to delete income record");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpenseRecord(expenseId);
      toast.success("Expense record deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense record");
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your revenue and expenses</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your revenue and expenses</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(overview.overview.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    From rent payments
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
                  <p className="text-sm font-medium text-gray-600">Additional Income</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(overview.overview.additionalIncome)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Other income sources
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(overview.overview.totalExpenses)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Property expenses
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
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
                    overview.overview.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(overview.overview.netIncome)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {overview.overview.profitMargin.toFixed(1)}% margin
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  overview.overview.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <BarChart3 className={`h-6 w-6 ${
                    overview.overview.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Payments Alert */}
      {overview && overview.overview.totalPendingAmount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {formatCurrency(overview.overview.totalPendingAmount)} in pending payments
                </p>
                <p className="text-sm text-yellow-700">
                  {overview.pendingPayments.length} payments awaiting confirmation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Property */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Revenue by Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview && overview.revenueByProperty.length > 0 ? (
              <div className="space-y-4">
                {overview.revenueByProperty.map((property) => (
                  <div key={property.propertyId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{property.propertyTitle}</p>
                      <p className="text-sm text-gray-600">{property.paymentCount} payments</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(property.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Revenue Data</h3>
                <p className="text-gray-600">Revenue from properties will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={showAddIncome} onOpenChange={setShowAddIncome}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Income
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Income Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="income-property">Property</Label>
                    <Select value={newIncome.propertyId} onValueChange={(value) => setNewIncome({...newIncome, propertyId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.length > 0 ? (
                          properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-properties" disabled>
                            No properties available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="income-amount">Amount</Label>
                    <Input
                      id="income-amount"
                      type="number"
                      value={newIncome.amount}
                      onChange={(e) => setNewIncome({...newIncome, amount: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="income-description">Description</Label>
                    <Textarea
                      id="income-description"
                      value={newIncome.description}
                      onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
                      placeholder="e.g., Late fee, Additional service"
                    />
                  </div>
                  <Button onClick={handleAddIncome} className="w-full">
                    Add Income
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Expense Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="expense-property">Property</Label>
                    <Select value={newExpense.propertyId} onValueChange={(value) => setNewExpense({...newExpense, propertyId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.length > 0 ? (
                          properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-properties" disabled>
                            No properties available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expense-amount">Amount</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expense-description">Description</Label>
                    <Textarea
                      id="expense-description"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      placeholder="e.g., Maintenance, Utilities, Insurance"
                    />
                  </div>
                  <Button onClick={handleAddExpense} className="w-full">
                    Add Expense
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Income */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeRecords.length > 0 ? (
              <div className="space-y-3">
                {incomeRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{record.description}</p>
                      <p className="text-sm text-gray-600">{record.property.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600">{formatCurrency(record.amount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIncome(record.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Income Records</h3>
                <p className="text-gray-600">Add income records to track additional revenue</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseRecords.length > 0 ? (
              <div className="space-y-3">
                {expenseRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{record.description}</p>
                      <p className="text-sm text-gray-600">{record.property.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">{formatCurrency(record.amount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpense(record.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Expense Records</h3>
                <p className="text-gray-600">Add expense records to track property costs</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Financial Trends
              </CardTitle>
              <Select value={selectedAnalyticsPeriod} onValueChange={setSelectedAnalyticsPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Revenue Trend</h4>
                {analytics.revenueTrend.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.revenueTrend.slice(-5).map((trend) => (
                      <div key={trend.period} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{trend.period}</span>
                        <span className="font-medium text-green-600">{formatCurrency(trend.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No revenue data available</p>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Expense Trend</h4>
                {analytics.expenseTrend.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.expenseTrend.slice(-5).map((trend) => (
                      <div key={trend.period} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{trend.period}</span>
                        <span className="font-medium text-red-600">{formatCurrency(trend.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No expense data available</p>
                )}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Revenue Growth</p>
                  <p className={`text-xl font-bold ${
                    analytics.growthRates.revenue >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.growthRates.revenue >= 0 ? '+' : ''}{analytics.growthRates.revenue.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Expense Growth</p>
                  <p className={`text-xl font-bold ${
                    analytics.growthRates.expenses >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {analytics.growthRates.expenses >= 0 ? '+' : ''}{analytics.growthRates.expenses.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Financials;
