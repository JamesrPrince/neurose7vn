const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { Message, User } = require("../models");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Store active connections
  const userSockets = new Map();

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    
    // Store user's socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Handle private messages
    socket.on('private-message', async ({ content, receiverId, projectId, attachments = [] }) => {
      try {
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
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', ({ receiverId, projectId }) => {
      if (userSockets.has(receiverId)) {
        userSockets.get(receiverId).forEach(socketId => {
          io.to(socketId).emit('user-typing', { userId, projectId });
        });
      }
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

module.exports = initializeSocket;
