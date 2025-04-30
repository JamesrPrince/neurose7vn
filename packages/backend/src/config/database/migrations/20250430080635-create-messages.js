"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Messages", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      attachments: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      receiverId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      projectId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Projects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex("Messages", ["senderId"]);
    await queryInterface.addIndex("Messages", ["receiverId"]);
    await queryInterface.addIndex("Messages", ["projectId"]);
    await queryInterface.addIndex("Messages", ["createdAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Messages");
  },
};
