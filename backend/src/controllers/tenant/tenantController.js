// file: tenantController.js
import prisma from "../../libs/prismaClient.js";
import { createMessageNotification } from "../../services/notificationService.js";
import { generateLeasePDF } from "../../services/pdfService.js";

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

// Helper function to check if a conversation is an inquiry
const checkIfInquiry = async (tenantId, landlordId) => {
  try {
    // Check if the tenant has an active lease with this landlord
    const existingLease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        unit: {
          property: {
            ownerId: landlordId
          }
        },
        OR: [
          { status: "ACTIVE" },
          { status: "DRAFT" }
        ]
      }
    });

    // If no active lease exists, this is an inquiry
    return !existingLease;
  } catch (error) {
    console.error("Error checking if inquiry:", error);
    // Default to true (inquiry) if there's an error
    return true;
  }
};

// ---------------------------------------------- GET TENANT DASHBOARD DATA ----------------------------------------------
export const getTenantDashboardData = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    console.log("=== TENANT DASHBOARD DEBUG ===");
    console.log("Tenant ID:", tenantId);
    console.log("Full req.user:", req.user);
    
    if (!tenantId) {
      console.log("❌ No tenant ID found in req.user");
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    // Get current active lease (including DRAFT leases that are assigned to this tenant)
    const currentLease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        OR: [
          { status: "ACTIVE" },
          { status: "DRAFT" } // Include DRAFT leases as they are assigned to the tenant
        ]
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

    console.log("Found lease:", currentLease ? {
      id: currentLease.id,
      status: currentLease.status,
      leaseNickname: currentLease.leaseNickname,
      tenantId: currentLease.tenantId
    } : "No lease found");

    // If no lease found, let's check if there are ANY leases for this tenant
    if (!currentLease) {
      const anyLeases = await prisma.lease.findMany({
        where: { tenantId: tenantId },
        select: { id: true, status: true, tenantId: true, leaseNickname: true }
      });
      console.log("All leases for this tenant:", anyLeases);
      
      // Also check if there are leases with different tenant IDs
      const allLeases = await prisma.lease.findMany({
        select: { id: true, status: true, tenantId: true, leaseNickname: true }
      });
      console.log("All leases in database:", allLeases);
    }

    console.log("=== TENANT DASHBOARD COMPLETE ===");
    console.log("Current lease exists:", !!currentLease);
    console.log("Dashboard data will be:", currentLease ? "WITH lease data" : "WITHOUT lease data");

    // Get all leases for this tenant
    const allLeases = await prisma.lease.findMany({
      where: {
        tenantId: tenantId
      },
      include: {
        payments: true
      }
    });

    // Get maintenance requests for this tenant
    const allMaintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        reporterId: tenantId
      },
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
      },
      orderBy: { createdAt: "desc" }
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
      new Date(payment.createdAt) > new Date() && 
      new Date(payment.createdAt) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;

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
      .filter(payment => payment.status === "PENDING" && new Date(payment.createdAt) > new Date())
      .slice(0, 3)
      .map(payment => ({
        id: `payment-${payment.id}`,
        type: "payment",
        title: `Payment Due: ${payment.amount}`,
        dueDate: payment.createdAt,
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
      .filter(payment => payment.status === "PENDING" && new Date(payment.createdAt) > new Date())
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    const nextPaymentDue = nextPayment ? nextPayment.createdAt : null;
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
        rentAmount: currentLease.rentAmount,
        interval: currentLease.interval,
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
        dueDate: payment.createdAt,
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
    console.log("✅ Dashboard data sent successfully");
  } catch (error) {
    console.error("=== TENANT DASHBOARD ERROR ===");
    console.error("Error fetching tenant dashboard data:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("===============================");
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

// ---------------------------------------------- GET TENANT LEASE DETAILS ----------------------------------------------
export const getTenantLeaseDetails = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    console.log("=== TENANT LEASE DETAILS DEBUG ===");
    console.log("Tenant ID:", tenantId);
    
    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    const lease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        OR: [
          { status: "ACTIVE" },
          { status: "DRAFT" } // Include DRAFT leases as they are assigned to the tenant
        ]
      },
      include: {
        unit: {
          include: {
            property: {
              include: {
                city: true,
                municipality: true,
                owner: {
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
            },
            amenities: true
          }
        },
        payments: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    console.log("Found lease for details:", lease ? {
      id: lease.id,
      status: lease.status,
      leaseNickname: lease.leaseNickname,
      tenantId: lease.tenantId
    } : "No lease found");

    if (!lease) {
      console.log("❌ No lease found for tenant");
      return res.status(404).json({ message: "No lease found" });
    }

    // Calculate payment statistics
    const allPayments = lease.payments || [];
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
      .filter(payment => payment.status === "PENDING" && new Date(payment.createdAt) > now)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
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
        amenities: lease.unit.amenities ? lease.unit.amenities.map(amenity => ({
          id: amenity.id,
          name: amenity.name
        })) : [],
        property: {
          id: lease.unit.property.id,
          title: lease.unit.property.title,
          address: formatPropertyAddress(lease.unit.property),
          type: lease.unit.property.type,
          description: lease.unit.property.description || "No description available"
        }
      },
      landlord: {
        id: lease.unit.property.owner.id,
        firstName: lease.unit.property.owner.firstName,
        lastName: lease.unit.property.owner.lastName,
        email: lease.unit.property.owner.email,
        phoneNumber: lease.unit.property.owner.phoneNumber,
        avatarUrl: lease.unit.property.owner.avatarUrl
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
        dueDate: payment.createdAt,
        createdAt: payment.createdAt
      })),
      upcomingPayments: upcomingPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        dueDate: payment.createdAt,
        status: payment.status
      })),
      leaseRules
    };

    res.json(leaseDetails);
    console.log("✅ Lease details sent successfully");
  } catch (error) {
    console.error("=== TENANT LEASE DETAILS ERROR ===");
    console.error("Error fetching tenant lease details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("===============================");
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
      orderBy: { createdAt: "desc" }
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
        reporterId: tenantId
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

// ---------------------------------------------- CLEAR MAINTENANCE REQUEST ----------------------------------------------
export const clearMaintenanceRequest = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    const { requestId } = req.params;

    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    // Check if the maintenance request exists and belongs to this tenant
    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        reporterId: tenantId
      }
    });

    if (!maintenanceRequest) {
      return res.status(404).json({ message: "Maintenance request not found or not accessible" });
    }

    // For now, we'll just return success without modifying the database
    // The frontend will handle hiding the request from the tenant's view
    res.json({
      message: "Maintenance request cleared successfully",
      requestId: requestId
    });
  } catch (error) {
    console.error("Error clearing maintenance request:", error);
    res.status(500).json({ message: "Failed to clear maintenance request" });
  }
};

