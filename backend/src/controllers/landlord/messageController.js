// file: messageController.js
import prisma from "../../libs/prismaClient.js";
import { createMessageNotification } from "../../services/notificationService.js";

// Helper function to check if a conversation is an inquiry
const checkIfInquiry = async (tenantId, landlordId) => {
  try {
    // Check if the tenant has an active lease with this landlord
    const existingLease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        unit: {
          property: {
            ownerId: landlordId
          }
        },
        OR: [
          { status: "ACTIVE" },
          { status: "DRAFT" }
        ]
      }
    });

    // If no active lease exists, this is an inquiry
    return !existingLease;
  } catch (error) {
    console.error("Error checking if inquiry:", error);
    // Default to true (inquiry) if there's an error
    return true;
  }
};

// ---------------------------------------------- GET ALL CONVERSATIONS FOR LANDLORD ----------------------------------------------
export const getLandlordConversations = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Get all conversations where the landlord is either userA or userB
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userAId: ownerId },
          { userBId: ownerId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        userB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: ownerId }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    });

    // Format the response
    const formattedConversations = await Promise.all(conversations.map(async (conversation) => {
      const otherUser = conversation.userAId === ownerId ? conversation.userB : conversation.userA;
      const lastMessage = conversation.messages[0];
      
      // Calculate time since last message
      let timeAgo = "";
      if (lastMessage) {
        const createdAt = new Date(lastMessage.createdAt);
        const now = new Date();
        const diffTime = now.getTime() - createdAt.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));

        if (diffDays > 0) {
          timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
          timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMinutes > 0) {
          timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else {
          timeAgo = "Just now";
        }
      }

      // Check if this is an inquiry dynamically
      const isInquiry = await checkIfInquiry(otherUser.id, ownerId);
      
      return {
        id: conversation.id,
        title: conversation.title || `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        otherUser: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          email: otherUser.email,
          avatarUrl: otherUser.avatarUrl,
          role: otherUser.role,
          fullName: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        },
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          isRead: lastMessage.isRead,
          createdAt: lastMessage.createdAt,
          sender: {
            id: lastMessage.sender.id,
            firstName: lastMessage.sender.firstName,
            lastName: lastMessage.sender.lastName,
            avatarUrl: lastMessage.sender.avatarUrl,
            fullName: `${lastMessage.sender.firstName || ''} ${lastMessage.sender.lastName || ''}`.trim() || lastMessage.sender.id,
          }
        } : null,
        unreadCount: conversation._count.messages,
        timeAgo,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        isInquiry: isInquiry, // Dynamic inquiry check
      };
    }));

    return res.json(formattedConversations);
  } catch (error) {
    console.error("Error fetching landlord conversations:", error);
    return res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// ---------------------------------------------- GET CONVERSATION MESSAGES ----------------------------------------------
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    // Verify the conversation belongs to the landlord
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userAId: ownerId },
          { userBId: ownerId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        userB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or not accessible" });
    }

    // Get all messages for this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read (only messages from other user)
    await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: ownerId },
        isRead: false
      },
      data: { isRead: true }
    });

    // Format the response
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        email: message.sender.email,
        avatarUrl: message.sender.avatarUrl,
        role: message.sender.role,
        fullName: `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email,
      }
    }));

    const otherUser = conversation.userAId === ownerId ? conversation.userB : conversation.userA;

    return res.json({
      conversation: {
        id: conversation.id,
        title: conversation.title || `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        otherUser: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          email: otherUser.email,
          avatarUrl: otherUser.avatarUrl,
          role: otherUser.role,
          fullName: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        },
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: formattedMessages
    });
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    return res.status(500).json({ message: "Failed to fetch conversation messages" });
  }
};

// ---------------------------------------------- SEND MESSAGE ----------------------------------------------
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (!conversationId || !content) {
      return res.status(400).json({ message: "Conversation ID and content are required" });
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userAId: senderId },
          { userBId: senderId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or not accessible" });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversationId,
        senderId: senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      }
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Get the recipient (other user in the conversation)
    const recipientId = conversation.userAId === senderId ? conversation.userBId : conversation.userAId;

    // Create notification for the recipient
    try {
      await createMessageNotification(recipientId, {
        sender: message.sender,
        content: message.content,
        conversation: { id: conversation.id }
      });
    } catch (notificationError) {
      console.error("Error creating message notification:", notificationError);
      // Don't fail the message send if notification fails
    }

    return res.json({
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          email: message.sender.email,
          avatarUrl: message.sender.avatarUrl,
          role: message.sender.role,
          fullName: `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email,
        }
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
};

// ---------------------------------------------- DELETE LANDLORD MESSAGE ----------------------------------------------
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" });
    }

    // Find the message and verify ownership
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId, // Only sender can delete their own message
      },
      include: {
        conversation: true
      }
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found or not accessible" });
    }

    // Check if this is already a deleted message placeholder
    if (message.content === "This message was deleted") {
      // Permanently delete the placeholder message from database
      await prisma.message.delete({
        where: { id: messageId }
      });

      return res.json({
        message: "Message permanently deleted",
        permanentlyDeleted: true
      });
    } else {
      // Mark message as deleted (soft delete)
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: "This message was deleted"
        }
      });

      return res.json({
        message: "Message deleted successfully",
        deletedMessage: {
          id: updatedMessage.id,
          content: updatedMessage.content
        }
      });
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
};

