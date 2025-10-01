// file: tenantController.js
import prisma from "../../libs/prismaClient.js";

// ---------------------------------------------- GET ALL TENANTS FOR LANDLORD ----------------------------------------------
export const getLandlordTenants = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Get all tenants who have leases with properties owned by this landlord
    const tenants = await prisma.user.findMany({
      where: {
        role: "TENANT",
        isDisabled: false,
        Lease: {
          some: {
            unit: {
              property: {
                ownerId: ownerId
              }
            }
          }
        }
      },
      include: {
        Lease: {
          where: {
            unit: {
              property: {
                ownerId: ownerId
              }
            }
          },
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    address: true,
                  }
                }
              }
            },
            payments: {
              orderBy: { dueDate: "desc" },
              take: 5
            },
            TenantBehaviorAnalysis: true
          }
        },
        maintenanceRequests: {
          where: {
            property: {
              ownerId: ownerId
            }
          },
          orderBy: { createdAt: "desc" },
          take: 3
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Format the response with behavior analysis
    const formattedTenants = tenants.map((tenant) => {
      const activeLease = tenant.Lease.find(lease => lease.status === "ACTIVE");
      const behaviorAnalysis = activeLease?.TenantBehaviorAnalysis?.[0];
      
      // Calculate payment reliability
      const allPayments = tenant.Lease.flatMap(lease => lease.payments);
      const totalPayments = allPayments.length;
      const onTimePayments = allPayments.filter(payment => 
        payment.timingStatus === "ONTIME" || payment.timingStatus === "ADVANCE"
      ).length;
      const paymentReliability = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

      // Calculate maintenance request count
      const maintenanceCount = tenant.maintenanceRequests.length;
      const recentMaintenanceCount = tenant.maintenanceRequests.filter(req => {
        const createdAt = new Date(req.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt > thirtyDaysAgo;
      }).length;

      // Determine risk level
      let riskLevel = "LOW";
      if (paymentReliability < 70 || maintenanceCount > 5 || recentMaintenanceCount > 2) {
        riskLevel = "HIGH";
      } else if (paymentReliability < 85 || maintenanceCount > 2 || recentMaintenanceCount > 1) {
        riskLevel = "MEDIUM";
      }

      return {
        id: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        phoneNumber: tenant.phoneNumber,
        avatarUrl: tenant.avatarUrl,
        isVerified: tenant.isVerified,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        fullName: `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim(),
        
        // Current lease info
        currentLease: activeLease ? {
          id: activeLease.id,
          leaseNickname: activeLease.leaseNickname,
          status: activeLease.status,
          rentAmount: activeLease.rentAmount,
          interval: activeLease.interval,
          startDate: activeLease.startDate,
          endDate: activeLease.endDate,
          property: activeLease.unit.property,
          unit: {
            id: activeLease.unit.id,
            label: activeLease.unit.label,
            status: activeLease.unit.status,
          }
        } : null,

        // Behavior analysis
        behaviorAnalysis: {
          riskLevel,
          paymentReliability: Math.round(paymentReliability),
          totalPayments,
          onTimePayments,
          maintenanceRequestsCount: maintenanceCount,
          recentMaintenanceCount,
          hasFrequentComplaints: recentMaintenanceCount > 2,
          aiRiskScore: behaviorAnalysis?.aiRiskScore || Math.round(100 - paymentReliability),
          aiSummary: behaviorAnalysis?.aiSummary || generateBehaviorSummary(paymentReliability, maintenanceCount, recentMaintenanceCount),
          lastAnalysisDate: behaviorAnalysis?.updatedAt || tenant.updatedAt,
        },

        // Recent activity
        recentPayments: activeLease?.payments?.slice(0, 3) || [],
        recentMaintenanceRequests: tenant.maintenanceRequests.slice(0, 3),
      };
    });

    return res.json(formattedTenants);
  } catch (error) {
    console.error("Error fetching landlord tenants:", error);
    return res.status(500).json({ message: "Failed to fetch tenants" });
  }
};

// ---------------------------------------------- GET TENANT DETAILS WITH SCREENING ----------------------------------------------
export const getTenantDetails = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Get tenant with all related data
    const tenant = await prisma.user.findFirst({
      where: {
        id: tenantId,
        role: "TENANT",
        Lease: {
          some: {
            unit: {
              property: {
                ownerId: ownerId
              }
            }
          }
        }
      },
      include: {
        Lease: {
          where: {
            unit: {
              property: {
                ownerId: ownerId
              }
            }
          },
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    address: true,
                  }
                }
              }
            },
            payments: {
              orderBy: { dueDate: "desc" }
            },
            TenantBehaviorAnalysis: true
          }
        },
        maintenanceRequests: {
          where: {
            property: {
              ownerId: ownerId
            }
          },
          orderBy: { createdAt: "desc" },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              }
            },
            unit: {
              select: {
                id: true,
                label: true,
              }
            }
          }
        },
        tenantScreenings: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found or not accessible" });
    }

    const activeLease = tenant.Lease.find(lease => lease.status === "ACTIVE");
    const behaviorAnalysis = activeLease?.TenantBehaviorAnalysis?.[0];
    const latestScreening = tenant.tenantScreenings[0];

    // Calculate comprehensive behavior metrics
    const allPayments = tenant.Lease.flatMap(lease => lease.payments);
    const totalPayments = allPayments.length;
    const onTimePayments = allPayments.filter(payment => 
      payment.timingStatus === "ONTIME" || payment.timingStatus === "ADVANCE"
    ).length;
    const latePayments = allPayments.filter(payment => payment.timingStatus === "LATE").length;
    const advancePayments = allPayments.filter(payment => payment.timingStatus === "ADVANCE").length;
    
    const paymentReliability = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;
    const averagePaymentDelay = calculateAveragePaymentDelay(allPayments);

    // Maintenance analysis
    const maintenanceCount = tenant.maintenanceRequests.length;
    const recentMaintenanceCount = tenant.maintenanceRequests.filter(req => {
      const createdAt = new Date(req.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt > thirtyDaysAgo;
    }).length;

    // Determine risk levels
    let paymentRiskLevel = "LOW";
    if (paymentReliability < 70) paymentRiskLevel = "HIGH";
    else if (paymentReliability < 85) paymentRiskLevel = "MEDIUM";

    let maintenanceRiskLevel = "LOW";
    if (maintenanceCount > 5) maintenanceRiskLevel = "HIGH";
    else if (maintenanceCount > 2) maintenanceRiskLevel = "MEDIUM";

    let overallRiskLevel = "LOW";
    if (paymentRiskLevel === "HIGH" || maintenanceRiskLevel === "HIGH") overallRiskLevel = "HIGH";
    else if (paymentRiskLevel === "MEDIUM" || maintenanceRiskLevel === "MEDIUM") overallRiskLevel = "MEDIUM";

    return res.json({
      ...tenant,
      currentLease: activeLease,
      behaviorAnalysis: {
        overallRiskLevel,
        paymentRiskLevel,
        maintenanceRiskLevel,
        paymentReliability: Math.round(paymentReliability),
        totalPayments,
        onTimePayments,
        latePayments,
        advancePayments,
        averagePaymentDelay,
        maintenanceRequestsCount: maintenanceCount,
        recentMaintenanceCount,
        hasFrequentComplaints: recentMaintenanceCount > 2,
        aiRiskScore: behaviorAnalysis?.aiRiskScore || Math.round(100 - paymentReliability),
        aiSummary: behaviorAnalysis?.aiSummary || generateDetailedBehaviorSummary(
          paymentReliability, 
          maintenanceCount, 
          recentMaintenanceCount,
          averagePaymentDelay
        ),
        aiCategory: behaviorAnalysis?.aiCategory || categorizeTenantBehavior(paymentReliability, maintenanceCount),
        lastAnalysisDate: behaviorAnalysis?.updatedAt || tenant.updatedAt,
      },
      screeningInfo: latestScreening ? {
        id: latestScreening.id,
        screeningRiskLevel: latestScreening.screeningRiskLevel,
        aiScreeningSummary: latestScreening.aiScreeningSummary,
        createdAt: latestScreening.createdAt,
        status: latestScreening.status,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    return res.status(500).json({ message: "Failed to fetch tenant details" });
  }
};

// ---------------------------------------------- RUN AUTOMATED TENANT SCREENING ----------------------------------------------
export const runTenantScreening = async (req, res) => {
  try {
    const { tenantId, unitId } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!tenantId || !unitId) {
      return res.status(400).json({ message: "Tenant ID and Unit ID are required" });
    }

    // Verify tenant and unit belong to landlord
    const tenant = await prisma.user.findFirst({
      where: {
        id: tenantId,
        role: "TENANT",
        Lease: {
          some: {
            unit: {
              property: {
                ownerId: ownerId
              }
            }
          }
        }
      }
    });

    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        property: {
          ownerId: ownerId
        }
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          }
        }
      }
    });

    if (!tenant || !unit) {
      return res.status(404).json({ message: "Tenant or unit not found or not accessible" });
    }

    // Simulate automated screening process
    const screeningResult = await performAutomatedScreening(tenant, unit);

    // Create or update screening record
    const screening = await prisma.tenantScreening.upsert({
      where: {
        tenantId_unitId: {
          tenantId: tenantId,
          unitId: unitId
        }
      },
      update: {
        screeningRiskLevel: screeningResult.riskLevel,
        aiScreeningSummary: screeningResult.summary,
        status: screeningResult.status,
        updatedAt: new Date(),
      },
      create: {
        tenantId: tenantId,
        unitId: unitId,
        fullName: `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim(),
        screeningRiskLevel: screeningResult.riskLevel,
        aiScreeningSummary: screeningResult.summary,
        status: screeningResult.status,
      }
    });

    return res.json({
      message: "Tenant screening completed successfully",
      screening: {
        id: screening.id,
        tenantId: screening.tenantId,
        unitId: screening.unitId,
        riskLevel: screening.screeningRiskLevel,
        summary: screening.aiScreeningSummary,
        status: screening.status,
        createdAt: screening.createdAt,
        updatedAt: screening.updatedAt,
      },
      recommendations: screeningResult.recommendations,
    });
  } catch (error) {
    console.error("Error running tenant screening:", error);
    return res.status(500).json({ message: "Failed to run tenant screening" });
  }
};