// ---------------------------------------------- SUBMIT MAINTENANCE REQUEST ----------------------------------------------
export const submitMaintenanceRequest = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    const { description } = req.body;

    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Photo is required" });
    }

    // Get the file path from the uploaded file
    const photoUrl = `/uploads/maintenance/${req.file.filename}`;

    // Get the tenant's current lease to get property and unit information
    const currentLease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        OR: [
          { status: "ACTIVE" },
          { status: "DRAFT" }
        ]
      },
      include: {
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

    if (!currentLease) {
      return res.status(404).json({ message: "No active lease found. You must have an active lease to submit maintenance requests." });
    }

    // Create the maintenance request
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        propertyId: currentLease.unit.property.id,
        unitId: currentLease.unit.id,
        reporterId: tenantId,
        description: description.trim(),
        photoUrl: photoUrl,
        status: "OPEN"
      },
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
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create notification for the landlord
    try {
      console.log("Creating notification for landlord:", currentLease.unit.property.ownerId);
      const notification = await prisma.notification.create({
        data: {
          userId: currentLease.unit.property.ownerId,
          type: "MAINTENANCE_REQUEST",
          message: `New maintenance request submitted for ${currentLease.unit.property.title} - Unit ${currentLease.unit.label}`
        }
      });
      console.log("Notification created successfully:", notification.id);
    } catch (notificationError) {
      console.error("Error creating maintenance request notification:", notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: "Maintenance request submitted successfully",
      request: maintenanceRequest
    });
  } catch (error) {
    console.error("Error submitting maintenance request:", error);
    res.status(500).json({ message: "Failed to submit maintenance request" });
  }
};

