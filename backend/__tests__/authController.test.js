const AuthController = require('../src/controllers/auth/AuthController.js');
const supabase = require('../config/supabaseClient.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../config/supabaseClient');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      password: 'hashedPassword123',
      first_name: 'John',
      last_name: 'Doe'
    };

    it('should login successfully with valid credentials', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: expect.objectContaining({
          user: expect.not.objectContaining({ password: expect.anything() }),
          token: 'mock-jwt-token',
          loginTime: expect.any(String)
        })
      });
    });

    it('should fail if email is missing', async () => {
      req.body = { password: 'password123' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email and password are required'
      });
    });

    it('should fail if password is missing', async () => {
      req.body = { email: 'test@example.com' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email and password are required'
      });
    });

    it('should fail with invalid email format', async () => {
      req.body = { email: 'invalid-email', password: 'password123' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email format'
      });
    });

    it('should fail if user not found', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            })
          })
        })
      });

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    it('should fail if password does not match', async () => {
      req.body = { email: 'test@example.com', password: 'wrongpassword' };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    it('should handle database errors', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error' } 
            })
          })
        })
      });

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Login failed',
        error: 'Database error'
      });
    });

    it('should handle unexpected errors', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };

      supabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Unexpected error'
      });
    });
  });

  describe('logout', () => {
    const mockDecodedToken = {
      userId: '123',
      email: 'test@example.com'
    };

    it('should logout successfully with valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';

      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { id: '123', email: 'test@example.com' }, 
              error: null 
            })
          })
        })
      });

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
        data: {
          userId: '123',
          email: 'test@example.com',
          logoutTime: expect.any(String)
        }
      });
    });

    it('should fail if no token provided', async () => {
      req.headers.authorization = undefined;

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided'
      });
    });

    it('should fail if authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided'
      });
    });

    it('should fail if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
    });

    it('should fail if user not found during logout', async () => {
      req.headers.authorization = 'Bearer valid-token';

      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            })
          })
        })
      });

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should handle database errors during logout', async () => {
      req.headers.authorization = 'Bearer valid-token';

      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error' } 
            })
          })
        })
      });

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Logout failed',
        error: 'Database error'
      });
    });

    it('should handle unexpected errors during logout', async () => {
      req.headers.authorization = 'Bearer valid-token';

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
    });
  });
});