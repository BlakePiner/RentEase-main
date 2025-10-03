// file: leaseController.js
import prisma from "../../libs/prismaClient.js";
import { createLeaseNotification } from "../../services/notificationService.js";
import { generateLeasePDF } from "../../services/pdfService.js";

// ---------------------------------------------- GET ALL LEASES OF THE LANDLORD ----------------------------------------------
export const getLandlordLeases = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Fetch leases with related data
    const leases = await prisma.lease.findMany({
      where: {
        unit: {
          property: {
            ownerId: ownerId
          }
        }
      },
      include: {
        unit: {
          select: {
            id: true,
            label: true,
            status: true,
            targetPrice: true,
            property: {
              select: {
                id: true,
                title: true,
                street: true,
                barangay: true,
                city: { select: { name: true } },
                municipality: { select: { name: true } },
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
            avatarUrl: true,
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
            timingStatus: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5, // Get last 5 payments
        },
        _count: {
          select: { payments: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Format the response
    const formattedLeases = leases.map((lease) => {
      const property = lease.unit.property;
      const fullAddress = [
        property.street,
        property.barangay,
        property.city?.name || property.municipality?.name,
      ].filter(Boolean).join(", ");

      // Calculate payment statistics
      const totalPayments = lease._count.payments;
      const paidPayments = lease.payments.filter(p => p.status === "PAID").length;
      const pendingPayments = totalPayments - paidPayments;
      const onTimePayments = lease.payments.filter(p => p.timingStatus === "ONTIME").length;
      const latePayments = lease.payments.filter(p => p.timingStatus === "LATE").length;

      // Calculate lease duration and remaining time
      const startDate = new Date(lease.startDate);
      const endDate = lease.endDate ? new Date(lease.endDate) : null;
      const now = new Date();
      
      const isActive = lease.status === "ACTIVE";
      const isExpired = endDate && now > endDate;
      const isUpcoming = startDate > now;

      // Calculate days remaining or overdue
      let daysInfo = null;
      if (endDate) {
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysInfo = {
          days: Math.abs(diffDays),
          isOverdue: diffDays < 0,
          isExpiringSoon: diffDays <= 30 && diffDays > 0
        };
      }

      return {
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
        
        // Related data
        unit: {
          id: lease.unit.id,
          label: lease.unit.label,
          status: lease.unit.status,
          targetPrice: lease.unit.targetPrice,
          property: {
            id: property.id,
            title: property.title,
            address: fullAddress,
          }
        },
        tenant: {
          id: lease.tenant.id,
          firstName: lease.tenant.firstName,
          lastName: lease.tenant.lastName,
          email: lease.tenant.email,
          phoneNumber: lease.tenant.phoneNumber,
          avatarUrl: lease.tenant.avatarUrl,
          fullName: `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim(),
        },
        
        // Payment statistics
        paymentStats: {
          total: totalPayments,
          paid: paidPayments,
          pending: pendingPayments,
          onTime: onTimePayments,
          late: latePayments,
          reliability: totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 100) : 0,
        },
        
        // Lease status info
        leaseInfo: {
          isActive,
          isExpired,
          isUpcoming,
          daysInfo,
        },
        
        // Recent payments
        recentPayments: lease.payments,
      };
    });

    return res.json(formattedLeases);
  } catch (error) {
    console.error("Error fetching landlord leases:", error);
    return res.status(500).json({ message: "Failed to fetch leases" });
  }
};

// ---------------------------------------------- GET SPECIFIC LEASE DETAILS ----------------------------------------------
export const getLeaseDetails = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!leaseId) {
      return res.status(400).json({ message: "Lease ID is required" });
    }

    // Fetch lease with all related data
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
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
                street: true,
                barangay: true,
                zipCode: true,
                city: { select: { name: true } },
                municipality: { select: { name: true } },
              }
            },
            amenities: {
              select: {
                id: true,
                name: true,
                category: true,
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
            avatarUrl: true,
            birthdate: true,
            gender: true,
          }
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        TenantBehaviorAnalysis: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get latest analysis
        }
      },
    });

    if (!lease) {
      return res.status(404).json({ message: "Lease not found or not accessible" });
    }

    // Build property address
    const property = lease.unit.property;
    const fullAddress = [
      property.street,
      property.barangay,
      property.city?.name || property.municipality?.name,
      property.zipCode,
    ].filter(Boolean).join(", ");

    // Calculate comprehensive payment statistics
    const totalPayments = lease.payments.length;
    const paidPayments = lease.payments.filter(p => p.status === "PAID");
    const pendingPayments = lease.payments.filter(p => p.status === "PENDING");
    const onTimePayments = lease.payments.filter(p => p.timingStatus === "ONTIME");
    const latePayments = lease.payments.filter(p => p.timingStatus === "LATE");
    const advancePayments = lease.payments.filter(p => p.timingStatus === "ADVANCE");

    const totalPaidAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate lease timeline
    const startDate = new Date(lease.startDate);
    const endDate = lease.endDate ? new Date(lease.endDate) : null;
    const now = new Date();
    
    const isActive = lease.status === "ACTIVE";
    const isExpired = endDate && now > endDate;
    const isUpcoming = startDate > now;

    // Calculate lease duration
    const leaseDuration = endDate ? 
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 
      null;

    const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = endDate ? 
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
      null;

    return res.json({
      ...lease,
      unit: {
        ...lease.unit,
        property: {
          ...property,
          address: fullAddress,
        }
      },
      tenant: {
        ...lease.tenant,
        fullName: `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim(),
      },
      paymentStats: {
        total: totalPayments,
        paid: paidPayments.length,
        pending: pendingPayments.length,
        onTime: onTimePayments.length,
        late: latePayments.length,
        advance: advancePayments.length,
        totalPaidAmount,
        totalPendingAmount,
        reliability: totalPayments > 0 ? Math.round((onTimePayments.length / totalPayments) * 100) : 0,
      },
      leaseInfo: {
        isActive,
        isExpired,
        isUpcoming,
        leaseDuration,
        daysElapsed,
        daysRemaining,
        isExpiringSoon: daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0,
        isOverdue: daysRemaining !== null && daysRemaining < 0,
      },
      behaviorAnalysis: lease.TenantBehaviorAnalysis[0] || null,
    });
  } catch (error) {
    console.error("Error fetching lease details:", error);
    return res.status(500).json({ message: "Failed to fetch lease details" });
  }
};

// ---------------------------------------------- CREATE NEW LEASE ----------------------------------------------
export const createLease = async (req, res) => {
  try {
    console.log("=== CREATE LEASE DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request file:", req.file);
    console.log("Request headers:", req.headers);
    console.log("=========================");
    
    const {
      unitId,
      tenantId,
      leaseNickname,
      leaseType,
      startDate,
      endDate,
      rentAmount,
      interval,
      status,
      hasFormalDocument,
      leaseDocumentUrl,
      landlordName,
      tenantName,
      rules,
      notes,
    } = req.body;

    // Handle file upload if present
    let documentUrl = leaseDocumentUrl;
    if (req.file && (hasFormalDocument === 'true' || hasFormalDocument === true)) {
      // In a real implementation, you would upload to cloud storage (AWS S3, etc.)
      // For now, we'll use a simple file path
      documentUrl = `/uploads/leases/${req.file.filename}`;
    }

    const ownerId = req.user?.id;
    if (!ownerId) {
      console.log("ERROR: No owner ID found in request");
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }
    
    console.log("Owner ID:", ownerId);

    // Validate required fields - all fields including tenantId are required
    if (!unitId || !tenantId || !leaseNickname || !leaseType || !startDate || !rentAmount || !interval || !status) {
      console.log("ERROR: Missing required fields");
      console.log("unitId:", unitId);
      console.log("tenantId:", tenantId);
      console.log("leaseNickname:", leaseNickname);
      console.log("leaseType:", leaseType);
      console.log("startDate:", startDate);
      console.log("rentAmount:", rentAmount);
      console.log("interval:", interval);
      console.log("status:", status);
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate that the unit belongs to the landlord
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
            ownerId: true,
          }
        }
      }
    });

    if (!unit) {
      return res.status(404).json({ message: "Unit not found or not owned by landlord" });
    }

    // Validate that the tenant exists
    const tenant = await prisma.user.findFirst({
      where: {
        id: tenantId,
        role: "TENANT"
      }
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Check if unit is already occupied by another active lease
    const existingLease = await prisma.lease.findFirst({
      where: {
        unitId: unitId,
        status: "ACTIVE"
      }
    });

    if (existingLease) {
      return res.status(400).json({ message: "Unit is already occupied by another active lease" });
    }

    // Validate dates
    console.log("Raw startDate:", startDate);
    console.log("Raw endDate:", endDate);
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const now = new Date();

    console.log("Parsed start date:", start);
    console.log("Parsed end date:", end);
    console.log("Current date:", now);

    // Check if dates are valid
    if (isNaN(start.getTime())) {
      console.log("ERROR: Invalid start date format");
      return res.status(400).json({ message: "Invalid start date format" });
    }
    
    if (end && isNaN(end.getTime())) {
      console.log("ERROR: Invalid end date format");
      return res.status(400).json({ message: "Invalid end date format" });
    }

    // Allow same day as start date (remove the past date restriction for testing)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const startDateOnly = new Date(start);
    startDateOnly.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (startDateOnly < today) {
      console.log("ERROR: Start date is in the past");
      return res.status(400).json({ message: "Start date cannot be in the past" });
    }

    if (end && end <= start) {
      console.log("ERROR: End date must be after start date");
      return res.status(400).json({ message: "End date must be after start date" });
    }

    // Validate rent amount
    if (rentAmount <= 0) {
      return res.status(400).json({ message: "Rent amount must be greater than 0" });
    }

    // Validate interval
    const validIntervals = ["DAILY", "WEEKLY", "MONTHLY"];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ message: "Invalid interval. Must be DAILY, WEEKLY, or MONTHLY" });
    }

    // Validate status
    const validStatuses = ["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Create the lease
    console.log("Creating lease with data:", {
      unitId,
      tenantId,
      leaseNickname: leaseNickname.trim(),
      leaseType,
      startDate: start,
      endDate: end,
      rentAmount: Number(rentAmount),
      interval,
      status,
      hasFormalDocument: hasFormalDocument || false,
      leaseDocumentUrl: documentUrl || null,
      landlordName: landlordName || null,
      tenantName: tenantName || null,
      rules: rules || null,
      notes: notes || null,
    });

    const lease = await prisma.lease.create({
      data: {
        unitId,
        tenantId,
        leaseNickname: leaseNickname.trim(),
        leaseType,
        startDate: start,
        endDate: end,
        rentAmount: Number(rentAmount),
        interval,
        status,
        hasFormalDocument: hasFormalDocument === 'true' || hasFormalDocument === true,
        leaseDocumentUrl: documentUrl || null,
        landlordName: landlordName || null,
        tenantName: tenantName || null,
        rules: rules || null,
        notes: notes || null,
      },
      include: {
        unit: {
          select: {
            id: true,
            label: true,
            property: {
              select: {
                id: true,
                title: true,
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
          }
        }
      }
    });

    // Update unit status to OCCUPIED if lease is ACTIVE
    if (status === "ACTIVE") {
      await prisma.unit.update({
        where: { id: unitId },
        data: { status: "OCCUPIED" }
      });
    }

    // Create notification for lease creation
    try {
      await createLeaseNotification(ownerId, lease, "CREATED");
    } catch (notificationError) {
      console.error("Error creating lease notification:", notificationError);
      // Don't fail the lease creation if notification fails
    }

    return res.status(201).json({
      message: "Lease created successfully",
      lease: {
        id: lease.id,
        leaseNickname: lease.leaseNickname,
        status: lease.status,
        unit: lease.unit,
        tenant: lease.tenant,
      }
    });
  } catch (error) {
    console.error("=== LEASE CREATION ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("===========================");
    return res.status(500).json({ 
      message: "Failed to create lease",
      error: error.message 
    });
  }
};

// ---------------------------------------------- UPDATE LEASE ----------------------------------------------
export const updateLease = async (req, res) => {
  try {
    console.log("=== UPDATE LEASE DEBUG ===");
    console.log("Request params:", req.params);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request file:", req.file);
    console.log("=========================");
    
    const { leaseId } = req.params;
    const {
      leaseNickname,
      leaseType,
      startDate,
      endDate,
      rentAmount,
      interval,
      status,
      hasFormalDocument,
      leaseDocumentUrl,
      landlordName,
      tenantName,
      rules,
      notes,
    } = req.body;

    // Handle file upload if present
    let documentUrl = leaseDocumentUrl;
    if (req.file && (hasFormalDocument === 'true' || hasFormalDocument === true)) {
      // In a real implementation, you would upload to cloud storage (AWS S3, etc.)
      // For now, we'll use a simple file path
      documentUrl = `/uploads/leases/${req.file.filename}`;
    }

    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!leaseId) {
      return res.status(400).json({ message: "Lease ID is required" });
    }

    // Check if lease exists and belongs to landlord
    const existingLease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        unit: {
          property: {
            ownerId: ownerId
          }
        }
      },
      include: {
        unit: {
          select: {
            id: true,
            status: true,
          }
        }
      }
    });

    if (!existingLease) {
      return res.status(404).json({ message: "Lease not found or not accessible" });
    }

    // Validate dates if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(existingLease.startDate);
      const end = endDate ? new Date(endDate) : existingLease.endDate ? new Date(existingLease.endDate) : null;

      if (end && end <= start) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
    }

    // Validate rent amount if provided
    if (rentAmount !== undefined && rentAmount <= 0) {
      return res.status(400).json({ message: "Rent amount must be greater than 0" });
    }

    // Validate interval if provided
    if (interval) {
      const validIntervals = ["DAILY", "WEEKLY", "MONTHLY"];
      if (!validIntervals.includes(interval)) {
        return res.status(400).json({ message: "Invalid interval. Must be DAILY, WEEKLY, or MONTHLY" });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
    }

    // Update the lease
    const updatedLease = await prisma.lease.update({
      where: { id: leaseId },
      data: {
        ...(leaseNickname && { leaseNickname: leaseNickname.trim() }),
        ...(leaseType && { leaseType }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(rentAmount !== undefined && { rentAmount: Number(rentAmount) }),
        ...(interval && { interval }),
        ...(status && { status }),
        ...(hasFormalDocument !== undefined && { hasFormalDocument: hasFormalDocument === 'true' || hasFormalDocument === true }),
        ...(documentUrl !== undefined && { leaseDocumentUrl: documentUrl }),
        ...(landlordName !== undefined && { landlordName }),
        ...(tenantName !== undefined && { tenantName }),
        ...(rules !== undefined && { rules }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        unit: {
          select: {
            id: true,
            label: true,
            property: {
              select: {
                id: true,
                title: true,
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
          }
        }
      }
    });

    // Update unit status based on lease status
    if (status) {
      let newUnitStatus = existingLease.unit.status;
      
      if (status === "ACTIVE") {
        newUnitStatus = "OCCUPIED";
      } else if (status === "EXPIRED" || status === "TERMINATED") {
        newUnitStatus = "AVAILABLE";
      }

      if (newUnitStatus !== existingLease.unit.status) {
        await prisma.unit.update({
          where: { id: existingLease.unit.id },
          data: { status: newUnitStatus }
        });
      }
    }

    return res.json({
      message: "Lease updated successfully",
      lease: updatedLease
    });
  } catch (error) {
    console.error("=== LEASE UPDATE ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("==========================");
    return res.status(500).json({ 
      message: "Failed to update lease",
      error: error.message 
    });
  }
};

// ---------------------------------------------- DELETE LEASE ----------------------------------------------
export const deleteLease = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!leaseId) {
      return res.status(400).json({ message: "Lease ID is required" });
    }

    // Check if lease exists and belongs to landlord
    const existingLease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        unit: {
          property: {
            ownerId: ownerId
          }
        }
      },
      include: {
        unit: {
          select: {
            id: true,
            status: true,
          }
        }
      }
    });

    if (!existingLease) {
      return res.status(404).json({ message: "Lease not found or not accessible" });
    }

    // Check if lease has payments (prevent deletion if it does)
    const paymentCount = await prisma.payment.count({
      where: { leaseId: leaseId }
    });

    if (paymentCount > 0) {
      return res.status(400).json({ 
        message: "Cannot delete lease with existing payments. Consider updating the status to 'TERMINATED' instead." 
      });
    }

    // Update unit status to AVAILABLE if it was OCCUPIED
    if (existingLease.unit.status === "OCCUPIED") {
      await prisma.unit.update({
        where: { id: existingLease.unit.id },
        data: { status: "AVAILABLE" }
      });
    }

    // Delete the lease
    await prisma.lease.delete({
      where: { id: leaseId }
    });

    return res.json({ message: "Lease deleted successfully" });
  } catch (error) {
    console.error("Error deleting lease:", error);
    return res.status(500).json({ message: "Failed to delete lease" });
  }
};

// ---------------------------------------------- GET ALL TENANTS (FOR LEASE CREATION) ----------------------------------------------
export const getTenants = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Fetch all tenants (for now, we'll get all users with TENANT role)
    // In a real application, you might want to filter by tenants who have interacted with this landlord
    const tenants = await prisma.user.findMany({
      where: {
        role: "TENANT",
        isDisabled: false, // Only active tenants
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(tenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return res.status(500).json({ message: "Failed to fetch tenants" });
  }
};

// ---------------------------------------------- GET LEASE STATISTICS ----------------------------------------------
export const getLeaseStats = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Get all leases for the landlord
    const leases = await prisma.lease.findMany({
      where: {
        unit: {
          property: {
            ownerId: ownerId
          }
        }
      },
      include: {
        payments: {
          select: {
            amount: true,
            status: true,
            timingStatus: true,
            paidAt: true,
          }
        }
      }
    });

    // Calculate statistics
    const totalLeases = leases.length;
    const activeLeases = leases.filter(l => l.status === "ACTIVE").length;
    const expiredLeases = leases.filter(l => l.status === "EXPIRED").length;
    const terminatedLeases = leases.filter(l => l.status === "TERMINATED").length;
    const draftLeases = leases.filter(l => l.status === "DRAFT").length;

    // Calculate revenue statistics
    const totalRevenue = leases.reduce((sum, lease) => {
      const paidPayments = lease.payments.filter(p => p.status === "PAID");
      return sum + paidPayments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
    }, 0);

    const monthlyRevenue = leases
      .filter(l => l.status === "ACTIVE")
      .reduce((sum, lease) => {
        if (lease.interval === "MONTHLY") {
          return sum + lease.rentAmount;
        } else if (lease.interval === "WEEKLY") {
          return sum + (lease.rentAmount * 4.33); // Approximate monthly
        } else if (lease.interval === "DAILY") {
          return sum + (lease.rentAmount * 30); // Approximate monthly
        }
        return sum;
      }, 0);

    // Calculate payment reliability
    const allPayments = leases.flatMap(l => l.payments);
    const totalPayments = allPayments.length;
    const onTimePayments = allPayments.filter(p => p.timingStatus === "ONTIME").length;
    const latePayments = allPayments.filter(p => p.timingStatus === "LATE").length;
    const paymentReliability = totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 100) : 0;

    // Calculate lease types distribution
    const leaseTypes = {};
    leases.forEach(lease => {
      leaseTypes[lease.leaseType] = (leaseTypes[lease.leaseType] || 0) + 1;
    });

    // Calculate interval distribution
    const intervals = {};
    leases.forEach(lease => {
      intervals[lease.interval] = (intervals[lease.interval] || 0) + 1;
    });

    // Find expiring leases (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const expiringLeases = leases.filter(lease => {
      if (!lease.endDate || lease.status !== "ACTIVE") return false;
      const endDate = new Date(lease.endDate);
      return endDate <= thirtyDaysFromNow && endDate > now;
    }).length;

    return res.json({
      overview: {
        totalLeases,
        activeLeases,
        expiredLeases,
        terminatedLeases,
        draftLeases,
        expiringLeases,
      },
      revenue: {
        totalRevenue,
        monthlyRevenue,
      },
      payments: {
        totalPayments,
        onTimePayments,
        latePayments,
        paymentReliability,
      },
      distribution: {
        leaseTypes,
        intervals,
      }
    });
  } catch (error) {
    console.error("Error fetching lease statistics:", error);
    return res.status(500).json({ message: "Failed to fetch lease statistics" });
  }
};