// ---------------------------------------------- BROWSE APPROVED PROPERTIES ----------------------------------------------
export const browseApprovedProperties = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      location, 
      amenities, 
      minPrice, 
      maxPrice,
      propertyType,
      sortBy = 'newest' 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause for properties with active listings
    const where = {
      Unit: {
        some: {
          listings: {
            some: {
              status: 'ACTIVE',
              expiresAt: {
                gt: new Date() // Not expired
              }
            }
          },
          status: 'AVAILABLE' // Unit must be available
        }
      }
    };

    // Add search filters
    if (search) {
      where.OR = [
        { 
          title: { contains: search, mode: 'insensitive' }
        }
      ];
    }

    // Location filter
    if (location && location !== 'ALL') {
      where.OR = [
        { city: { name: { contains: location, mode: 'insensitive' } } },
        { municipality: { name: { contains: location, mode: 'insensitive' } } }
      ];
    }

    // Property type filter
    if (propertyType && propertyType !== 'ALL') {
      where.type = propertyType;
    }

    // Price range filter - check units within the property
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      
      where.Unit.some.targetPrice = priceFilter;
    }

    // Amenities filter - check units within the property
    if (amenities) {
      const amenityList = Array.isArray(amenities) ? amenities : [amenities];
      where.Unit.some.amenities = {
        some: {
          name: {
            in: amenityList
          }
        }
      };
    }

    // Build order by clause
    let orderBy = { createdAt: 'desc' }; // default: newest
    if (sortBy === 'price_low') orderBy = { createdAt: 'desc' }; // We'll sort by min unit price later
    else if (sortBy === 'price_high') orderBy = { createdAt: 'desc' }; // We'll sort by max unit price later
    else if (sortBy === 'most_viewed') orderBy = { createdAt: 'desc' }; // We'll calculate total views later

    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          city: { select: { name: true } },
          municipality: { select: { name: true } },
          Unit: {
            where: {
              listings: {
                some: {
                  status: 'ACTIVE',
                  expiresAt: {
                    gt: new Date()
                  }
                }
              },
              status: 'AVAILABLE'
            },
            include: {
              amenities: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              },
              reviews: {
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  createdAt: true,
                  tenant: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
              },
              listings: {
                where: {
                  status: 'ACTIVE'
                },
                select: {
                  id: true,
                  createdAt: true,
                  expiresAt: true
                },
                take: 1
              }
            }
          }
        }
      }),
      prisma.property.count({ where })
    ]);

    // Format the response
    const formattedProperties = properties.map(property => {
      // Calculate aggregate data from available units
      const availableUnits = property.Unit;
      const totalViews = availableUnits.reduce((sum, unit) => sum + unit.viewCount, 0);
      const minPrice = availableUnits.length > 0 ? Math.min(...availableUnits.map(u => u.targetPrice)) : 0;
      const maxPrice = availableUnits.length > 0 ? Math.max(...availableUnits.map(u => u.targetPrice)) : 0;
      
      // Get all reviews from all units
      const allReviews = availableUnits.flatMap(unit => unit.reviews);
      const avgRating = allReviews.length > 0 
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
        : 0;

      // Get unique amenities from all units
      const allAmenities = availableUnits.flatMap(unit => unit.amenities);
      const uniqueAmenities = allAmenities.filter((amenity, index, self) => 
        index === self.findIndex(a => a.id === amenity.id)
      );

      return {
        id: property.id,
        title: property.title,
        type: property.type,
        street: property.street,
        barangay: property.barangay,
        zipCode: property.zipCode,
        mainImageUrl: property.mainImageUrl,
        nearInstitutions: property.nearInstitutions,
        createdAt: property.createdAt,
        address: `${property.street}, ${property.barangay}`,
        location: property.city?.name || property.municipality?.name || 'Unknown',
        
        // Aggregate unit data
        availableUnitsCount: availableUnits.length,
        totalViews,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        
        // Reviews and ratings
        reviews: allReviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          tenantName: `${review.tenant.firstName || ''} ${review.tenant.lastName || ''}`.trim() || 'Anonymous'
        })),
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
        
        // Amenities from all units
        amenities: uniqueAmenities,
        
        // Sample unit for display purposes
        sampleUnit: availableUnits[0] ? {
          id: availableUnits[0].id,
          label: availableUnits[0].label,
          maxOccupancy: availableUnits[0].maxOccupancy,
          floorNumber: availableUnits[0].floorNumber
        } : null
      };
    });

    res.json({
      properties: formattedProperties,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Error browsing approved properties:", error);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
};

// ---------------------------------------------- GET PROPERTY DETAILS WITH AVAILABLE UNITS ----------------------------------------------
export const getPropertyDetailsForTenant = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({ message: "Property ID is required" });
    }

    // Get property with all available units that have active listings
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        city: { select: { name: true } },
        municipality: { select: { name: true } },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true
          }
        },
        Unit: {
          where: {
            listings: {
              some: {
                status: 'ACTIVE',
                expiresAt: {
                  gt: new Date()
                }
              }
            },
            status: 'AVAILABLE'
          },
          include: {
            amenities: {
              select: {
                id: true,
                name: true,
                category: true
              }
            },
            reviews: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                tenant: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            },
            listings: {
              where: {
                status: 'ACTIVE'
              },
              select: {
                id: true,
                createdAt: true,
                expiresAt: true
              },
              take: 1
            }
          },
          orderBy: { label: 'asc' }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found or no available units" });
    }

    // Format the response
    const formattedProperty = {
      id: property.id,
      title: property.title,
      type: property.type,
      street: property.street,
      barangay: property.barangay,
      zipCode: property.zipCode,
      mainImageUrl: property.mainImageUrl,
      nearInstitutions: property.nearInstitutions,
      latitude: property.latitude,
      longitude: property.longitude,
      createdAt: property.createdAt,
      address: `${property.street}, ${property.barangay}`,
      location: property.city?.name || property.municipality?.name || 'Unknown',
      
      // Owner information
      owner: {
        id: property.owner.id,
        name: `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() || property.owner.email,
        email: property.owner.email,
        phoneNumber: property.owner.phoneNumber,
        avatarUrl: property.owner.avatarUrl
      },
      
      // Available units
      availableUnits: property.Unit.map(unit => {
        const avgRating = unit.reviews.length > 0 
          ? unit.reviews.reduce((sum, review) => sum + review.rating, 0) / unit.reviews.length 
          : 0;

        return {
          id: unit.id,
          label: unit.label,
          description: unit.description,
          status: unit.status,
          mainImageUrl: unit.mainImageUrl,
          otherImages: unit.otherImages,
          viewCount: unit.viewCount,
          targetPrice: unit.targetPrice,
          securityDeposit: unit.securityDeposit,
          maxOccupancy: unit.maxOccupancy,
          floorNumber: unit.floorNumber,
          unitLeaseRules: unit.unitLeaseRules,
          requiresScreening: unit.requiresScreening,
          createdAt: unit.createdAt,
          listedAt: unit.listings[0]?.createdAt,
          
          amenities: unit.amenities,
          
          reviews: unit.reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            tenantName: `${review.tenant.firstName || ''} ${review.tenant.lastName || ''}`.trim() || 'Anonymous'
          })),
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: unit.reviews.length
        };
      }),
      
      // Property-level aggregates
      totalAvailableUnits: property.Unit.length,
      priceRange: {
        min: property.Unit.length > 0 ? Math.min(...property.Unit.map(u => u.targetPrice)) : 0,
        max: property.Unit.length > 0 ? Math.max(...property.Unit.map(u => u.targetPrice)) : 0
      },
      totalViews: property.Unit.reduce((sum, unit) => sum + unit.viewCount, 0),
      
      // All amenities available in the property
      allAmenities: property.Unit.flatMap(unit => unit.amenities)
        .filter((amenity, index, self) => index === self.findIndex(a => a.id === amenity.id)),
      
      // All reviews for the property
      allReviews: property.Unit.flatMap(unit => unit.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        tenantName: `${review.tenant.firstName || ''} ${review.tenant.lastName || ''}`.trim() || 'Anonymous',
        unitLabel: unit.label
      }))),
      
      avgRating: property.Unit.length > 0 ? 
        Math.round((property.Unit.flatMap(unit => unit.reviews)
          .reduce((sum, review) => sum + review.rating, 0) / 
          Math.max(property.Unit.flatMap(unit => unit.reviews).length, 1)) * 10) / 10 : 0,
      
      totalReviews: property.Unit.flatMap(unit => unit.reviews).length
    };

    res.json(formattedProperty);
  } catch (error) {
    console.error("Error fetching property details:", error);
    res.status(500).json({ message: "Failed to fetch property details" });
  }
};

// ---------------------------------------------- SUBMIT TENANT APPLICATION ----------------------------------------------
export const submitTenantApplication = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    const { unitId } = req.params;
    const {
      // Personal Information
      fullName,
      birthdate,
      governmentIdNumber,
      
      // Employment & Financial
      employmentStatus,
      employerName,
      monthlyIncome,
      
      // Background & References
      previousLandlordName,
      previousLandlordContact,
      rentalHistoryNotes,
      characterReferences,
      
      // Lifestyle
      isSmoker,
      hasPets,
      petTypes,
      otherLifestyle,
      
      // Document URLs (if uploaded)
      idImageUrl,
      selfieUrl,
      nbiClearanceUrl,
      biodataUrl,
      proofOfIncomeUrl
    } = req.body;

    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    if (!unitId) {
      return res.status(400).json({ message: "Unit ID is required" });
    }

    // Verify the unit exists and is available
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            ownerId: true
          }
        },
        listings: {
          where: {
            status: 'ACTIVE',
            expiresAt: {
              gt: new Date()
            }
          },
          take: 1
        }
      }
    });

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    if (unit.status !== 'AVAILABLE') {
      return res.status(400).json({ message: "Unit is not available for applications" });
    }

    if (unit.listings.length === 0) {
      return res.status(400).json({ message: "Unit is not actively listed" });
    }

    // Check if tenant already has an active lease
    const existingActiveLease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        OR: [
          { status: "ACTIVE" },
          { status: "DRAFT" } // Include DRAFT leases as they are assigned to the tenant
        ]
      }
    });

    if (existingActiveLease) {
      return res.status(400).json({ 
        message: "You already have an active lease. Please contact your current landlord to terminate your existing lease before applying for a new property.",
        code: "ACTIVE_LEASE_EXISTS"
      });
    }

    // Check if tenant already has a pending application for this unit
    const existingApplication = await prisma.tenantScreening.findFirst({
      where: {
        tenantId,
        unitId
      }
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You already have an application for this unit" });
    }

    // Create the tenant screening/application record
    const application = await prisma.tenantScreening.create({
      data: {
        tenantId,
        unitId,
        
        // Personal Information
        fullName: fullName || '',
        birthdate: birthdate ? new Date(birthdate) : null,
        governmentIdNumber: governmentIdNumber || null,
        
        // Employment & Financial
        employmentStatus: employmentStatus || null,
        employerName: employerName || null,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        
        // Background & References
        previousLandlordName: previousLandlordName || null,
        previousLandlordContact: previousLandlordContact || null,
        rentalHistoryNotes: rentalHistoryNotes || null,
        characterReferences: characterReferences || null,
        
        // Lifestyle
        isSmoker: isSmoker || false,
        hasPets: hasPets || false,
        petTypes: petTypes || null,
        otherLifestyle: otherLifestyle || null,
        
        // Document URLs
        idImageUrl: idImageUrl || null,
        selfieUrl: selfieUrl || null,
        nbiClearanceUrl: nbiClearanceUrl || null,
        biodataUrl: biodataUrl || null,
        proofOfIncomeUrl: proofOfIncomeUrl || null,
        
        // AI Analysis (will be calculated later)
        aiRiskScore: 0.2, // Default low risk
        riskLevel: 'LOW',
        aiScreeningSummary: 'Application submitted - pending review'
      }
    });

    // Create notification for landlord
    await prisma.notification.create({
      data: {
        userId: unit.property.ownerId,
        type: 'APPLICATION',
        message: `New tenant application received for ${unit.property.title} - Unit ${unit.label}`,
        status: 'UNREAD'
      }
    });

    res.json({
      message: "Application submitted successfully",
      application: {
        id: application.id,
        unitId: application.unitId,
        status: 'SUBMITTED',
        submittedAt: application.createdAt
      }
    });
  } catch (error) {
    console.error("Error submitting tenant application:", error);
    res.status(500).json({ message: "Failed to submit application" });
  }
};

// ---------------------------------------------- DELETE TENANT MESSAGE ----------------------------------------------
export const deleteTenantMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" });
    }

    // Find the message and verify ownership
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId, // Only sender can delete their own message
      },
      include: {
        conversation: true
      }
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found or not accessible" });
    }

    // Check if this is already a deleted message placeholder
    if (message.content === "This message was deleted") {
      // Permanently delete the placeholder message from database
      await prisma.message.delete({
        where: { id: messageId }
      });

      return res.json({
        message: "Message permanently deleted",
        permanentlyDeleted: true
      });
    } else {
      // Mark message as deleted (soft delete)
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: "This message was deleted"
        }
      });

      return res.json({
        message: "Message deleted successfully",
        deletedMessage: {
          id: updatedMessage.id,
          content: updatedMessage.content
        }
      });
    }
  } catch (error) {
    console.error("Error deleting tenant message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
};

// ---------------------------------------------- DELETE TENANT CONVERSATION ----------------------------------------------
export const deleteTenantConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const tenantId = req.user?.id;

    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    // Find the conversation and verify the tenant has access to it
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userAId: tenantId },
          { userBId: tenantId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or not accessible" });
    }

    // Check if this is a conversation with the tenant's current landlord
    const otherUserId = conversation.userAId === tenantId ? conversation.userBId : conversation.userAId;
    const isInquiry = await checkIfInquiry(tenantId, otherUserId);
    
    // If it's NOT an inquiry, it means they have a lease (current landlord) - prevent deletion
    if (!isInquiry) {
      return res.status(403).json({ 
        message: "Cannot delete conversation with your current landlord. This conversation is protected." 
      });
    }

    // Delete the conversation and all its messages
    await prisma.conversation.delete({
      where: { id: conversationId }
    });

    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant conversation:", error);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
};

// ---------------------------------------------- GET TENANT APPLICATIONS ----------------------------------------------
export const getTenantApplications = async (req, res) => {
  try {
    const tenantId = req.user?.id;

    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    const applications = await prisma.tenantScreening.findMany({
      where: { tenantId },
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
                municipality: { select: { name: true } },
                mainImageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: 'PENDING', // You can add status field to schema later
      submittedAt: app.createdAt,
      riskLevel: app.riskLevel,
      aiRiskScore: app.aiRiskScore,
      unit: {
        id: app.unit.id,
        label: app.unit.label,
        targetPrice: app.unit.targetPrice,
        property: {
          id: app.unit.property.id,
          title: app.unit.property.title,
          address: `${app.unit.property.street}, ${app.unit.property.barangay}`,
          location: app.unit.property.city?.name || app.unit.property.municipality?.name || 'Unknown',
          mainImageUrl: app.unit.property.mainImageUrl
        }
      }
    }));

    res.json(formattedApplications);
  } catch (error) {
    console.error("Error fetching tenant applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

// ---------------------------------------------- GET TENANT CONVERSATIONS ----------------------------------------------
export const getTenantConversations = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    // First, get the tenant's assigned landlord from their lease
    const currentLease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        OR: [
          { status: "ACTIVE" },
          { status: "DRAFT" }
        ]
      },
      include: {
        unit: {
          include: {
            property: {
              include: {
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    // Get all existing conversations where the tenant is either userA or userB
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userAId: tenantId },
          { userBId: tenantId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        userB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: tenantId }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    });

    // Format the response
    const formattedConversations = await Promise.all(conversations.map(async (conversation) => {
      const otherUser = conversation.userAId === tenantId ? conversation.userB : conversation.userA;
      const lastMessage = conversation.messages[0] || null;
      
      // Calculate time ago
      const now = new Date();
      const updatedAt = new Date(conversation.updatedAt);
      const diffTime = now.getTime() - updatedAt.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.ceil(diffTime / (1000 * 60));
      
      let timeAgo;
      if (diffDays > 0) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = "Just now";
      }

      // Check if this is an inquiry dynamically
      const isInquiry = await checkIfInquiry(tenantId, otherUser.id);

      return {
        id: conversation.id,
        title: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        otherUser: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          email: otherUser.email,
          avatarUrl: otherUser.avatarUrl,
          role: otherUser.role,
          fullName: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        },
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          isRead: lastMessage.isRead,
          createdAt: lastMessage.createdAt,
          sender: {
            id: lastMessage.sender.id,
            firstName: lastMessage.sender.firstName,
            lastName: lastMessage.sender.lastName,
            avatarUrl: lastMessage.sender.avatarUrl,
            fullName: `${lastMessage.sender.firstName || ''} ${lastMessage.sender.lastName || ''}`.trim() || lastMessage.sender.email,
          }
        } : null,
        unreadCount: conversation._count.messages,
        timeAgo,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        isInquiry: isInquiry, // Dynamic inquiry check
      };
    }));

    // If the tenant has an assigned landlord, check if there's already a conversation with them
    let landlordConversation = null;
    if (currentLease && currentLease.unit.property.owner) {
      const landlord = currentLease.unit.property.owner;
      
      // Check if there's already a conversation with this landlord
      const existingConversation = formattedConversations.find(conv => 
        conv.otherUser.id === landlord.id
      );
      
      if (!existingConversation) {
        // Create a virtual conversation entry for the landlord
        landlordConversation = {
          id: null, // No conversation ID yet
          title: `${landlord.firstName || ''} ${landlord.lastName || ''}`.trim() || landlord.email,
          otherUser: {
            id: landlord.id,
            firstName: landlord.firstName,
            lastName: landlord.lastName,
            email: landlord.email,
            avatarUrl: landlord.avatarUrl,
            role: landlord.role,
            fullName: `${landlord.firstName || ''} ${landlord.lastName || ''}`.trim() || landlord.email,
          },
          lastMessage: null,
          unreadCount: 0,
          timeAgo: null,
          createdAt: null,
          updatedAt: null,
          isLandlord: true, // Flag to indicate this is the assigned landlord
          isInquiry: false, // This is the current landlord, not an inquiry
        };
      }
    }

    // Combine existing conversations with the landlord entry
    const allConversations = [];
    if (landlordConversation) {
      allConversations.push(landlordConversation);
    }
    allConversations.push(...formattedConversations);

    res.json(allConversations);
  } catch (error) {
    console.error("Error fetching tenant conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// ---------------------------------------------- GET TENANT CONVERSATION MESSAGES ----------------------------------------------
export const getTenantConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const tenantId = req.user?.id;

    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    // Verify the conversation belongs to the tenant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userAId: tenantId },
          { userBId: tenantId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        userB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or not accessible" });
    }

    // Get all messages for this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read (only messages from other user)
    await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: tenantId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Format the response
    const otherUser = conversation.userAId === tenantId ? conversation.userB : conversation.userA;
    const formattedMessages = messages.map(message => ({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        email: message.sender.email,
        avatarUrl: message.sender.avatarUrl,
        role: message.sender.role,
        fullName: `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email,
      }
    }));

    res.json({
      conversation: {
        id: conversation.id,
        title: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        otherUser: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          email: otherUser.email,
          avatarUrl: otherUser.avatarUrl,
          role: otherUser.role,
          fullName: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        },
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Error fetching tenant conversation messages:", error);
    res.status(500).json({ message: "Failed to fetch conversation messages" });
  }
};

