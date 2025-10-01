// file: tenantController.js
import prisma from "../../libs/prismaClient.js";

// Helper function to format property address
function formatPropertyAddress(property) {
  const segments = [
    property.street,
    property.barangay,
    property.city?.name || property.municipality?.name,
    property.zipCode
  ].filter(Boolean);
  return segments.join(", ");
}

// ---------------------------------------------- GET TENANT DASHBOARD DATA ----------------------------------------------
export const getTenantDashboardData = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    // Get current active lease
    const currentLease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        status: "ACTIVE"
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
                zipCode: true,
                city: true,
                municipality: true
              }
            }
          }
        }
      }
    });

    // Get all leases for this tenant
    const allLeases = await prisma.lease.findMany({
      where: {
        tenantId: tenantId
      },
      include: {
        payments: true,
        maintenanceRequests: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                street: true,
                barangay: true,
                zipCode: true,
                city: true,
                municipality: true
              }
            },
            unit: {
              select: {
                id: true,
                label: true
              }
            }
          }
        }
      }
    });

    // Calculate overview statistics
    const activeLeases = allLeases.filter(lease => lease.status === "ACTIVE").length;
    const allPayments = allLeases.flatMap(lease => lease.payments);
    const totalPayments = allPayments.length;
    const onTimePayments = allPayments.filter(payment => 
      payment.timingStatus === "ONTIME" || payment.timingStatus === "ADVANCE"
    ).length;
    const pendingPayments = allPayments.filter(payment => payment.status === "PENDING").length;
    const upcomingPayments = allPayments.filter(payment => 
      payment.status === "PENDING" && 
      new Date(payment.dueDate) > new Date() && 
      new Date(payment.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    const allMaintenanceRequests = allLeases.flatMap(lease => lease.maintenanceRequests);
    const maintenanceRequests = allMaintenanceRequests.length;

    // Check for leases ending soon (within 30 days)
    const leaseEndingSoon = allLeases.filter(lease => {
      if (lease.status !== "ACTIVE") return false;
      const endDate = new Date(lease.endDate);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return endDate <= thirtyDaysFromNow;
    }).length;

    // Get recent payments (last 5)
    const recentPayments = allPayments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Get recent maintenance requests (last 5)
    const recentMaintenanceRequests = allMaintenanceRequests
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Generate upcoming tasks
    const upcomingTasks = [];
    
    // Add upcoming payments as tasks
    const upcomingPaymentTasks = allPayments
      .filter(payment => payment.status === "PENDING" && new Date(payment.dueDate) > new Date())
      .slice(0, 3)
      .map(payment => ({
        id: `payment-${payment.id}`,
        type: "payment",
        title: `Payment Due: ${payment.amount}`,
        dueDate: payment.dueDate,
        description: `Monthly rent payment due`,
        status: "pending"
      }));

    // Add lease renewal tasks if lease is ending soon
    const leaseRenewalTasks = allLeases
      .filter(lease => {
        if (lease.status !== "ACTIVE") return false;
        const endDate = new Date(lease.endDate);
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return endDate <= thirtyDaysFromNow;
      })
      .map(lease => ({
        id: `lease-${lease.id}`,
        type: "lease",
        title: "Lease Renewal",
        dueDate: lease.endDate,
        description: "Your lease is ending soon. Consider renewal options.",
        status: "pending"
      }));

    upcomingTasks.push(...upcomingPaymentTasks, ...leaseRenewalTasks);

    // Calculate financial summary
    const totalPaid = allPayments
      .filter(payment => payment.status === "PAID")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const totalDue = allPayments
      .filter(payment => payment.status === "PENDING")
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Find next payment due
    const nextPayment = allPayments
      .filter(payment => payment.status === "PENDING" && new Date(payment.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

    const nextPaymentDue = nextPayment ? nextPayment.dueDate : null;
    const nextPaymentAmount = nextPayment ? nextPayment.amount : 0;

    // Calculate payment reliability percentage
    const paymentReliability = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

    const dashboardData = {
      overview: {
        activeLeases,
        totalPayments,
        onTimePayments,
        pendingPayments,
        maintenanceRequests,
        upcomingPayments,
        leaseEndingSoon
      },
      currentLease: currentLease ? {
        id: currentLease.id,
        status: currentLease.status,
        startDate: currentLease.startDate,
        endDate: currentLease.endDate,
        monthlyRent: currentLease.monthlyRent,
        securityDeposit: currentLease.securityDeposit,
        unit: {
          id: currentLease.unit.id,
          label: currentLease.unit.label,
          property: {
            id: currentLease.unit.property.id,
            title: currentLease.unit.property.title,
            address: formatPropertyAddress(currentLease.unit.property)
          }
        }
      } : null,
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        timingStatus: payment.timingStatus,
        dueDate: payment.dueDate,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt
      })),
      recentMaintenanceRequests: recentMaintenanceRequests.map(request => ({
        id: request.id,
        title: request.title,
        description: request.description,
        status: request.status,
        priority: request.priority,
        createdAt: request.createdAt,
        property: {
          id: request.property.id,
          title: request.property.title,
          address: formatPropertyAddress(request.property)
        },
        unit: {
          id: request.unit.id,
          label: request.unit.label
        }
      })),
      upcomingTasks,
      financialSummary: {
        totalPaid,
        totalDue,
        nextPaymentDue,
        nextPaymentAmount,
        paymentReliability: Math.round(paymentReliability)
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching tenant dashboard data:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

// ---------------------------------------------- GET TENANT LEASE DETAILS ----------------------------------------------
export const getTenantLeaseDetails = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    const lease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        status: "ACTIVE"
      },
      include: {
        unit: {
          include: {
            property: true,
            amenities: true
          }
        },
        payments: {
          orderBy: { dueDate: "desc" }
        },
        landlord: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ message: "No active lease found" });
    }

    // Calculate payment statistics
    const allPayments = lease.payments;
    const totalPayments = allPayments.length;
    const paidPayments = allPayments.filter(payment => payment.status === "PAID").length;
    const pendingPayments = allPayments.filter(payment => payment.status === "PENDING").length;
    const onTimePayments = allPayments.filter(payment => 
      payment.timingStatus === "ONTIME" || payment.timingStatus === "ADVANCE"
    ).length;
    const latePayments = allPayments.filter(payment => payment.timingStatus === "LATE").length;
    const advancePayments = allPayments.filter(payment => payment.timingStatus === "ADVANCE").length;

    const totalPaidAmount = allPayments
      .filter(payment => payment.status === "PAID")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const totalPendingAmount = allPayments
      .filter(payment => payment.status === "PENDING")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const paymentReliability = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

    // Calculate lease info
    const startDate = new Date(lease.startDate);
    const endDate = lease.endDate ? new Date(lease.endDate) : null;
    const now = new Date();
    
    const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = endDate ? Math.floor((endDate - now) / (1000 * 60 * 60 * 24)) : null;
    const leaseDuration = endDate ? Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) : null;
    
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;
    const isOverdue = daysRemaining !== null && daysRemaining < 0;

    // Get recent payments (last 5)
    const recentPayments = allPayments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Get upcoming payments (next 3)
    const upcomingPayments = allPayments
      .filter(payment => payment.status === "PENDING" && new Date(payment.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3);

    // Mock lease rules (in a real app, these would come from the database)
    const leaseRules = [
      {
        id: "1",
        title: "Quiet Hours",
        description: "Please maintain quiet hours between 10 PM and 7 AM to respect your neighbors.",
        category: "Noise"
      },
      {
        id: "2", 
        title: "Pet Policy",
        description: "Pets are allowed with prior approval and additional pet deposit.",
        category: "Pets"
      },
      {
        id: "3",
        title: "Maintenance Requests",
        description: "Submit maintenance requests through the tenant portal for non-emergency issues.",
        category: "Maintenance"
      },
      {
        id: "4",
        title: "Guest Policy",
        description: "Guests may stay for up to 7 consecutive days without prior notice.",
        category: "Guests"
      }
    ];

    const leaseDetails = {
      id: lease.id,
      leaseNickname: lease.leaseNickname,
      leaseType: lease.leaseType,
      startDate: lease.startDate,
      endDate: lease.endDate,
      rentAmount: lease.rentAmount,
      interval: lease.interval,
      status: lease.status,
      hasFormalDocument: lease.hasFormalDocument,
      leaseDocumentUrl: lease.leaseDocumentUrl,
      landlordName: lease.landlordName,
      tenantName: lease.tenantName,
      notes: lease.notes,
      createdAt: lease.createdAt,
      updatedAt: lease.updatedAt,
      unit: {
        id: lease.unit.id,
        label: lease.unit.label,
        status: lease.unit.status,
        targetPrice: lease.unit.targetPrice,
        description: lease.unit.description || "No description available",
        maxOccupancy: lease.unit.maxOccupancy || 1,
        floorNumber: lease.unit.floorNumber,
        amenities: lease.unit.amenities.map(amenity => ({
          id: amenity.id,
          name: amenity.name
        })),
        property: {
          id: lease.unit.property.id,
          title: lease.unit.property.title,
          address: formatPropertyAddress(lease.unit.property),
          type: lease.unit.property.type,
          description: lease.unit.property.description || "No description available"
        }
      },
      landlord: {
        id: lease.landlord.id,
        firstName: lease.landlord.firstName,
        lastName: lease.landlord.lastName,
        email: lease.landlord.email,
        phoneNumber: lease.landlord.phoneNumber,
        avatarUrl: lease.landlord.avatarUrl
      },
      paymentStats: {
        total: totalPayments,
        paid: paidPayments,
        pending: pendingPayments,
        onTime: onTimePayments,
        late: latePayments,
        advance: advancePayments,
        totalPaidAmount,
        totalPendingAmount,
        reliability: Math.round(paymentReliability)
      },
      leaseInfo: {
        isActive: lease.status === "ACTIVE",
        isExpired: lease.status === "EXPIRED",
        isUpcoming: lease.status === "DRAFT",
        leaseDuration,
        daysElapsed,
        daysRemaining,
        isExpiringSoon,
        isOverdue
      },
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
        timingStatus: payment.timingStatus,
        dueDate: payment.dueDate,
        createdAt: payment.createdAt
      })),
      upcomingPayments: upcomingPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        dueDate: payment.dueDate,
        status: payment.status
      })),
      leaseRules
    };

    res.json(leaseDetails);
  } catch (error) {
    console.error("Error fetching tenant lease details:", error);
    res.status(500).json({ message: "Failed to fetch lease details" });
  }
};

// ---------------------------------------------- GET TENANT PAYMENTS ----------------------------------------------
export const getTenantPayments = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    const payments = await prisma.payment.findMany({
      where: {
        lease: {
          tenantId: tenantId
        }
      },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    title: true,
                    street: true,
                    barangay: true,
                    zipCode: true,
                    city: true,
                    municipality: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { dueDate: "desc" }
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching tenant payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

// ---------------------------------------------- GET TENANT MAINTENANCE REQUESTS ----------------------------------------------
export const getTenantMaintenanceRequests = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        lease: {
          tenantId: tenantId
        }
      },
      include: {
        property: {
          select: {
            title: true,
            street: true,
            barangay: true,
            zipCode: true,
            city: true,
            municipality: true
          }
        },
        unit: {
          select: {
            label: true
          }
        },
        lease: {
          select: {
            id: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(maintenanceRequests);
  } catch (error) {
    console.error("Error fetching tenant maintenance requests:", error);
    res.status(500).json({ message: "Failed to fetch maintenance requests" });
  }
};
