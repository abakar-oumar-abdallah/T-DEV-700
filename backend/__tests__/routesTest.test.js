const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth/auth');
const userRoutes = require('../src/routes/user/user');
const teamRoutes = require('../src/routes/team/team');
const clockRoutes = require('../src/routes/clock/clock');
const userTeamRoutes = require('../src/routes/userTeam/userTeam');

// Mock des contrôleurs
jest.mock('../src/controllers/auth/AuthController', () => ({
  login: jest.fn((req, res) => res.status(200).json({ success: true, token: 'mock-token' })),
  logout: jest.fn((req, res) => res.status(200).json({ success: true, message: 'Logged out' }))
}));

jest.mock('../src/controllers/user/UserController', () => ({
  getAllUsers: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  createUser: jest.fn((req, res) => res.status(201).json({ success: true, data: { id: 1 } })),
  getUserById: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  getUserByEmail: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  updateUser: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  deleteUser: jest.fn((req, res) => res.status(200).json({ success: true }))
}));

jest.mock('../src/controllers/team/TeamController', () => ({
  getAllTeams: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  createTeam: jest.fn((req, res) => res.status(201).json({ success: true, data: { id: 1 } })),
  getTeamById: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  getTeamByName: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  updateTeam: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  deleteTeam: jest.fn((req, res) => res.status(200).json({ success: true }))
}));

jest.mock('../src/controllers/clock/ClockController', () => ({
  getAllClocks: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  createClock: jest.fn((req, res) => res.status(201).json({ success: true, data: { id: 1 } })),
  getClockById: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  getClockByUserTeamId: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  updateClock: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  deleteClock: jest.fn((req, res) => res.status(200).json({ success: true }))
}));

jest.mock('../src/controllers/userteam/UserTeamController', () => ({
  getAllUserTeams: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  createUserTeam: jest.fn((req, res) => res.status(201).json({ success: true, data: { id: 1 } })),
  createUserTeamWithEmail: jest.fn((req, res) => res.status(201).json({ success: true, data: { id: 1 } })),
  getUserTeamById: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  getTeamsByUserId: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  getUsersByTeamId: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  updateUserTeam: jest.fn((req, res) => res.status(200).json({ success: true, data: { id: 1 } })),
  deleteUserTeam: jest.fn((req, res) => res.status(200).json({ success: true }))
}));

// Configuration de l'application Express pour les tests
const app = express();
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', teamRoutes);
app.use('/api', clockRoutes);
app.use('/api', userTeamRoutes);

