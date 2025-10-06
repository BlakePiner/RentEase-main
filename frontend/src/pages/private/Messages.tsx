import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Send, 
  Search, 
  ArrowLeft,
  User,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  MoreVertical,
  ImageIcon,
  Paperclip,
  Users,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { 
  getLandlordConversationsRequest, 
  getConversationMessagesRequest, 
  sendMessageRequest, 
  deleteConversationRequest,
  deleteMessageRequest,
  getMessageStatsRequest,
  createOrGetConversationRequest,
  type Conversation,
  type Message,
  type ConversationWithMessages,
  type MessageStats
} from "@/api/landlordMessageApi";
import { getLandlordTenantsRequest, type TenantManagementItem } from "@/api/landlordTenantApi";
import {
  getTenantConversationsRequest,
  getTenantConversationMessagesRequest,
  sendTenantMessageRequest,
  deleteTenantMessageRequest,
  deleteTenantConversationRequest,
  getTenantMessageStatsRequest,
  type Conversation as TenantConversation,
  type Message as TenantMessage,
  type ConversationWithMessages as TenantConversationWithMessages,
  type MessageStats as TenantMessageStats
} from "@/api/tenantMessageApi";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteConversationConfirm, setShowDeleteConversationConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [stats, setStats] = useState<MessageStats | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const checkScrollPosition = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsAtBottom(distanceFromBottom < 100);
      setShowScrollButton(distanceFromBottom > 300);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Fetch conversations and stats
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const isLandlord = user.role === "LANDLORD";
        const [conversationsRes, statsRes] = await Promise.all([
          isLandlord 
            ? getLandlordConversationsRequest({ signal: controller.signal })
            : getTenantConversationsRequest({ signal: controller.signal }),
          isLandlord 
            ? getMessageStatsRequest({ signal: controller.signal })
            : getTenantMessageStatsRequest({ signal: controller.signal }),
        ]);
        
        let conversations = conversationsRes.data;
        
        // Auto-create conversations for active tenants (landlord only)
        if (isLandlord) {
          try {
            const tenantsRes = await getLandlordTenantsRequest({ signal: controller.signal });
            const activeTenants = tenantsRes.data.filter((item: TenantManagementItem) => 
              item.type === 'TENANT' && item.tenant
            );
            
            // Create conversations for tenants that don't have existing conversations
            const conversationPromises = activeTenants.map(async (tenant: TenantManagementItem) => {
              const existingConversation = conversations.find(conv => 
                conv.otherUser && conv.otherUser.id === tenant.tenant.id
              );
              
              if (!existingConversation) {
                try {
                  const response = await createOrGetConversationRequest({
                    otherUserId: tenant.tenant.id
                  });
                  return response.data;
                } catch (error) {
                  console.warn(`Failed to create conversation with tenant ${tenant.tenant.id}:`, error);
                  return null;
                }
              }
              return null;
            });
            
            const newConversations = await Promise.all(conversationPromises);
            const validNewConversations = newConversations.filter(conv => conv !== null);
            
            if (validNewConversations.length > 0) {
              conversations = [...validNewConversations, ...conversations];
              console.log(`✅ Auto-created ${validNewConversations.length} conversations for active tenants`);
            }
          } catch (error) {
            console.error('Error auto-creating conversations:', error);
          }
        }
        
        setConversations(conversations);
        setStats(statsRes.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching conversations:", err);
          toast.error("Failed to fetch conversations");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [user]);

  // Auto-select conversation based on URL parameters
  useEffect(() => {
    const tenantId = searchParams.get('tenantId');
    const tenantName = searchParams.get('tenantName');
    
    if (tenantId && conversations.length > 0 && !selectedConversation && user?.role === 'LANDLORD') {
      // Look for existing conversation with this tenant
      const existingConversation = conversations.find(conv => 
        conv.otherUser && conv.otherUser.id === tenantId
      );
      
      if (existingConversation) {
        setSelectedConversation(existingConversation);
        setShowMobileChat(true);
      } else if (tenantName) {
        // Create a new conversation with the tenant
        const createConversation = async () => {
          try {
            const response = await createOrGetConversationRequest({
              otherUserId: tenantId
            });
            
            // Add the new conversation to the list
            const newConversation = response.data;
            setConversations(prev => [newConversation, ...prev]);
            
            // Select the new conversation
            setSelectedConversation(newConversation);
            setShowMobileChat(true);
            
            toast.success(`Started conversation with ${tenantName}`);
          } catch (error: any) {
            console.error('Error creating conversation:', error);
            toast.error('Failed to start conversation');
            
            // Fallback: create a virtual conversation
            const virtualConversation: Conversation = {
              id: `virtual-${tenantId}`,
              otherUser: {
                id: tenantId,
                firstName: tenantName.split(' ')[0] || '',
                lastName: tenantName.split(' ').slice(1).join(' ') || '',
                email: '',
                avatarUrl: null,
                role: 'TENANT',
                fullName: tenantName
              },
              lastMessage: null,
              unreadCount: 0,
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              title: `Chat with ${tenantName}`,
              timeAgo: 'now'
            };
            setSelectedConversation(virtualConversation);
            setShowMobileChat(true);
          }
        };
        
        createConversation();
      }
    }
  }, [conversations, searchParams, selectedConversation, user]);


  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !user) {
      setMessages([]);
      return;
    }

    // Don't fetch messages for virtual conversations
    if (!selectedConversation.id || selectedConversation.id.startsWith('virtual-')) {
      setMessages([]);
      return;
    }

    const controller = new AbortController();
    const fetchMessages = async () => {
      try {
        const isLandlord = user.role === "LANDLORD";
        const response = isLandlord 
          ? await getConversationMessagesRequest(selectedConversation.id!, { signal: controller.signal })
          : await getTenantConversationMessagesRequest(selectedConversation.id!, { signal: controller.signal });
        setMessages(response.data.messages);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching messages:", err);
          toast.error("Failed to fetch messages");
        }
      }
    };

    fetchMessages();
    return () => controller.abort();
  }, [selectedConversation, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);

    try {
      const isLandlord = user.role === "LANDLORD";
      let response;

      if (isLandlord) {
        if (selectedConversation.id && !selectedConversation.id.startsWith('virtual-')) {
          // Existing conversation
          response = await sendMessageRequest({
            conversationId: selectedConversation.id,
            content: messageContent,
          });
        } else {
          // New conversation - send message with recipientId
          response = await sendMessageRequest({
            recipientId: selectedConversation.otherUser.id,
            content: messageContent,
          });
        }
      } else {
        // For tenants, handle both existing conversations and new conversations with landlord
        if (selectedConversation.id) {
          // Existing conversation
          response = await sendTenantMessageRequest({
            conversationId: selectedConversation.id,
            content: messageContent,
          });
        } else {
          // New conversation with landlord (virtual conversation)
          response = await sendTenantMessageRequest({
            recipientId: selectedConversation.otherUser.id,
            content: messageContent,
          });
        }
      }

      // Add the new message to the messages list
      setMessages(prev => [...prev, response.data.message]);

      // Update the conversation's last message and unread count
      setConversations(prev => prev.map(conv => 
        (conv.id === selectedConversation.id || (conv.isLandlord && selectedConversation.isLandlord))
          ? {
              ...conv,
              id: response.data.message.conversationId, // Update with real conversation ID
              lastMessage: response.data.message,
              unreadCount: 0,
              updatedAt: response.data.message.createdAt,
            }
          : conv
      ));

      // Update selected conversation with real ID
      setSelectedConversation(prev => prev ? {
        ...prev,
        id: response.data.message.conversationId
      } : null);

      toast.success("Message sent successfully");
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
      setNewMessage(messageContent); // Restore the message
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      const isLandlord = user.role === "LANDLORD";
      const response = await (isLandlord ? deleteMessageRequest(messageId) : deleteTenantMessageRequest(messageId));
      
      // Check if message was permanently deleted
      if (response.data.permanentlyDeleted) {
        // Remove the message from the messages list entirely
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast.success("Message permanently deleted");
      } else {
        // Update the message content to show "This message was deleted"
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: "This message was deleted" }
            : msg
        ));
        toast.success("Message deleted successfully");
      }
    } catch (err: any) {
      console.error("Error deleting message:", err);
      toast.error("Failed to delete message");
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!user) return;
    
    try {
      if (user.role === "LANDLORD") {
        await deleteConversationRequest(conversationId);
      } else if (user.role === "TENANT") {
        await deleteTenantConversationRequest(conversationId);
      } else {
        toast.error("Unauthorized to delete conversations");
        return;
      }
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      toast.success("Conversation deleted successfully");
    } catch (err: any) {
      console.error("Error deleting conversation:", err);
      const errorMessage = err.response?.data?.message || "Failed to delete conversation";
      toast.error(errorMessage);
    }
    setShowDeleteConversationConfirm(null);
  };

  const filteredConversations = conversations.filter(conversation =>
    (conversation.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (conversation.otherUser.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (conversation.otherUser.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffSeconds > 0) {
      return `${diffSeconds} second${diffSeconds > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-emerald-600" />
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            {stats && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{stats.totalConversations} conversations</span>
                </div>
                {stats.unreadMessages > 0 && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{stats.unreadMessages} unread</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileChat(!showMobileChat)}
            className="md:hidden"
          >
            {showMobileChat ? <ArrowLeft className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 bg-white border-r border-gray-200`}>
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-emerald-50 border-emerald-200' : ''
                  }`}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    setShowMobileChat(true);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium">
                      {(conversation.otherUser.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conversation.title || 'Untitled Conversation'}
                          </h3>
                          {user?.role === "LANDLORD" && conversation.isInquiry && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                              Inquiry
                            </span>
                          )}
                          {user?.role === "TENANT" && !conversation.isInquiry && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                              Current Landlord
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && (
                            <span className="bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                          {(user?.role === "LANDLORD" || (user?.role === "TENANT" && conversation.id !== null && conversation.isInquiry)) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConversationConfirm(conversation.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage?.content || "No messages yet"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conversation.timeAgo || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </h3>
                <p className="text-sm text-gray-600">
                  {searchQuery 
                    ? "Try adjusting your search terms."
                    : user?.role === "LANDLORD" 
                      ? "Start a conversation with a tenant to see messages here."
                      : "Your conversations with landlords will appear here."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation && (
          <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-white`}>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium text-sm">
                    {(selectedConversation.otherUser.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900">{selectedConversation.title || 'Untitled Conversation'}</h2>
                    <p className="text-sm text-gray-600">{selectedConversation.otherUser.role || 'User'}</p>
                  </div>
                </div>
                {(user?.role === "LANDLORD" || (user?.role === "TENANT" && selectedConversation.id !== null && selectedConversation.isInquiry)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConversationConfirm(selectedConversation.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.length > 0 ? (
                messages.map((message) => {
                  const isDeleted = message.content === "This message was deleted";
                  const isMyMessage = message.senderId === user?.id;
                  const canDelete = isMyMessage && !isDeleted;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} group`}
                      onMouseEnter={() => setHoveredMessage(message.id)}
                      onMouseLeave={() => setHoveredMessage(null)}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                        isDeleted 
                          ? 'bg-gray-100 text-gray-500 italic' 
                          : isMyMessage 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gray-200 text-gray-900'
                      }`}>
                        {isDeleted ? (
                          <div className="flex items-center justify-between">
                            <p className="text-sm">This message was deleted</p>
                            {isMyMessage && (
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Permanently delete this message"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <p className="text-sm">{message.content}</p>
                            {canDelete && hoveredMessage === message.id && (
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                title="Delete message"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </>
                        )}
                        <div className={`flex items-center justify-between mt-1 text-xs ${
                          isMyMessage && !isDeleted ? 'text-emerald-100' : 'text-gray-500'
                        }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {isMyMessage && !isDeleted && (
                            <div className="flex items-center gap-1">
                              {message.isRead ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No messages yet</h3>
                    <p className="text-sm text-gray-600">Start the conversation by sending a message below.</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={sendingMessage}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  size="sm"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* No conversation selected */}
        {!selectedConversation && (
          <div className="hidden md:flex flex-1 items-center justify-center bg-white">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation from the sidebar to start messaging.</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConversationConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Conversation</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConversationConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteConversation(showDeleteConversationConfirm)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;