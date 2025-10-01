import { privateApi } from "./axios";

// ---------------------------------------------- INTERFACES ----------------------------------------------

export interface Notification {
  id: string;
  type: string;
  message: string;
  status: "UNREAD" | "READ" | "ARCHIVED";
  readAt: string | null;
  createdAt: string;
  link: string;
  time: string; // Formatted time ago string
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

export interface NotificationFilters {
  limit?: number;
  offset?: number;
  status?: "ALL" | "UNREAD" | "READ" | "ARCHIVED";
}

// ---------------------------------------------- API FUNCTIONS ----------------------------------------------

// Get user notifications
export const getNotifications = async (filters: NotificationFilters = {}): Promise<NotificationResponse> => {
  const params = new URLSearchParams();
  
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  if (filters.status) params.append('status', filters.status);
  
  const response = await privateApi.get(`/auth/notifications?${params.toString()}`);
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await privateApi.put(`/auth/notifications/${notificationId}/read`);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<{ updatedCount: number }> => {
  const response = await privateApi.put('/auth/notifications/read-all');
  return response.data;
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await privateApi.delete(`/auth/notifications/${notificationId}`);
};

// Get unread count only (for header badge)
export const getUnreadCount = async (): Promise<number> => {
  const response = await getNotifications({ limit: 1, status: "UNREAD" });
  return response.unreadCount;
};