// ---------------------------------------------- GET SCREENING RESULTS ----------------------------------------------
export const getScreeningResults = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Get all screening results for the tenant
    const screenings = await prisma.tenantScreening.findMany({
      where: {
        tenantId: tenantId,
        unit: {
          property: {
            ownerId: ownerId
          }
        }
      },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (screenings.length === 0) {
      return res.status(404).json({ message: "No screening results found for this tenant" });
    }

    return res.json(screenings);
  } catch (error) {
    console.error("Error fetching screening results:", error);
    return res.status(500).json({ message: "Failed to fetch screening results" });
  }
};

// ---------------------------------------------- GENERATE BEHAVIOR REPORT ----------------------------------------------
export const generateBehaviorReport = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reportType = "comprehensive" } = req.query;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Get comprehensive tenant data
    const tenant = await prisma.user.findFirst({
      where: {
        id: tenantId,
        role: "TENANT",
        Lease: {
          some: {
            unit: {
              property: {
                ownerId: ownerId
              }
            }
          }
        }
      },
      include: {
        Lease: {
          where: {
            unit: {
              property: {
                ownerId: ownerId
              }
            }
          },
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    address: true,
                  }
                }
              }
            },
            payments: {
              orderBy: { dueDate: "desc" }
            },
            TenantBehaviorAnalysis: true
          }
        },
        maintenanceRequests: {
          where: {
            property: {
              ownerId: ownerId
            }
          },
          orderBy: { createdAt: "desc" },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              }
            },
            unit: {
              select: {
                id: true,
                label: true,
              }
            }
          }
        },
        tenantScreenings: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found or not accessible" });
    }

    // Generate comprehensive behavior report
    const report = generateComprehensiveBehaviorReport(tenant, reportType);

    return res.json(report);
  } catch (error) {
    console.error("Error generating behavior report:", error);
    return res.status(500).json({ message: "Failed to generate behavior report" });
  }
};