// ---------------------------------------------- ACTIVATE LEASE ----------------------------------------------
export const activateLease = async (req, res) => {
  try {
    console.log("=== ACTIVATE LEASE DEBUG ===");
    const ownerId = req.user?.id;
    const { leaseId } = req.params;
    
    console.log("Owner ID:", ownerId);
    console.log("Lease ID:", leaseId);

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!leaseId) {
      return res.status(400).json({ message: "Lease ID is required" });
    }

    // Verify the lease belongs to this landlord
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        unit: {
          property: {
            ownerId: ownerId
          }
        }
      },
      include: {
        unit: true
      }
    });

    console.log("Found lease:", lease ? {
      id: lease.id,
      status: lease.status,
      unitId: lease.unitId,
      tenantId: lease.tenantId
    } : "Not found");

    if (!lease) {
      return res.status(404).json({ message: "Lease not found or you don't have permission to activate it" });
    }

    if (lease.status === 'ACTIVE') {
      return res.status(400).json({ message: "Lease is already active" });
    }

    console.log("Updating lease status from", lease.status, "to ACTIVE");

    // Update lease status to ACTIVE and unit status to OCCUPIED
    const updatedLease = await prisma.lease.update({
      where: { id: leaseId },
      data: { status: 'ACTIVE' }
    });

    console.log("Lease updated:", {
      id: updatedLease.id,
      status: updatedLease.status
    });

    // Update unit status to OCCUPIED
    await prisma.unit.update({
      where: { id: lease.unitId },
      data: { status: 'OCCUPIED' }
    });

    console.log(`✅ Lease ${leaseId} activated successfully`);
    console.log("=== ACTIVATE LEASE COMPLETE ===");

    res.json({
      message: "Lease activated successfully",
      lease: updatedLease
    });

  } catch (error) {
    console.error("=== ACTIVATE LEASE ERROR ===");
    console.error("Error activating lease:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("===============================");
    return res.status(500).json({ message: "Failed to activate lease" });
  }
};

// ---------------------------------------------- GENERATE LEASE PDF ----------------------------------------------
export const generateLeasePDFController = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!leaseId) {
      return res.status(400).json({ message: "Lease ID is required" });
    }

    // Get the lease with all related data
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
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
    const fileName = `lease-${lease.leaseNickname || lease.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating lease PDF:", error);
    res.status(500).json({ message: "Failed to generate lease PDF" });
  }
};
