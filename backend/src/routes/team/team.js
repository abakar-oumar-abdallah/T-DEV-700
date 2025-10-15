const express = require('express');
const router = express.Router();
const TeamController = require('../../controllers/team/TeamController');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const PermissionMiddleware = require('../../middlewares/PermissionMiddleware');
const TeamRoleMiddleware = require('../../middlewares/TeamRoleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management 
 */

// get all teams
/**
 * @swagger
 * /teams:
 *   get:
 *     summary: Get all teams
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: List of all teams
 */
router.get('/teams', 
    AuthMiddleware,
    PermissionMiddleware('superadmin'),
    TeamController.getAllTeams
);

/**
 * @swagger
 * /teams:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - lateness_limit
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dev Team
 *               description:
 *                 type: string
 *                 example: Backend developers
 *               lateness_limit:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Team created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Team name already exists
 *       500:
 *         description: Server error
 */
router.post(
    '/teams', 
    AuthMiddleware,
    PermissionMiddleware('admin'),
    TeamController.createTeam
);


// get a team by id
/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     summary: Get teams by ID
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the team to retrieve
 *     responses:
 *       200:
 *         description: Team found successfully
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.get('/teams/:id', TeamController.getTeamById);

// get a team by name
/**
 * @swagger
 * /teams/{name}/name:
 *   get:
 *     summary: Get teams by name
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: name of the team to retrieve
 *     responses:
 *       200:
 *         description: Team found successfully
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.get('/teams/:name/name', TeamController.getTeamByName);

/**
 * @swagger
 * /teams/{id}:
 *   patch:
 *     summary: Update an existing team
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the team to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: newTeam
 *               description:
 *                 type: string
 *                 example: Updated
 *               lateness_limit:
 *                 type: integer
 *                 example: 15
 *     responses:
 *       200:
 *         description: Team updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.patch('/teams/:id', TeamController.updateTeam);

//delete a team
/**
 * @swagger
 * /teams/{id}:
 *   delete:
 *     summary: Delete a team 
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team deleted
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.delete('/teams/:id', 
    // AuthMiddleware,
    // PermissionMiddleware('admin'),
    // TeamRoleMiddleware(['manager']),
    TeamController.deleteTeam
);

module.exports = router;