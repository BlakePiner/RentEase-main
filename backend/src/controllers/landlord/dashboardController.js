import prisma from "../../libs/prismaClient.js";

// Get recent activity for landlord dashboard
export const getRecentActivity = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const limit = parseInt(req.query.limit) || 10;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: landlord not found" });
    }

    // Get recent activities from multiple sources
    const activities = [];

    // 1. Get all recent tenant applications
    const allRecentApplications = await prisma.tenantScreening.findMany({
      where: {
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
            email: true,
            avatarUrl: true
          }
        },
        unit: {
          select: {
            id: true,
            label: true,
            property: {
              select: {
                id: true,
                title: true,
                street: true,
                barangay: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out applications where the tenant already has an active lease for this unit
    const recentApplications = [];
    for (const app of allRecentApplications) {
      const hasActiveLease = await prisma.lease.findFirst({
        where: {
          tenantId: app.tenantId,
          unitId: app.unitId,
          status: 'ACTIVE'
        }
      });
      
      // Only include applications where the tenant doesn't have an active lease for this unit
      if (!hasActiveLease) {
        recentApplications.push(app);
      }
    }

    // Take only the limit we need
    const limitedRecentApplications = recentApplications.slice(0, Math.ceil(limit / 3));

    // Format applications as activities
    limitedRecentApplications.forEach(app => {
      activities.push({
        id: `app_${app.id}`,
        type: 'APPLICATION',
        title: 'New Tenant Application',
        description: `${app.tenant.firstName} ${app.tenant.lastName} applied for ${app.unit.label}`,
        timestamp: app.createdAt,
        status: 'PENDING_SCREENING',
        property: {
          id: app.unit.property.id,
          title: app.unit.property.title,
          address: `${app.unit.property.street}, ${app.unit.property.barangay}`
        },
        unit: {
          id: app.unit.id,
          label: app.unit.label
        },
        tenant: {
          id: app.tenant.id,
          firstName: app.tenant.firstName,
          lastName: app.tenant.lastName,
          fullName: `${app.tenant.firstName} ${app.tenant.lastName}`,
          avatarUrl: app.tenant.avatarUrl
        },
        metadata: {
          riskLevel: app.riskLevel,
          aiRiskScore: app.aiRiskScore
        }
      });
    });

    // 2. Recent maintenance requests
    const recentMaintenance = await prisma.maintenanceRequest.findMany({
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
            property: {
              select: {
                id: true,
                title: true,
                street: true,
                barangay: true
              }
            }
          }
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit / 3) // Allocate 1/3 of limit to maintenance
    });

    // Format maintenance requests as activities
    recentMaintenance.forEach(maintenance => {
      activities.push({
        id: `maint_${maintenance.id}`,
        type: 'MAINTENANCE',
        title: 'Maintenance Request',
        description: maintenance.description,
        timestamp: maintenance.createdAt,
        status: maintenance.status,
        priority: maintenance.priority,
        property: {
          id: maintenance.unit.property.id,
          title: maintenance.unit.property.title,
          address: `${maintenance.unit.property.street}, ${maintenance.unit.property.barangay}`
        },
        unit: {
          id: maintenance.unit.id,
          label: maintenance.unit.label
        },
        tenant: {
          id: maintenance.reporter.id,
          firstName: maintenance.reporter.firstName,
          lastName: maintenance.reporter.lastName,
          fullName: `${maintenance.reporter.firstName} ${maintenance.reporter.lastName}`,
          avatarUrl: maintenance.reporter.avatarUrl
        }
      });
    });

    // 3. Recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        lease: {
          unit: {
            property: {
              ownerId: ownerId
            }
          }
        }
      },
      include: {
        lease: {
          select: {
            id: true,
            unit: {
              select: {
                id: true,
                label: true,
                property: {
                  select: {
                    id: true,
                    title: true,
                    street: true,
                    barangay: true
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
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit / 3) // Allocate 1/3 of limit to payments
    });

    // Format payments as activities
    recentPayments.forEach(payment => {
      activities.push({
        id: `pay_${payment.id}`,
        type: 'PAYMENT',
        title: payment.status === 'PAID' ? 'Payment Received' : 'Payment Pending',
        description: `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName} - ${payment.lease.unit.label}`,
        timestamp: payment.createdAt,
        status: payment.status,
        amount: payment.amount,
        property: {
          id: payment.lease.unit.property.id,
          title: payment.lease.unit.property.title,
          address: `${payment.lease.unit.property.street}, ${payment.lease.unit.property.barangay}`
        },
        unit: {
          id: payment.lease.unit.id,
          label: payment.lease.unit.label
        },
        tenant: {
          id: payment.lease.tenant.id,
          firstName: payment.lease.tenant.firstName,
          lastName: payment.lease.tenant.lastName,
          fullName: `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`,
          avatarUrl: payment.lease.tenant.avatarUrl
        },
        metadata: {
          timingStatus: payment.timingStatus,
          method: payment.method
        }
      });
    });

    // Sort all activities by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.json(limitedActivities);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
};

// Get upcoming tasks for landlord dashboard
export const getUpcomingTasks = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const limit = parseInt(req.query.limit) || 10;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: landlord not found" });
    }

    const tasks = [];

    // 1. Get all tenant applications for this landlord
    const allApplications = await prisma.tenantScreening.findMany({
      where: {
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
            email: true,
            avatarUrl: true
          }
        },
        unit: {
          select: {
            id: true,
            label: true,
            property: {
              select: {
                id: true,
                title: true,
                street: true,
                barangay: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }, // Oldest first for review
    });

    // Filter out applications where the tenant already has an active lease for this unit
    const pendingApplications = [];
    for (const app of allApplications) {
      const hasActiveLease = await prisma.lease.findFirst({
        where: {
          tenantId: app.tenantId,
          unitId: app.unitId,
          status: 'ACTIVE'
        }
      });
      
      // Only include applications where the tenant doesn't have an active lease for this unit
      if (!hasActiveLease) {
        pendingApplications.push(app);
      }
    }

    // Take only the limit we need
    const limitedPendingApplications = pendingApplications.slice(0, Math.ceil(limit / 2));

    // Format pending applications as tasks
    limitedPendingApplications.forEach(app => {
      const daysSinceApplication = Math.floor((new Date() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24));
      const isOverdue = daysSinceApplication > 7; // Consider overdue after 7 days

      tasks.push({
        id: `review_app_${app.id}`,
        type: 'APPLICATION_REVIEW',
        title: 'Review Tenant Application',
        description: `Review application from ${app.tenant.firstName} ${app.tenant.lastName} for ${app.unit.label}`,
        dueDate: new Date(Date.now() + (7 - daysSinceApplication) * 24 * 60 * 60 * 1000).toISOString(),
        priority: isOverdue ? 'URGENT' : daysSinceApplication > 3 ? 'HIGH' : 'MEDIUM',
        status: isOverdue ? 'OVERDUE' : 'PENDING',
        property: {
          id: app.unit.property.id,
          title: app.unit.property.title,
          address: `${app.unit.property.street}, ${app.unit.property.barangay}`
        },
        unit: {
          id: app.unit.id,
          label: app.unit.label
        },
        tenant: {
          id: app.tenant.id,
          firstName: app.tenant.firstName,
          lastName: app.tenant.lastName,
          fullName: `${app.tenant.firstName} ${app.tenant.lastName}`,
          avatarUrl: app.tenant.avatarUrl
        },
        metadata: {
          daysUntilDue: Math.max(0, 7 - daysSinceApplication),
          isOverdue: isOverdue,
          riskLevel: app.riskLevel,
          aiRiskScore: app.aiRiskScore
        }
      });
    });

    // 2. Lease renewals coming up (leases ending in next 30 days)
    const upcomingLeaseRenewals = await prisma.lease.findMany({
      where: {
        unit: {
          property: {
            ownerId: ownerId
          }
        },
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        unit: {
          select: {
            id: true,
            label: true,
            property: {
              select: {
                id: true,
                title: true,
                street: true,
                barangay: true
              }
            }
          }
        }
      },
      orderBy: { endDate: 'asc' },
      take: Math.ceil(limit / 2) // Allocate half to lease renewals
    });

    // Format lease renewals as tasks
    upcomingLeaseRenewals.forEach(lease => {
      const daysUntilEnd = Math.floor((new Date(lease.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      const isUrgent = daysUntilEnd <= 7;

      tasks.push({
        id: `renewal_${lease.id}`,
        type: 'LEASE_RENEWAL',
        title: 'Lease Renewal Due',
        description: `Lease for ${lease.tenant.firstName} ${lease.tenant.lastName} in ${lease.unit.label} expires soon`,
        dueDate: lease.endDate,
        priority: isUrgent ? 'URGENT' : 'HIGH',
        status: 'PENDING',
        property: {
          id: lease.unit.property.id,
          title: lease.unit.property.title,
          address: `${lease.unit.property.street}, ${lease.unit.property.barangay}`
        },
        unit: {
          id: lease.unit.id,
          label: lease.unit.label
        },
        tenant: {
          id: lease.tenant.id,
          firstName: lease.tenant.firstName,
          lastName: lease.tenant.lastName,
          fullName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          avatarUrl: lease.tenant.avatarUrl
        },
        metadata: {
          daysUntilDue: daysUntilEnd,
          isOverdue: false
        }
      });
    });

    // Sort tasks by due date and priority
    tasks.sort((a, b) => {
      // First sort by status (overdue first)
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
      
      // Then by due date
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    const limitedTasks = tasks.slice(0, limit);

    res.json(limitedTasks);
  } catch (error) {
    console.error("Error fetching upcoming tasks:", error);
    res.status(500).json({ message: "Failed to fetch upcoming tasks" });
  }
};
