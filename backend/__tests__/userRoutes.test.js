const request = require('supertest');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

let testUserId = null;
let testUserEmail = null;
const createdUserIds = []; // Tracker pour tous les utilisateurs créés

describe('User CRUD Routes (Integration)', () => {
  
  beforeAll(async () => {
    const newUser = {
      email: `clocktest${Date.now()}@test.com`,
      password: 'password123',
      first_name: 'Test',
      last_name: 'Clock'
    };
    
    try {
      const userResponse = await request(BASE_URL).post('/users').send(newUser);
      
      if (userResponse.body.success && userResponse.body.data) {
        testUserId = userResponse.body.data.id;
        testUserEmail = userResponse.body.data.email;
        createdUserIds.push(testUserId);
      } else {
        console.error('Failed to create test user:', userResponse.body);
      }
    } catch (error) {
      console.error('Error creating test user:', error);
    }
  });

  afterAll(async () => {
    // Nettoyer TOUS les utilisateurs créés
    for (const userId of createdUserIds) {
      try {
        await request(BASE_URL).delete(`/users/${userId}`);
      } catch (error) {
        // Ignorer les erreurs (utilisateur déjà supprimé)
      }
    }
  });

  describe('POST /users - Create new user', () => {
    it('should create user successfully with all fields', async () => {
      const newUser = {
        email: `test${Date.now()}@test.com`,
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      
      // Ajouter au tracker si la création a réussi
      if (response.body.data?.id) {
        createdUserIds.push(response.body.data.id);
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.first_name).toBe(newUser.first_name);
      expect(response.body.data.last_name).toBe(newUser.last_name);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 400 when email is missing', async () => {
      const newUser = {
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email, password, first_name and last_name are required');
    });

    it('should return 400 when password is missing', async () => {
      const newUser = {
        email: `test${Date.now()}@test.com`,
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when first_name is missing', async () => {
      const newUser = {
        email: `test${Date.now()}@test.com`,
        password: 'password123',
        last_name: 'Doe'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when last_name is missing', async () => {
      const newUser = {
        email: `test${Date.now()}@test.com`,
        password: 'password123',
        first_name: 'John'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const newUser = {
        email: 'invalid-email',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email format');
    });

    it('should return 400 when first_name is too short', async () => {
      const newUser = {
        email: `test${Date.now()}@test.com`,
        password: 'password123',
        first_name: 'J',
        last_name: 'Doe'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('First name must be at least 2 characters long');
    });

    it('should return 400 when last_name is too short', async () => {
      const newUser = {
        email: `test${Date.now()}@test.com`,
        password: 'password123',
        first_name: 'John',
        last_name: 'D'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Last name must be at least 2 characters long');
    });

    it('should return 409 when email already exists', async () => {
      expect(testUserId).toBeTruthy();
      expect(testUserEmail).toBeTruthy();
      
      const newUser = {
        email: testUserEmail, // Utiliser l'email du beforeAll
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('GET /users - Get all users', () => {
    it('should return all users successfully', async () => {
      const response = await request(BASE_URL).get('/users');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /users/:id - Get user by ID', () => {
    it('should return user by valid ID', async () => {
      expect(testUserId).toBeTruthy();
      
      const response = await request(BASE_URL).get(`/users/${testUserId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUserId);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(BASE_URL).get('/users/6f4bfc69-0244-4d27-8912-73213f161f12');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /users/email/:email - Get user by email', () => {
    it('should return user by valid email', async () => {
      expect(testUserId).toBeTruthy();
      expect(testUserEmail).toBeTruthy();
      
      const response = await request(BASE_URL).get(`/users/email/${testUserEmail}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUserEmail);
      expect(response.body.data.id).toBe(testUserId);
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request(BASE_URL).get('/users/email/nonexistent@test.com');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(BASE_URL).get('/users/email/invalid-email');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email format provided');
    });
  });

  describe('PATCH /users/:id - Update user', () => {
    let updateTestUserId = null;
    let updateTestUserEmail = null;

    // Créer un utilisateur spécifique pour les tests de mise à jour
    beforeAll(async () => {
      const newUser = {
        email: `updatetest${Date.now()}@test.com`,
        password: 'password123',
        first_name: 'UpdateTest',
        last_name: 'User'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      if (response.body.data?.id) {
        updateTestUserId = response.body.data.id;
        updateTestUserEmail = response.body.data.email;
        createdUserIds.push(updateTestUserId);
      }
    });

    it('should update user email successfully', async () => {
      expect(updateTestUserId).toBeTruthy();
      
      const newEmail = `updated${Date.now()}@test.com`;
      const updateData = { email: newEmail };

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newEmail);
      expect(response.body.data.password).toBeUndefined();

      updateTestUserEmail = newEmail;
    });

    it('should update user first_name successfully', async () => {
      expect(updateTestUserId).toBeTruthy();
      
      const updateData = { first_name: 'UpdatedFirstName' };

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe('UpdatedFirstName');
    });

    it('should update user last_name successfully', async () => {
      expect(updateTestUserId).toBeTruthy();
      
      const updateData = { last_name: 'UpdatedLastName' };

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.last_name).toBe('UpdatedLastName');
    });

    it('should update user password successfully', async () => {
      expect(updateTestUserId).toBeTruthy();
      
      const updateData = { password: 'newPassword456' };

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should update multiple fields successfully', async () => {
      expect(updateTestUserId).toBeTruthy();
      
      const updateData = {
        first_name: 'MultiUpdate',
        last_name: 'Test',
      };

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe('MultiUpdate');
      expect(response.body.data.last_name).toBe('Test');
    });

    it('should return 400 when no fields are provided', async () => {
      expect(updateTestUserId).toBeTruthy();

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('At least one field must be provided to update');
    });

    it('should return 400 for invalid email format', async () => {
      expect(updateTestUserId).toBeTruthy();
      
      const updateData = { email: 'invalid-email' };

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email format');
    });

    it('should return 400 when password is too short', async () => {
      expect(updateTestUserId).toBeTruthy();
      
      const updateData = { password: '12345' };

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should return 400 when first_name is too short', async () => {
      expect(updateTestUserId).toBeTruthy();
      
      const updateData = { first_name: 'J' };

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('First name must be at least 2 characters long');
    });

    it('should return 400 when last_name is too short', async () => {
      expect(updateTestUserId).toBeTruthy();
      
      const updateData = { last_name: 'D' };

      const response = await request(BASE_URL)
        .patch(`/users/${updateTestUserId}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Last name must be at least 2 characters long');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(BASE_URL)
        .patch('/users/100000')
        .send({ first_name: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 409 when email already exists for another user', async () => {
      const secondUser = {
        email: `second${Date.now()}@test.com`,
        password: 'password123',
        first_name: 'Second',
        last_name: 'User'
      };

      const createResponse = await request(BASE_URL).post('/users').send(secondUser);
      const secondUserId = createResponse.body.data.id;
      
      // Ajouter au tracker
      createdUserIds.push(secondUserId);

      expect(testUserEmail).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/users/${secondUserId}`)
        .send({ email: testUserEmail });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already exists for another user');
    });
  });

  describe('DELETE /users/:id - Delete user', () => {
    it('should delete user successfully', async () => {
      // Créer un utilisateur spécifiquement pour ce test
      const newUser = {
        email: `todelete${Date.now()}@test.com`,
        password: 'password123',
        first_name: 'ToDelete',
        last_name: 'User'
      };

      const createResponse = await request(BASE_URL).post('/users').send(newUser);
      const deleteUserId = createResponse.body.data.id;
      
      const response = await request(BASE_URL).delete(`/users/${deleteUserId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
      expect(response.body.data.deletedUser).toBeDefined();
    });

    it('should return 404 for already deleted user', async () => {
      // Créer et supprimer un utilisateur
      const newUser = {
        email: `todelete2${Date.now()}@test.com`,
        password: 'password123',
        first_name: 'ToDelete2',
        last_name: 'User'
      };

      const createResponse = await request(BASE_URL).post('/users').send(newUser);
      const deleteUserId = createResponse.body.data.id;
      
      // Première suppression
      await request(BASE_URL).delete(`/users/${deleteUserId}`);
      
      // Deuxième suppression (devrait échouer)
      const response = await request(BASE_URL).delete(`/users/${deleteUserId}`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(BASE_URL).delete('/users/10000000');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });
});