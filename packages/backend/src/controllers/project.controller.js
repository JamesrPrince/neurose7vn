const Joi = require("joi");
const { Project, User } = require("../models");
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

// ...rest of the controller methods...
