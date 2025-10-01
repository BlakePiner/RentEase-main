// file: maintenanceController.js
import prisma from "../../libs/prismaClient.js";

// ---------------------------------------------- GET ALL MAINTENANCE REQUESTS FOR LANDLORD ----------------------------------------------
export const getLandlordMaintenanceRequests = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Fetch maintenance requests for all properties owned by the landlord
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
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
            street: true,
            barangay: true,
            city: { select: { name: true } },
            municipality: { select: { name: true } },
          }
        },
        unit: {
          select: {
            id: true,
            label: true,
            status: true,
          }
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Format the response
    const formattedRequests = maintenanceRequests.map((request) => {
      const property = request.property;
      const fullAddress = [
        property.street,
        property.barangay,
        property.city?.name || property.municipality?.name,
      ].filter(Boolean).join(", ");

      // Calculate time since creation
      const createdAt = new Date(request.createdAt);
      const now = new Date();
      const diffTime = now.getTime() - createdAt.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

      let timeAgo = "";
      if (diffDays > 0) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = "Just now";
      }

      // Determine priority based on status and age
      let priority = "LOW";
      if (request.status === "OPEN" && diffDays >= 7) {
        priority = "HIGH";
      } else if (request.status === "OPEN" && diffDays >= 3) {
        priority = "MEDIUM";
      } else if (request.status === "IN_PROGRESS" && diffDays >= 14) {
        priority = "HIGH";
      }

      return {
        id: request.id,
        description: request.description,
        photoUrl: request.photoUrl,
        status: request.status,
        priority: priority,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        timeAgo: timeAgo,
        daysOpen: diffDays,
        
        // Related data
        property: {
          id: property.id,
          title: property.title,
          address: fullAddress,
        },
        unit: request.unit ? {
          id: request.unit.id,
          label: request.unit.label,
          status: request.unit.status,
        } : null,
        reporter: {
          id: request.reporter.id,
          firstName: request.reporter.firstName,
          lastName: request.reporter.lastName,
          email: request.reporter.email,
          phoneNumber: request.reporter.phoneNumber,
          avatarUrl: request.reporter.avatarUrl,
          role: request.reporter.role,
          fullName: `${request.reporter.firstName || ''} ${request.reporter.lastName || ''}`.trim(),
        },
      };
    });

    return res.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching landlord maintenance requests:", error);
    return res.status(500).json({ message: "Failed to fetch maintenance requests" });
  }
};

// ---------------------------------------------- GET SPECIFIC MAINTENANCE REQUEST DETAILS ----------------------------------------------
export const getMaintenanceRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    // Fetch maintenance request with all related data
    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        property: {
          ownerId: ownerId
        }
      },
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
            mainImageUrl: true,
          }
        },
        unit: {
          select: {
            id: true,
            label: true,
            status: true,
            description: true,
            mainImageUrl: true,
          }
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            role: true,
            createdAt: true,
          }
        }
      },
    });

    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found or not accessible" });
    }

    // Build property address
    const property = request.property;
    const fullAddress = [
      property.street,
      property.barangay,
      property.city?.name || property.municipality?.name,
      property.zipCode,
    ].filter(Boolean).join(", ");

    // Calculate time information
    const createdAt = new Date(request.createdAt);
    const updatedAt = new Date(request.updatedAt);
    const now = new Date();
    
    const diffTime = now.getTime() - createdAt.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    let timeAgo = "";
    if (diffDays > 0) {
      timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = "Just now";
    }

    // Determine priority
    let priority = "LOW";
    if (request.status === "OPEN" && diffDays >= 7) {
      priority = "HIGH";
    } else if (request.status === "OPEN" && diffDays >= 3) {
      priority = "MEDIUM";
    } else if (request.status === "IN_PROGRESS" && diffDays >= 14) {
      priority = "HIGH";
    }

    return res.json({
      ...request,
      property: {
        ...property,
        address: fullAddress,
      },
      reporter: {
        ...request.reporter,
        fullName: `${request.reporter.firstName || ''} ${request.reporter.lastName || ''}`.trim(),
      },
      timeInfo: {
        timeAgo,
        daysOpen: diffDays,
        hoursOpen: diffHours,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
      priority,
    });
  } catch (error) {
    console.error("Error fetching maintenance request details:", error);
    return res.status(500).json({ message: "Failed to fetch maintenance request details" });
  }
};

