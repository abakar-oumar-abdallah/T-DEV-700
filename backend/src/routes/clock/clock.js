const express = require('express');
const router = express.Router();
const ClockController = require('../../controllers/clock/ClockController');

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
 *               - user_id
 *               - clock_in
 *               - clock_out
 *             properties:
 *               user_id:
 *                 type: string
 *               clock_in:
 *                 type: string
 *                 format: date-time
 *               clock_out:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Clock created
 *       500:
 *         description: Server error
 */
router.post('/clocks', ClockController.createClock);

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
 *               user_id:
 *                 type: string
 *               clock_in:
 *                 type: string
 *                 format: date-time
 *               clock_out:
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

module.exports = router;