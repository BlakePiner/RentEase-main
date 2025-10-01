import prisma from "../../libs/prismaClient.js";

// ---------------------------------------------- GET FINANCIAL OVERVIEW ----------------------------------------------
export const getFinancialOverview = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { period = 'month' } = req.query; // week, month, quarter, year

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all properties for the landlord
    const properties = await prisma.property.findMany({
      where: { ownerId },
      select: { id: true, title: true }
    });

    const propertyIds = properties.map(p => p.id);

    // Get revenue from payments (rent payments)
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
      include: {
        lease: {
          select: {
            id: true,
            leaseNickname: true,
            rentAmount: true,
            interval: true,
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
            }
          }
        }
      }
    });

    // Get additional income records
    const additionalIncome = await prisma.income.findMany({
      where: {
        propertyId: { in: propertyIds },
        date: { gte: startDate }
      },
      include: {
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
      include: {
        property: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Calculate totals
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const additionalIncomeTotal = additionalIncome.reduce((sum, income) => sum + income.amount, 0);
    const totalIncome = totalRevenue + additionalIncomeTotal;
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    // Calculate revenue by property
    const revenueByProperty = {};
    payments.forEach(payment => {
      const propertyId = payment.lease.unit.property.id;
      const propertyTitle = payment.lease.unit.property.title;
      if (!revenueByProperty[propertyId]) {
        revenueByProperty[propertyId] = {
          propertyId,
          propertyTitle,
          revenue: 0,
          paymentCount: 0
        };
      }
      revenueByProperty[propertyId].revenue += payment.amount;
      revenueByProperty[propertyId].paymentCount += 1;
    });

    // Calculate expenses by property
    const expensesByProperty = {};
    expenses.forEach(expense => {
      const propertyId = expense.property.id;
      const propertyTitle = expense.property.title;
      if (!expensesByProperty[propertyId]) {
        expensesByProperty[propertyId] = {
          propertyId,
          propertyTitle,
          expenses: 0,
          expenseCount: 0
        };
      }
      expensesByProperty[propertyId].expenses += expense.amount;
      expensesByProperty[propertyId].expenseCount += 1;
    });

    // Get pending payments (money that should be coming in)
    const pendingPayments = await prisma.payment.findMany({
      where: {
        lease: {
          unit: {
            property: {
              ownerId: ownerId
            }
          }
        },
        status: 'PENDING'
      },
      include: {
        lease: {
          select: {
            id: true,
            leaseNickname: true,
            rentAmount: true,
            unit: {
              select: {
                label: true,
                property: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const totalPendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate profit margin
    const profitMargin = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

    return res.json({
      overview: {
        totalRevenue,
        additionalIncome: additionalIncomeTotal,
        totalIncome,
        totalExpenses,
        netIncome,
        totalPendingAmount,
        profitMargin: Math.round(profitMargin * 100) / 100,
        period,
        startDate,
        endDate: now
      },
      revenueByProperty: Object.values(revenueByProperty),
      expensesByProperty: Object.values(expensesByProperty),
      recentPayments: payments.slice(0, 10).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paidAt: payment.paidAt,
        method: payment.method,
        lease: {
          nickname: payment.lease.leaseNickname,
          unit: payment.lease.unit.label,
          property: payment.lease.unit.property.title
        }
      })),
      recentExpenses: expenses.slice(0, 10).map(expense => ({
        id: expense.id,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        property: {
          title: expense.property.title
        }
      })),
      pendingPayments: pendingPayments.slice(0, 10).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        createdAt: payment.createdAt,
        lease: {
          nickname: payment.lease.leaseNickname,
          unit: payment.lease.unit.label,
          property: payment.lease.unit.property.title
        }
      }))
    });
  } catch (error) {
    console.error("Error fetching financial overview:", error);
    return res.status(500).json({ message: "Failed to fetch financial overview" });
  }
};

// ---------------------------------------------- GET FINANCIAL ANALYTICS ----------------------------------------------
export const getFinancialAnalytics = async (req, res) => {
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

    // Get properties
    const properties = await prisma.property.findMany({
      where: { ownerId },
      select: { id: true, title: true }
    });

    const propertyIds = properties.map(p => p.id);

    // Get payments for trend analysis
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

    // Get expenses for trend analysis
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

    payments.forEach(payment => {
      const date = new Date(payment.paidAt);
      let key;
      
      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'quarter') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      } else {
        key = date.getFullYear().toString();
      }

      if (!revenueTrend[key]) {
        revenueTrend[key] = 0;
      }
      revenueTrend[key] += payment.amount;
    });

    expenses.forEach(expense => {
      const date = new Date(expense.date);
      let key;
      
      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'quarter') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      } else {
        key = date.getFullYear().toString();
      }

      if (!expenseTrend[key]) {
        expenseTrend[key] = 0;
      }
      expenseTrend[key] += expense.amount;
    });

    // Convert to arrays for charting
    const revenueTrendData = Object.entries(revenueTrend)
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const expenseTrendData = Object.entries(expenseTrend)
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate growth rates
    const calculateGrowthRate = (data) => {
      if (data.length < 2) return 0;
      const latest = data[data.length - 1].amount;
      const previous = data[data.length - 2].amount;
      return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
    };

    const revenueGrowthRate = calculateGrowthRate(revenueTrendData);
    const expenseGrowthRate = calculateGrowthRate(expenseTrendData);

    return res.json({
      period,
      groupBy,
      revenueTrend: revenueTrendData,
      expenseTrend: expenseTrendData,
      growthRates: {
        revenue: Math.round(revenueGrowthRate * 100) / 100,
        expenses: Math.round(expenseGrowthRate * 100) / 100
      }
    });
  } catch (error) {
    console.error("Error fetching financial analytics:", error);
    return res.status(500).json({ message: "Failed to fetch financial analytics" });
  }
};