// ---------------------------------------------- UPDATE MAINTENANCE REQUEST STATUS ----------------------------------------------
export const updateMaintenanceRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    // Validate status
    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be OPEN, IN_PROGRESS, or RESOLVED" });
    }

    // Check if request exists and belongs to landlord
    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        property: {
          ownerId: ownerId
        }
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          }
        },
        unit: {
          select: {
            id: true,
            label: true,
          }
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!existingRequest) {
      return res.status(404).json({ message: "Maintenance request not found or not accessible" });
    }

    // Update the maintenance request
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: status,
        // Note: We could add a notes field to the schema if needed
        // For now, we'll just update the status
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          }
        },
        unit: {
          select: {
            id: true,
            label: true,
          }
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    return res.json({
      message: "Maintenance request status updated successfully",
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        description: updatedRequest.description,
        property: updatedRequest.property,
        unit: updatedRequest.unit,
        reporter: updatedRequest.reporter,
      }
    });
  } catch (error) {
    console.error("Error updating maintenance request status:", error);
    return res.status(500).json({ message: "Failed to update maintenance request status" });
  }
};

// ---------------------------------------------- GET MAINTENANCE STATISTICS ----------------------------------------------
export const getMaintenanceStats = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Get all maintenance requests for the landlord
    const requests = await prisma.maintenanceRequest.findMany({
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
          }
        }
      }
    });

    // Calculate statistics
    const totalRequests = requests.length;
    const openRequests = requests.filter(r => r.status === "OPEN").length;
    const inProgressRequests = requests.filter(r => r.status === "IN_PROGRESS").length;
    const resolvedRequests = requests.filter(r => r.status === "RESOLVED").length;

    // Calculate average resolution time (for resolved requests)
    const resolvedRequestsWithTime = requests
      .filter(r => r.status === "RESOLVED")
      .map(r => {
        const createdAt = new Date(r.createdAt);
        const updatedAt = new Date(r.updatedAt);
        const diffTime = updatedAt.getTime() - createdAt.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      });

    const averageResolutionTime = resolvedRequestsWithTime.length > 0 
      ? Math.round(resolvedRequestsWithTime.reduce((sum, days) => sum + days, 0) / resolvedRequestsWithTime.length)
      : 0;

    // Calculate requests by property
    const requestsByProperty = {};
    requests.forEach(request => {
      const propertyTitle = request.property.title;
      if (!requestsByProperty[propertyTitle]) {
        requestsByProperty[propertyTitle] = {
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
        };
      }
      requestsByProperty[propertyTitle].total++;
      requestsByProperty[propertyTitle][request.status.toLowerCase().replace('_', '')]++;
    });

    // Find urgent requests (open for more than 7 days)
    const now = new Date();
    const urgentRequests = requests.filter(request => {
      if (request.status !== "OPEN") return false;
      const createdAt = new Date(request.createdAt);
      const diffTime = now.getTime() - createdAt.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 7;
    }).length;

    // Calculate resolution rate
    const resolutionRate = totalRequests > 0 ? Math.round((resolvedRequests / totalRequests) * 100) : 0;

    return res.json({
      overview: {
        totalRequests,
        openRequests,
        inProgressRequests,
        resolvedRequests,
        urgentRequests,
        resolutionRate,
        averageResolutionTime,
      },
      byProperty: requestsByProperty,
    });
  } catch (error) {
    console.error("Error fetching maintenance statistics:", error);
    return res.status(500).json({ message: "Failed to fetch maintenance statistics" });
  }
};

// ---------------------------------------------- DELETE MAINTENANCE REQUEST ----------------------------------------------
export const deleteMaintenanceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    // Check if request exists and belongs to landlord
    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        property: {
          ownerId: ownerId
        }
      }
    });

    if (!existingRequest) {
      return res.status(404).json({ message: "Maintenance request not found or not accessible" });
    }

    // Delete the maintenance request
    await prisma.maintenanceRequest.delete({
      where: { id: requestId }
    });

    return res.json({ message: "Maintenance request deleted successfully" });
  } catch (error) {
    console.error("Error deleting maintenance request:", error);
    return res.status(500).json({ message: "Failed to delete maintenance request" });
  }
};
