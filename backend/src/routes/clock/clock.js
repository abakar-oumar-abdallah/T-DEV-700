const express = require('express');
const router = express.Router();
const ClockController = require('../../controllers/clock/ClockController');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const PermissionMiddleware = require('../../middlewares/PermissionMiddleware');
const TeamRoleMiddleware = require('../../middlewares/TeamRoleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Clocks
 *   description: Clock management 
 */

// Get all clocks
/**
 * @swagger
 * /clocks:
 *   get:
 *     summary: Get all clocks
 *     tags: [Clocks]
 *     responses:
 *       200:
 *         description: List of all clocks
 */
router.get('/clocks', ClockController.getAllClocks);

// Create a new clock
/**
 * @swagger
 * /clocks:
 *   post:
 *     summary: Create a new clock entry
 *     tags: [Clocks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_team_id
 *               - planning_id
 *               - arrival_time
 *               - departure_time
 *             properties:
 *               planning_id:
 *                 type: string
 *               user_team_id:
 *                 type: string
 *               arrival_time:
 *                 type: string
 *                 format: date-time
 *               departure_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Clock created
 *       500:
 *         description: Server error
 */
router.post('/clocks',
    // AuthMiddleware,
    // TeamRoleMiddleware(['employee', 'manager', 'admin']),
    ClockController.createClock
);

// Get a clock by id
/**
 * @swagger
 * /clocks/{id}:
 *   get:
 *     summary: Get clock by ID
 *     tags: [Clocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Clock id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clock found
 *       404:
 *         description: Clock not found
 *       500:
 *         description: Server error
 */
router.get('/clocks/:id', ClockController.getClockById);

// Get a clock by user team id
/**
 * @swagger
 * /clocks/{user_team_id}:
 *   get:
 *     summary: Get clock by user_team_id
 *     tags: [Clocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: user team id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clock found
 *       404:
 *         description: Clock not found
 *       500:
 *         description: Server error
 */
router.get('/clocks/:user_team_id',
    // AuthMiddleware,
    // TeamRoleMiddleware(['employee', 'manager', 'admin']),
    ClockController.getClockByUserTeamId
);

// Update a clock
/**
 * @swagger
 * /clocks/{id}:
 *   patch:
 *     summary: Update a clock entry
 *     tags: [Clocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Clock id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_team_id:
 *                 type: string
 *               arrival_time:
 *                 type: string
 *                 format: date-time
 *               departure_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Clock updated
 *       404:
 *         description: Clock not found
 *       500:
 *         description: Server error
 */
router.patch('/clocks/:id', ClockController.updateClock);

// Delete a clock
/**
 * @swagger
 * /clocks/{id}:
 *   delete:
 *     summary: Delete a clock entry
 *     tags: [Clocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Clock id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clock deleted
 *       404:
 *         description: Clock not found
 *       500:
 *         description: Server error
 */
router.delete('/clocks/:id', ClockController.deleteClock);


// ==================== CURRENT USER ROUTES (TOKEN-BASED) ====================

// Clock in/out for current user
/**
 * @swagger
 * /clocks/myTeam/{teamId}/clockInOut:
 *   post:
 *     summary: Clock in/out for current user in specific team
 *     tags: [Clocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       201:
 *         description: Clock in/out successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User-team association or planning not found
 *       500:
 *         description: Server error
 */
router.post('/clocks/myTeam/:teamId/clockInOut',
    AuthMiddleware,
    TeamRoleMiddleware(['employee', 'manager'], true),
    ClockController.createClockInOut
);

// Get all clocks for current user
/**
 * @swagger
 * /clocks/myClocks:
 *   get:
 *     summary: Get all clocks for current user (token-based)
 *     tags: [Clocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user clocks retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/clocks/myClocks',
    AuthMiddleware,
    ClockController.getClocksByCurrentUser
);

// Get clocks for current user by specific date
/**
 * @swagger
 * /clocks/myTeam/{teamId}/date/{date}:
 *   get:
 *     summary: Get current user's clocks for specific team by date
 *     tags: [Clocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Clocks for date retrieved successfully
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User-team association not found
 *       500:
 *         description: Server error
 */
router.get('/clocks/myTeam/:teamId/date/:date',
    AuthMiddleware,
    TeamRoleMiddleware(['employee', 'manager'], true),
    ClockController.getClocksByDate
);

// Get clocks for current user by date range
/**
 * @swagger
 * /clocks/myTeam/{teamId}/range/{startDate}/{endDate}:
 *   get:
 *     summary: Get current user's clocks for specific team by date range
 *     tags: [Clocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *       - in: path
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in YYYY-MM-DD format
 *         example: "2024-01-01"
 *       - in: path
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in YYYY-MM-DD format
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Clocks for date range retrieved successfully
 *       400:
 *         description: Invalid date format or range
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User-team association not found
 *       500:
 *         description: Server error
 */
router.get('/clocks/myTeam/:teamId/range/:startDate/:endDate',
    AuthMiddleware,
    TeamRoleMiddleware(['employee', 'manager'], true),
    ClockController.getClocksByDateRange
);

module.exports = router;