// ---------------------------------------------- GET TENANT STATISTICS ----------------------------------------------
export const getTenantStats = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Get all tenants for this landlord
    const tenants = await prisma.user.findMany({
      where: {
        role: "TENANT",
        isDisabled: false,
        Lease: {
          some: {
            unit: {
              property: {
                ownerId: ownerId
              }
            }
          }
        }
      },
      include: {
        Lease: {
          where: {
            unit: {
              property: {
                ownerId: ownerId
              }
            }
          },
          include: {
            payments: true,
            TenantBehaviorAnalysis: true
          }
        },
        maintenanceRequests: {
          where: {
            property: {
              ownerId: ownerId
            }
          }
        }
      }
    });

    // Calculate statistics
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(tenant => 
      tenant.Lease.some(lease => lease.status === "ACTIVE")
    ).length;

    // Payment statistics
    const allPayments = tenants.flatMap(tenant => 
      tenant.Lease.flatMap(lease => lease.payments)
    );
    const totalPayments = allPayments.length;
    const onTimePayments = allPayments.filter(payment => 
      payment.timingStatus === "ONTIME" || payment.timingStatus === "ADVANCE"
    ).length;
    const overallPaymentReliability = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

    // Risk level distribution
    const riskLevels = tenants.map(tenant => {
      const allTenantPayments = tenant.Lease.flatMap(lease => lease.payments);
      const tenantPaymentReliability = allTenantPayments.length > 0 ? 
        (allTenantPayments.filter(p => p.timingStatus === "ONTIME" || p.timingStatus === "ADVANCE").length / allTenantPayments.length) * 100 : 0;
      
      if (tenantPaymentReliability < 70 || tenant.maintenanceRequests.length > 5) return "HIGH";
      if (tenantPaymentReliability < 85 || tenant.maintenanceRequests.length > 2) return "MEDIUM";
      return "LOW";
    });

    const highRiskTenants = riskLevels.filter(level => level === "HIGH").length;
    const mediumRiskTenants = riskLevels.filter(level => level === "MEDIUM").length;
    const lowRiskTenants = riskLevels.filter(level => level === "LOW").length;

    // Maintenance statistics
    const totalMaintenanceRequests = tenants.reduce((sum, tenant) => sum + tenant.maintenanceRequests.length, 0);
    const averageMaintenancePerTenant = totalTenants > 0 ? totalMaintenanceRequests / totalTenants : 0;

    return res.json({
      overview: {
        totalTenants,
        activeTenants,
        overallPaymentReliability: Math.round(overallPaymentReliability),
        totalMaintenanceRequests,
        averageMaintenancePerTenant: Math.round(averageMaintenancePerTenant * 10) / 10,
      },
      riskDistribution: {
        high: highRiskTenants,
        medium: mediumRiskTenants,
        low: lowRiskTenants,
      },
      performance: {
        averagePaymentDelay: calculateAveragePaymentDelay(allPayments),
        tenantRetentionRate: calculateTenantRetentionRate(tenants),
        screeningCompletionRate: calculateScreeningCompletionRate(tenants),
      }
    });
  } catch (error) {
    console.error("Error fetching tenant statistics:", error);
    return res.status(500).json({ message: "Failed to fetch tenant statistics" });
  }
};

