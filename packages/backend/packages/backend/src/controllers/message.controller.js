const Joi = require('joi');
const { Message, Project, User } = require('../models');
const { Op } = require('sequelize');

// Validation schemas
const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  receiverId: Joi.string().uuid().required(),
  projectId: Joi.string().uuid().required(),
  attachments: Joi.array().items(Joi.string()).optional()
});

const markAsReadSchema = Joi.object({
  messageId: Joi.string().uuid().optional(),
  conversationId: Joi.boolean().optional(),
  projectId: Joi.string().uuid().when('conversationId', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  senderId: Joi.string().uuid().when('conversationId', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
}).or('messageId', 'conversationId');

/**
 * @desc    Send a message from one user to another
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    const { content, receiverId, projectId, attachments = [] } = value;
    const senderId = req.user.id;

    // Check if the receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Receiver not found'
      });
    }

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Security check: Make sure the sender and receiver are both involved in the project
    const isClientOrProvider = (
      // Sender is the client and receiver is the provider (or potential provider)
      (req.user.id === project.clientId && (receiver.role === 'service_provider')) ||
      // Or sender is the provider and receiver is the client
      (req.user.role === 'service_provider' && project.clientId === receiverId)
    );

    if (!isClientOrProvider) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only send messages to users involved in the project'
      });
    }

    // Create the message
    const message = await Message.create({
      content,
      senderId,
      receiverId,
      projectId,
      attachments,
      isRead: false
    });

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: {
        message
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while sending the message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get conversation history between two users for a specific project
 * @route   GET /api/messages/conversation/:projectId/:userId
 * @access  Private
 */
const getConversation = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const currentUserId = req.user.id;
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Security check: Make sure the current user is involved in the project
    const isInvolved = (
      currentUserId === project.clientId || 
      currentUserId === project.assignedToId
    );

    if (!isInvolved) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only access conversations for projects you are involved in'
      });
    }

    // Get the conversation
    const messages = await Message.getConversationHistory(
      currentUserId,
      userId,
      projectId,
      limit,
      offset
    );

    // Count total messages for pagination
    const totalMessages = await Message.count({
      where: {
        projectId,
        [Op.or]: [
          {
            senderId: currentUserId,
            receiverId: userId
          },
          {
            senderId: userId,
            receiverId: currentUserId
          }
        ]
      }
    });

    // Mark all received messages in this conversation as read
    await Message.markConversationAsRead(projectId, userId, currentUserId);

    res.status(200).json({
      status: 'success',
      data: {
        messages,
        pagination: {
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit),
          page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all unread messages for the current user
 * @route   GET /api/messages/unread
 * @access  Private
 */
const getUnreadMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get unread messages
    const unreadMessages = await Message.findAll({
      where: {
        receiverId: currentUserId,
        isRead: false
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Count unread messages
    const unreadCount = await Message.getUnreadCount(currentUserId);

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount,
        messages: unreadMessages
      }
    });
  } catch (error) {
    console.error('Get unread messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching unread messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Mark message(s) as read
 * @route   PATCH /api/messages/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = markAsReadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    const { messageId, conversationId, projectId, senderId } = value;
    const currentUserId = req.user.id;

    // Mark a single message as read
    if (messageId) {
      const message = await Message.findByPk(messageId);
      
      if (!message) {
        return res.status(404).json({
          status: 'error',
          message: 'Message not found'
        });
      }

      // Security check: Only the receiver can mark a message as read
      if (message.receiverId !== currentUserId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only mark messages addressed to you as read'
        });
      }

      await message.markAsRead();

      return res.status(200).json({
        status: 'success',
        message: 'Message marked as read successfully'
      });
    }
    
    // Mark an entire conversation as read
    if (conversationId) {
      // Check project exists
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({
          status: 'error',
          message: 'Project not found'
        });
      }

      // Security check: Make sure the current user is involved in the project
      const isInvolved = (
        currentUserId === project.clientId || 
        currentUserId === project.assignedToId
      );

      if (!isInvolved) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only mark conversations for projects you are involved in'
        });
      }

      await Message.markConversationAsRead(projectId, senderId, currentUserId);

      return res.status(200).json({
        status: 'success',
        message: 'All messages in conversation marked as read successfully'
      });
    }
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while marking messages as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getUnreadMessages,
  markAsRead
};

