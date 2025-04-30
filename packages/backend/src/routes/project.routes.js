const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const { authenticate, checkRole } = require("../middlewares/auth.middleware");
const { uploadProjectFiles } = require("../config/upload");

// All routes require authentication
router.use(authenticate);

// Get all projects (with filtering)
router.get("/", projectController.getAllProjects);

// Get current user's projects
router.get("/my-projects", projectController.getUserProjects);

// Get a single project by ID
router.get("/:id", projectController.getProjectById);

// Create a new project (clients only)
router.post(
  "/",
  checkRole(["client"]),
  uploadProjectFiles,
  projectController.createProject
);

// Update a project
router.put("/:id", uploadProjectFiles, projectController.updateProject);

// Delete a project (clients only, open status)
router.delete("/:id", checkRole(["client"]), projectController.deleteProject);

// Apply for a project (providers only)
router.post(
  "/:id/apply",
  checkRole(["provider"]),
  projectController.applyForProject
);

module.exports = router;