// ---------------------------------------------- HELPER FUNCTIONS ----------------------------------------------

function generateBehaviorSummary(paymentReliability, maintenanceCount, recentMaintenanceCount) {
  if (paymentReliability >= 90 && maintenanceCount <= 1) {
    return "Excellent tenant with consistent on-time payments and minimal maintenance requests.";
  } else if (paymentReliability >= 80 && maintenanceCount <= 2) {
    return "Good tenant with mostly reliable payments and reasonable maintenance needs.";
  } else if (paymentReliability >= 70 && maintenanceCount <= 3) {
    return "Average tenant with some payment delays and moderate maintenance requests.";
  } else {
    return "High-risk tenant with frequent payment issues and excessive maintenance requests.";
  }
}

function generateDetailedBehaviorSummary(paymentReliability, maintenanceCount, recentMaintenanceCount, averageDelay) {
  const summary = [];
  
  if (paymentReliability >= 90) {
    summary.push("Excellent payment history with 90%+ on-time payments");
  } else if (paymentReliability >= 80) {
    summary.push("Good payment history with mostly reliable payments");
  } else if (paymentReliability >= 70) {
    summary.push("Average payment history with some delays");
  } else {
    summary.push("Poor payment history with frequent delays");
  }

  if (averageDelay > 0) {
    summary.push(`Average payment delay of ${averageDelay} days`);
  }

  if (maintenanceCount === 0) {
    summary.push("No maintenance requests submitted");
  } else if (maintenanceCount <= 2) {
    summary.push("Minimal maintenance requests");
  } else if (maintenanceCount <= 5) {
    summary.push("Moderate maintenance requests");
  } else {
    summary.push("Excessive maintenance requests");
  }

  if (recentMaintenanceCount > 2) {
    summary.push("Recent increase in maintenance requests");
  }

  return summary.join(". ") + ".";
}

