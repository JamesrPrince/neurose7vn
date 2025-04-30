module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "Message",
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
          notEmpty: true,
        },
      },
      attachments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
        allowNull: false,
        references: {
          model: "Projects",
          key: "id",
        },
      },
    },
    {
      tableName: "Messages",
      timestamps: true,
    }
  );

  Message.associate = (models) => {
    Message.belongsTo(models.User, {
      as: "sender",
      foreignKey: "senderId",
    });
    Message.belongsTo(models.User, {
      as: "receiver",
      foreignKey: "receiverId",
    });
    Message.belongsTo(models.Project, {
      foreignKey: "projectId",
    });
  };

  return Message;
};
