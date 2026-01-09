const express = require('express');
const router = express.Router();
const KpiController = require('../../controllers/kpi/KpiController');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const TeamRoleMiddleware = require('../../middlewares/TeamRoleMiddleware');

/**
 * @swagger
 * tags:
 *   name: KPI
 *   description: Key Performance Indicators
 */

/**
 * @swagger
 * /kpi/teams/{teamId}/employees/{userId}/lateness:
 *   get:
 *     summary: Get lateness rate for an employee in a specific team
 *     tags: [KPI]
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
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: days
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of days to analyze (omit for all-time data)
 *         example: 30
 *     responses:
 *       200:
 *         description: Lateness rate calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     teamId:
 *                       type: integer
 *                     period:
 *                       type: object
 *                       properties:
 *                         days:
 *                           oneOf:
 *                             - type: integer
 *                             - type: string
 *                               enum: [all]
 *                         startDate:
 *                           type: string
 *                           description: Start date or "all time"
 *                         endDate:
 *                           type: string
 *                     totalClocks:
 *                       type: integer
 *                     onTime:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *                     early:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *                     warning:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *                     graveLateness:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager role required
 *       404:
 *         description: User-team association not found
 *       500:
 *         description: Server error
 */
router.get(
    '/kpi/teams/:teamId/employees/:userId/lateness',
    AuthMiddleware,
    TeamRoleMiddleware(['manager','owner'], true),
    KpiController.getLatenessRateByEmployee
);



/**
 * @swagger
 * /kpi/teams/{teamId}/employees/{userId}/departures:
 *   get:
 *     summary: Get departure rate for an employee in a specific team
 *     tags: [KPI]
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
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: days
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of days to analyze (omit for all-time data)
 *         example: 30
 *     responses:
 *       200:
 *         description: Departure rate calculated successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager role required
 *       404:
 *         description: User-team association not found
 *       500:
 *         description: Server error
 */
router.get(
    '/kpi/teams/:teamId/employees/:userId/departures',
    AuthMiddleware,
    TeamRoleMiddleware(['manager','owner'], true),
    KpiController.getDepartureRateByEmployee
);

// Get absences for a user
router.get('/kpi/teams/:teamId/users/:userId/absences', AuthMiddleware, TeamRoleMiddleware(['manager','owner']),KpiController.getAbsences);

// Fix absences (create clock entries)
router.patch('/kpi/teams/:teamId/absences/fix', AuthMiddleware, TeamRoleMiddleware(['manager','owner']),KpiController.fixAbsences);

module.exports = router;