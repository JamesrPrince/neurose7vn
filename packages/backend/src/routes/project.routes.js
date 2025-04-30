const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const { verifyToken, checkRole } = require("../middlewares/auth.middleware");
const { upload } = require("../config/upload");

/**
 * @route   POST /api/projects
 * @desc    Create a new project with file attachments
 * @access  Private (Client only)
 */
router.post(
  "/",
  verifyToken,
  checkRole("client"),
  upload.array("attachments", 5),
  projectController.createProject
);

/**
 * @route   PATCH /api/projects/:id
 * @desc    Update a project with file attachments
 * @access  Private (Client only - owner)
 */
router.patch(
  "/:id",
  verifyToken,
  checkRole("client"),
  upload.array("attachments", 5),
  projectController.updateProject
);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with filtering
 * @access  Private
 */
router.get("/", verifyToken, projectController.getAllProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a specific project by ID
 * @access  Private
 */
router.get("/:id", verifyToken, projectController.getProjectById);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project and its attachments
 * @access  Private (Client only - owner)
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole("client"),
  projectController.deleteProject
);

/**
 * @route   POST /api/projects/:id/apply
 * @desc    Apply to a project (Service providers only)
 * @access  Private (Service provider only)
 */
router.post(
  "/:id/apply",
  verifyToken,
  checkRole("service_provider"),
  projectController.applyToProject
);

/**
 * @route   PATCH /api/projects/:id/assign/:providerId
 * @desc    Assign a project to a service provider
 * @access  Private (Client only - owner)
 */
router.patch(
  "/:id/assign/:providerId",
  verifyToken,
  checkRole("client"),
  projectController.assignProject
);

/**
 * @route   PATCH /api/projects/:id/complete
 * @desc    Complete a project
 * @access  Private (Client only - owner)
 */
router.patch(
  "/:id/complete",
  verifyToken,
  checkRole("client"),
  projectController.completeProject
);

module.exports = router;
