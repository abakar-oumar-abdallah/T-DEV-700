const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/auth/AuthController');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const { authLimiter } = require('../../middlewares/RateLimiters');
const { getCsrfToken, csrfProtection } = require('../../middlewares/CsrfMiddleware');
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
 * /csrf-token:
 *   get:
 *     summary: Get CSRF token for form submission
 *     tags: [Users/Login]
 *     description: Returns a CSRF token that must be included in subsequent POST/PUT/DELETE requests
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 csrfToken:
 *                   type: string
 */
router.get('/csrf-token', getCsrfToken);

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
router.post('/login', authLimiter, csrfProtection, AuthController.login);

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
    csrfProtection,
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
