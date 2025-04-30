const express = require("express");
const { authenticateJWT } = require("../middlewares/auth.middleware");
const messageController = require("../controllers/message.controller");

const router = express.Router();

// Apply authentication middleware to all message routes
router.use(authenticateJWT);

// Get messages between two users for a specific project
router.get(
  "/conversation/:projectId/:otherUserId",
  messageController.getConversation
);

// Get all conversations for the authenticated user
router.get("/conversations", messageController.getConversations);

// Mark messages as read
router.patch("/read/:projectId/:otherUserId", messageController.markAsRead);

module.exports = router;
