const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (Client only)
 */
router.post('/', verifyToken, checkRole('client'), projectController.createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with filtering
 * @access  Private
 */
router.get('/', verifyToken, projectController.getAllProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a specific project by ID
 * @access  Private
 */
router.get('/:id', verifyToken, projectController.getProjectById);

/**
 * @route   PATCH /api/projects/:id
 * @desc    Update a project
 * @access  Private (Client only - owner)
 */
router.patch('/:id', verifyToken, checkRole('client'), projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private (Client only - owner)
 */
router.delete('/:id', verifyToken, checkRole('client'), projectController.deleteProject);

/**
 * @route   POST /api/projects/:id/apply
 * @desc    Apply to a project
 * @access  Private (Service Provider only)
 */
router.post('/:id/apply', verifyToken, checkRole('service_provider'), projectController.applyToProject);

/**
 * @route   PATCH /api/projects/:id/assign/:providerId
 * @desc    Assign a project to a service provider
 * @access  Private (Client only - owner)
 */
router.patch('/:id/assign/:providerId', verifyToken, checkRole('client'), projectController.assignProject);

/**
 * @route   PATCH /api/projects/:id/complete
 * @desc    Mark a project as completed
 * @access  Private (Client only - owner)
 */
router.patch('/:id/complete', verifyToken, checkRole('client'), projectController.completeProject);

/**
 * @route   PATCH /api/projects/:id/cancel
 * @desc    Cancel a project
 * @access  Private (Client only - owner)
 */
router.patch('/:id/cancel', verifyToken, checkRole('client'), projectController.cancelProject);

module.exports = router;

