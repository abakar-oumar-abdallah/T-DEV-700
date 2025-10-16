const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/auth/AuthController');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
// const PermissionMiddleware = require('../../middlewares/PermissionMiddleware');
// const TeamRoleMiddleware = require('../../middlewares/TeamRoleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users/Login
 *   description: User authentication
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users/Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out a user (token-based)
 *     tags: [Users/Login]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized or invalid token
 *       500:
 *         description: Server error
 */
router.post('/logout',
    AuthMiddleware,
    AuthController.logout
);

/**
 * @swagger
 * /checkAuth:
 *   get:
 *     summary: Check authentication and get user info
 *     tags: [Users/Login]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authentication valid
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/checkAuth',
    AuthMiddleware,
    AuthController.checkAuth
);

module.exports = router;
