const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/', verifyToken, messageController.sendMessage);

/**
 * @route   GET /api/messages/conversation/:projectId/:userId
 * @desc    Get conversation history between two users for a specific project
 * @access  Private
 */
router.get('/conversation/:projectId/:userId', verifyToken, messageController.getConversation);

/**
 * @route   GET /api/messages/unread
 * @desc    Get all unread messages for the current user
 * @access  Private
 */
router.get('/unread', verifyToken, messageController.getUnreadMessages);

/**
 * @route   PATCH /api/messages/read
 * @desc    Mark message(s) as read
 * @access  Private
 */
router.patch('/read', verifyToken, messageController.markAsRead);

module.exports = router;

