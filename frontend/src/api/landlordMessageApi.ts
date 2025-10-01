import { privateApi } from "./axios";

// Types for message data
export interface Conversation {
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
  timeAgo: string;
  createdAt: string;
  updatedAt: string;
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
  conversationId: string;
  content: string;
}

export interface CreateConversationData {
  otherUserId: string;
}

// API functions
export const getLandlordConversationsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<Conversation[]>("/landlord/messages", {
    signal: params?.signal,
  });
  return response;
};

export const getConversationMessagesRequest = async (conversationId: string, params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<ConversationWithMessages>(`/landlord/messages/${conversationId}`, {
    signal: params?.signal,
  });
  return response;
};

export const sendMessageRequest = async (data: SendMessageData) => {
  const response = await privateApi.post("/landlord/messages", data);
  return response;
};

export const createOrGetConversationRequest = async (data: CreateConversationData) => {
  const response = await privateApi.post("/landlord/messages/conversation", data);
  return response;
};

export const deleteConversationRequest = async (conversationId: string) => {
  const response = await privateApi.delete(`/landlord/messages/${conversationId}`);
  return response;
};

export const getMessageStatsRequest = async (params?: { signal?: AbortSignal }) => {
  const response = await privateApi.get<MessageStats>("/landlord/messages/stats", {
    signal: params?.signal,
  });
  return response;
};
