"use strict";

const { v4: uuidv4 } = require("uuid");
const { User } = require("../../../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, fetch the user IDs we need
    const users = await User.findAll({
      attributes: ["id", "role", "email"],
    });

    const clientUsers = users.filter((user) => user.role === "client");
    const providerUsers = users.filter((user) => user.role === "provider");

    // Make sure we have the users we need
    if (clientUsers.length < 2 || providerUsers.length < 2) {
      console.error(
        "Not enough users found. Make sure to run the user seeder first."
      );
      return;
    }

    const client1Id = clientUsers[0].id;
    const client2Id = clientUsers[1].id;
    const provider1Id = providerUsers[0].id;
    const provider2Id = providerUsers[1].id;

    // Create projects
    const projects = [
      {
        id: uuidv4(),
        title: "E-commerce Website Development",
        description:
          "Looking for a developer to build a modern e-commerce website with product catalog, shopping cart, and payment integration.",
        budget: 3000.0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "in_progress",
        clientId: client1Id,
        providerId: provider1Id,
        category: "web_development",
        skills: ["JavaScript", "React", "Node.js", "MongoDB"],
        attachments: [],
        visibility: "public",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
      {
        id: uuidv4(),
        title: "Mobile App UI/UX Design",
        description:
          "Need a talented designer to create user interface designs for a fitness tracking mobile app.",
        budget: 1500.0,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        status: "in_progress",
        clientId: client2Id,
        providerId: provider2Id,
        category: "design",
        skills: ["UI/UX", "Figma", "Adobe XD", "Mobile Design"],
        attachments: [],
        visibility: "public",
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },
      {
        id: uuidv4(),
        title: "WordPress Blog Setup and Customization",
        description:
          "Looking for someone to set up a WordPress blog with custom theme and essential plugins.",
        budget: 500.0,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        status: "open",
        clientId: client1Id,
        providerId: null,
        category: "web_development",
        skills: ["WordPress", "PHP", "CSS", "Theme Development"],
        attachments: [],
        visibility: "public",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        id: uuidv4(),
        title: "Database Optimization for SaaS Platform",
        description:
          "Need an experienced developer to optimize our PostgreSQL database and improve query performance.",
        budget: 1200.0,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: "open",
        clientId: client2Id,
        providerId: null,
        category: "data_science",
        skills: [
          "PostgreSQL",
          "Database Optimization",
          "SQL",
          "Performance Tuning",
        ],
        attachments: [],
        visibility: "public",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: uuidv4(),
        title: "React Native Mobile App Development",
        description:
          "Looking for a React Native developer to build a cross-platform mobile application with authentication and API integration.",
        budget: 4000.0,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        status: "open",
        clientId: client1Id,
        providerId: null,
        category: "mobile_app",
        skills: [
          "React Native",
          "JavaScript",
          "API Integration",
          "Mobile Development",
        ],
        attachments: [],
        visibility: "public",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: uuidv4(),
        title: "Logo and Brand Identity Design",
        description:
          "Need a creative designer to create a logo and brand identity for a new startup in the tech industry.",
        budget: 800.0,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: "completed",
        clientId: client2Id,
        providerId: provider2Id,
        category: "design",
        skills: [
          "Logo Design",
          "Brand Identity",
          "Adobe Illustrator",
          "Creative Design",
        ],
        attachments: [],
        visibility: "public",
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Completed 5 days ago
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    return queryInterface.bulkInsert("Projects", projects);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Projects", null, {});
  },
};
