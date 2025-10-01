import prisma from "../../libs/prismaClient.js";

// ---------------------------------------------- GET PROPERTY PERFORMANCE REPORTS ----------------------------------------------
export const getPropertyPerformanceReport = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { period = 'year' } = req.query; // month, quarter, year

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Last 12 months
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear() - 3, 0, 1); // Last 4 quarters
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 4, 0, 1); // Last 5 years
        break;
      default:
        startDate = new Date(now.getFullYear() - 4, 0, 1);
    }

    // Get properties with their performance data
    const properties = await prisma.property.findMany({
      where: { ownerId },
      include: {
        Unit: {
          include: {
            Lease: {
              where: {
                status: 'ACTIVE'
              },
              include: {
                payments: {
                  where: {
                    status: 'PAID',
                    paidAt: {
                      gte: startDate
                    }
                  }
                }
              }
            }
          }
        },
        Income: {
          where: {
            date: {
              gte: startDate
            }
          }
        },
        Expense: {
          where: {
            date: {
              gte: startDate
            }
          }
        }
      }
    });

    // Calculate performance metrics for each property
    const propertyPerformance = properties.map(property => {
      const totalUnits = property.Unit.length;
      const occupiedUnits = property.Unit.filter(unit => 
        unit.Lease.some(lease => lease.status === 'ACTIVE')
      ).length;
      
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      
      // Calculate revenue from payments
      const paymentRevenue = property.Unit.reduce((sum, unit) => {
        return sum + unit.Lease.reduce((leaseSum, lease) => {
          return leaseSum + lease.payments.reduce((paymentSum, payment) => {
            return paymentSum + payment.amount;
          }, 0);
        }, 0);
      }, 0);
      
      // Calculate additional income
      const additionalIncome = property.Income.reduce((sum, income) => sum + income.amount, 0);
      
      // Calculate total revenue
      const totalRevenue = paymentRevenue + additionalIncome;
      
      // Calculate expenses
      const totalExpenses = property.Expense.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate net income
      const netIncome = totalRevenue - totalExpenses;
      
      // Calculate ROI (assuming property value is estimated)
      const estimatedPropertyValue = totalUnits * 500000; // Rough estimate
      const roi = estimatedPropertyValue > 0 ? (netIncome / estimatedPropertyValue) * 100 : 0;

      return {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyType: property.type,
        totalUnits,
        occupiedUnits,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        totalRevenue,
        totalExpenses,
        netIncome,
        roi: Math.round(roi * 100) / 100,
        address: `${property.street}, ${property.barangay}`,
        city: property.city?.name || property.municipality?.name || 'Unknown'
      };
    });

    // Calculate overall metrics
    const totalProperties = properties.length;
    const totalUnits = properties.reduce((sum, p) => sum + p.Unit.length, 0);
    const totalOccupiedUnits = properties.reduce((sum, p) => {
      return sum + p.Unit.filter(unit => 
        unit.Lease.some(lease => lease.status === 'ACTIVE')
      ).length;
    }, 0);
    
    const overallOccupancyRate = totalUnits > 0 ? (totalOccupiedUnits / totalUnits) * 100 : 0;
    const totalRevenue = propertyPerformance.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalExpenses = propertyPerformance.reduce((sum, p) => sum + p.totalExpenses, 0);
    const totalNetIncome = totalRevenue - totalExpenses;

    return res.json({
      period,
      startDate,
      endDate: now,
      overallMetrics: {
        totalProperties,
        totalUnits,
        totalOccupiedUnits,
        overallOccupancyRate: Math.round(overallOccupancyRate * 100) / 100,
        totalRevenue,
        totalExpenses,
        totalNetIncome,
        averageROI: totalProperties > 0 ? 
          Math.round((propertyPerformance.reduce((sum, p) => sum + p.roi, 0) / totalProperties) * 100) / 100 : 0
      },
      propertyPerformance: propertyPerformance.sort((a, b) => b.netIncome - a.netIncome)
    });
  } catch (error) {
    console.error("Error fetching property performance report:", error);
    return res.status(500).json({ message: "Failed to fetch property performance report" });
  }
};

