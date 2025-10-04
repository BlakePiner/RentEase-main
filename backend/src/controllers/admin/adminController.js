// file: adminController.js
import prisma from "../../libs/prismaClient.js";

// ---------------------------------------------- GET ADMIN DASHBOARD STATS ----------------------------------------------
export const getAdminDashboardStats = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User Statistics
    const totalUsers = await prisma.user.count();
    const totalLandlords = await prisma.user.count({ where: { role: "LANDLORD" } });
    const totalTenants = await prisma.user.count({ where: { role: "TENANT" } });
    const disabledUsers = await prisma.user.count({ where: { isDisabled: true } });
    
    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: startOfMonth } }
    });
    const newUsersLastMonth = await prisma.user.count({
      where: { 
        createdAt: { 
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    });

    // Property Statistics
    const totalProperties = await prisma.property.count();
    const totalUnits = await prisma.unit.count();
    const occupiedUnits = await prisma.unit.count({ where: { status: "OCCUPIED" } });
    const availableUnits = await prisma.unit.count({ where: { status: "AVAILABLE" } });
    const maintenanceUnits = await prisma.unit.count({ where: { status: "MAINTENANCE" } });
    
    const newPropertiesThisMonth = await prisma.property.count({
      where: { createdAt: { gte: startOfMonth } }
    });

    // Lease Statistics
    const totalLeases = await prisma.lease.count();
    const activeLeases = await prisma.lease.count({ where: { status: "ACTIVE" } });
    const expiredLeases = await prisma.lease.count({ where: { status: "EXPIRED" } });
    const terminatedLeases = await prisma.lease.count({ where: { status: "TERMINATED" } });
    
    const newLeasesThisMonth = await prisma.lease.count({
      where: { createdAt: { gte: startOfMonth } }
    });

    // Payment Statistics
    const totalPayments = await prisma.payment.count();
    const paidPayments = await prisma.payment.count({ where: { status: "PAID" } });
    const pendingPayments = await prisma.payment.count({ where: { status: "PENDING" } });
    // Note: OVERDUE status might not exist in schema, using timingStatus instead
    const overduePayments = await prisma.payment.count({ where: { timingStatus: "LATE" } });
    
    const totalPaymentAmount = await prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true }
    });
    
    const monthlyRevenue = await prisma.payment.aggregate({
      where: { 
        status: "PAID",
        paidAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    // Maintenance Statistics
    const totalMaintenanceRequests = await prisma.maintenanceRequest.count();
    const pendingMaintenance = await prisma.maintenanceRequest.count({ 
      where: { status: "OPEN" } 
    });
    const inProgressMaintenance = await prisma.maintenanceRequest.count({ 
      where: { status: "IN_PROGRESS" } 
    });
    const completedMaintenance = await prisma.maintenanceRequest.count({ 
      where: { status: "RESOLVED" } 
    });

    // Recent Activity
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        isDisabled: true
      }
    });

    const recentProperties = await prisma.property.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        city: true,
        municipality: true,
        createdAt: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        lease: {
          select: {
            tenant: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
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

    // System Health Metrics
    const systemHealth = {
      totalUsers,
      activeUsers: totalUsers - disabledUsers,
      occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
      paymentSuccessRate: totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0,
      maintenanceResponseRate: totalMaintenanceRequests > 0 ? Math.round((completedMaintenance / totalMaintenanceRequests) * 100) : 0
    };

    // Growth Metrics
    const userGrowthRate = newUsersLastMonth > 0 
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : newUsersThisMonth > 0 ? 100 : 0;

    const dashboardStats = {
      overview: {
        totalUsers,
        totalLandlords,
        totalTenants,
        disabledUsers,
        totalProperties,
        totalUnits,
        occupiedUnits,
        availableUnits,
        maintenanceUnits,
        totalLeases,
        activeLeases,
        totalPayments,
        pendingPayments,
        overduePayments,
        totalMaintenanceRequests,
        pendingMaintenance
      },
      financial: {
        totalRevenue: totalPaymentAmount._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        paidPayments,
        pendingPayments,
        overduePayments
      },
      growth: {
        newUsersThisMonth,
        newUsersLastMonth,
        userGrowthRate,
        newPropertiesThisMonth,
        newLeasesThisMonth
      },
      systemHealth,
      recentActivity: {
        users: recentUsers.map(user => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          isDisabled: user.isDisabled
        })),
        properties: recentProperties.map(property => ({
          id: property.id,
          title: property.title,
          type: property.type,
          location: `${property.city}, ${property.municipality}`,
          createdAt: property.createdAt,
          owner: `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() || property.owner.email
        })),
        payments: recentPayments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          tenant: `${payment.lease.tenant.firstName || ''} ${payment.lease.tenant.lastName || ''}`.trim() || payment.lease.tenant.email,
          property: payment.lease.unit.property.title,
          unit: payment.lease.unit.label
        }))
      }
    };

    res.json(dashboardStats);
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ 
      message: "Failed to fetch dashboard statistics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ---------------------------------------------- GET ALL USERS ----------------------------------------------
export const getAllUsers = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    const { page = 1, limit = 20, role, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (role && role !== 'ALL') {
      where.role = role;
    }
    
    if (status === 'DISABLED') {
      where.isDisabled = true;
    } else if (status === 'ACTIVE') {
      where.isDisabled = false;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isDisabled: true,
          isVerified: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              Property: true,
              Lease: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User',
      email: user.email,
      role: user.role,
      isDisabled: user.isDisabled,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      propertiesCount: user._count.Property,
      leasesCount: user._count.Lease
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ---------------------------------------------- TOGGLE USER STATUS ----------------------------------------------
export const toggleUserStatus = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { userId } = req.params;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Don't allow disabling other admins
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isDisabled: true, email: true }
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === "ADMIN") {
      return res.status(403).json({ message: "Cannot disable admin users" });
    }

    // Toggle the disabled status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isDisabled: !targetUser.isDisabled },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isDisabled: true
      }
    });

    res.json({
      message: `User ${updatedUser.isDisabled ? 'disabled' : 'enabled'} successfully`,
      user: {
        id: updatedUser.id,
        name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email,
        email: updatedUser.email,
        role: updatedUser.role,
        isDisabled: updatedUser.isDisabled
      }
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
};

// ---------------------------------------------- GET SYSTEM ANALYTICS ----------------------------------------------
export const getSystemAnalytics = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    let groupBy;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupBy = 'week';
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = 'month';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
    }

    // User registration trends
    const userRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    });

    // Property creation trends
    const propertyCreations = await prisma.property.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    });

    // Payment trends
    const paymentTrends = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
        status: 'PAID'
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Top performing properties
    const topProperties = await prisma.property.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        city: true,
        municipality: true,
        _count: {
          select: {
            units: true
          }
        },
        units: {
          select: {
            leases: {
              where: { status: 'ACTIVE' },
              select: {
                payments: {
                  where: { status: 'PAID' },
                  select: { amount: true }
                }
              }
            }
          }
        }
      }
    });

    const analytics = {
      period,
      dateRange: { start: startDate, end: now },
      trends: {
        userRegistrations: userRegistrations.length,
        propertyCreations: propertyCreations.length,
        totalRevenue: paymentTrends.reduce((sum, payment) => sum + (payment._sum.amount || 0), 0),
        totalTransactions: paymentTrends.reduce((sum, payment) => sum + payment._count.id, 0)
      },
      topProperties: topProperties.map(property => ({
        id: property.id,
        title: property.title,
        location: `${property.city}, ${property.municipality}`,
        unitsCount: property._count.units,
        totalRevenue: property.units.reduce((sum, unit) => 
          sum + unit.leases.reduce((leaseSum, lease) => 
            leaseSum + lease.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0), 0)
      })).sort((a, b) => b.totalRevenue - a.totalRevenue)
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching system analytics:", error);
    res.status(500).json({ message: "Failed to fetch system analytics" });
  }
};

// ---------------------------------------------- GET PROPERTY REQUESTS ----------------------------------------------
export const getPropertyRequests = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { 
          unit: {
            property: {
              title: { contains: search, mode: 'insensitive' }
            }
          }
        },
        { 
          unit: {
            label: { contains: search, mode: 'insensitive' }
          }
        },
        {
          landlord: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          unit: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  street: true,
                  barangay: true,
                  city: { select: { name: true } },
                  municipality: { select: { name: true } },
                  mainImageUrl: true
                }
              },
              amenities: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          },
          landlord: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      }),
      prisma.listing.count({ where })
    ]);

    const formattedListings = listings.map(listing => ({
      id: listing.id,
      status: listing.status,
      amount: listing.amount,
      paymentStatus: listing.paymentStatus,
      attemptCount: listing.attemptCount,
      riskLevel: listing.riskLevel,
      fraudRiskScore: listing.fraudRiskScore,
      adminNotes: listing.adminNotes,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      unit: {
        id: listing.unit.id,
        label: listing.unit.label,
        description: listing.unit.description,
        status: listing.unit.status,
        targetPrice: listing.unit.targetPrice,
        securityDeposit: listing.unit.securityDeposit,
        maxOccupancy: listing.unit.maxOccupancy,
        floorNumber: listing.unit.floorNumber,
        mainImageUrl: listing.unit.mainImageUrl,
        amenities: listing.unit.amenities,
        property: {
          id: listing.unit.property.id,
          title: listing.unit.property.title,
          type: listing.unit.property.type,
          address: `${listing.unit.property.street}, ${listing.unit.property.barangay}`,
          location: listing.unit.property.city?.name || listing.unit.property.municipality?.name || 'Unknown',
          mainImageUrl: listing.unit.property.mainImageUrl
        }
      },
      landlord: {
        id: listing.landlord.id,
        name: `${listing.landlord.firstName || ''} ${listing.landlord.lastName || ''}`.trim() || listing.landlord.email,
        email: listing.landlord.email,
        avatarUrl: listing.landlord.avatarUrl
      }
    }));

    res.json({
      listings: formattedListings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Error fetching property requests:", error);
    res.status(500).json({ message: "Failed to fetch property requests" });
  }
};

// ---------------------------------------------- APPROVE/REJECT PROPERTY REQUEST ----------------------------------------------
export const updatePropertyRequestStatus = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { listingId } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    if (!listingId) {
      return res.status(400).json({ message: "Listing ID is required" });
    }

    if (!status || !['APPROVED', 'REJECTED', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ message: "Valid status is required (APPROVED, REJECTED, BLOCKED)" });
    }

    // Get the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        unit: {
          include: {
            property: {
              select: {
                title: true,
                ownerId: true
              }
            }
          }
        },
        landlord: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.status !== 'PENDING') {
      return res.status(400).json({ message: "Only pending listings can be updated" });
    }

    // Prepare update data
    const updateData = {
      status,
      updatedAt: new Date()
    };

    // Add admin notes if provided
    if (adminNotes) {
      const currentNotes = listing.adminNotes || [];
      const newNote = {
        date: new Date().toISOString(),
        comment: adminNotes,
        adminId: adminId
      };
      updateData.adminNotes = [...currentNotes, newNote];
    }

    // If approved, set expiration date and activate listing
    if (status === 'APPROVED') {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3); // 3 months validity
      updateData.expiresAt = expiresAt;
      updateData.status = 'ACTIVE'; // Directly activate approved listings
      
      // Update unit listing status
      await prisma.unit.update({
        where: { id: listing.unitId },
        data: { listedAt: new Date() }
      });
    }

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: updateData,
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
        landlord: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create notification for landlord
    const notificationMessage = status === 'APPROVED' 
      ? `Your listing request for ${listing.unit.property.title} - ${listing.unit.label} has been approved and is now active!`
      : status === 'REJECTED'
      ? `Your listing request for ${listing.unit.property.title} - ${listing.unit.label} has been rejected. ${adminNotes ? 'Reason: ' + adminNotes : ''}`
      : `Your listing request for ${listing.unit.property.title} - ${listing.unit.label} has been blocked.`;

    await prisma.notification.create({
      data: {
        userId: listing.landlordId,
        type: 'LISTING',
        message: notificationMessage,
        status: 'UNREAD'
      }
    });

    res.json({
      message: `Listing ${status.toLowerCase()} successfully`,
      listing: {
        id: updatedListing.id,
        status: updatedListing.status,
        expiresAt: updatedListing.expiresAt,
        adminNotes: updatedListing.adminNotes
      }
    });
  } catch (error) {
    console.error("Error updating property request status:", error);
    res.status(500).json({ message: "Failed to update property request status" });
  }
};

// ---------------------------------------------- GET ALL PROPERTIES ----------------------------------------------
export const getAllProperties = async (req, res) => {
  try {
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      type = "", 
      status = "" 
    } = req.query;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { street: { contains: search, mode: 'insensitive' } },
        { barangay: { contains: search, mode: 'insensitive' } },
        { owner: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get properties with owner and unit information
    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isDisabled: true
            }
          },
          Unit: {
            select: {
              id: true,
              label: true,
              status: true,
              targetPrice: true
            }
          },
          _count: {
            select: {
              Unit: true,
              MaintenanceRequest: true
            }
          }
        }
      }),
      prisma.property.count({ where })
    ]);

    // Format properties for response
    const formattedProperties = properties.map(property => ({
      id: property.id,
      title: property.title,
      type: property.type,
      address: `${property.street}, ${property.barangay}`,
      city: property.city?.name || property.municipality?.name || 'N/A',
      zipCode: property.zipCode,
      mainImageUrl: property.mainImageUrl,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      owner: {
        id: property.owner.id,
        name: `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() || property.owner.email,
        email: property.owner.email,
        isDisabled: property.owner.isDisabled
      },
      unitsCount: property._count.Unit,
      maintenanceRequestsCount: property._count.MaintenanceRequest,
      units: property.Unit.map(unit => ({
        id: unit.id,
        label: unit.label,
        status: unit.status,
        targetPrice: unit.targetPrice
      }))
    }));

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      properties: formattedProperties,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
};