// ---------------------------------------------- ADD INCOME RECORD ----------------------------------------------
export const addIncome = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { propertyId, unitId, amount, description, date } = req.body;

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: ownerId
      }
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found or not owned by you" });
    }

    // Verify unit belongs to property if unitId is provided
    if (unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          id: unitId,
          propertyId: propertyId
        }
      });

      if (!unit) {
        return res.status(404).json({ message: "Unit not found or does not belong to property" });
      }
    }

    const income = await prisma.income.create({
      data: {
        propertyId,
        unitId: unitId || null,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date()
      },
      include: {
        property: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return res.status(201).json({
      message: "Income record added successfully",
      income
    });
  } catch (error) {
    console.error("Error adding income record:", error);
    return res.status(500).json({ message: "Failed to add income record" });
  }
};

// ---------------------------------------------- ADD EXPENSE RECORD ----------------------------------------------
export const addExpense = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { propertyId, unitId, amount, description, date } = req.body;

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: ownerId
      }
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found or not owned by you" });
    }

    // Verify unit belongs to property if unitId is provided
    if (unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          id: unitId,
          propertyId: propertyId
        }
      });

      if (!unit) {
        return res.status(404).json({ message: "Unit not found or does not belong to property" });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        propertyId,
        unitId: unitId || null,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date()
      },
      include: {
        property: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return res.status(201).json({
      message: "Expense record added successfully",
      expense
    });
  } catch (error) {
    console.error("Error adding expense record:", error);
    return res.status(500).json({ message: "Failed to add expense record" });
  }
};

// ---------------------------------------------- GET INCOME RECORDS ----------------------------------------------
export const getIncomeRecords = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { propertyId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get properties
    const properties = await prisma.property.findMany({
      where: { ownerId },
      select: { id: true }
    });

    const propertyIds = properties.map(p => p.id);

    const whereClause = {
      propertyId: { in: propertyIds }
    };

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    const [incomeRecords, totalCount] = await Promise.all([
      prisma.income.findMany({
        where: whereClause,
        include: {
          property: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.income.count({ where: whereClause })
    ]);

    return res.json({
      incomeRecords,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching income records:", error);
    return res.status(500).json({ message: "Failed to fetch income records" });
  }
};

// ---------------------------------------------- GET EXPENSE RECORDS ----------------------------------------------
export const getExpenseRecords = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { propertyId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get properties
    const properties = await prisma.property.findMany({
      where: { ownerId },
      select: { id: true }
    });

    const propertyIds = properties.map(p => p.id);

    const whereClause = {
      propertyId: { in: propertyIds }
    };

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    const [expenseRecords, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        include: {
          property: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.expense.count({ where: whereClause })
    ]);

    return res.json({
      expenseRecords,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching expense records:", error);
    return res.status(500).json({ message: "Failed to fetch expense records" });
  }
};

// ---------------------------------------------- DELETE INCOME RECORD ----------------------------------------------
export const deleteIncomeRecord = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { incomeId } = req.params;

    // Verify ownership through property
    const income = await prisma.income.findFirst({
      where: {
        id: incomeId,
        property: {
          ownerId: ownerId
        }
      }
    });

    if (!income) {
      return res.status(404).json({ message: "Income record not found or not owned by you" });
    }

    await prisma.income.delete({
      where: { id: incomeId }
    });

    return res.json({ message: "Income record deleted successfully" });
  } catch (error) {
    console.error("Error deleting income record:", error);
    return res.status(500).json({ message: "Failed to delete income record" });
  }
};

// ---------------------------------------------- DELETE EXPENSE RECORD ----------------------------------------------
export const deleteExpenseRecord = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { expenseId } = req.params;

    // Verify ownership through property
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        property: {
          ownerId: ownerId
        }
      }
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense record not found or not owned by you" });
    }

    await prisma.expense.delete({
      where: { id: expenseId }
    });

    return res.json({ message: "Expense record deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense record:", error);
    return res.status(500).json({ message: "Failed to delete expense record" });
  }
};
