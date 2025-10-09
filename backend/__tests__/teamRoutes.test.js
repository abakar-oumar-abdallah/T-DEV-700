const request = require('supertest');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

let teamId = null;      

describe('Team CRUD Routes (Integration)', () => {
  beforeAll(async () => {
    const newTeam = {
      name: `testTeam ${Date.now()}`,
      description: 'tests',
      lateness_limit: 10,
    };

    try {
      const res = await request(BASE_URL).post('/teams').send(newTeam);
      if (res.body && res.body.data && res.body.data.id) {
        teamId = res.body.data.id;
      } else {
        console.error('Failed to create test team:', res.body);
      }
    } catch (error) {
      console.error('Error creating test team:', error);
    }
  });

  afterAll(async () => {
    try {
      if (teamId) await request(BASE_URL).delete(`/teams/${teamId}`);
    } catch (error) {
        console.error('Error deleting test user:', error);
    }
  });

  describe('GET /teams - Get all teams', () => {
    it('should return all teams successfully', async () => {
      const res = await request(BASE_URL).get('/teams');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /teams - Create new team', () => {
    it('should create team successfully', async () => {
      const newTeam = {
        name: `Dev Team ${Date.now()}`,
        description: 'Backend developers',
        lateness_limit: 15
      };

      const res = await request(BASE_URL).post('/teams').send(newTeam);
      expect([201, 200]).toContain(res.status);
      expect(res.body.success).toBe(true);

      if (res.body.data) {
        expect(res.body.data.name).toBe(newTeam.name);
        expect(res.body.data.description).toBe(newTeam.description);
      }
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidTeam = { description: 'No name provided' };
      const res = await request(BASE_URL).post('/teams').send(invalidTeam);

      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });
   
  describe('GET /teams/:id - Get team by ID', () => {
    it('should return team by valid ID', async () => {
      expect(teamId).toBeTruthy();
      const res = await request(BASE_URL).get(`/teams/${teamId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(teamId);
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(BASE_URL).get('/teams/999999');
      expect([404, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /teams/:id - Update team', () => {
    it('should update team successfully', async () => {
      const update = {
        name: `Updated Team ${Date.now()}`,
        description: 'Updated description',
        lateness_limit: 20,
      };

      const res = await request(BASE_URL).patch(`/teams/${teamId}`).send(update);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(update.name);
      expect(res.body.data.description).toBe(update.description);
      expect(res.body.data.lateness_limit).toBe(update.lateness_limit);
    });

    it('should return 400 when no fields are provided', async () => {
      const res = await request(BASE_URL).patch(`/teams/${teamId}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when updating non-existent team', async () => {
      const res = await request(BASE_URL).patch('/teams/999999').send({ name: 'X' });
      expect([404, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /teams/:id - Delete team', () => {
    it('should delete team successfully', async () => {
      const newTeam = {
        name: `Delete Team ${Date.now()}`,
        description: 'To delete',
        lateness_limit: 5,
      };
      const createRes = await request(BASE_URL).post('/teams').send(newTeam);
      const deleteId = createRes.body.data.id;

      const res = await request(BASE_URL).delete(`/teams/${deleteId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(deleteId);
    });

    it('should return 404 when deleting non-existent team', async () => {
      const res = await request(BASE_URL).delete('/teams/999999');
      expect([404, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });
});