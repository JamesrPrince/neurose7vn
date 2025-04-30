const Joi = require('joi');
const { Review, Project, User } = require('../models');
const { Op } = require('sequelize');

// Validation schemas
const createReviewSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  revieweeId: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow('', null)
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  comment: Joi.string().max(1000).allow('', null)
}).min(1);

/**
 * @desc    Create a review for another user after project completion
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    const { projectId, revieweeId, rating, comment } = value;
    const reviewerId = req.user.id;

    // Check if reviewee exists
    const reviewee = await User.findByPk(revieweeId);
    if (!reviewee) {
      return res.status(404).json({
        status: 'error',
        message: 'User to be reviewed not found'
      });
    }

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if project is completed
    if (project.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Reviews can only be created for completed projects'
      });
    }

    // Check if reviewer is involved in the project
    const isReviewerInvolved = (
      project.clientId === reviewerId || 
      project.assignedToId === reviewerId
    );

    if (!isReviewerInvolved) {
      return res.status(403).json({
        status: 'error',
        message: 'Only users involved in the project can leave reviews'
      });
    }

    // Check if reviewee is involved in the project
    const isRevieweeInvolved = (
      project.clientId === revieweeId || 
      project.assignedToId === revieweeId
    );

    if (!isRevieweeInvolved) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only review users who were involved in the project'
      });
    }

    // Check if reviewer is not reviewing themselves
    if (reviewerId === revieweeId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot review yourself'
      });
    }

    // Check if client is reviewing service provider or vice versa
    const isClientReviewingProvider = (
      reviewerId === project.clientId && 
      revieweeId === project.assignedToId
    );
    
    const isProviderReviewingClient = (
      reviewerId === project.assignedToId && 
      revieweeId === project.clientId
    );

    if (!isClientReviewingProvider && !isProviderReviewingClient) {
      return res.status(400).json({
        status: 'error',
        message: 'A client can only review the service provider, and vice versa'
      });
    }

    // Check if reviewer has already reviewed this user for this project
    const existingReview = await Review.findOne({
      where: {
        projectId,
        reviewerId,
        revieweeId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this user for this project'
      });
    }

    // Create the review
    const review = await Review.create({
      projectId,
      reviewerId,
      revieweeId,
      rating,
      comment
    });

    res.status(201).json({
      status: 'success',
      message: 'Review created successfully',
      data: {
        review
      }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating the review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all reviews for a specific user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getReviewsForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get reviews for user using the model method
    const reviews = await Review.getReviewsForUser(userId, limit, offset);

    // Get total count for pagination
    const count = reviews.length ? await Review.count({
      where: { revieweeId: userId }
    }) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        pagination: {
          total: count,
          pages: Math.ceil(count / limit),
          page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get reviews for user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all reviews for a specific project
 * @route   GET /api/reviews/project/:projectId
 * @access  Private
 */
const getReviewsForProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Get reviews for project using the model method
    const reviews = await Review.getReviewsForProject(projectId);

    res.status(200).json({
      status: 'success',
      data: {
        reviews
      }
    });
  } catch (error) {
    console.error('Get reviews for project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all reviews created by the current user
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
const getMyReviews = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get reviews created by the current user
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { reviewerId },
      include: [
        {
          model: User,
          as: 'reviewee',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'category', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        pagination: {
          total: count,
          pages: Math.ceil(count / limit),
          page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching your reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update a review
 * @route   PATCH /api/reviews/:id
 * @access  Private
 */
const updateReview = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // Find the review
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check if user is the review creator
    if (review.reviewerId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own reviews'
      });
    }

    // Update the review
    await review.update(value);

    res.status(200).json({
      status: 'success',
      message: 'Review updated successfully',
      data: {
        review
      }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = async (req, res) => {
  try {
    // Find the review
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check if user is the review creator
    if (review.reviewerId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own reviews'
      });
    }

    // Delete the review
    await review.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting the review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createReview,
  getReviewsForUser,
  getReviewsForProject,
  getMyReviews,
  updateReview,
  deleteReview
};

