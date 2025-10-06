import prisma from "../../libs/prismaClient.js";
import { createPaymentNotification } from "../../services/notificationService.js";

// ---------------------------------------------- GET LANDLORD PAYMENTS ----------------------------------------------
export const getLandlordPayments = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { status, timingStatus, leaseId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {
      lease: {
        unit: {
          property: {
            ownerId: ownerId
          }
        }
      }
    };

    // Add filters
    if (status) {
      whereClause.status = status;
    }
    if (timingStatus) {
      whereClause.timingStatus = timingStatus;
    }
    if (leaseId) {
      whereClause.leaseId = leaseId;
    }

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          lease: {
            include: {
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
              tenant: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phoneNumber: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.payment.count({ where: whereClause })
    ]);

    // Transform payments for frontend
    const transformedPayments = payments.map(payment => ({
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
        rentAmount: payment.lease.rentAmount,
        interval: payment.lease.interval,
        unit: payment.lease.unit,
        tenant: payment.lease.tenant
      }
    }));

    return res.json({
      payments: transformedPayments,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching landlord payments:", error);
    return res.status(500).json({ message: "Failed to fetch payments" });
  }
};

// ---------------------------------------------- GET PAYMENT DETAILS ----------------------------------------------
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
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
          include: {
            unit: {
              select: {
                id: true,
                label: true,
                property: {
                  select: {
                    id: true,
                    title: true,
                    address: true
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
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.json({
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
      lease: payment.lease
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return res.status(500).json({ message: "Failed to fetch payment details" });
  }
};

// ---------------------------------------------- UPDATE PAYMENT STATUS ----------------------------------------------
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, note } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Validate status
    const validStatuses = ["PENDING", "PAID"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be PENDING or PAID" });
    }

    // Check if payment exists and belongs to landlord
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        lease: {
          unit: {
            property: {
              ownerId: ownerId
            }
          }
        }
      }
    });

    if (!existingPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment
    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === "PAID" && !existingPayment.paidAt) {
        updateData.paidAt = new Date();
      }
    }
    if (note !== undefined) {
      updateData.note = note;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        lease: {
          include: {
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
            tenant: {
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
    });

    // Create notification if payment status changed
    if (status && status !== existingPayment.status) {
      try {
        await createPaymentNotification(ownerId, {
          amount: updatedPayment.amount,
          status: updatedPayment.status,
          timingStatus: updatedPayment.timingStatus,
          lease: updatedPayment.lease
        });
      } catch (notificationError) {
        console.error("Error creating payment notification:", notificationError);
        // Don't fail the payment update if notification fails
      }
    }

    return res.json({
      message: "Payment status updated successfully",
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        paidAt: updatedPayment.paidAt,
        note: updatedPayment.note,
        updatedAt: updatedPayment.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({ message: "Failed to update payment status" });
  }
};

// ---------------------------------------------- GET PAYMENT STATISTICS ----------------------------------------------
export const getPaymentStats = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    const { period = 'month' } = req.query; // month, quarter, year

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
        createdAt: {
          gte: startDate
        }
      },
      include: {
        lease: {
          select: {
            id: true,
            leaseNickname: true,
            rentAmount: true,
            interval: true
          }
        }
      }
    });

    // Calculate statistics
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.status === 'PAID');
    const pendingPayments = payments.filter(p => p.status === 'PENDING');
    
    const totalAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const onTimePayments = paidPayments.filter(p => p.timingStatus === 'ONTIME');
    const latePayments = paidPayments.filter(p => p.timingStatus === 'LATE');
    const advancePayments = paidPayments.filter(p => p.timingStatus === 'ADVANCE');
    
    const onTimeRate = paidPayments.length > 0 ? (onTimePayments.length / paidPayments.length) * 100 : 0;
    const lateRate = paidPayments.length > 0 ? (latePayments.length / paidPayments.length) * 100 : 0;

    // Payment method distribution
    const methodDistribution = {};
    paidPayments.forEach(payment => {
      const method = payment.method || 'UNKNOWN';
      methodDistribution[method] = (methodDistribution[method] || 0) + 1;
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthPayments = paidPayments.filter(p => 
        p.paidAt && p.paidAt >= monthStart && p.paidAt <= monthEnd
      );
      
      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: monthPayments.reduce((sum, p) => sum + p.amount, 0),
        count: monthPayments.length
      });
    }

    return res.json({
      summary: {
        totalPayments,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        totalAmount,
        pendingAmount,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
        lateRate: Math.round(lateRate * 100) / 100
      },
      timing: {
        onTime: onTimePayments.length,
        late: latePayments.length,
        advance: advancePayments.length
      },
      distribution: {
        methods: methodDistribution
      },
      trend: monthlyTrend
    });
  } catch (error) {
    console.error("Error fetching payment statistics:", error);
    return res.status(500).json({ message: "Failed to fetch payment statistics" });
  }
};