// ---------------------------------------------- GET ALL PAYMENTS ----------------------------------------------
export const getAllPayments = async (req, res) => {
  try {
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      status = "", 
      method = "",
      timingStatus = ""
    } = req.query;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { lease: { 
          OR: [
            { leaseNickname: { contains: search, mode: 'insensitive' } },
            { tenant: { 
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }},
            { unit: { 
              property: {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { street: { contains: search, mode: 'insensitive' } },
                  { barangay: { contains: search, mode: 'insensitive' } }
                ]
              }
            }}
          ]
        }}
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (method && method !== 'all') {
      where.method = method;
    }

    if (timingStatus && timingStatus !== 'all') {
      where.timingStatus = timingStatus;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get payments with related information
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          lease: {
            include: {
              tenant: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  isDisabled: true
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
                      owner: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          email: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    // Format payments for response
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paidAt: payment.paidAt,
      method: payment.method,
      providerTxnId: payment.providerTxnId,
      status: payment.status,
      timingStatus: payment.timingStatus,
      isPartial: payment.isPartial,
      note: payment.note,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      lease: {
        id: payment.lease.id,
        leaseNickname: payment.lease.leaseNickname,
        leaseType: payment.lease.leaseType,
        startDate: payment.lease.startDate,
        endDate: payment.lease.endDate,
        rentAmount: payment.lease.rentAmount,
        interval: payment.lease.interval,
        status: payment.lease.status,
        tenant: {
          id: payment.lease.tenant.id,
          name: `${payment.lease.tenant.firstName || ''} ${payment.lease.tenant.lastName || ''}`.trim() || payment.lease.tenant.email,
          email: payment.lease.tenant.email,
          isDisabled: payment.lease.tenant.isDisabled
        },
        unit: {
          id: payment.lease.unit.id,
          label: payment.lease.unit.label,
          property: {
            id: payment.lease.unit.property.id,
            title: payment.lease.unit.property.title,
            address: `${payment.lease.unit.property.street}, ${payment.lease.unit.property.barangay}`,
            owner: {
              id: payment.lease.unit.property.owner.id,
              name: `${payment.lease.unit.property.owner.firstName || ''} ${payment.lease.unit.property.owner.lastName || ''}`.trim() || payment.lease.unit.property.owner.email,
              email: payment.lease.unit.property.owner.email
            }
          }
        }
      }
    }));

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      payments: formattedPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

