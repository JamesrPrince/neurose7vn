const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Message } = require('../models');

/**
 * Initialize Socket.IO server for real-time communication
 * @param {Object} server - HTTP server instance
 * @returns {Object} - Socket.IO instance
 */
exports.initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user exists
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user data to socket
      socket.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };
      
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Store active connections
  const userSockets = new Map();

  // Handle connection
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    const userId = socket.user.id;
    
    // Store user's socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join a private room based on user ID for direct messages
    socket.join(`user-${socket.user.id}`);
    
    // Event to join a specific conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation-${conversationId}`);
      console.log(`${socket.user.id} joined conversation ${conversationId}`);
    });
    
    // Event to leave a specific conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation-${conversationId}`);
      console.log(`${socket.user.id} left conversation ${conversationId}`);
    });
    
    // Event to send a message
    socket.on('send-message', async (messageData) => {
      try {
        const { receiverId, content, projectId, attachments = [] } = messageData;
        
        // Create message in database
        const message = await Message.create({
          senderId: userId,
          receiverId,
          projectId,
          content,
          attachments,
          isRead: false,
        });

        // Emit to sender
        socket.emit('new-message', {
          message: {
            ...message.toJSON(),
            isRead: false,
          },
          sender: await User.findByPk(userId, {
            attributes: [
              "id",
              "username",
              "firstName",
              "lastName",
              "profileImage",
            ],
          }),
        });

        // Emit to receiver if online
        if (userSockets.has(receiverId)) {
          userSockets.get(receiverId).forEach(socketId => {
            io.to(socketId).emit('new-message', {
              message: {
                ...message.toJSON(),
                isRead: false,
              },
              sender: await User.findByPk(userId, {
                attributes: [
                  "id",
                  "username",
                  "firstName",
                  "lastName",
                  "profileImage",
                ],
              }),
            });
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Event for typing indicator
    socket.on('typing', ({ receiverId, projectId, isTyping }) => {
      io.to(`user-${receiverId}`).emit('typing-indicator', {
        senderId: socket.user.id,
        projectId,
        isTyping
      });
    });

    // Handle message read status
    socket.on('message-read', async ({ messageId }) => {
      try {
        await Message.update(
          { isRead: true },
          { where: { id: messageId, receiverId: userId } }
        );

        // Notify sender that message was read
        const message = await Message.findByPk(messageId);
        if (message && userSockets.has(message.senderId)) {
          userSockets.get(message.senderId).forEach(socketId => {
            io.to(socketId).emit('message-read', { messageId });
          });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to update message status' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
      if (userSockets.has(userId)) {
        const userSocketSet = userSockets.get(userId);
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
};