// ---------------------------------------------- GET PAYMENT HISTORY FOR LEASE ----------------------------------------------
export const getLeasePaymentHistory = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Verify lease belongs to landlord
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
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ message: "Lease not found" });
    }

    // Get payment history for this lease
    const payments = await prisma.payment.findMany({
      where: { leaseId: leaseId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      lease: {
        id: lease.id,
        leaseNickname: lease.leaseNickname,
        rentAmount: lease.rentAmount,
        interval: lease.interval,
        startDate: lease.startDate,
        endDate: lease.endDate,
        unit: lease.unit,
        tenant: lease.tenant
      },
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paidAt: payment.paidAt,
        method: payment.method,
        status: payment.status,
        timingStatus: payment.timingStatus,
        isPartial: payment.isPartial,
        note: payment.note,
        createdAt: payment.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching lease payment history:", error);
    return res.status(500).json({ message: "Failed to fetch payment history" });
  }
};

// ---------------------------------------------- SEND PAYMENT REMINDER ----------------------------------------------
export const sendPaymentReminder = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const { message, reminderType = 'GENERAL' } = req.body || {};
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Verify lease belongs to landlord
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
    });

    if (!lease) {
      return res.status(404).json({ message: "Lease not found" });
    }

    // Create reminder message (no conditions - just send like inquiry system)
    const defaultMessage = `Hello ${lease.tenant.firstName || 'Tenant'},

This is a friendly reminder about your rent payment for ${lease.unit.property.title} - ${lease.unit.label}.

Please make your payment as soon as possible to avoid any late fees.

Thank you for your prompt attention to this matter.

Best regards,
Your Landlord`;

    const reminderContent = message || defaultMessage;

    // Create a pre-message in the conversation between landlord and tenant
    // First, find or create a conversation between the landlord and tenant
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: ownerId, userBId: lease.tenant.id },
          { userAId: lease.tenant.id, userBId: ownerId }
        ]
      }
    });

    if (!conversation) {
      // Create new conversation if it doesn't exist
      conversation = await prisma.conversation.create({
        data: {
          userAId: ownerId,
          userBId: lease.tenant.id,
          title: `Conversation with ${lease.tenant.firstName} ${lease.tenant.lastName}`
        }
      });
    }

    // Create the payment reminder message
    const reminderMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: ownerId,
        content: reminderContent,
        isRead: false
      }
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // Create notification for the tenant
    try {
      await prisma.notification.create({
        data: {
          userId: lease.tenant.id,
          type: "PAYMENT_REMINDER",
          message: `Payment Reminder: Your landlord has sent you a payment reminder for ${lease.unit.property.title} - ${lease.unit.label}. Please check your messages.`,
          status: "UNREAD"
        }
      });
    } catch (notificationError) {
      console.error("Error creating payment reminder notification:", notificationError);
    }

    return res.json({
      message: "Payment reminder sent successfully",
      reminder: {
        id: reminderMessage.id,
        conversationId: conversation.id,
        leaseId: lease.id,
        tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
        tenantEmail: lease.tenant.email,
        reminderType: reminderType,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error sending payment reminder:", error);
    return res.status(500).json({ message: "Failed to send payment reminder" });
  }
};
