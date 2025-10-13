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

module.exports = router;