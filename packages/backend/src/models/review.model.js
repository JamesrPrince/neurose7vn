const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Review = sequelize.define(
    "Review",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Projects",
          key: "id",
        },
      },
      reviewerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      revieweeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("client_to_provider", "provider_to_client"),
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  // Define associations
  Review.associate = (models) => {
    Review.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });
    Review.belongsTo(models.User, {
      foreignKey: "reviewerId",
      as: "reviewer",
    });
    Review.belongsTo(models.User, {
      foreignKey: "revieweeId",
      as: "reviewee",
    });
  };

  return Review;
};
