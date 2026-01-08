const express = require('express');
const router = express.Router();
const SuperadminController = require('../../controllers/superadmin/SuperadminController');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const PermissionMiddleware = require('../../middlewares/PermissionMiddleware');

/**
 * @swagger
 * tags:
 *   name: Superadmin
 *   description: Superadmin management endpoints
 */

// All routes require authentication and superadmin permission
router.use(AuthMiddleware);
router.use(PermissionMiddleware.requireSuperadmin);

// Dashboard statistics
router.get('/superadmin/stats', SuperadminController.getDashboardStats);

// User management
router.get('/superadmin/users', SuperadminController.getAllUsers);
router.get('/superadmin/users/search', SuperadminController.searchUserByEmail);
router.patch('/superadmin/users/:userId/permission', SuperadminController.updateUserPermission);
router.delete('/superadmin/users/:userId', SuperadminController.deleteUser);

// Team management
router.get('/superadmin/teams', SuperadminController.getAllTeams);
router.delete('/superadmin/teams/:teamId', SuperadminController.deleteTeam);

module.exports = router;
