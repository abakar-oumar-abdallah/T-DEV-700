const express = require('express');
const router = express.Router();
const UserTeamController = require('../../controllers/userteam/UserTeamController');

/**
 * @swagger
 * tags:
 *   name: UserTeams
 *   description: User-Team association management 
 */

// Get all user-team associations
/**
 * @swagger
 * /userteams:
 *   get:
 *     summary: Get all user-team associations
 *     tags: [UserTeams]
 *     responses:
 *       200:
 *         description: List of all user-team associations
 *       500:
 *         description: Server error
 */
router.get('/userteams', UserTeamController.getAllUserTeams);

// Create a new user-team association
/**
 * @swagger
 * /userteams:
 *   post:
 *     summary: Create a new user-team association
 *     tags: [UserTeams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - teamId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               teamId:
 *                 type: integer
 *                 example: 1
 *               role:
 *                 type: string
 *                 enum: [employee, manager]
 *                 example: employee
 *     responses:
 *       201:
 *         description: User-team association created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User or team not found
 *       409:
 *         description: Association already exists
 *       500:
 *         description: Server error
 */
router.post('/userteams', UserTeamController.createUserTeam);

// Get user-team association by userId and teamId
/**
 * @swagger
 * /userteams/{userId}/{teamId}:
 *   get:
 *     summary: Get user-team association by userId and teamId
 *     tags: [UserTeams]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: User-team association found
 *       404:
 *         description: Association not found
 *       500:
 *         description: Server error
 */
router.get('/userteams/:userId/:teamId', UserTeamController.getUserTeamById);

// Get all teams for a specific user
/**
 * @swagger
 * /users/{userId}/teams:
 *   get:
 *     summary: Get all teams for a specific user
 *     tags: [UserTeams]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User teams retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/users/:userId/teams', UserTeamController.getTeamsByUserId);

// Get all users for a specific team
/**
 * @swagger
 * /teams/{teamId}/users:
 *   get:
 *     summary: Get all users for a specific team
 *     tags: [UserTeams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team users retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/teams/:teamId/users', UserTeamController.getUsersByTeamId);

// Update user-team association
/**
 * @swagger
 * /userteams/{userId}/{teamId}:
 *   patch:
 *     summary: Update user-team association role
 *     tags: [UserTeams]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [employee, manager]
 *                 example: manager
 *     responses:
 *       200:
 *         description: User-team association updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Association not found
 *       500:
 *         description: Server error
 */
router.patch('/userteams/:userId/:teamId', UserTeamController.updateUserTeam);

// Delete user-team association
/**
 * @swagger
 * /userteams/{userId}/{teamId}:
 *   delete:
 *     summary: Delete user-team association
 *     tags: [UserTeams]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: User-team association deleted successfully
 *       404:
 *         description: Association not found
 *       500:
 *         description: Server error
 */
router.delete('/userteams/:userId/:teamId', UserTeamController.deleteUserTeam);

module.exports = router;