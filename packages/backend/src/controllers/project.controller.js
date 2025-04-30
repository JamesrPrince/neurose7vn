const Joi = require("joi");
const { Project, User, Review } = require("../models");
const { Op } = require("sequelize");
const fs = require("fs").promises;
const path = require("path");

// Validation schemas
const createProjectSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(20).max(5000).required(),
  budgetMinimum: Joi.number().min(0).required(),
  budgetMaximum: Joi.number().min(Joi.ref("budgetMinimum")).required(),
  deadline: Joi.date().greater("now").required(),
  skills: Joi.array().items(Joi.string()).min(1).required(),
  category: Joi.string()
    .valid(
      "web_development",
      "mobile_app",
      "design",
      "marketing",
      "data_science",
      "game_development",
      "devops",
      "other"
    )
    .required(),
});

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Client only)
 */
const createProject = async (req, res) => {
  try {
    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        status: "error",
        message: "Only clients can create projects",
      });
    }

    // Validate request body
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) {
      // Delete uploaded files if validation fails
      if (req.files) {
        await Promise.all(
          req.files.map((file) =>
            fs
              .unlink(file.path)
              .catch((err) =>
                console.error(`Error deleting file ${file.path}:`, err)
              )
          )
        );
      }
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    // Process file attachments
    const attachments = req.files ? req.files.map((file) => file.filename) : [];

    // Create the project with attachments
    const project = await Project.create({
      ...value,
      clientId: req.user.id,
      attachments,
    });

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    // Delete uploaded files if project creation fails
    if (req.files) {
      await Promise.all(
        req.files.map((file) =>
          fs
            .unlink(file.path)
            .catch((err) =>
              console.error(`Error deleting file ${file.path}:`, err)
            )
        )
      );
    }
    console.error("Create project error:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while creating the project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
    // Find the project
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      // Delete uploaded files if project not found
      if (req.files) {
        await Promise.all(
          req.files.map((file) =>
            fs
              .unlink(file.path)
              .catch((err) =>
                console.error(`Error deleting file ${file.path}:`, err)
              )
          )
        );
      }
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Check if user is the project owner
    if (project.clientId !== req.user.id) {
      // Delete uploaded files if user is not authorized
      if (req.files) {
        await Promise.all(
          req.files.map((file) =>
            fs
              .unlink(file.path)
              .catch((err) =>
                console.error(`Error deleting file ${file.path}:`, err)
              )
          )
        );
      }
      return res.status(403).json({
        status: "error",
        message: "You can only update your own projects",
      });
    }

    // Process new attachments
    let attachments = [...(project.attachments || [])];
    if (req.files && req.files.length > 0) {
      attachments.push(...req.files.map((file) => file.filename));
    }

    // If there's a request to remove attachments
    if (
      req.body.removeAttachments &&
      Array.isArray(req.body.removeAttachments)
    ) {
      const toRemove = req.body.removeAttachments;
      // Remove files from storage
      await Promise.all(
        toRemove.map((filename) => {
          const filePath = path.join(__dirname, "../../../uploads", filename);
          return fs
            .unlink(filePath)
            .catch((err) =>
              console.error(`Error deleting file ${filePath}:`, err)
            );
        })
      );
      // Remove from attachments array
      attachments = attachments.filter((att) => !toRemove.includes(att));
    }

    // Update the project
    const updatedProject = await project.update({
      ...req.body,
      attachments,
    });

    res.status(200).json({
      status: "success",
      message: "Project updated successfully",
      data: {
        project: updatedProject,
      },
    });
  } catch (error) {
    // Delete newly uploaded files if update fails
    if (req.files) {
      await Promise.all(
        req.files.map((file) =>
          fs
            .unlink(file.path)
            .catch((err) =>
              console.error(`Error deleting file ${file.path}:`, err)
            )
        )
      );
    }
    console.error("Update project error:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while updating the project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    if (project.clientId !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "You can only delete your own projects",
      });
    }

    // Delete associated files
    if (project.attachments && project.attachments.length > 0) {
      await Promise.all(
        project.attachments.map((filename) => {
          const filePath = path.join(__dirname, "../../../uploads", filename);
          return fs
            .unlink(filePath)
            .catch((err) =>
              console.error(`Error deleting file ${filePath}:`, err)
            );
        })
      );
    }

    // Delete the project
    await project.destroy();

    res.status(200).json({
      status: "success",
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while deleting the project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get all projects with filtering options
 */
exports.getAllProjects = async (req, res, next) => {
  try {
    const {
      status,
      category,
      skills,
      minBudget,
      maxBudget,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter conditions
    const whereConditions = {};

    // Status filter
    if (status) {
      whereConditions.status = status;
    }

    // Category filter
    if (category) {
      whereConditions.category = category;
    }

    // Skills filter (array)
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(",");
      whereConditions.skills = {
        [Op.overlap]: skillsArray,
      };
    }

    // Budget range filter
    if (minBudget) {
      whereConditions.budget = {
        ...whereConditions.budget,
        [Op.gte]: minBudget,
      };
    }

    if (maxBudget) {
      whereConditions.budget = {
        ...whereConditions.budget,
        [Op.lte]: maxBudget,
      };
    }

    // Search filter (title and description)
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Only show public projects or projects where the user is involved
    whereConditions[Op.or] = [
      { visibility: "public" },
      { clientId: req.user.id },
      { providerId: req.user.id },
    ];

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get projects
    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereConditions,
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
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: {
        projects,
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
 * Get a single project by ID
 */
exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: "client",
          attributes: ["id", "firstName", "lastName", "email", "profileImage"],
        },
        {
          model: User,
          as: "provider",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "profileImage",
            "bio",
            "skills",
          ],
          required: false,
        },
        {
          model: Review,
          as: "reviews",
          include: [
            {
              model: User,
              as: "reviewer",
              attributes: ["id", "firstName", "lastName", "profileImage"],
            },
          ],
        },
      ],
    });

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Check if user has permission to view this project
    const isClient = project.clientId === req.user.id;
    const isProvider = project.providerId === req.user.id;

    if (project.visibility !== "public" && !isClient && !isProvider) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to view this project",
      });
    }

    res.status(200).json({
      status: "success",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new project
 */
exports.createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      budget,
      deadline,
      category,
      skills,
      visibility = "public",
    } = req.body;

    // Only clients can create projects
    if (req.user.role !== "client") {
      return res.status(403).json({
        status: "error",
        message: "Only clients can create projects",
      });
    }

    // Process attachments if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        attachments.push(`/uploads/projects/${file.filename}`);
      });
    }

    // Create project
    const project = await Project.create({
      title,
      description,
      budget,
      deadline: deadline ? new Date(deadline) : null,
      category,
      skills: skills || [],
      clientId: req.user.id,
      attachments,
      visibility,
    });

    // Get project with associations
    const projectWithDetails = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: "client",
          attributes: ["id", "firstName", "lastName", "email", "profileImage"],
        },
      ],
    });

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: { project: projectWithDetails },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a project
 */
exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      budget,
      deadline,
      status,
      category,
      skills,
      visibility,
    } = req.body;

    // Find project
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Check permission
    const isClient = project.clientId === req.user.id;
    const isProvider = project.providerId === req.user.id;

    if (!isClient && !isProvider) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to update this project",
      });
    }

    // Client can update all fields, provider can only update status
    if (isClient) {
      // Only allow changing provider if project is still open
      if (
        project.status !== "open" &&
        req.body.providerId &&
        project.providerId !== req.body.providerId
      ) {
        return res.status(400).json({
          status: "error",
          message:
            "Cannot change provider for a project that is already in progress",
        });
      }

      // Update project fields
      project.title = title || project.title;
      project.description = description || project.description;
      project.budget = budget || project.budget;
      project.deadline = deadline ? new Date(deadline) : project.deadline;
      project.category = category || project.category;
      project.skills = skills || project.skills;
      project.visibility = visibility || project.visibility;
    }

    // Both client and provider can update status with certain restrictions
    if (status && status !== project.status) {
      // Provider can only mark as in_progress, under_review, or completed
      if (
        isProvider &&
        !["in_progress", "under_review", "completed"].includes(status)
      ) {
        return res.status(403).json({
          status: "error",
          message: "You do not have permission to set this status",
        });
      }

      // Client can cancel the project or accept completed work
      if (isClient && !["cancelled", "completed"].includes(status)) {
        return res.status(403).json({
          status: "error",
          message: "You do not have permission to set this status",
        });
      }

      project.status = status;
    }

    // Process new attachments if any
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(
        (file) => `/uploads/projects/${file.filename}`
      );
      project.attachments = [...project.attachments, ...newAttachments];
    }

    // Save changes
    await project.save();

    // Get updated project with associations
    const updatedProject = await Project.findByPk(id, {
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
          required: false,
        },
      ],
    });

    res.status(200).json({
      status: "success",
      message: "Project updated successfully",
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a project (only available for clients and only for projects in 'open' status)
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find project
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Check permission (only client can delete)
    if (project.clientId !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "Only the project owner can delete a project",
      });
    }

    // Can only delete projects in 'open' status
    if (project.status !== "open") {
      return res.status(400).json({
        status: "error",
        message: 'Only projects in "open" status can be deleted',
      });
    }

    // Delete project
    await project.destroy();

    res.status(200).json({
      status: "success",
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply for a project (only for providers)
 */
exports.applyForProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, proposedBudget } = req.body;

    // Only providers can apply
    if (req.user.role !== "provider") {
      return res.status(403).json({
        status: "error",
        message: "Only providers can apply for projects",
      });
    }

    // Find project
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Check if project is open
    if (project.status !== "open") {
      return res.status(400).json({
        status: "error",
        message: 'Can only apply to projects with "open" status',
      });
    }

    // Check if provider is not the client
    if (project.clientId === req.user.id) {
      return res.status(400).json({
        status: "error",
        message: "You cannot apply to your own project",
      });
    }

    // Create a proposal (this would be a separate model in a full implementation)
    // For now, we'll just assign the provider to the project
    project.providerId = req.user.id;
    project.status = "in_progress";
    await project.save();

    // Send message to client about the application
    const applicationMessage = `I am interested in your project "${
      project.title
    }". ${message || ""}`;

    // TODO: Create a message from provider to client

    // Get updated project with associations
    const updatedProject = await Project.findByPk(id, {
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

    res.status(200).json({
      status: "success",
      message: "Applied to project successfully",
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get projects for the current user (either as client or provider)
 */
exports.getUserProjects = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Build filter conditions
    const whereConditions = {};

    // Filter by role (client or provider)
    if (role === "client") {
      whereConditions.clientId = userId;
    } else if (role === "provider") {
      whereConditions.providerId = userId;
    } else {
      // If no role specified, get all projects where user is involved
      whereConditions[Op.or] = [{ clientId: userId }, { providerId: userId }];
    }

    // Filter by status
    if (status) {
      whereConditions.status = status;
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get projects
    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereConditions,
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
          required: false,
        },
      ],
      order: [["updatedAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: {
        projects,
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
