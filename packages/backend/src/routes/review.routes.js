const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { authenticate } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(authenticate);

// Create a new review
router.post("/", reviewController.createReview);

// Get reviews for a specific user
router.get("/user/:userId", reviewController.getUserReviews);

// Get reviews for a specific project
router.get("/project/:projectId", reviewController.getProjectReviews);

// Get current user's received reviews
router.get("/my-reviews", reviewController.getMyReviews);

// Get projects waiting for review by current user
router.get("/pending", reviewController.getPendingReviews);

module.exports = router;
