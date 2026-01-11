const express = require('express');
const router = express.Router();
const ClockController = require('../../controllers/clock/ClockController');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const PermissionMiddleware = require('../../middlewares/PermissionMiddleware');
const TeamRoleMiddleware = require('../../middlewares/TeamRoleMiddleware');
const TotpMiddleware = require('../../middlewares/TotpMiddleware');
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
router.get('/clocks',
    AuthMiddleware,
    PermissionMiddleware('superadmin'),
    ClockController.getAllClocks);

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
    AuthMiddleware,
    PermissionMiddleware('admin'),
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
router.get('/clocks/:id',
    AuthMiddleware,
    ClockController.getClockById);

// Get a clock by user team id
/**
 * @swagger
 * /clocks/userteams/{user_team_id}:
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
router.get('/clocks/userteams/:user_team_id',
    AuthMiddleware,
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
router.patch('/clocks/:id',
    AuthMiddleware,
    PermissionMiddleware('admin'),
    ClockController.updateClock);

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
router.delete('/clocks/:id',
    AuthMiddleware,
    PermissionMiddleware('admin'),
    ClockController.deleteClock);


// ==================== CURRENT USER ROUTES (TOKEN-BASED) ====================

// Clock in/out for current user - Most important route
/**
 * @swagger
 * /clocks/myTeam/{teamId}/clockInOut:
 *   post:
 *     summary: Clock in/out for current user in specific team (requires TOTP verification)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: TOTP verification code (6 digits)
 *                 example: "123456"
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       201:
 *         description: Clock in/out successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Clock in successful"
 *                 data:
 *                   type: object
 *                   description: Clock entry data
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Optional warnings (late arrival, early departure, etc.)
 *                 isLate:
 *                   type: boolean
 *                   description: Indicates if the clock-in was late
 *       400:
 *         description: Validation error or invalid TOTP code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     invalid_totp: "Invalid TOTP code"
 *                     missing_code: "TOTP code is required"
 *                     missing_userteam: "User team ID is required"
 *                     duplicate_clock: "You have already clocked in for this work day"
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized or TOTP verification failed
 *       404:
 *         description: User-team association, planning, or schedule not found
 *       500:
 *         description: Server error
 */
router.post('/clocks/myTeam/:teamId/clockInOut',
    AuthMiddleware,
    TeamRoleMiddleware(['employee', 'manager', 'owner'], true),
    TotpMiddleware,
    ClockController.createClockInOut
);

// Get all clocks for current user
/**
 * @swagger
 * /clocks/users/myClocks:
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
router.get('/clocks/users/myClocks',
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