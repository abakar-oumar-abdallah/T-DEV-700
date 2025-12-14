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
 *           default: 30
 *         description: Number of days to analyze (default 30)
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
 *                           type: integer
 *                         startDate:
 *                           type: string
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
    TeamRoleMiddleware(['manager'], true),
    KpiController.getLatenessRateByEmployee
);

module.exports = router;