const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("client", "provider", "admin"),
        defaultValue: "client",
      },
      profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      hourlyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  // Method to check password validity
  User.prototype.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  // Define associations
  User.associate = (models) => {
    User.hasMany(models.Project, {
      foreignKey: "clientId",
      as: "clientProjects",
    });
    User.hasMany(models.Project, {
      foreignKey: "providerId",
      as: "providerProjects",
    });
    User.hasMany(models.Review, {
      foreignKey: "reviewerId",
      as: "givenReviews",
    });
    User.hasMany(models.Review, {
      foreignKey: "revieweeId",
      as: "receivedReviews",
    });
    User.hasMany(models.Message, {
      foreignKey: "senderId",
      as: "sentMessages",
    });
    User.hasMany(models.Message, {
      foreignKey: "receiverId",
      as: "receivedMessages",
    });
  };

  return User;
};