// ---------------------------------------------- SEND TENANT MESSAGE ----------------------------------------------
export const sendTenantMessage = async (req, res) => {
  try {
    const { conversationId, content, recipientId } = req.body;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    let conversation;

    if (conversationId) {
      // Existing conversation
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { userAId: senderId },
            { userBId: senderId }
          ]
        }
      });

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found or not accessible" });
      }
    } else if (recipientId) {
      // New conversation - check if one already exists
      conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { userAId: senderId, userBId: recipientId },
            { userAId: recipientId, userBId: senderId }
          ]
        }
      });

      if (!conversation) {
        // Create new conversation
        conversation = await prisma.conversation.create({
          data: {
            userAId: senderId,
            userBId: recipientId,
            title: null, // Will be auto-generated
          }
        });
      }
    } else {
      return res.status(400).json({ message: "Either conversationId or recipientId is required" });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      }
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // Get the recipient (other user in the conversation)
    const messageRecipientId = conversation.userAId === senderId ? conversation.userBId : conversation.userAId;

    // Create notification for the recipient
    try {
      await createMessageNotification(messageRecipientId, {
        sender: message.sender,
        content: message.content,
        conversation: { id: conversation.id }
      });
    } catch (notificationError) {
      console.error("Error creating message notification:", notificationError);
      // Don't fail the message send if notification fails
    }

    return res.json({
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          email: message.sender.email,
          avatarUrl: message.sender.avatarUrl,
          role: message.sender.role,
          fullName: `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email,
        }
      }
    });
  } catch (error) {
    console.error("Error sending tenant message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// ---------------------------------------------- CREATE OR GET TENANT CONVERSATION ----------------------------------------------
export const createOrGetTenantConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (!otherUserId) {
      return res.status(400).json({ message: "Other user ID is required" });
    }

    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: currentUserId, userBId: otherUserId },
          { userAId: otherUserId, userBId: currentUserId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        userB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      }
    });

    // If conversation doesn't exist, create it
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId: currentUserId,
          userBId: otherUserId,
        },
        include: {
          userA: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
            }
          },
          userB: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
            }
          }
        }
      });
    }

    // Format the response
    const otherUser = conversation.userAId === currentUserId ? conversation.userB : conversation.userA;
    
    // Check if this is an inquiry dynamically
    const isInquiry = await checkIfInquiry(currentUserId, otherUser.id);
    
    res.json({
      conversation: {
        id: conversation.id,
        title: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        otherUser: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          email: otherUser.email,
          avatarUrl: otherUser.avatarUrl,
          role: otherUser.role,
          fullName: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        },
        isInquiry: isInquiry, // Dynamic inquiry check
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      }
    });
  } catch (error) {
    console.error("Error creating or getting tenant conversation:", error);
    res.status(500).json({ message: "Failed to create or get conversation" });
  }
};

// ---------------------------------------------- GET TENANT MESSAGE STATS ----------------------------------------------
export const getTenantMessageStats = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    // Get conversation count
    const totalConversations = await prisma.conversation.count({
      where: {
        OR: [
          { userAId: tenantId },
          { userBId: tenantId }
        ]
      }
    });

    // Get total messages count
    const totalMessages = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { userAId: tenantId },
            { userBId: tenantId }
          ]
        }
      }
    });

    // Get unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { userAId: tenantId },
            { userBId: tenantId }
          ]
        },
        senderId: { not: tenantId },
        isRead: false
      }
    });

    // Get recent conversations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentConversations = await prisma.conversation.count({
      where: {
        OR: [
          { userAId: tenantId },
          { userBId: tenantId }
        ],
        updatedAt: {
          gte: sevenDaysAgo
        }
      }
    });

    res.json({
      totalConversations,
      totalMessages,
      unreadMessages,
      recentConversations
    });
  } catch (error) {
    console.error("Error fetching tenant message stats:", error);
    res.status(500).json({ message: "Failed to fetch message statistics" });
  }
};

// ---------------------------------------------- DOWNLOAD LEASE PDF (TENANT) ----------------------------------------------
export const downloadLeasePDF = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const tenantId = req.user?.id;

    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: tenant not found" });
    }

    if (!leaseId) {
      return res.status(400).json({ message: "Lease ID is required" });
    }

    // Get the lease with all related data - verify tenant has access
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        tenantId: tenantId // Ensure tenant can only access their own lease
      },
      include: {
        unit: {
          include: {
            property: {
              include: {
                city: true,
                municipality: true,
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phoneNumber: true,
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ message: "Lease not found or not accessible" });
    }

    // Generate PDF
    const pdfBuffer = await generateLeasePDF(lease);

    // Set response headers for PDF download
    const fileName = `my-lease-${lease.leaseNickname || lease.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error downloading lease PDF:", error);
    res.status(500).json({ message: "Failed to download lease PDF" });
  }
};