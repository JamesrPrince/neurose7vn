const { Message, User, Project } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all messages between current user and another user
 */
exports.getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { projectId } = req.query;
    
    // Validate if user exists
    const otherUser = await User.findByPk(userId);
    if (!otherUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Build query conditions
    const whereConditions = {
      [Op.or]: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    };
    
    // Add project filter if provided
    if (projectId) {
      whereConditions.projectId = projectId;
    }
    
    // Get messages
    const messages = await Message.findAll({
      where: whereConditions,
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title'],
          required: false
        }
      ]
    });
    
    // Mark unread messages as read
    const unreadMessages = messages.filter(
      msg => !msg.isRead && msg.receiverId === currentUserId
    );
    
    if (unreadMessages.length > 0) {
      await Message.update(
        { isRead: true, readAt: new Date() },
        {
          where: {
            id: { [Op.in]: unreadMessages.map(msg => msg.id) }
          }
        }
      );
    }
    
    res.status(200).json({
      status: 'success',
      data: { messages }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message to another user
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, projectId } = req.body;
    const senderId = req.user.id;
    
    // Validate if receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipient not found'
      });
    }
    
    // Validate project if provided
    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({
          status: 'error',
          message: 'Project not found'
        });
      }
    }
    
    // Create attachments array if files were uploaded
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push(`/uploads/messages/${file.filename}`);
      });
    }
    
    // Create message
    const message = await Message.create({
      senderId,
      receiverId,
      projectId,
      content,
      attachments,
      isRead: false
    });
    
    // Get message with associations
    const messageWithDetails = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title'],
          required: false
        }
      ]
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: { message: messageWithDetails }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all conversations for the current user
 */
exports.getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    
    // Get all unique users that current user has messaged with
    const conversations = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      attributes: [
        [sequelize.fn('DISTINCT', 
          sequelize.fn('CASE', 
            sequelize.literal(`WHEN "senderId" = '${currentUserId}' THEN "receiverId" ELSE "senderId" END`)), 
        'userId']
      ],
      raw: true
    });
    
    // Get user details and last message for each conversation
    const conversationDetails = await Promise.all(
      conversations.map(async (conv) => {
        const userId = conv.userId;
        
        // Get user details
        const user = await User.findByPk(userId, {
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage']
        });
        
        // Get last message
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: currentUserId, receiverId: userId },
              { senderId: userId, receiverId: currentUserId }
            ]
          },
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: Project,
              as: 'project',
              attributes: ['id', 'title'],
              required: false
            }
          ]
        });
        
        // Get unread count
        const unreadCount = await Message.count({
          where: {
            senderId: userId,
            receiverId: currentUserId,
            isRead: false
          }
        });
        
        return {
          user,
          lastMessage,
          unreadCount
        };
      })
    );
    
    res.status(200).json({
      status: 'success',
      data: { conversations: conversationDetails }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark message as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;
    
    // Find the message
    const message = await Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }
    
    // Check if user is the receiver
    if (message.receiverId !== currentUserId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to mark this message as read'
      });
    }
    
    // Update message
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Message marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread message count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    
    // Count unread messages
    const unreadCount = await Message.count({
      where: {
        receiverId: currentUserId,
        isRead: false
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};
