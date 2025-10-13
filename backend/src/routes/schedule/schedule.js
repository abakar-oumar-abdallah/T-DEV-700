const express = require('express');
const router = express.Router();
const ScheduleController = require('../../controllers/schedule/ScheduleController');

/**
 * @swagger
 * tags:
 *   name: Schedule
 *   description: Schedule management
 */

// Get all schedules
/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedule]
 *     responses:
 *       200:
 *         description: List of all schedules
 *       500:
 *         description: Server error
 */
router.get('/schedules', ScheduleController.getAllSchedules);

// Get schedule by ID
/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule found
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
router.get('/schedules/:id', ScheduleController.getScheduleById);

// Get schedules by planning ID
/**
 * @swagger
 * /plannings/{planningId}/schedules:
 *   get:
 *     summary: Get all schedules for a specific planning
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: planningId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Planning ID
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully
 *       404:
 *         description: Planning not found
 *       500:
 *         description: Server error
 */
router.get('/plannings/:planningId/schedules', ScheduleController.getSchedulesByPlanningId);

// Update schedule
/**
 * @swagger
 * /schedules/{id}:
 *   patch:
 *     summary: Update schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                 example: tuesday
 *               time_in:
 *                 type: string
 *                 format: time
 *                 example: "08:00:00"
 *               time_out:
 *                 type: string
 *                 format: time
 *                 example: "16:00:00"
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Schedule not found
 *       409:
 *         description: Duplicate day in planning
 *       500:
 *         description: Server error
 */
router.patch('/schedules/:id', ScheduleController.updateSchedule);

// Delete schedule
/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     summary: Delete schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
router.delete('/schedules/:id', ScheduleController.deleteSchedule);

module.exports = router;