describe('Routes Integration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== AUTH ROUTES ====================
  describe('Auth Routes', () => {
    describe('POST /api/login', () => {
      it('devrait appeler la route login', async () => {
        const response = await request(app)
          .post('/api/login')
          .send({ email: 'test@test.com', password: 'password' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.token).toBe('mock-token');
      });
    });

    describe('POST /api/logout', () => {
      it('devrait appeler la route logout', async () => {
        const response = await request(app)
          .post('/api/logout');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  // ==================== USER ROUTES ====================
  describe('User Routes', () => {
    describe('GET /api/users', () => {
      it('devrait retourner tous les utilisateurs', async () => {
        const response = await request(app).get('/api/users');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /api/users', () => {
      it('devrait créer un nouvel utilisateur', async () => {
        const response = await request(app)
          .post('/api/users')
          .send({
            email: 'test@test.com',
            password: 'password',
            first_name: 'John',
            last_name: 'Doe',
            permission: 'admin'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('GET /api/users/:id', () => {
      it('devrait retourner un utilisateur par ID', async () => {
        const response = await request(app).get('/api/users/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('GET /api/users/email/:email', () => {
      it('devrait retourner un utilisateur par email', async () => {
        const response = await request(app).get('/api/users/email/test@test.com');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('PATCH /api/users/:id', () => {
      it('devrait mettre à jour un utilisateur', async () => {
        const response = await request(app)
          .patch('/api/users/1')
          .send({ first_name: 'Jane' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /api/users/:id', () => {
      it('devrait supprimer un utilisateur', async () => {
        const response = await request(app).delete('/api/users/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  // ==================== TEAM ROUTES ====================
  describe('Team Routes', () => {
    describe('GET /api/teams', () => {
      it('devrait retourner toutes les équipes', async () => {
        const response = await request(app).get('/api/teams');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /api/teams', () => {
      it('devrait créer une nouvelle équipe', async () => {
        const response = await request(app)
          .post('/api/teams')
          .send({
            name: 'Dev Team',
            description: 'Backend developers',
            lateness_limit: 10
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('GET /api/teams/:id', () => {
      it('devrait retourner une équipe par ID', async () => {
        const response = await request(app).get('/api/teams/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('GET /api/teams/:name/name', () => {
      it('devrait retourner une équipe par nom', async () => {
        const response = await request(app).get('/api/teams/DevTeam/name');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('PATCH /api/teams/:id', () => {
      it('devrait mettre à jour une équipe', async () => {
        const response = await request(app)
          .patch('/api/teams/1')
          .send({ name: 'Updated Team' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /api/teams/:id', () => {
      it('devrait supprimer une équipe', async () => {
        const response = await request(app).delete('/api/teams/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  // ==================== CLOCK ROUTES ====================
  describe('Clock Routes', () => {
    describe('GET /api/clocks', () => {
      it('devrait retourner tous les clocks', async () => {
        const response = await request(app).get('/api/clocks');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /api/clocks', () => {
      it('devrait créer un nouveau clock', async () => {
        const response = await request(app)
          .post('/api/clocks')
          .send({
            user_team_id: 1,
            planning_id: 1,
            arrival_time: '2025-10-10T08:00:00Z',
            departure_time: '2025-10-10T17:00:00Z'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('GET /api/clocks/:id', () => {
      it('devrait retourner un clock par ID', async () => {
        const response = await request(app).get('/api/clocks/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('PATCH /api/clocks/:id', () => {
      it('devrait mettre à jour un clock', async () => {
        const response = await request(app)
          .patch('/api/clocks/1')
          .send({ departure_time: '2025-10-10T18:00:00Z' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /api/clocks/:id', () => {
      it('devrait supprimer un clock', async () => {
        const response = await request(app).delete('/api/clocks/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  // ==================== USERTEAM ROUTES ====================
  describe('UserTeam Routes', () => {
    describe('GET /api/userteams', () => {
      it('devrait retourner toutes les associations user-team', async () => {
        const response = await request(app).get('/api/userteams');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /api/userteams', () => {
      it('devrait créer une nouvelle association user-team', async () => {
        const response = await request(app)
          .post('/api/userteams')
          .send({
            userId: 1,
            teamId: 1,
            role: 'employee'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('POST /api/userteams/email', () => {
      it('devrait créer une association user-team avec email', async () => {
        const response = await request(app)
          .post('/api/userteams/email')
          .send({
            email: 'test@test.com',
            teamId: 1,
            role: 'employee'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('GET /api/userteams/:userId/:teamId', () => {
      it('devrait retourner une association par userId et teamId', async () => {
        const response = await request(app).get('/api/userteams/1/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });

    describe('GET /api/users/:userId/teams', () => {
      it('devrait retourner toutes les équipes d\'un utilisateur', async () => {
        const response = await request(app).get('/api/users/1/teams');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/teams/:teamId/users', () => {
      it('devrait retourner tous les utilisateurs d\'une équipe', async () => {
        const response = await request(app).get('/api/teams/1/users');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('PATCH /api/userteams/:userId/:teamId', () => {
      it('devrait mettre à jour une association user-team', async () => {
        const response = await request(app)
          .patch('/api/userteams/1/1')
          .send({ role: 'manager' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /api/userteams/:userId/:teamId', () => {
      it('devrait supprimer une association user-team', async () => {
        const response = await request(app).delete('/api/userteams/1/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});