function categorizeTenantBehavior(paymentReliability, maintenanceCount) {
  if (paymentReliability >= 90 && maintenanceCount <= 1) {
    return "EXCELLENT";
  } else if (paymentReliability >= 80 && maintenanceCount <= 2) {
    return "GOOD";
  } else if (paymentReliability >= 70 && maintenanceCount <= 3) {
    return "AVERAGE";
  } else {
    return "HIGH_RISK";
  }
}

function calculateAveragePaymentDelay(payments) {
  const latePayments = payments.filter(payment => payment.timingStatus === "LATE");
  if (latePayments.length === 0) return 0;
  
  const totalDelay = latePayments.reduce((sum, payment) => {
    const dueDate = new Date(payment.dueDate);
    const paidDate = new Date(payment.paidAt || payment.updatedAt);
    const delay = Math.ceil((paidDate - dueDate) / (1000 * 60 * 60 * 24));
    return sum + Math.max(0, delay);
  }, 0);
  
  return Math.round(totalDelay / latePayments.length);
}

function calculateTenantRetentionRate(tenants) {
  const tenantsWithMultipleLeases = tenants.filter(tenant => tenant.Lease.length > 1);
  return tenants.length > 0 ? (tenantsWithMultipleLeases.length / tenants.length) * 100 : 0;
}

function calculateScreeningCompletionRate(tenants) {
  const tenantsWithScreenings = tenants.filter(tenant => tenant.tenantScreenings && tenant.tenantScreenings.length > 0);
  return tenants.length > 0 ? (tenantsWithScreenings.length / tenants.length) * 100 : 0;
}

async function performAutomatedScreening(tenant, unit) {
  // Simulate API calls to external screening services
  // In a real implementation, this would call actual screening APIs
  
  const mockScreeningData = {
    creditScore: Math.floor(Math.random() * 200) + 500, // 500-700
    criminalBackground: Math.random() > 0.1, // 90% clean
    evictionHistory: Math.random() > 0.05, // 95% clean
    employmentVerification: Math.random() > 0.15, // 85% verified
    incomeVerification: Math.random() > 0.2, // 80% verified
  };

  // Calculate risk level based on screening results
  let riskLevel = "LOW";
  let riskScore = 0;

  if (mockScreeningData.creditScore < 600) riskScore += 30;
  else if (mockScreeningData.creditScore < 650) riskScore += 15;

  if (!mockScreeningData.criminalBackground) riskScore += 40;
  if (!mockScreeningData.evictionHistory) riskScore += 35;
  if (!mockScreeningData.employmentVerification) riskScore += 20;
  if (!mockScreeningData.incomeVerification) riskScore += 15;

  if (riskScore >= 50) riskLevel = "HIGH";
  else if (riskScore >= 25) riskLevel = "MEDIUM";

  // Generate AI summary
  const summary = generateScreeningSummary(mockScreeningData, riskLevel);
  
  // Generate recommendations
  const recommendations = generateScreeningRecommendations(mockScreeningData, riskLevel);

  return {
    riskLevel,
    riskScore,
    summary,
    status: "COMPLETED",
    recommendations,
    screeningData: mockScreeningData,
  };
}

