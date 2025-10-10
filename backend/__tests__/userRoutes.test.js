const UserController = require('../src/controllers/user/UserController.js');
const supabase = require('../config/supabaseClient.js');
const bcrypt = require('bcrypt');

// Mock de Supabase
jest.mock('../config/supabaseClient.js', () => ({
  from: jest.fn()
}));

// Mock de bcrypt
jest.mock('bcrypt');

describe('UserController', () => {
  let req, res;

  beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();
    
    // Mock de la requête et de la réponse
    req = {
      body: {},
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getAllUsers', () => {
    it('devrait retourner tous les utilisateurs avec succès', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@test.com', first_name: 'John', last_name: 'Doe' },
        { id: 2, email: 'user2@test.com', first_name: 'Jane', last_name: 'Smith' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null
        })
      });

      await UserController.getAllUsers(req, res);

      expect(supabase.from).toHaveBeenCalledWith('user');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Users retrieved successfully',
        data: mockUsers,
        count: 2
      });
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const mockError = { message: 'Database error' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      });

      await UserController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch users',
        error: 'Database error'
      });
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        permission: 'user'
      };
    });

    it('devrait créer un utilisateur avec succès', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
        permission: 'user'
      };

      bcrypt.hash.mockResolvedValue(hashedPassword);

      // Mock pour vérifier si l'utilisateur existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      // Mock pour créer l'utilisateur
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      });

      await UserController.createUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully',
        data: expect.objectContaining({
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe'
        })
      });
      expect(res.json.mock.calls[0][0].data.password).toBeUndefined();
    });

    it('devrait retourner une erreur si des champs requis sont manquants', async () => {
      req.body = { email: 'test@example.com' };

      await UserController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email, password, first_name, last_name and permission are required'
      });
    });

    it('devrait retourner une erreur si le format de l\'email est invalide', async () => {
      req.body.email = 'invalid-email';

      await UserController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email format'
      });
    });

    it('devrait retourner une erreur si le prénom est trop court', async () => {
      req.body.first_name = 'J';

      await UserController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'First name must be at least 2 characters long'
      });
    });

    it('devrait retourner une erreur si le nom est trop court', async () => {
      req.body.last_name = 'D';

      await UserController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Last name must be at least 2 characters long'
      });
    });

    it('devrait retourner une erreur si l\'email existe déjà', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, email: 'test@example.com' },
              error: null
            })
          })
        })
      });

      await UserController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists'
      });
    });
  });

  describe('getUserById', () => {
    it('devrait retourner un utilisateur par son ID', async () => {
      req.params.id = '1';
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      });

      await UserController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User retrieved successfully',
        data: mockUser
      });
    });

    it('devrait retourner 404 si l\'utilisateur n\'existe pas', async () => {
      req.params.id = '999';

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      await UserController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('getUserByEmail', () => {
    it('devrait retourner un utilisateur par son email', async () => {
      req.params.email = 'test@example.com';
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      });

      await UserController.getUserByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User retrieved successfully',
        data: mockUser
      });
    });

    it('devrait retourner une erreur si le format de l\'email est invalide', async () => {
      req.params.email = 'invalid-email';

      await UserController.getUserByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email format provided'
      });
    });

    it('devrait retourner 404 si l\'utilisateur n\'existe pas', async () => {
      req.params.email = 'notfound@example.com';

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      await UserController.getUserByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      req.params.id = '1';
    });

    it('devrait mettre à jour un utilisateur avec succès', async () => {
      req.body = {
        first_name: 'Jane',
        last_name: 'Updated'
      };

      const mockUpdatedUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        first_name: 'Jane',
        last_name: 'Updated'
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedUser,
                error: null
              })
            })
          })
        })
      });

      await UserController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: expect.objectContaining({
          first_name: 'Jane',
          last_name: 'Updated'
        })
      });
      expect(res.json.mock.calls[0][0].data.password).toBeUndefined();
    });

    it('devrait retourner une erreur si aucun champ n\'est fourni', async () => {
      req.body = {};

      await UserController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'At least one field must be provided to update'
      });
    });

    it('devrait hasher le mot de passe lors de la mise à jour', async () => {
      req.body = { password: 'newPassword123' };
      const hashedPassword = 'newHashedPassword';

      bcrypt.hash.mockResolvedValue(hashedPassword);

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 1, password: hashedPassword },
                error: null
              })
            })
          })
        })
      });

      await UserController.updateUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('devrait retourner une erreur si le mot de passe est trop court', async () => {
      req.body = { password: '12345' };

      await UserController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    });

    it('devrait retourner 404 si l\'utilisateur n\'existe pas', async () => {
      req.body = { first_name: 'Jane' };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      });

      await UserController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('devrait vérifier que l\'email n\'existe pas déjà pour un autre utilisateur', async () => {
      req.body = { email: 'existing@example.com' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 2, email: 'existing@example.com' },
                error: null
              })
            })
          })
        })
      });

      await UserController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists for another user'
      });
    });
  });

  describe('deleteUser', () => {
    it('devrait supprimer un utilisateur avec succès', async () => {
      req.params.id = '1';
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      // Mock pour vérifier l'existence
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      });

      // Mock pour la suppression
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      await UserController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully',
        data: {
          deletedUser: mockUser
        }
      });
    });

    it('devrait retourner 404 si l\'utilisateur n\'existe pas', async () => {
      req.params.id = '999';

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      await UserController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      req.params.id = '1';
      const mockUser = { id: 1, email: 'test@example.com' };

      // Mock pour vérifier l'existence
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      });

      // Mock pour la suppression avec erreur
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Deletion failed' }
          })
        })
      });

      await UserController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete user',
        error: 'Deletion failed'
      });
    });
  });
});