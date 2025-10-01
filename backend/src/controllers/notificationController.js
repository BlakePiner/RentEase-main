import prisma from "../libs/prismaClient.js";

// ---------------------------------------------- GET USER NOTIFICATIONS ----------------------------------------------
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    const { limit = 20, offset = 0, status = "ALL" } = req.query;

    // Build where clause based on status filter
    let whereClause = { userId };
    if (status !== "ALL") {
      whereClause.status = status;
    }

    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Get total count for pagination
    const totalCount = await prisma.notification.count({
      where: whereClause,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { userId, status: "UNREAD" },
    });

    // Format notifications for frontend
    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      message: notification.message,
      status: notification.status,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      // Generate appropriate link based on notification type
      link: generateNotificationLink(notification),
      // Format time for display
      time: formatTimeAgo(notification.createdAt),
    }));

    return res.json({
      notifications: formattedNotifications,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > parseInt(offset) + parseInt(limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// ---------------------------------------------- MARK NOTIFICATION AS READ ----------------------------------------------
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    // Update notification status
    const updatedNotification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId, // Ensure user can only update their own notifications
      },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });

    if (updatedNotification.count === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

// ---------------------------------------------- MARK ALL NOTIFICATIONS AS READ ----------------------------------------------
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    // Update all unread notifications
    const updatedCount = await prisma.notification.updateMany({
      where: {
        userId: userId,
        status: "UNREAD",
      },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });

    return res.json({ 
      message: "All notifications marked as read",
      updatedCount: updatedCount.count,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

// ---------------------------------------------- DELETE NOTIFICATION ----------------------------------------------
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    // Delete notification
    const deletedNotification = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId, // Ensure user can only delete their own notifications
      },
    });

    if (deletedNotification.count === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
};

// ---------------------------------------------- CREATE NOTIFICATION (INTERNAL USE) ----------------------------------------------
export const createNotification = async (userId, type, message) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        status: "UNREAD",
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// ---------------------------------------------- HELPER FUNCTIONS ----------------------------------------------

// Generate appropriate link based on notification type
function generateNotificationLink(notification) {
  const { type, message } = notification;
  
  // Extract relevant IDs from message if possible
  const messageLower = message.toLowerCase();
  
  switch (type) {
    case "PAYMENT":
      if (messageLower.includes("payment")) {
        return "/landlord/payments";
      }
      return "/landlord/payments";
      
    case "LEASE":
      if (messageLower.includes("lease")) {
        return "/landlord/leases";
      }
      return "/landlord/leases";
      
    case "MAINTENANCE":
      if (messageLower.includes("maintenance")) {
        return "/landlord/maintenance";
      }
      return "/landlord/maintenance";
      
    case "MESSAGE":
      if (messageLower.includes("message")) {
        return "/landlord/messages";
      }
      return "/landlord/messages";
      
    case "TENANT":
      if (messageLower.includes("tenant")) {
        return "/landlord/tenants";
      }
      return "/landlord/tenants";
      
    case "PROPERTY":
      if (messageLower.includes("property")) {
        return "/landlord/properties";
      }
      return "/landlord/properties";
      
    case "SYSTEM":
    default:
      return "/landlord/dashboard";
  }
}

// Format time ago for display
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return "Just now";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}