function generateScreeningSummary(data, riskLevel) {
  const summary = [];
  
  summary.push(`Credit Score: ${data.creditScore}`);
  summary.push(`Criminal Background: ${data.criminalBackground ? 'Clean' : 'Issues Found'}`);
  summary.push(`Eviction History: ${data.evictionHistory ? 'Clean' : 'Previous Evictions'}`);
  summary.push(`Employment: ${data.employmentVerification ? 'Verified' : 'Not Verified'}`);
  summary.push(`Income: ${data.incomeVerification ? 'Verified' : 'Not Verified'}`);
  
  summary.push(`Overall Risk Level: ${riskLevel}`);
  
  return summary.join(". ");
}

function generateScreeningRecommendations(data, riskLevel) {
  const recommendations = [];
  
  if (riskLevel === "HIGH") {
    recommendations.push("Consider requiring additional security deposit");
    recommendations.push("Request co-signer or guarantor");
    recommendations.push("Implement stricter payment monitoring");
  } else if (riskLevel === "MEDIUM") {
    recommendations.push("Monitor payment behavior closely");
    recommendations.push("Consider standard security deposit");
  } else {
    recommendations.push("Standard lease terms acceptable");
    recommendations.push("Consider offering lease renewal incentives");
  }
  
  return recommendations;
}

