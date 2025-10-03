import { privateApi } from "./axios";

// Types for message data (same as landlord but for tenant context)
export interface Conversation {
  id: string | null;
  title: string;
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
    role: string;
    fullName: string;
  };
  lastMessage: {
    id: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    sender: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      fullName: string;
    };
  } | null;
  unreadCount: number;
  timeAgo: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isLandlord?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
    role: string;
    fullName: string;
  };
}

export interface ConversationWithMessages {
  conversation: {
    id: string;
    title: string;
    otherUser: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      avatarUrl: string | null;
      role: string;
      fullName: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  messages: Message[];
}

export interface MessageStats {
  totalConversations: number;
  totalMessages: number;
  unreadMessages: number;
  recentConversations: number;
}

export interface SendMessageData {
  conversationId?: string;
  recipientId?: string;
  content: string;
}

export interface CreateConversationData {
  otherUserId: string;
}

// API functions for tenant messaging
export const getTenantConversationsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<Conversation[]>("/tenant/messages", {
    signal: params?.signal,
  });
  return response;
};

export const getTenantConversationMessagesRequest = async (conversationId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<ConversationWithMessages>(`/tenant/messages/${conversationId}`, {
    signal: params?.signal,
  });
  return response;
};

export const sendTenantMessageRequest = async (data: SendMessageData) => {
  const response = await privateApi.post("/tenant/messages", data);
  return response;
};

export const createOrGetTenantConversationRequest = async (data: CreateConversationData) => {
  const response = await privateApi.post("/tenant/messages/conversation", data);
  return response;
};

export const getTenantMessageStatsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<MessageStats>("/tenant/messages/stats", {
    signal: params?.signal,
  });
  return response;
};

export const deleteTenantMessageRequest = async (messageId: string) => {
  const response = await privateApi.delete(`/tenant/messages/${messageId}`);
  return response;
};