// ---------------------------------------------- GET PAYMENT ANALYTICS ----------------------------------------------
export const getPaymentAnalytics = async (req, res) => {
  try {
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get payment statistics
    const [
      totalPayments,
      totalAmount,
      paidPayments,
      pendingPayments,
      onTimePayments,
      latePayments,
      advancePayments,
      partialPayments,
      paymentMethods,
      monthlyRevenue
    ] = await Promise.all([
      // Total payments count
      prisma.payment.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Total amount
      prisma.payment.aggregate({
        where: { 
          createdAt: { gte: startDate },
          status: 'PAID'
        },
        _sum: { amount: true }
      }),
      
      // Paid payments count
      prisma.payment.count({
        where: { 
          createdAt: { gte: startDate },
          status: 'PAID'
        }
      }),
      
      // Pending payments count
      prisma.payment.count({
        where: { 
          createdAt: { gte: startDate },
          status: 'PENDING'
        }
      }),
      
      // On-time payments count
      prisma.payment.count({
        where: { 
          createdAt: { gte: startDate },
          timingStatus: 'ONTIME'
        }
      }),
      
      // Late payments count
      prisma.payment.count({
        where: { 
          createdAt: { gte: startDate },
          timingStatus: 'LATE'
        }
      }),
      
      // Advance payments count
      prisma.payment.count({
        where: { 
          createdAt: { gte: startDate },
          timingStatus: 'ADVANCE'
        }
      }),
      
      // Partial payments count
      prisma.payment.count({
        where: { 
          createdAt: { gte: startDate },
          isPartial: true
        }
      }),
      
      // Payment methods breakdown
      prisma.payment.groupBy({
        by: ['method'],
        where: { 
          createdAt: { gte: startDate },
          status: 'PAID'
        },
        _count: { method: true },
        _sum: { amount: true }
      }),
      
      // Monthly revenue (last 12 months)
      prisma.payment.groupBy({
        by: ['createdAt'],
        where: { 
          status: 'PAID',
          createdAt: { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
        },
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    res.json({
      summary: {
        totalPayments,
        totalAmount: totalAmount._sum.amount || 0,
        paidPayments,
        pendingPayments,
        onTimePayments,
        latePayments,
        advancePayments,
        partialPayments
      },
      paymentMethods: paymentMethods.map(method => ({
        method: method.method || 'Unknown',
        count: method._count.method,
        totalAmount: method._sum.amount || 0
      })),
      monthlyRevenue: monthlyRevenue.map(month => ({
        month: month.createdAt,
        amount: month._sum.amount || 0,
        count: month._count.id
      }))
    });

  } catch (error) {
    console.error("Error fetching payment analytics:", error);
    res.status(500).json({ message: "Failed to fetch payment analytics" });
  }
};

// ---------------------------------------------- GET SYSTEM LOGS ----------------------------------------------
export const getSystemLogs = async (req, res) => {
  try {
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      role = "",
      activityType = "" // online, offline, new_user
    } = req.query;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with their activity information
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { lastLogin: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isDisabled: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              Property: true,
              Lease: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Format users for system logs
    const systemLogs = users.map(user => {
      const now = new Date();
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      const createdAt = new Date(user.createdAt);
      
      // Determine activity status
      let activityStatus = 'offline';
      let lastActivity = null;
      let activityType = 'offline';
      
      if (lastLogin) {
        const timeSinceLogin = now.getTime() - lastLogin.getTime();
        const hoursSinceLogin = timeSinceLogin / (1000 * 60 * 60);
        
        // Consider user online if they logged in within the last 2 hours (more realistic)
        if (hoursSinceLogin <= 2) {
          activityStatus = 'online';
          activityType = 'online';
        } else {
          // User has logged in before but is now offline
          activityStatus = 'offline';
          activityType = 'offline';
        }
        lastActivity = lastLogin;
      } else {
        // User never logged in, show as new user
        activityStatus = 'new_user';
        activityType = 'new_user';
        lastActivity = createdAt;
      }

      // Calculate time online/offline with 32-day maximum offline
      let timeOnline = 0;
      let timeOffline = 0;
      
      if (lastLogin) {
        const timeSinceLogin = now.getTime() - lastLogin.getTime();
        const hoursSinceLogin = timeSinceLogin / (1000 * 60 * 60);
        const daysSinceLogin = hoursSinceLogin / 24;
        
        if (hoursSinceLogin <= 2) {
          // User is online (within 2 hours)
          timeOnline = Math.round(hoursSinceLogin * 100) / 100;
          timeOffline = 0;
        } else {
          // User is offline
          timeOnline = 0;
          // Cap offline time at 32 days (768 hours)
          const maxOfflineHours = 32 * 24; // 768 hours
          timeOffline = Math.min(hoursSinceLogin, maxOfflineHours);
          timeOffline = Math.round(timeOffline * 100) / 100;
        }
      } else {
        // User never logged in
        const timeSinceCreated = now.getTime() - createdAt.getTime();
        const hoursSinceCreated = timeSinceCreated / (1000 * 60 * 60);
        const maxOfflineHours = 32 * 24; // 768 hours
        timeOffline = Math.min(hoursSinceCreated, maxOfflineHours);
        timeOffline = Math.round(timeOffline * 100) / 100;
        timeOnline = 0;
      }

      return {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        role: user.role,
        isDisabled: user.isDisabled,
        activityStatus,
        activityType,
        lastActivity,
        timeOnline,
        timeOffline,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        propertiesCount: user._count.Property,
        leasesCount: user._count.Lease
      };
    });

    // Filter by activity type if specified
    let filteredLogs = systemLogs;
    if (activityType && activityType !== 'all') {
      filteredLogs = systemLogs.filter(log => log.activityType === activityType);
    }

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      logs: filteredLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount: filteredLogs.length,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error("Error fetching system logs:", error);
    res.status(500).json({ message: "Failed to fetch system logs" });
  }
};

// ---------------------------------------------- GET SYSTEM LOGS ANALYTICS ----------------------------------------------
export const getSystemLogsAnalytics = async (req, res) => {
  try {
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found" });
    }

    const { period = '24h' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get user activity statistics
    const [
      totalUsers,
      onlineUsers,
      offlineUsers,
      newUsers,
      recentLogins,
      userRegistrations
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Online users (logged in within last 2 hours)
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(now.getTime() - 2 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Offline users (logged in more than 2 hours ago or never, but not more than 32 days)
      prisma.user.count({
        where: {
          OR: [
            { 
              AND: [
                { lastLogin: { lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) } },
                { lastLogin: { gte: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000) } }
              ]
            },
            { lastLogin: null }
          ]
        }
      }),
      
      // New users (never logged in)
      prisma.user.count({
        where: {
          lastLogin: null
        }
      }),
      
      // Recent logins (within specified period)
      prisma.user.count({
        where: {
          lastLogin: { gte: startDate }
        }
      }),
      
      // User registrations (within specified period)
      prisma.user.count({
        where: {
          createdAt: { gte: startDate }
        }
      })
    ]);

    // Get role breakdown
    const roleBreakdown = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    res.json({
      summary: {
        totalUsers,
        onlineUsers,
        offlineUsers,
        newUsers,
        recentLogins,
        userRegistrations
      },
      roleBreakdown: roleBreakdown.map(role => ({
        role: role.role,
        count: role._count.role
      }))
    });

  } catch (error) {
    console.error("Error fetching system logs analytics:", error);
    res.status(500).json({ message: "Failed to fetch system logs analytics" });
  }
};
