const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      budget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "open",
          "in_progress",
          "under_review",
          "completed",
          "cancelled"
        ),
        defaultValue: "open",
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      providerId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null when project is first posted
        references: {
          model: "Users",
          key: "id",
        },
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      attachments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "disputed", "refunded"),
        defaultValue: "pending",
      },
      visibility: {
        type: DataTypes.ENUM("public", "invite_only", "private"),
        defaultValue: "public",
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeUpdate: (project) => {
          // Set completedAt when status changes to completed
          if (
            project.changed("status") &&
            project.status === "completed" &&
            !project.completedAt
          ) {
            project.completedAt = new Date();
          }
        },
      },
    }
  );

  // Define associations
  Project.associate = (models) => {
    Project.belongsTo(models.User, {
      foreignKey: "clientId",
      as: "client",
    });
    Project.belongsTo(models.User, {
      foreignKey: "providerId",
      as: "provider",
    });
    Project.hasMany(models.Review, {
      foreignKey: "projectId",
      as: "reviews",
    });
    Project.hasMany(models.Message, {
      foreignKey: "projectId",
      as: "messages",
    });
    // You can add more associations like project proposals, milestones, etc.
  };

  return Project;
};
