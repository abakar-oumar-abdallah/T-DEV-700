const express = require('express');
const router = express.Router();
const PlanningController = require('../../controllers/planning/PlanningController');

/**
 * @swagger
 * tags:
 *   name: Planning
 *   description: Planning management
 */

// Get all plannings
/**
 * @swagger
 * /plannings:
 *   get:
 *     summary: Get all plannings with their schedules
 *     tags: [Planning]
 *     responses:
 *       200:
 *         description: List of all plannings
 *       500:
 *         description: Server error
 */
router.get('/plannings', PlanningController.getAllPlannings);

// Create a new planning
/**
 * @swagger
 * /plannings:
 *   post:
 *     summary: Create a new planning with schedules
 *     tags: [Planning]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_default:
 *                 type: boolean
 *                 example: false
 *               schedules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - day
 *                     - time_in
 *                     - time_out
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                       example: monday
 *                     time_in:
 *                       type: string
 *                       format: time
 *                       example: "09:00:00"
 *                     time_out:
 *                       type: string
 *                       format: time
 *                       example: "17:00:00"
 *     responses:
 *       201:
 *         description: Planning created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/plannings', PlanningController.createPlanning);

// Get planning by ID
/**
 * @swagger
 * /plannings/{id}:
 *   get:
 *     summary: Get planning by ID with schedules
 *     tags: [Planning]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Planning ID
 *     responses:
 *       200:
 *         description: Planning found
 *       404:
 *         description: Planning not found
 *       500:
 *         description: Server error
 */
router.get('/plannings/:id', PlanningController.getPlanningById);

// Update planning
/**
 * @swagger
 * /plannings/{id}:
 *   patch:
 *     summary: Update planning
 *     tags: [Planning]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Planning ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_default:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Planning updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Planning not found
 *       500:
 *         description: Server error
 */
router.patch('/plannings/:id', PlanningController.updatePlanning);

// Delete planning
/**
 * @swagger
 * /plannings/{id}:
 *   delete:
 *     summary: Delete planning
 *     tags: [Planning]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Planning ID
 *     responses:
 *       200:
 *         description: Planning deleted successfully
 *       404:
 *         description: Planning not found
 *       409:
 *         description: Planning is referenced by teams or clocks
 *       500:
 *         description: Server error
 */
router.delete('/plannings/:id', PlanningController.deletePlanning);

// Get default planning by team ID
/**
 * @swagger
 * /plannings/teams/{teamId}/default:
 *   get:
 *     summary: Get default planning for a team
 *     tags: [Planning]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Default planning retrieved successfully
 *       404:
 *         description: Team not found or no default planning assigned
 *       500:
 *         description: Server error
 */
router.get('/plannings/teams/:teamId/default', PlanningController.getDefaultPlanningByTeam);

// Get planning by user-team ID
/**
 * @swagger
 * /plannings/user-teams/{userTeamId}:
 *   get:
 *     summary: Get planning for a user-team association
 *     tags: [Planning]
 *     parameters:
 *       - in: path
 *         name: userTeamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User-Team association ID
 *     responses:
 *       200:
 *         description: Planning retrieved successfully
 *       404:
 *         description: User-team association not found or no planning assigned
 *       500:
 *         description: Server error
 */
router.get('/plannings/user-teams/:userTeamId', PlanningController.getPlanningByUserTeam);

// Modify team planning (creates new planning)
/**
 * @swagger
 * /plannings/teams/{teamId}/modify:
 *   post:
 *     summary: Modify team planning by creating a new one
 *     tags: [Planning]
 *     parameters:
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
 *               - schedules
 *             properties:
 *               schedules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - day
 *                     - time_in
 *                     - time_out
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                       example: monday
 *                     time_in:
 *                       type: string
 *                       format: time
 *                       example: "09:00:00"
 *                     time_out:
 *                       type: string
 *                       format: time
 *                       example: "17:00:00"
 *     responses:
 *       201:
 *         description: Team planning modified successfully (new planning created)
 *       400:
 *         description: Validation error
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.post('/plannings/teams/:teamId/modify', PlanningController.modifyTeamPlanning);

// Modify user-team planning (creates new planning)
/**
 * @swagger
 * /plannings/user-teams/{userTeamId}/modify:
 *   post:
 *     summary: Modify user-team planning by creating a new one
 *     tags: [Planning]
 *     parameters:
 *       - in: path
 *         name: userTeamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User-Team association ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schedules
 *             properties:
 *               schedules:
 *                 type: array
 *                 description: Array of schedules (can be empty for vacation planning)
 *                 items:
 *                   type: object
 *                   required:
 *                     - day
 *                     - time_in
 *                     - time_out
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                       example: monday
 *                     time_in:
 *                       type: string
 *                       format: time
 *                       example: "09:00:00"
 *                     time_out:
 *                       type: string
 *                       format: time
 *                       example: "17:00:00"
 *     responses:
 *       201:
 *         description: User-team planning modified successfully (new planning created)
 *       400:
 *         description: Validation error
 *       404:
 *         description: User-team association not found
 *       500:
 *         description: Server error
 */
router.post('/plannings/user-teams/:userTeamId/modify', PlanningController.modifyUserTeamPlanning);

module.exports = router;