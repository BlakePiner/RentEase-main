// file: tenantController.js
import prisma from "../../libs/prismaClient.js";

// ---------------------------------------------- GET ALL TENANTS FOR LANDLORD ----------------------------------------------
export const getLandlordTenants = async (req, res) => {
  try {
    console.log("=== GET LANDLORD TENANTS API CALLED ===");
    const ownerId = req.user?.id;
    console.log("Owner ID:", ownerId);
    console.log("User object:", req.user);
    if (!ownerId) {
      console.log("❌ No owner ID found");
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Get tenant applications for this landlord's properties (only pending ones, not approved)
    const applications = await prisma.tenantScreening.findMany({
      where: {
        unit: {
          property: {
            ownerId: ownerId
          }
        },
        // Only include applications that haven't been approved or rejected
        OR: [
          {
            aiScreeningSummary: null // New applications without screening summary
          },
          {
            aiScreeningSummary: {
              not: {
                contains: "APPROVED"
              }
            }
          }
        ]
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            createdAt: true
          }
        },
        unit: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                street: true,
                barangay: true,
                city: { select: { name: true } },
                municipality: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Get approved tenants (those who have been approved, regardless of lease status)
    // This acts as a history of all approved applications
    const approvedApplications = await prisma.tenantScreening.findMany({
      where: {
        unit: {
          property: {
            ownerId: ownerId
          }
        },
        aiScreeningSummary: {
          contains: "APPROVED"
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            createdAt: true
          }
        },
        unit: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                street: true,
                barangay: true,
                city: { select: { name: true } },
                municipality: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Also get existing tenants with leases (only ACTIVE leases, not DRAFT)
    const existingTenants = await prisma.user.findMany({
      where: {
        role: "TENANT",
        isDisabled: false,
        Lease: {
          some: {
            unit: {
              property: {
                ownerId: ownerId
              }
            },
            status: "ACTIVE" // Only ACTIVE leases
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
            },
            status: "ACTIVE" // Only ACTIVE leases
          },
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    street: true,
                    barangay: true,
                    city: { select: { name: true } },
                    municipality: { select: { name: true } }
                  }
                }
              }
            },
            payments: {
              orderBy: { createdAt: "desc" },
              take: 5
            }
          }
        },
        MaintenanceRequest: {
          where: {
            property: {
              ownerId: ownerId
            }
          },
          orderBy: { createdAt: "desc" },
          take: 3
        },
        TenantBehaviorAnalysis: {
          where: {
            lease: {
              unit: {
                property: {
                  ownerId: ownerId
                }
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });

    console.log(`✅ Found ${applications.length} applications for landlord ${ownerId}`);

    // Format applications (pending screening)
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      type: 'APPLICATION',
      status: 'PENDING_SCREENING',
      submittedAt: app.createdAt,
      tenant: {
        id: app.tenant.id,
        firstName: app.tenant.firstName,
        lastName: app.tenant.lastName,
        email: app.tenant.email,
        phoneNumber: app.tenant.phoneNumber,
        avatarUrl: app.tenant.avatarUrl,
        createdAt: app.tenant.createdAt
      },
      unit: {
        id: app.unit.id,
        label: app.unit.label,
        targetPrice: app.unit.targetPrice,
        property: {
          id: app.unit.property.id,
          title: app.unit.property.title,
          address: `${app.unit.property.street}, ${app.unit.property.barangay}`,
          location: app.unit.property.city?.name || app.unit.property.municipality?.name || 'Unknown'
        }
      },
      applicationData: {
        fullName: app.fullName,
        birthdate: app.birthdate,
        governmentIdNumber: app.governmentIdNumber,
        employmentStatus: app.employmentStatus,
        employerName: app.employerName,
        monthlyIncome: app.monthlyIncome,
        previousLandlordName: app.previousLandlordName,
        previousLandlordContact: app.previousLandlordContact,
        rentalHistoryNotes: app.rentalHistoryNotes,
        characterReferences: app.characterReferences,
        isSmoker: app.isSmoker,
        hasPets: app.hasPets,
        petTypes: app.petTypes,
        otherLifestyle: app.otherLifestyle,
        // Document URLs
        idImageUrl: app.idImageUrl,
        selfieUrl: app.selfieUrl,
        nbiClearanceUrl: app.nbiClearanceUrl,
        biodataUrl: app.biodataUrl,
        proofOfIncomeUrl: app.proofOfIncomeUrl
      },
      riskAssessment: {
        aiRiskScore: app.aiRiskScore,
        riskLevel: app.riskLevel,
        aiScreeningSummary: app.aiScreeningSummary
      }
    }));

    // Format existing tenants (with draft or active leases)
    const formattedTenants = existingTenants.map((tenant) => {
      const lease = tenant.Lease[0]; // Should only have one lease per property owner
      const behaviorAnalysis = tenant.TenantBehaviorAnalysis?.[0];
      
      // Calculate payment reliability
      const allPayments = tenant.Lease.flatMap(lease => lease.payments);
      const totalPayments = allPayments.length;
      const onTimePayments = allPayments.filter(payment => 
        payment.timingStatus === "ONTIME" || payment.timingStatus === "ADVANCE"
      ).length;
      const paymentReliability = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

      // Calculate maintenance request count
      const maintenanceCount = tenant.MaintenanceRequest.length;
      const recentMaintenanceCount = tenant.MaintenanceRequest.filter(req => {
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
        type: lease?.status === 'DRAFT' ? 'APPROVED_TENANT' : 'TENANT',
        status: lease?.status === 'DRAFT' ? 'PENDING_LEASE_ACTIVATION' : 'ACTIVE',
        tenant: {
          id: tenant.id,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          email: tenant.email,
          phoneNumber: tenant.phoneNumber,
          avatarUrl: tenant.avatarUrl,
          isVerified: tenant.isVerified,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          fullName: `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim()
        },
        
        // Current lease info
        currentLease: lease ? {
          id: lease.id,
          leaseNickname: lease.leaseNickname,
          status: lease.status,
          rentAmount: lease.rentAmount,
          interval: lease.interval,
          startDate: lease.startDate,
          endDate: lease.endDate,
          unit: {
            id: lease.unit.id,
            label: lease.unit.label,
            status: lease.unit.status,
            targetPrice: lease.unit.targetPrice,
            property: {
              id: lease.unit.property.id,
              title: lease.unit.property.title,
              address: `${lease.unit.property.street}, ${lease.unit.property.barangay}`,
              location: lease.unit.property.city?.name || lease.unit.property.municipality?.name || 'Unknown'
            }
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
        recentPayments: lease?.payments?.slice(0, 3) || [],
        recentMaintenanceRequests: tenant.MaintenanceRequest.slice(0, 3),
      };
    });

    // Format approved tenants (history of all approved applications)
    const formattedApprovedTenants = approvedApplications.map((app) => ({
      id: app.id,
      type: 'APPROVED_TENANT',
      status: 'APPROVED',
      approvedAt: app.updatedAt,
      submittedAt: app.createdAt,
      tenant: {
        id: app.tenant.id,
        firstName: app.tenant.firstName,
        lastName: app.tenant.lastName,
        email: app.tenant.email,
        phoneNumber: app.tenant.phoneNumber,
        avatarUrl: app.tenant.avatarUrl,
        createdAt: app.tenant.createdAt
      },
      unit: {
        id: app.unit.id,
        label: app.unit.label,
        targetPrice: app.unit.targetPrice,
        property: {
          id: app.unit.property.id,
          title: app.unit.property.title,
          address: `${app.unit.property.street}, ${app.unit.property.barangay}, ${app.unit.property.city?.name || app.unit.property.municipality?.name || ''}`
        }
      },
      unitId: app.unitId,
      propertyTitle: app.unit.property.title,
      unitLabel: app.unit.label,
      riskAssessment: {
        riskLevel: app.screeningRiskLevel || 'LOW',
        aiScreeningSummary: app.aiScreeningSummary
      }
    }));

    // Combine applications, approved tenants, and existing tenants
    const allTenantData = [...formattedApplications, ...formattedApprovedTenants, ...formattedTenants];

    console.log(`✅ Returning ${formattedApplications.length} applications, ${formattedApprovedTenants.length} approved tenants, and ${formattedTenants.length} active tenants`);
    console.log("📤 Final response data:", JSON.stringify(allTenantData, null, 2));
    return res.json(allTenantData);
  } catch (error) {
    console.error("Error fetching landlord tenants:", error);
    return res.status(500).json({ message: "Failed to fetch tenants" });
  }
};

// ---------------------------------------------- APPROVE/REJECT TENANT APPLICATION ----------------------------------------------
export const updateTenantApplicationStatus = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: "Valid status is required (APPROVED or REJECTED)" });
    }

    // Get the application and verify ownership
    const application = await prisma.tenantScreening.findUnique({
      where: { id: applicationId },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        unit: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                ownerId: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.unit.property.ownerId !== ownerId) {
      return res.status(403).json({ message: "You can only review applications for your own properties" });
    }

    if (status === 'APPROVED') {
      // Just approve the application - don't create lease automatically
      // Update the application status instead of deleting it
      await prisma.tenantScreening.update({
        where: { id: applicationId },
        data: {
          // Use aiScreeningSummary to store approval notes since notes field doesn't exist
          aiScreeningSummary: `APPROVED: ${notes || 'Application approved - awaiting lease assignment'}`
        }
      });

      // Create notification for tenant
      await prisma.notification.create({
        data: {
          userId: application.tenantId,
          type: 'APPLICATION',
          message: `Congratulations! Your application for ${application.unit.property.title} - ${application.unit.label} has been approved! The landlord will assign you a lease soon.`,
          status: 'UNREAD'
        }
      });

      // Create notification for landlord
      await prisma.notification.create({
        data: {
          userId: ownerId,
          type: 'APPLICATION',
          message: `Application approved for ${application.unit.property.title} - ${application.unit.label}. Please assign a lease to the tenant.`,
          status: 'UNREAD'
        }
      });

      res.json({
        message: "Application approved successfully. Please assign a lease to the tenant.",
        applicationId: applicationId,
        tenantId: application.tenantId,
        unitId: application.unitId
      });
    } else {
      // Rejected - just delete the application
      await prisma.tenantScreening.delete({
        where: { id: applicationId }
      });

      // Create notification for tenant
      await prisma.notification.create({
        data: {
          userId: application.tenantId,
          type: 'APPLICATION',
          message: `Your application for ${application.unit.property.title} - ${application.unit.label} has been rejected. ${notes ? 'Reason: ' + notes : ''}`,
          status: 'UNREAD'
        }
      });

      res.json({
        message: "Application rejected successfully"
      });
    }
  } catch (error) {
    console.error("Error updating tenant application status:", error);
    return res.status(500).json({ message: "Failed to update application status" });
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
              orderBy: { createdAt: "desc" }
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
              orderBy: { createdAt: "desc" }
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
    const dueDate = new Date(payment.createdAt);
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

// ---------------------------------------------- DELETE/REMOVE TENANT ----------------------------------------------
export const removeTenant = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { tenantId } = req.params;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    console.log(`🗑️ Removing tenant ${tenantId} by landlord ${ownerId}`);

    // Find any tenant screening records for this tenant on landlord's properties
    const applications = await prisma.tenantScreening.findMany({
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
                title: true
              }
            }
          }
        }
      }
    });

    // Find any draft leases for this tenant on landlord's properties
    const draftLeases = await prisma.lease.findMany({
      where: {
        tenantId: tenantId,
        status: 'DRAFT',
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
                title: true
              }
            }
          }
        }
      }
    });

    // Delete applications
    if (applications.length > 0) {
      await prisma.tenantScreening.deleteMany({
        where: {
          id: {
            in: applications.map(app => app.id)
          }
        }
      });
      console.log(`✅ Deleted ${applications.length} applications`);
    }

    // Delete draft leases
    if (draftLeases.length > 0) {
      await prisma.lease.deleteMany({
        where: {
          id: {
            in: draftLeases.map(lease => lease.id)
          }
        }
      });
      console.log(`✅ Deleted ${draftLeases.length} draft leases`);
    }

    // Get tenant info for notification
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      select: {
        firstName: true,
        lastName: true
      }
    });

    // Create notification for tenant
    const propertyNames = [...applications, ...draftLeases]
      .map(item => item.unit.property.title)
      .filter((name, index, self) => self.indexOf(name) === index);

    if (propertyNames.length > 0) {
      await prisma.notification.create({
        data: {
          userId: tenantId,
          type: 'APPLICATION',
          message: `Your application/lease for ${propertyNames.join(', ')} has been cancelled by the landlord. You can reapply if you wish.`,
          status: 'UNREAD'
        }
      });
    }

    res.json({
      message: `Successfully removed tenant ${tenant?.firstName} ${tenant?.lastName}`,
      deletedApplications: applications.length,
      deletedDraftLeases: draftLeases.length,
      properties: propertyNames
    });

  } catch (error) {
    console.error("Error removing tenant:", error);
    return res.status(500).json({ message: "Failed to remove tenant" });
  }
};

// ---------------------------------------------- GET AVAILABLE LEASES FOR TENANT ----------------------------------------------
export const getAvailableLeasesForTenant = async (req, res) => {
  try {
    console.log("=== GET AVAILABLE LEASES FOR TENANT ===");
    const ownerId = req.user?.id;
    const { tenantId, unitId } = req.params;
    
    console.log("Owner ID:", ownerId);
    console.log("Tenant ID:", tenantId);
    console.log("Unit ID:", unitId);

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!tenantId || !unitId) {
      return res.status(400).json({ message: "Tenant ID and Unit ID are required" });
    }

    // Get available draft leases for this unit by this landlord
    // Look for leases that are assigned to this tenant
    const availableLeases = await prisma.lease.findMany({
      where: {
        unit: {
          property: {
            ownerId: ownerId
          }
        },
        unitId: unitId,
        status: 'DRAFT',
        tenantId: tenantId // Only leases assigned to this specific tenant
      },
      include: {
        unit: {
          include: {
            property: {
              select: {
                title: true
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${availableLeases.length} available leases`);
    console.log("Leases details:", availableLeases.map(lease => ({
      id: lease.id,
      leaseNickname: lease.leaseNickname,
      tenantId: lease.tenantId,
      status: lease.status,
      tenant: lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : 'No tenant'
    })));

    const formattedLeases = availableLeases.map(lease => ({
      id: lease.id,
      leaseNickname: lease.leaseNickname,
      leaseType: lease.leaseType,
      rentAmount: lease.rentAmount,
      interval: lease.interval,
      startDate: lease.startDate,
      endDate: lease.endDate,
      notes: lease.notes,
      createdAt: lease.createdAt,
      tenantId: lease.tenantId, // Include tenantId for frontend logic
      property: lease.unit.property.title,
      unit: lease.unit.label
    }));

    console.log("Formatted leases:", formattedLeases);

    res.json({
      availableLeases: formattedLeases
    });

  } catch (error) {
    console.error("❌ Error fetching available leases:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error message:", error.message);
    return res.status(500).json({ 
      message: "Failed to fetch available leases",
      error: error.message,
      details: error.stack
    });
  }
};

// ---------------------------------------------- ASSIGN LEASE TO TENANT ----------------------------------------------
export const assignLeaseToTenant = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { applicationId } = req.params;
    const { leaseId } = req.body;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!applicationId || !leaseId) {
      return res.status(400).json({ message: "Application ID and Lease ID are required" });
    }

    // Get the application
    const application = await prisma.tenantScreening.findUnique({
      where: { id: applicationId },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        unit: {
          include: {
            property: {
              select: {
                title: true,
                ownerId: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.unit.property.ownerId !== ownerId) {
      return res.status(403).json({ message: "You can only assign leases for your own properties" });
    }

    // Get the lease
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenant: {
          select: {
            id: true,
            email: true
          }
        },
        unit: {
          include: {
            property: {
              select: {
                ownerId: true
              }
            }
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ message: "Lease not found" });
    }

    if (lease.unit.property.ownerId !== ownerId) {
      return res.status(403).json({ message: "You can only assign your own leases" });
    }

    // Check if lease is available (either no tenant or placeholder tenant)
    const isPlaceholderTenant = lease.tenant?.email === 'draft-placeholder@rentease.system';
    
    if (lease.tenantId && !isPlaceholderTenant) {
      return res.status(400).json({ message: "This lease is already assigned to another tenant" });
    }

    if (lease.unitId !== application.unitId) {
      return res.status(400).json({ message: "Lease unit does not match application unit" });
    }

    // Assign the lease to the tenant (replace placeholder or assign to unassigned lease)
    const updatedLease = await prisma.lease.update({
      where: { id: leaseId },
      data: {
        tenantId: application.tenantId,
        tenantName: `${application.tenant.firstName} ${application.tenant.lastName}`,
        notes: `${lease.notes || ''}\nAssigned to ${application.tenant.firstName} ${application.tenant.lastName} from approved application.`
      }
    });

    // Delete the application since it's now converted to a lease
    await prisma.tenantScreening.delete({
      where: { id: applicationId }
    });

    // Create notification for tenant
    await prisma.notification.create({
      data: {
        userId: application.tenantId,
        type: 'LEASE',
        message: `A lease has been assigned to you for ${application.unit.property.title} - ${application.unit.label}. Please review the lease details.`,
        status: 'UNREAD'
      }
    });

    res.json({
      message: "Lease assigned successfully",
      lease: {
        id: updatedLease.id,
        leaseNickname: updatedLease.leaseNickname,
        status: updatedLease.status,
        startDate: updatedLease.startDate,
        endDate: updatedLease.endDate
      }
    });

  } catch (error) {
    console.error("Error assigning lease to tenant:", error);
    return res.status(500).json({ message: "Failed to assign lease" });
  }
};

// ---------------------------------------------- GET TENANTS WITH PENDING APPLICATIONS ----------------------------------------------
export const getTenantsWithPendingApplications = async (req, res) => {
  try {
    console.log("🚀 getTenantsWithPendingApplications called");
    console.log("📋 Request query:", req.query);
    console.log("👤 Request user:", req.user);
    
    const ownerId = req.user?.id;
    const { unitId } = req.query;

    if (!ownerId) {
      console.log("❌ No owner ID found");
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    console.log(`🔍 Getting tenants with pending applications for owner: ${ownerId}, unitId: ${unitId}`);

    // Build where clause
    let whereClause = {
      unit: {
        property: {
          ownerId: ownerId
        }
      }
    };

    // If unitId is specified, filter by specific unit
    if (unitId) {
      whereClause.unitId = unitId;
    }

    // Get all pending applications for this landlord's properties (only non-approved ones)
    const pendingApplications = await prisma.tenantScreening.findMany({
      where: {
        ...whereClause,
        // Only include applications that haven't been approved or rejected
        OR: [
          {
            aiScreeningSummary: null // New applications without screening summary
          },
          {
            aiScreeningSummary: {
              not: {
                contains: "APPROVED"
              }
            }
          }
        ]
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        unit: {
          include: {
            property: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    console.log(`📋 Found ${pendingApplications.length} pending applications`);

    // Extract unique tenants from applications
    const uniqueTenants = [];
    const seenTenantIds = new Set();

    pendingApplications.forEach(application => {
      if (!seenTenantIds.has(application.tenant.id)) {
        seenTenantIds.add(application.tenant.id);
        uniqueTenants.push({
          id: application.tenant.id,
          firstName: application.tenant.firstName,
          lastName: application.tenant.lastName,
          email: application.tenant.email,
          phoneNumber: application.tenant.phoneNumber,
          applicationId: application.id,
          unitId: application.unitId,
          propertyTitle: application.unit.property.title,
          unitLabel: application.unit.label
        });
      }
    });

    console.log(`👥 Returning ${uniqueTenants.length} unique tenants with pending applications`);

    res.json({
      tenants: uniqueTenants,
      totalApplications: pendingApplications.length
    });

  } catch (error) {
    console.error("Error fetching tenants with pending applications:", error);
    return res.status(500).json({ message: "Failed to fetch tenants with pending applications" });
  }
};

// ---------------------------------------------- REMOVE APPROVED TENANT (DELETE APPLICATION RECORD) ----------------------------------------------
export const removeApprovedTenant = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { applicationId } = req.params;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    // Get the application and verify ownership
    const application = await prisma.tenantScreening.findFirst({
      where: {
        id: applicationId,
        unit: {
          property: {
            ownerId: ownerId
          }
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        unit: {
          include: {
            property: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found or you don't have permission to delete it" });
    }

    // Delete the application record (this removes it from approved tenants history)
    await prisma.tenantScreening.delete({
      where: { id: applicationId }
    });

    // Send notification to tenant
    await prisma.notification.create({
      data: {
        userId: application.tenant.id,
        type: 'APPLICATION',
        message: `Your approved application for ${application.unit.property.title} - ${application.unit.label} has been removed by the landlord.`,
        status: 'UNREAD'
      }
    });

    console.log(`✅ Approved application ${applicationId} removed successfully`);

    res.json({
      message: `Successfully removed approved application for ${application.tenant.firstName} ${application.tenant.lastName}`,
      tenantName: `${application.tenant.firstName} ${application.tenant.lastName}`,
      property: `${application.unit.property.title} - ${application.unit.label}`
    });

  } catch (error) {
    console.error("Error removing approved tenant:", error);
    return res.status(500).json({ message: "Failed to remove approved tenant" });
  }
};
