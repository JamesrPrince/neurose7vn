"use strict";

const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create admin user
    const adminId = uuidv4();

    // Create client users
    const client1Id = uuidv4();
    const client2Id = uuidv4();

    // Create provider users
    const provider1Id = uuidv4();
    const provider2Id = uuidv4();

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    return queryInterface.bulkInsert("Users", [
      {
        id: adminId,
        email: "admin@techfreelance.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        bio: "Platform administrator",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: client1Id,
        email: "client1@example.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Client",
        role: "client",
        bio: "Tech startup founder looking for talented developers",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: client2Id,
        email: "client2@example.com",
        password: hashedPassword,
        firstName: "Sarah",
        lastName: "Johnson",
        role: "client",
        bio: "Marketing director needing website development",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: provider1Id,
        email: "provider1@example.com",
        password: hashedPassword,
        firstName: "Michael",
        lastName: "Developer",
        role: "provider",
        bio: "Full stack developer with 5+ years of experience",
        skills: ["JavaScript", "React", "Node.js", "MongoDB"],
        hourlyRate: 75.0,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: provider2Id,
        email: "provider2@example.com",
        password: hashedPassword,
        firstName: "Emma",
        lastName: "Designer",
        role: "provider",
        bio: "UI/UX designer specializing in user-centered design",
        skills: ["UI/UX", "Figma", "Adobe XD", "HTML/CSS"],
        hourlyRate: 65.0,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Users", null, {});
  },
};