// ---------------------------------------------- GET FINANCIAL TRENDS REPORT ----------------------------------------------
export const getFinancialTrendsReport = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { period = 'year' } = req.query; // month, quarter, year

    // Calculate date range
    const now = new Date();
    let startDate;
    let groupBy;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Last 12 months
        groupBy = 'month';
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear() - 3, 0, 1); // Last 4 quarters
        groupBy = 'quarter';
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 4, 0, 1); // Last 5 years
        groupBy = 'year';
        break;
      default:
        startDate = new Date(now.getFullYear() - 4, 0, 1);
        groupBy = 'year';
    }

    // Get all payments for the landlord
    const payments = await prisma.payment.findMany({
      where: {
        lease: {
          unit: {
            property: {
              ownerId: ownerId
            }
          }
        },
        status: 'PAID',
        paidAt: {
          gte: startDate
        }
      },
      select: {
        amount: true,
        paidAt: true,
        lease: {
          select: {
            unit: {
              select: {
                property: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Get properties for additional income and expenses
    const properties = await prisma.property.findMany({
      where: { ownerId },
      select: { id: true }
    });

    const propertyIds = properties.map(p => p.id);

    // Get additional income
    const additionalIncome = await prisma.income.findMany({
      where: {
        propertyId: { in: propertyIds },
        date: { gte: startDate }
      },
      select: {
        amount: true,
        date: true,
        property: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: {
        propertyId: { in: propertyIds },
        date: { gte: startDate }
      },
      select: {
        amount: true,
        date: true,
        property: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Group data by time period
    const revenueTrend = {};
    const expenseTrend = {};
    const netIncomeTrend = {};

    // Process payments
    payments.forEach(payment => {
      const date = new Date(payment.paidAt);
      let key = getTimeKey(date, groupBy);

      if (!revenueTrend[key]) {
        revenueTrend[key] = 0;
      }
      revenueTrend[key] += payment.amount;
    });

    // Process additional income
    additionalIncome.forEach(income => {
      const date = new Date(income.date);
      let key = getTimeKey(date, groupBy);

      if (!revenueTrend[key]) {
        revenueTrend[key] = 0;
      }
      revenueTrend[key] += income.amount;
    });

    // Process expenses
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      let key = getTimeKey(date, groupBy);

      if (!expenseTrend[key]) {
        expenseTrend[key] = 0;
      }
      expenseTrend[key] += expense.amount;
    });

    // Calculate net income for each period
    Object.keys(revenueTrend).forEach(key => {
      const revenue = revenueTrend[key] || 0;
      const expense = expenseTrend[key] || 0;
      netIncomeTrend[key] = revenue - expense;
    });

    // Convert to arrays for charting
    const revenueData = Object.entries(revenueTrend)
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const expenseData = Object.entries(expenseTrend)
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const netIncomeData = Object.entries(netIncomeTrend)
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate growth rates
    const revenueGrowth = calculateGrowthRate(revenueData);
    const expenseGrowth = calculateGrowthRate(expenseData);
    const netIncomeGrowth = calculateGrowthRate(netIncomeData);

    return res.json({
      period,
      groupBy,
      startDate,
      endDate: now,
      trends: {
        revenue: revenueData,
        expenses: expenseData,
        netIncome: netIncomeData
      },
      growthRates: {
        revenue: Math.round(revenueGrowth * 100) / 100,
        expenses: Math.round(expenseGrowth * 100) / 100,
        netIncome: Math.round(netIncomeGrowth * 100) / 100
      }
    });
  } catch (error) {
    console.error("Error fetching financial trends report:", error);
    return res.status(500).json({ message: "Failed to fetch financial trends report" });
  }
};

// ---------------------------------------------- GET TENANT ANALYTICS REPORT ----------------------------------------------
export const getTenantAnalyticsReport = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Get all active leases for the landlord
    const leases = await prisma.lease.findMany({
      where: {
        unit: {
          property: {
            ownerId: ownerId
          }
        },
        status: 'ACTIVE'
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            createdAt: true
          }
        },
        unit: {
          select: {
            id: true,
            label: true,
            property: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        payments: {
          select: {
            amount: true,
            status: true,
            timingStatus: true,
            paidAt: true,
            createdAt: true
          }
        },
        TenantBehaviorAnalysis: {
          select: {
            paymentReliability: true,
            maintenanceRequestsCount: true,
            aiRiskScore: true,
            riskLevel: true,
            aiSummary: true
          }
        }
      }
    });

    // Calculate tenant metrics
    const totalTenants = leases.length;
    const totalPayments = leases.reduce((sum, lease) => sum + lease.payments.length, 0);
    const paidPayments = leases.reduce((sum, lease) => 
      sum + lease.payments.filter(p => p.status === 'PAID').length, 0
    );
    const onTimePayments = leases.reduce((sum, lease) => 
      sum + lease.payments.filter(p => p.timingStatus === 'ONTIME').length, 0
    );
    const latePayments = leases.reduce((sum, lease) => 
      sum + lease.payments.filter(p => p.timingStatus === 'LATE').length, 0
    );

    const paymentReliability = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;
    const paymentSuccessRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

    // Calculate risk distribution
    const riskDistribution = {
      low: 0,
      medium: 0,
      high: 0
    };

    leases.forEach(lease => {
      if (lease.TenantBehaviorAnalysis.length > 0) {
        const analysis = lease.TenantBehaviorAnalysis[0];
        if (analysis.riskLevel) {
          riskDistribution[analysis.riskLevel.toLowerCase()]++;
        }
      } else {
        // Default to medium risk if no analysis
        riskDistribution.medium++;
      }
    });

    // Calculate average metrics
    const avgPaymentReliability = leases.reduce((sum, lease) => {
      if (lease.TenantBehaviorAnalysis.length > 0) {
        return sum + (lease.TenantBehaviorAnalysis[0].paymentReliability || 0);
      }
      return sum;
    }, 0) / totalTenants;

    const avgMaintenanceRequests = leases.reduce((sum, lease) => {
      if (lease.TenantBehaviorAnalysis.length > 0) {
        return sum + (lease.TenantBehaviorAnalysis[0].maintenanceRequestsCount || 0);
      }
      return sum;
    }, 0) / totalTenants;

    // Get tenant details for the list
    const tenantDetails = leases.map(lease => {
      const analysis = lease.TenantBehaviorAnalysis[0] || {};
      const recentPayments = lease.payments.slice(-3); // Last 3 payments
      
      return {
        tenantId: lease.tenant.id,
        tenantName: `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim(),
        email: lease.tenant.email,
        phoneNumber: lease.tenant.phoneNumber,
        propertyTitle: lease.unit.property.title,
        unitLabel: lease.unit.label,
        leaseStartDate: lease.startDate,
        paymentReliability: analysis.paymentReliability || 0,
        maintenanceRequestsCount: analysis.maintenanceRequestsCount || 0,
        riskLevel: analysis.riskLevel || 'MEDIUM',
        aiRiskScore: analysis.aiRiskScore || 0,
        aiSummary: analysis.aiSummary || 'No analysis available',
        recentPayments: recentPayments.map(p => ({
          amount: p.amount,
          status: p.status,
          timingStatus: p.timingStatus,
          paidAt: p.paidAt
        }))
      };
    });

    return res.json({
      totalTenants,
      totalPayments,
      paidPayments,
      onTimePayments,
      latePayments,
      paymentReliability: Math.round(paymentReliability * 100) / 100,
      paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
      riskDistribution,
      averageMetrics: {
        paymentReliability: Math.round(avgPaymentReliability * 100) / 100,
        maintenanceRequests: Math.round(avgMaintenanceRequests * 100) / 100
      },
      tenantDetails: tenantDetails.sort((a, b) => b.paymentReliability - a.paymentReliability)
    });
  } catch (error) {
    console.error("Error fetching tenant analytics report:", error);
    return res.status(500).json({ message: "Failed to fetch tenant analytics report" });
  }
};

// ---------------------------------------------- GET OCCUPANCY ANALYTICS REPORT ----------------------------------------------
export const getOccupancyAnalyticsReport = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { period = 'year' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear() - 3, 0, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 4, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear() - 4, 0, 1);
    }

    // Get all units with their lease history
    const units = await prisma.unit.findMany({
      where: {
        property: {
          ownerId: ownerId
        }
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            type: true
          }
        },
        Lease: {
          where: {
            startDate: {
              gte: startDate
            }
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            rentAmount: true
          }
        }
      }
    });

    // Calculate occupancy metrics
    const totalUnits = units.length;
    const currentlyOccupied = units.filter(unit => 
      unit.Lease.some(lease => lease.status === 'ACTIVE')
    ).length;
    
    const currentlyAvailable = units.filter(unit => 
      !unit.Lease.some(lease => lease.status === 'ACTIVE')
    ).length;

    const overallOccupancyRate = totalUnits > 0 ? (currentlyOccupied / totalUnits) * 100 : 0;

    // Calculate occupancy by property type
    const occupancyByType = {};
    units.forEach(unit => {
      const type = unit.property.type;
      if (!occupancyByType[type]) {
        occupancyByType[type] = {
          total: 0,
          occupied: 0,
          available: 0
        };
      }
      
      occupancyByType[type].total++;
      if (unit.Lease.some(lease => lease.status === 'ACTIVE')) {
        occupancyByType[type].occupied++;
      } else {
        occupancyByType[type].available++;
      }
    });

    // Calculate occupancy rates by type
    Object.keys(occupancyByType).forEach(type => {
      const data = occupancyByType[type];
      data.occupancyRate = data.total > 0 ? (data.occupied / data.total) * 100 : 0;
    });

    // Calculate average rent by property type
    const averageRentByType = {};
    Object.keys(occupancyByType).forEach(type => {
      const typeUnits = units.filter(unit => unit.property.type === type);
      const activeLeases = typeUnits.flatMap(unit => 
        unit.Lease.filter(lease => lease.status === 'ACTIVE')
      );
      
      if (activeLeases.length > 0) {
        const totalRent = activeLeases.reduce((sum, lease) => sum + lease.rentAmount, 0);
        averageRentByType[type] = totalRent / activeLeases.length;
      } else {
        averageRentByType[type] = 0;
      }
    });

    return res.json({
      period,
      startDate,
      endDate: now,
      overallMetrics: {
        totalUnits,
        currentlyOccupied,
        currentlyAvailable,
        overallOccupancyRate: Math.round(overallOccupancyRate * 100) / 100
      },
      occupancyByType,
      averageRentByType
    });
  } catch (error) {
    console.error("Error fetching occupancy analytics report:", error);
    return res.status(500).json({ message: "Failed to fetch occupancy analytics report" });
  }
};

// Helper function to get time key based on groupBy
function getTimeKey(date, groupBy) {
  if (groupBy === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  } else if (groupBy === 'quarter') {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${date.getFullYear()}-Q${quarter}`;
  } else {
    return date.getFullYear().toString();
  }
}

// Helper function to calculate growth rate
function calculateGrowthRate(data) {
  if (data.length < 2) return 0;
  const latest = data[data.length - 1].amount;
  const previous = data[data.length - 2].amount;
  return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
}
