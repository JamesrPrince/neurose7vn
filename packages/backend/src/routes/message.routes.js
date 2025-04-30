const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const multer = require("multer");
const path = require("path");

// Configure multer storage for message attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/messages"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "message-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images, documents, and archives are allowed"));
  },
});

// All routes require authentication
router.use(authenticate);

// Get all conversations
router.get("/conversations", messageController.getConversations);

// Get messages between current user and another user
router.get("/conversations/:userId", messageController.getConversation);

// Send a message
router.post(
  "/send",
  upload.array("attachments", 3),
  messageController.sendMessage
);

// Mark message as read
router.patch("/:messageId/read", messageController.markAsRead);

// Get unread message count
router.get("/unread/count", messageController.getUnreadCount);

module.exports = router;