function generateComprehensiveBehaviorReport(tenant, reportType) {
  const allPayments = tenant.Lease.flatMap(lease => lease.payments);
  const totalPayments = allPayments.length;
  const onTimePayments = allPayments.filter(payment => 
    payment.timingStatus === "ONTIME" || payment.timingStatus === "ADVANCE"
  ).length;
  const paymentReliability = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

  const maintenanceCount = tenant.maintenanceRequests.length;
  const recentMaintenanceCount = tenant.maintenanceRequests.filter(req => {
    const createdAt = new Date(req.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt > thirtyDaysAgo;
  }).length;

  return {
    tenant: {
      id: tenant.id,
      fullName: `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim(),
      email: tenant.email,
      phoneNumber: tenant.phoneNumber,
      joinedDate: tenant.createdAt,
    },
    reportType,
    generatedAt: new Date().toISOString(),
    summary: {
      overallRiskLevel: paymentReliability < 70 || maintenanceCount > 5 ? "HIGH" : 
                      paymentReliability < 85 || maintenanceCount > 2 ? "MEDIUM" : "LOW",
      paymentReliability: Math.round(paymentReliability),
      maintenanceRequestsCount: maintenanceCount,
      recentMaintenanceCount,
      averagePaymentDelay: calculateAveragePaymentDelay(allPayments),
    },
    detailedAnalysis: {
      paymentBehavior: {
        totalPayments,
        onTimePayments,
        latePayments: allPayments.filter(p => p.timingStatus === "LATE").length,
        advancePayments: allPayments.filter(p => p.timingStatus === "ADVANCE").length,
        reliability: Math.round(paymentReliability),
        trend: calculatePaymentTrend(allPayments),
      },
      maintenanceBehavior: {
        totalRequests: maintenanceCount,
        recentRequests: recentMaintenanceCount,
        averageResponseTime: calculateAverageMaintenanceResponseTime(tenant.maintenanceRequests),
        requestTypes: categorizeMaintenanceRequests(tenant.maintenanceRequests),
      },
      leaseHistory: {
        totalLeases: tenant.Lease.length,
        activeLeases: tenant.Lease.filter(l => l.status === "ACTIVE").length,
        averageLeaseDuration: calculateAverageLeaseDuration(tenant.Lease),
        renewalRate: calculateRenewalRate(tenant.Lease),
      }
    },
    recommendations: generateReportRecommendations(paymentReliability, maintenanceCount, recentMaintenanceCount),
    riskFactors: identifyRiskFactors(paymentReliability, maintenanceCount, recentMaintenanceCount),
  };
}

function calculatePaymentTrend(payments) {
  if (payments.length < 3) return "INSUFFICIENT_DATA";
  
  const recentPayments = payments.slice(0, 3);
  const olderPayments = payments.slice(3, 6);
  
  const recentOnTime = recentPayments.filter(p => p.timingStatus === "ONTIME" || p.timingStatus === "ADVANCE").length;
  const olderOnTime = olderPayments.filter(p => p.timingStatus === "ONTIME" || p.timingStatus === "ADVANCE").length;
  
  if (recentOnTime > olderOnTime) return "IMPROVING";
  if (recentOnTime < olderOnTime) return "DECLINING";
  return "STABLE";
}

function calculateAverageMaintenanceResponseTime(requests) {
  const resolvedRequests = requests.filter(req => req.status === "RESOLVED");
  if (resolvedRequests.length === 0) return 0;
  
  const totalTime = resolvedRequests.reduce((sum, req) => {
    const createdAt = new Date(req.createdAt);
    const updatedAt = new Date(req.updatedAt);
    const diffTime = updatedAt.getTime() - createdAt.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);
  
  return Math.round(totalTime / resolvedRequests.length);
}

function categorizeMaintenanceRequests(requests) {
  const categories = {
    plumbing: 0,
    electrical: 0,
    hvac: 0,
    general: 0,
    emergency: 0,
  };
  
  requests.forEach(req => {
    const description = req.description.toLowerCase();
    if (description.includes("plumb") || description.includes("water") || description.includes("toilet")) {
      categories.plumbing++;
    } else if (description.includes("electrical") || description.includes("power") || description.includes("outlet")) {
      categories.electrical++;
    } else if (description.includes("hvac") || description.includes("air") || description.includes("heat")) {
      categories.hvac++;
    } else if (description.includes("emergency") || description.includes("urgent")) {
      categories.emergency++;
    } else {
      categories.general++;
    }
  });
  
  return categories;
}

function calculateAverageLeaseDuration(leases) {
  if (leases.length === 0) return 0;
  
  const totalDuration = leases.reduce((sum, lease) => {
    const startDate = new Date(lease.startDate);
    const endDate = lease.endDate ? new Date(lease.endDate) : new Date();
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);
  
  return Math.round(totalDuration / leases.length);
}

function calculateRenewalRate(leases) {
  if (leases.length <= 1) return 0;
  
  const renewedLeases = leases.filter(lease => {
    // Simple logic: if there are multiple leases for the same unit, consider it a renewal
    const sameUnitLeases = leases.filter(l => l.unitId === lease.unitId);
    return sameUnitLeases.length > 1;
  });
  
  return leases.length > 0 ? (renewedLeases.length / leases.length) * 100 : 0;
}

function generateReportRecommendations(paymentReliability, maintenanceCount, recentMaintenanceCount) {
  const recommendations = [];
  
  if (paymentReliability < 70) {
    recommendations.push("Implement stricter payment monitoring and reminders");
    recommendations.push("Consider requiring automatic payment setup");
  }
  
  if (maintenanceCount > 5) {
    recommendations.push("Schedule regular property inspections");
    recommendations.push("Consider implementing maintenance request limits");
  }
  
  if (recentMaintenanceCount > 2) {
    recommendations.push("Investigate recent increase in maintenance requests");
    recommendations.push("Consider tenant education on proper maintenance reporting");
  }
  
  if (paymentReliability >= 90 && maintenanceCount <= 1) {
    recommendations.push("Consider offering lease renewal incentives");
    recommendations.push("Nominate for tenant of the month program");
  }
  
  return recommendations;
}

function identifyRiskFactors(paymentReliability, maintenanceCount, recentMaintenanceCount) {
  const riskFactors = [];
  
  if (paymentReliability < 70) {
    riskFactors.push("Poor payment history");
  }
  
  if (maintenanceCount > 5) {
    riskFactors.push("Excessive maintenance requests");
  }
  
  if (recentMaintenanceCount > 2) {
    riskFactors.push("Recent increase in maintenance requests");
  }
  
  if (paymentReliability < 50) {
    riskFactors.push("Very poor payment reliability");
  }
  
  return riskFactors;
}
