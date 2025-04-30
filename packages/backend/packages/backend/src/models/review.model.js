const { Model, DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user.model');
const Project = require('./project.model');

class Review extends Model {
  // Static method to calculate average rating for a user
  static async calculateAverageRating(userId) {
    const result = await Review.findAll({
      where: { revieweeId: userId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
      ],
      raw: true
    });
    
    return {
      averageRating: parseFloat(result[0].averageRating) || 0,
      totalReviews: parseInt(result[0].totalReviews) || 0
    };
  }
  
  // Static method to get all reviews for a specific user
  static async getReviewsForUser(userId, limit = 10, offset = 0) {
    return await Review.findAll({
      where: { revieweeId: userId },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'category']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }
  
  // Static method to get all reviews for a specific project
  static async getReviewsForProject(projectId) {
    return await Review.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: User,
          as: 'reviewee',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }
  
  // Static method to verify that the reviewer was involved in the project
  static async verifyReviewerInvolvement(projectId, reviewerId) {
    const project = await Project.findOne({
      where: {
        id: projectId,
        [Op.or]: [
          { clientId: reviewerId },
          { assignedToId: reviewerId }
        ]
      }
    });
    
    return !!project; // Returns true if the reviewer was involved in the project
  }
}

Review.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      validate: {
        notNull: {
          msg: 'Project is required',
        },
      },
    },
    reviewerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      validate: {
        notNull: {
          msg: 'Reviewer is required',
        },
      },
    },
    revieweeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      validate: {
        notNull: {
          msg: 'Reviewee is required',
        },
        notReviewingSelf(value) {
          if (value === this.reviewerId) {
            throw new Error('Users cannot review themselves');
          }
        },
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Rating is required',
        },
        min: {
          args: [1],
          msg: 'Rating must be at least 1',
        },
        max: {
          args: [5],
          msg: 'Rating cannot be more than 5',
        },
        isInt: {
          msg: 'Rating must be an integer',
        },
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Comment cannot exceed 1000 characters',
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
    hooks: {
      // After creating a review, update the user's average rating
      afterCreate: async (review) => {
        const { averageRating } = await Review.calculateAverageRating(review.revieweeId);
        await User.update(
          { rating: averageRating },
          { where: { id: review.revieweeId } }
        );
      },
      // After updating a review, update the user's average rating
      afterUpdate: async (review) => {
        if (review.changed('rating')) {
          const { averageRating } = await Review.calculateAverageRating(review.revieweeId);
          await User.update(
            { rating: averageRating },
            { where: { id: review.revieweeId } }
          );
        }
      },
      // Before creating a review, verify involvement and check if project is completed
      beforeCreate: async (review) => {
        // Verify that the reviewer was involved in the project
        const isInvolved = await Review.verifyReviewerInvolvement(review.projectId, review.reviewerId);
        if (!isInvolved) {
          throw new Error('Only users involved in the project can leave reviews');
        }
        
        // Verify that the project is completed
        const project = await Project.findByPk(review.projectId);
        if (!project || project.status !== 'completed') {
          throw new Error('Reviews can only be left for completed projects');
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ['projectId', 'reviewerId', 'revieweeId'],
        name: 'reviews_project_reviewer_reviewee_unique'
      }
    ]
  }
);

// Define associations
Review.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

Review.belongsTo(User, {
  foreignKey: 'reviewerId',
  as: 'reviewer',
});

Review.belongsTo(User, {
  foreignKey: 'revieweeId',
  as: 'reviewee',
});

// Project has many reviews
Project.hasMany(Review, {
  foreignKey: 'projectId',
  as: 'reviews',
});

// User has given many reviews
User.hasMany(Review, {
  foreignKey: 'reviewerId',
  as: 'givenReviews',
});

// User has received many reviews
User.hasMany(Review, {
  foreignKey: 'revieweeId',
  as: 'receivedReviews',
});

module.exports = Review;

