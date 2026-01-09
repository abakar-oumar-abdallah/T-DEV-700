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
router.use(PermissionMiddleware('superadmin'));

/**
 * @swagger
 * /superadmin/stats:
 *   get:
 *     summary: Get dashboard statistics (superadmin only)
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       403:
 *         description: Forbidden - Superadmin only
 *       500:
 *         description: Server error
 */
router.get('/superadmin/stats', SuperadminController.getDashboardStats);

/**
 * @swagger
 * /superadmin/users/{userId}/permission:
 *   patch:
 *     summary: Update user permission (superadmin only)
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission
 *             properties:
 *               permission:
 *                 type: string
 *                 enum: [user, admin, superadmin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       400:
 *         description: Invalid permission value
 *       403:
 *         description: Forbidden - Superadmin only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch('/superadmin/users/:userId/permission', SuperadminController.updateUserPermission);

module.exports = router;