const request = require('supertest');

const BASE_URL = 'http://localhost:3001';

let testClockId = null;
let testUserId = null;

describe('Clock CRUD Routes (Integration)', () => {
  
  beforeAll(async () => {
    const newUser = {
      email: `clocktest${Date.now()}@test.com`,
      password: 'password123',
      first_name: 'Test',
      last_name: 'Clock'
    };
    
    try {
      const userResponse = await request(BASE_URL).post('/users').send(newUser);
      
      // Vérifier si la création a réussi
      if (userResponse.body.success && userResponse.body.data) {
        testUserId = userResponse.body.data.id;
      } else {
        console.error('Failed to create test user:', userResponse.body);
      }
    } catch (error) {
      console.error('Error creating test user:', error);
    }
  });

  afterAll(async () => {
    if (testUserId) {
      try {
        await request(BASE_URL).delete(`/users/${testUserId}`);
      } catch (error) {
        console.error('Error deleting test user:', error);
      }
    }
  });

  describe('GET /clocks - Get all clocks', () => {
    it('should return all clocks successfully', async () => {
      const response = await request(BASE_URL).get('/clocks');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });
  });

  describe('POST /clocks - Create new clock', () => {
    it('should create clock successfully', async () => {
      expect(testUserId).toBeTruthy();
      
      const newClock = {
        user_id: testUserId,
        clock_in: new Date().toISOString(),
        clock_out: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(BASE_URL).post('/clocks').send(newClock);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(newClock.user_id);
      expect(response.body.data.clock_in).toBeDefined();
      expect(response.body.data.clock_out).toBeDefined();

      testClockId = response.body.data.id;
    });

    it('should create clock with partial data', async () => {
      expect(testUserId).toBeTruthy();
      const response = await request(BASE_URL).post('/clocks').send({ 
        user_id: testUserId,
        clock_in: new Date().toISOString(),
        clock_out: null 
      });
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /clocks/:id - Get clock by ID', () => {
    it('should return clock by valid ID', async () => {
      expect(testClockId).toBeTruthy();
      const response = await request(BASE_URL).get(`/clocks/${testClockId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testClockId);
      expect(response.body.data.user_id).toBe(testUserId);
    });

    it('should return 404 for non-existent clock', async () => {
      const response = await request(BASE_URL).get('/clocks/6f4bfc69-0244-4d27-8912-73213f161f12');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Clock not found');
    });
  });

  describe('PATCH /clocks/:id - Update clock', () => {
    it('should update clock successfully', async () => {
      expect(testClockId).toBeTruthy();
      const updateData = {
        clock_out: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(BASE_URL)
        .patch(`/clocks/${testClockId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testClockId);
      expect(response.body.data.clock_out).toBeDefined();
    });

    it('should update multiple fields successfully', async () => {
      expect(testClockId).toBeTruthy();
      const updateData = {
        clock_in: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        clock_out: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(BASE_URL)
        .patch(`/clocks/${testClockId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 500 for non-existent clock', async () => {
      const response = await request(BASE_URL)
        .patch('/clocks/6f4bfc69-0244-4d27-8912-73213f161f12')
        .send({ clock_out: new Date().toISOString() });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /clocks/:id - Delete clock', () => {
    it('should delete clock successfully', async () => {
      expect(testClockId).toBeTruthy();
      const response = await request(BASE_URL).delete(`/clocks/${testClockId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Clock deleted successfully');
      expect(response.body.data.deletedClock).toBeDefined();
    });

    it('should return 404 for already deleted clock', async () => {
      expect(testClockId).toBeTruthy();
      const response = await request(BASE_URL).delete(`/clocks/${testClockId}`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Clock not found');
    });

    it('should return 500 for non-existent clock', async () => {
      const response = await request(BASE_URL).delete('/clocks/6f4bfc69-0244-4d27-8912-73213f161f12');
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});