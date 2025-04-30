const Joi = require('joi');
const { Project, User } = require('../models');
const { Op } = require('sequelize');

// Validation schemas
const createProjectSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(20).max(5000).required(),
  budgetMinimum: Joi.number().min(0).required(),
  budgetMaximum: Joi.number().min(Joi.ref('budgetMinimum')).required(),
  deadline: Joi.date().greater('now').required(),
  skills: Joi.array().items(Joi.string()).min(1).required(),
  category: Joi.string().valid(
    'web_development',
    'mobile_app',
    'design',
    'marketing',
    'data_science',
    'game_development',
    'devops',
    'other'
  ).required(),
  attachments: Joi.array().items(Joi.string()).optional()
});

const updateProjectSchema = Joi.object({
  title: Joi.string().min(5).max(100),
  description: Joi.string().min(20).max(5000),
  budgetMinimum: Joi.number().min(0),
  budgetMaximum: Joi.number().min(Joi.ref('budgetMinimum')),
  deadline: Joi.date().greater('now'),
  skills: Joi.array().items(Joi.string()).min(1),
  category: Joi.string().valid(
    'web_development',
    'mobile_app',
    'design',
    'marketing',
    'data_science',
    'game_development',
    'devops',
    'other'
  ),
  attachments: Joi.array().items(Joi.string())
}).min(1);

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Client only)
 */
const createProject = async (req, res) => {
  try {
    // Check if user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({
        status: 'error',
        message: 'Only clients can create projects'
      });
    }

    // Validate request body
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // Create project
    const project = await Project.create({
      ...value,
      clientId: req.user.id,
      status: 'open'
    });

    res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating the project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all projects with optional filters
 * @route   GET /api/projects
 * @access  Private
 */
const getAllProjects = async (req, res) => {
  try {
    const {
      status,
      category,
      skill,
      minBudget,
      maxBudget,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (skill) {
      // For PostgreSQL, using array contains operator
      where.skills = { [Op.contains]: [skill] };
    }

    if (minBudget) {
      where.budgetMinimum = { [Op.gte]: parseFloat(minBudget) };
    }

    if (maxBudget) {
      where.budgetMaximum = { [Op.lte]: parseFloat(maxBudget) };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // If service provider, only show open projects
    if (req.user.role === 'service_provider') {
      where.status = 'open';
    }

    // Find projects
    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'rating']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'rating']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      status: 'success',
      data: {
        count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        projects
      }
    });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get a project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'rating']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'rating']
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update a project
 * @route   PATCH /api/projects/:id
 * @access  Private (Client only - owner)
 */
const updateProject = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // Find the project
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if user is the project owner
    if (project.clientId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own projects'
      });
    }

    // Check if project is already assigned
    if (project.status !== 'open' && value.budgetMinimum || value.budgetMaximum || value.deadline || value.skills || value.category) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update core details of a project that is not open'
      });
    }

    // Update project
    await project.update(value);

    res.status(200).json({
      status: 'success',
      message: 'Project updated successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private (Client only - owner)
 */
const deleteProject = async (req, res) => {
  try {
    // Find the project
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if user is the project owner
    if (project.clientId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own projects'
      });
    }

    // Check if project is already in progress
    if (project.status === 'in_progress') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete a project that is in progress. Please cancel it instead.'
      });
    }

    // Delete project
    await project.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting the project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Apply to a project
 * @route   POST /api/projects/:id/apply
 * @access  Private (Service Provider only)
 */
const applyToProject = async (req, res) => {
  try {
    // Check if user is a service provider
    if (req.user.role !== 'service_provider') {
      return res.status(403).json({
        status: 'error',
        message: 'Only service providers can apply to projects'
      });
    }

    // Find the project
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if project is open
    if (project.status !== 'open') {
      return res.status(400).json({
        status: 'error',
        message: 'You can only apply to open projects'
      });
    }

    // Check if service provider has the required skills
    const providerSkills = req.user.skills || [];
    const hasRequiredSkills = project.skills.some(skill => providerSkills.includes(skill));
    
    if (!hasRequiredSkills) {
      return res.status(400).json({
        status: 'error',
        message: 'You do not have the required skills for this project'
      });
    }

    // TODO: Store the application in a separate ProjectApplication model
    // This is a simplified implementation
    
    res.status(200).json({
      status: 'success',
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Apply to project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while applying to the project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Assign a project to a service provider
 * @route   PATCH /api/projects/:id/assign/:providerId
 * @access  Private (Client only - owner)
 */
const assignProject = async (req, res) => {
  try {
    const { id, providerId } = req.params;

    // Find the project
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if user is the project owner
    if (project.clientId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only assign your own projects'
      });
    }

    // Check if project is open
    if (project.status !== 'open') {
      return res.status(400).json({
        status: 'error',
        message: 'You can only assign open projects'
      });
    }

    // Check if provider exists and is a service provider
    const provider = await User.findByPk(providerId);
    
    if (!provider || provider.role !== 'service_provider') {
      return res.status(404).json({
        status: 'error',
        message: 'Service provider not found'
      });
    }

    // Update project with assignedToId and change status to in_progress
    await project.update({
      assignedToId: providerId,
      status: 'in_progress'
    });

    res.status(200).json({
      status: 'success',
      message: 'Project assigned successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Assign project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while assigning the project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Complete a project
 * @route   PATCH /api/projects/:id/complete
 * @access  Private (Client only - owner)
 */
const completeProject = async (req, res) => {
  try {
    // Find the project
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if user is the project owner
    if (project.clientId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only complete your own projects'
      });
    }

    // Check if project is in progress
    if (project.status !== 'in_progress') {
      return res.status(400).json({
        status: 'error',
        message: 'Only in-progress projects can be marked as completed'
      });
    }

    // Check if project has an assigned service provider
    if (!project.assignedToId) {
      return res.status(400).json({
        status: 'error',
        message: 'Project must have an assigned service provider to be completed'
      });
    }

    // Update project status to completed
    await project.update({ status: 'completed' });

    res.status(200).json({
      status: 'success',
      message: 'Project marked as completed successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Complete project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while completing the project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Cancel a project
 * @route   PATCH /api/projects/:id/cancel
 * @access  Private (Client only - owner)
 */
const cancelProject = async (req, res) => {
  try {
    // Find the project
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if user is the project owner
    if (project.clientId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only cancel your own projects'
      });
    }

    // Check if project is already completed or cancelled
    if (project.status === 'completed' || project.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot cancel a project that is already ${project.status}`
      });
    }

    // Update project status to cancelled
    await project.update({ status: 'cancelled' });

    res.status(200).json({
      status: 'success',
      message: 'Project cancelled successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Cancel project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while cancelling the project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all controller functions
module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  applyToProject,
  assignProject,
  completeProject,
  cancelProject
};

