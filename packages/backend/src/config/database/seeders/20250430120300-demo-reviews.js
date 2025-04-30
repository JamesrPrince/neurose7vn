"use strict";

const { v4: uuidv4 } = require("uuid");
const { Project } = require("../../../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find completed projects
    const completedProjects = await Project.findAll({
      where: { status: "completed" },
      attributes: ["id", "clientId", "providerId", "title"],
    });

    if (completedProjects.length === 0) {
      console.error(
        "No completed projects found. Make sure to run the project seeder first."
      );
      return;
    }

    // Create reviews
    const reviews = [];

    // For each completed project, create reviews from both parties
    for (const project of completedProjects) {
      const clientId = project.clientId;
      const providerId = project.providerId;
      const projectId = project.id;

      // Client review of provider
      reviews.push({
        id: uuidv4(),
        projectId,
        reviewerId: clientId,
        revieweeId: providerId,
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 rating
        comment: `Excellent work on the ${project.title} project. Very professional and delivered on time. Would definitely work with this provider again.`,
        type: "client_to_provider",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      });

      // Provider review of client
      reviews.push({
        id: uuidv4(),
        projectId,
        reviewerId: providerId,
        revieweeId: clientId,
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 rating
        comment: `Great client to work with! Clear requirements and prompt communication throughout the project.`,
        type: "provider_to_client",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      });
    }

    return queryInterface.bulkInsert("Reviews", reviews);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Reviews", null, {});
  },
};
