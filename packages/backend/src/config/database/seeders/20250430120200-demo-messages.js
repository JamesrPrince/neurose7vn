"use strict";

const { v4: uuidv4 } = require("uuid");
const { User, Project } = require("../../../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, fetch the users and projects
    const users = await User.findAll({
      attributes: ["id", "role", "email"],
    });

    const projects = await Project.findAll({
      attributes: ["id", "clientId", "providerId", "status"],
    });

    // Filter projects that have both client and provider
    const activeProjects = projects.filter((project) => project.providerId);

    if (activeProjects.length === 0) {
      console.error(
        "No active projects found with both client and provider. Make sure to run the project seeder first."
      );
      return;
    }

    // Create messages
    const messages = [];

    // For each active project, create some conversation messages
    for (const project of activeProjects) {
      const clientId = project.clientId;
      const providerId = project.providerId;
      const projectId = project.id;

      // Add initial messages
      messages.push({
        id: uuidv4(),
        senderId: clientId,
        receiverId: providerId,
        projectId,
        content:
          "Hi there! Thanks for applying to my project. When can you start?",
        attachments: [],
        isRead: true,
        readAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      });

      messages.push({
        id: uuidv4(),
        senderId: providerId,
        receiverId: clientId,
        projectId,
        content:
          "Hello! I can start working on this right away. I just need a few more details about your requirements.",
        attachments: [],
        isRead: true,
        readAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      });

      messages.push({
        id: uuidv4(),
        senderId: clientId,
        receiverId: providerId,
        projectId,
        content:
          "Great! I've prepared a document with all the details. Let me know if you have any questions.",
        attachments: [],
        isRead: true,
        readAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      });

      // Skip some days for more realistic conversation flow

      messages.push({
        id: uuidv4(),
        senderId: providerId,
        receiverId: clientId,
        projectId,
        content:
          "I've been working on your project and have made significant progress. I'll share a demo link shortly.",
        attachments: [],
        isRead: true,
        readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      });

      messages.push({
        id: uuidv4(),
        senderId: clientId,
        receiverId: providerId,
        projectId,
        content: "That sounds great! Looking forward to seeing the progress.",
        attachments: [],
        isRead: true,
        readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      });

      // More recent messages

      messages.push({
        id: uuidv4(),
        senderId: providerId,
        receiverId: clientId,
        projectId,
        content:
          "Here's the demo link: https://demo.example.com. Please let me know your feedback!",
        attachments: [],
        isRead: true,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      });

      // For completed projects, add completion messages
      if (project.status === "completed") {
        messages.push({
          id: uuidv4(),
          senderId: providerId,
          receiverId: clientId,
          projectId,
          content:
            "I've completed all the requirements for this project. Please review and let me know if there are any changes needed.",
          attachments: [],
          isRead: true,
          readAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        });

        messages.push({
          id: uuidv4(),
          senderId: clientId,
          receiverId: providerId,
          projectId,
          content:
            "Everything looks great! I'm marking this project as complete. It was a pleasure working with you!",
          attachments: [],
          isRead: true,
          readAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
          updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        });
      } else {
        // For in-progress projects, add recent message that is unread
        messages.push({
          id: uuidv4(),
          senderId: clientId,
          receiverId: providerId,
          projectId,
          content:
            "I checked the demo and it looks great! I have a few small suggestions though. Can we add a search feature to the navigation bar?",
          attachments: [],
          isRead: false,
          readAt: null,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        });
      }
    }

    return queryInterface.bulkInsert("Messages", messages);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Messages", null, {});
  },
};
