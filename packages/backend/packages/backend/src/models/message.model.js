const { Model, DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user.model');
const Project = require('./project.model');

class Message extends Model {
  // Instance method to mark message as read
  async markAsRead() {
    this.isRead = true;
    return await this.save();
  }
  
  // Static method to get conversation history between two users for a specific project
  static async getConversationHistory(user1Id, user2Id, projectId, limit = 50, offset = 0) {
    return await Message.findAll({
      where: {
        projectId,
        [Op.or]: [
          {
            senderId: user1Id,
            receiverId: user2Id
          },
          {
            senderId: user2Id,
            receiverId: user1Id
          }
        ]
      },
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });
  }
  
  // Static method to get unread messages count for a user
  static async getUnreadCount(userId) {
    return await Message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
  }
  
  // Static method to mark all messages in a conversation as read
  static async markConversationAsRead(projectId, senderId, receiverId) {
    return await Message.update(
      { isRead: true },
      {
        where: {
          projectId,
          senderId,
          receiverId,
          isRead: false
        }
      }
    );
  }
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Message content cannot be empty',
        },
        len: {
          args: [1, 5000],
          msg: 'Message content must be between 1 and 5000 characters',
        },
      },
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
  }
);

// Define associations
Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender',
});

Message.belongsTo(User, {
  foreignKey: 'receiverId',
  as: 'receiver',
});

Message.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// User has many sent messages
User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'sentMessages',
});

// User has many received messages
User.hasMany(Message, {
  foreignKey: 'receiverId',
  as: 'receivedMessages',
});

// Project has many messages
Project.hasMany(Message, {
  foreignKey: 'projectId',
  as: 'messages',
});

module.exports = Message;

