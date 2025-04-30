const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      receiverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Projects",
          key: "id",
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attachments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeUpdate: (message) => {
          if (message.changed("isRead") && message.isRead) {
            message.readAt = new Date();
          }
        },
      },
    }
  );

  // Define associations
  Message.associate = (models) => {
    Message.belongsTo(models.User, {
      foreignKey: "senderId",
      as: "sender",
    });
    Message.belongsTo(models.User, {
      foreignKey: "receiverId",
      as: "receiver",
    });
    Message.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });
  };

  return Message;
};
