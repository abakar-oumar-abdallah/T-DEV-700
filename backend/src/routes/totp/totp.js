const express = require('express');
const router = express.Router();
const totpController = require('../../controllers/totp/TotpController.js');

/**
 * @swagger
 * tags:
 *   name: Totp
 *   description: TOTP management 
 */

/**
 * @swagger
 * /totp/generate/{teamId}:
 *   post:
 *     summary: Generate a TOTP code for a team
 *     tags: [Totp]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: The team ID
 *     responses:
 *       200:
 *         description: TOTP code generated successfully
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
 *                     teamId:
 *                       type: string
 *                     code:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/totp/generate/:teamId', (req, res) => {
  totpController.generateTotp(req, res);
});

/**
 * @swagger
 * /totp/verify/{teamId}:
 *   post:
 *     summary: Verify a TOTP code for a team
 *     tags: [Totp]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: The team ID
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
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: TOTP code verified successfully
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
 *                     teamId:
 *                       type: string
 *                     isValid:
 *                       type: boolean
 *       400:
 *         description: Validation error
 *       404:
 *         description: Team or TOTP secret not found
 *       500:
 *         description: Server error
 */
router.post('/totp/verify/:teamId', (req, res) => {
  totpController.verifyTotp(req, res);
});

/**
 * @swagger
 * /totp/reset/{teamId}:
 *   post:
 *     summary: Reset the TOTP secret for a team
 *     tags: [Totp]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: The team ID
 *     responses:
 *       200:
 *         description: TOTP secret reset successfully
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
 *                     teamId:
 *                       type: string
 *                     secretExisted:
 *                       type: boolean
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/totp/reset/:teamId', (req, res) => {
  totpController.resetTeamSecret(req, res);
});

module.exports = router;