// ---------------------------------------------- CREATE OR GET CONVERSATION ----------------------------------------------
export const createOrGetConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (!otherUserId) {
      return res.status(400).json({ message: "Other user ID is required" });
    }

    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: currentUserId, userBId: otherUserId },
          { userAId: otherUserId, userBId: currentUserId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        userB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      }
    });

    // If conversation doesn't exist, create it
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId: currentUserId,
          userBId: otherUserId,
        },
        include: {
          userA: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
            }
          },
          userB: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
            }
          }
        }
      });
    }

    const otherUser = conversation.userAId === currentUserId ? conversation.userB : conversation.userA;

    return res.json({
      conversation: {
        id: conversation.id,
        title: conversation.title || `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        otherUser: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          email: otherUser.email,
          avatarUrl: otherUser.avatarUrl,
          role: otherUser.role,
          fullName: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email,
        },
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      }
    });
  } catch (error) {
    console.error("Error creating or getting conversation:", error);
    return res.status(500).json({ message: "Failed to create or get conversation" });
  }
};

// ---------------------------------------------- DELETE CONVERSATION ----------------------------------------------
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userAId: ownerId },
          { userBId: ownerId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or not accessible" });
    }

    // Delete the conversation (messages will be deleted due to cascade)
    await prisma.conversation.delete({
      where: { id: conversationId }
    });

    return res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ message: "Failed to delete conversation" });
  }
};

// ---------------------------------------------- GET MESSAGE STATISTICS ----------------------------------------------
export const getMessageStats = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: owner not found" });
    }

    // Get conversation and message statistics
    const totalConversations = await prisma.conversation.count({
      where: {
        OR: [
          { userAId: ownerId },
          { userBId: ownerId }
        ]
      }
    });

    const totalMessages = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { userAId: ownerId },
            { userBId: ownerId }
          ]
        }
      }
    });

    const unreadMessages = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { userAId: ownerId },
            { userBId: ownerId }
          ]
        },
        isRead: false,
        senderId: { not: ownerId }
      }
    });

    // Get recent conversations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentConversations = await prisma.conversation.count({
      where: {
        OR: [
          { userAId: ownerId },
          { userBId: ownerId }
        ],
        updatedAt: {
          gte: sevenDaysAgo
        }
      }
    });

    return res.json({
      totalConversations,
      totalMessages,
      unreadMessages,
      recentConversations,
    });
  } catch (error) {
    console.error("Error fetching message statistics:", error);
    return res.status(500).json({ message: "Failed to fetch message statistics" });
  }
};
