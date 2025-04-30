const { Review, Project, User } = require("../models");
const { Op } = require("sequelize");

/**
 * Create a review
 */
exports.createReview = async (req, res, next) => {
  try {
    const { projectId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    // Find project
    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Check if project is completed
    if (project.status !== "completed") {
      return res.status(400).json({
        status: "error",
        message: "Reviews can only be left for completed projects",
      });
    }

    // Determine the type and reviewee
    let revieweeId;
    let type;

    if (project.clientId === reviewerId) {
      // Client is reviewing provider
      revieweeId = project.providerId;
      type = "client_to_provider";
    } else if (project.providerId === reviewerId) {
      // Provider is reviewing client
      revieweeId = project.clientId;
      type = "provider_to_client";
    } else {
      return res.status(403).json({
        status: "error",
        message: "Only project participants can leave reviews",
      });
    }

    // Check if a review already exists
    const existingReview = await Review.findOne({
      where: {
        projectId,
        reviewerId,
        revieweeId,
      },
    });

    if (existingReview) {
      return res.status(400).json({
        status: "error",
        message: "You have already reviewed this user for this project",
      });
    }

    // Create the review
    const review = await Review.create({
      projectId,
      reviewerId,
      revieweeId,
      rating,
      comment,
      type,
    });

    // Get review with associations
    const reviewWithDetails = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email", "profileImage"],
        },
        {
          model: User,
          as: "reviewee",
          attributes: ["id", "firstName", "lastName", "email", "profileImage"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "title"],
        },
      ],
    });

    res.status(201).json({
      status: "success",
      message: "Review submitted successfully",
      data: { review: reviewWithDetails },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a user
 */
exports.getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get reviews
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { revieweeId: userId },
      include: [
        {
          model: User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email", "profileImage"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "title", "description", "status", "completedAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Calculate average rating
    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) /
      (reviews.length || 1);

    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: {
        reviews,
        avgRating,
        totalReviews: count,
        pagination: {
          totalCount: count,
          totalPages,
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a project
 */
exports.getProjectReviews = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Validate if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Get reviews
    const reviews = await Review.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: "reviewer",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "profileImage",
            "role",
          ],
        },
        {
          model: User,
          as: "reviewee",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "profileImage",
            "role",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's received reviews
 */
exports.getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get reviews
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { revieweeId: userId },
      include: [
        {
          model: User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email", "profileImage"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "title", "description", "status", "completedAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Calculate average rating
    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) /
      (reviews.length || 1);

    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: {
        reviews,
        avgRating,
        totalReviews: count,
        pagination: {
          totalCount: count,
          totalPages,
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get projects waiting for review by current user
 */
exports.getPendingReviews = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find completed projects where user is involved
    const completedProjects = await Project.findAll({
      where: {
        [Op.or]: [{ clientId: userId }, { providerId: userId }],
        status: "completed",
      },
      include: [
        {
          model: User,
          as: "client",
          attributes: ["id", "firstName", "lastName", "email", "profileImage"],
        },
        {
          model: User,
          as: "provider",
          attributes: ["id", "firstName", "lastName", "email", "profileImage"],
        },
      ],
    });

    // Filter projects where user hasn't left a review yet
    const pendingReviews = await Promise.all(
      completedProjects.map(async (project) => {
        // Determine the reviewee
        const revieweeId =
          project.clientId === userId ? project.providerId : project.clientId;

        // Check if user already left a review
        const existingReview = await Review.findOne({
          where: {
            projectId: project.id,
            reviewerId: userId,
            revieweeId,
          },
        });

        // Return project if no review exists
        if (!existingReview) {
          return {
            project,
            reviewee:
              project.clientId === userId ? project.provider : project.client,
          };
        }

        return null;
      })
    );

    // Filter out null values
    const filteredPendingReviews = pendingReviews.filter(
      (item) => item !== null
    );

    res.status(200).json({
      status: "success",
      data: { pendingReviews: filteredPendingReviews },
    });
  } catch (error) {
    next(error);
  }
};
