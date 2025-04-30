const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/reviews
 * @desc    Create a review
 * @access  Private
 */
router.post('/', verifyToken, reviewController.createReview);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get all reviews for a specific user
 * @access  Public
 */
router.get('/user/:userId', reviewController.getReviewsForUser);

/**
 * @route   GET /api/reviews/project/:projectId
 * @desc    Get all reviews for a specific project
 * @access  Private
 */
router.get('/project/:projectId', verifyToken, reviewController.getReviewsForProject);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Get all reviews created by the current user
 * @access  Private
 */
router.get('/my-reviews', verifyToken, reviewController.getMyReviews);

/**
 * @route   PATCH /api/reviews/:id
 * @desc    Update a review
 * @access  Private (owner only)
 */
router.patch('/:id', verifyToken, reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private (owner only)
 */
router.delete('/:id', verifyToken, reviewController.deleteReview);

module.exports = router;

