const AuthMiddleware = require('../src/middlewares/AuthMiddleware');
const PermissionMiddleware = require('../src/middlewares/PermissionMiddleware');
const TeamRoleMiddleware = require('../src/middlewares/TeamRoleMiddleware');
const supabase = require('../config/supabaseClient');
const jwt = require('jsonwebtoken');

// Mock de Supabase
jest.mock('../config/supabaseClient', () => ({
  from: jest.fn()
}));

// Mock de JWT
jest.mock('jsonwebtoken');

describe('Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      headers: {},
      body: {},
      params: {},
      query: {},
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    // Set up mock JWT_SECRET
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('AuthMiddleware', () => {
    describe('Token Validation', () => {
      it('devrait retourner 401 si aucun token n\'est fourni', async () => {
        await AuthMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unauthorized - No token provided'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait accepter un token avec le préfixe Bearer', async () => {
        const mockToken = 'valid-token';
        const mockDecoded = { userId: 1 };
        const mockUser = { id: 1, email: 'test@example.com', permission: 'user' };

        req.headers.authorization = `Bearer ${mockToken}`;
        jwt.verify.mockReturnValue(mockDecoded);

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

        await AuthMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
        expect(next).toHaveBeenCalled();
      });

      it('devrait accepter un token sans le préfixe Bearer', async () => {
        const mockToken = 'valid-token';
        const mockDecoded = { userId: 1 };
        const mockUser = { id: 1, email: 'test@example.com', permission: 'user' };

        req.headers.authorization = mockToken;
        jwt.verify.mockReturnValue(mockDecoded);

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

        await AuthMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
        expect(next).toHaveBeenCalled();
      });

      it('devrait retourner 401 si le token est invalide', async () => {
        req.headers.authorization = 'invalid-token';
        jwt.verify.mockImplementation(() => {
          const error = new Error('Invalid token');
          error.name = 'JsonWebTokenError';
          throw error;
        });

        await AuthMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unauthorized - Invalid token'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait retourner 401 si le token est expiré', async () => {
        req.headers.authorization = 'expired-token';
        jwt.verify.mockImplementation(() => {
          const error = new Error('Token expired');
          error.name = 'TokenExpiredError';
          throw error;
        });

        await AuthMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unauthorized - Token expired'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('User Validation', () => {
      it('devrait authentifier un utilisateur valide', async () => {
        const mockToken = 'valid-token';
        const mockDecoded = { userId: 1 };
        const mockUser = { id: 1, email: 'test@example.com', permission: 'user' };

        req.headers.authorization = `Bearer ${mockToken}`;
        jwt.verify.mockReturnValue(mockDecoded);

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

        await AuthMiddleware(req, res, next);

        expect(req.user).toEqual({
          userId: 1,
          permission: 'user'
        });
        expect(req.body.userId).toBe(1);
        expect(next).toHaveBeenCalled();
      });

      it('devrait retourner 401 si l\'utilisateur n\'existe pas dans la base de données', async () => {
        const mockToken = 'valid-token';
        const mockDecoded = { userId: 999 };

        req.headers.authorization = `Bearer ${mockToken}`;
        jwt.verify.mockReturnValue(mockDecoded);

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'User not found' }
              })
            })
          })
        });

        await AuthMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unauthorized - User not found'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait gérer les erreurs de base de données', async () => {
        const mockToken = 'valid-token';
        const mockDecoded = { userId: 1 };

        req.headers.authorization = `Bearer ${mockToken}`;
        jwt.verify.mockReturnValue(mockDecoded);

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        });

        await AuthMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Internal Server Error'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('PermissionMiddleware', () => {
    describe('Authentication Check', () => {
      it('devrait retourner 401 si l\'utilisateur n\'est pas authentifié', () => {
        const middleware = PermissionMiddleware('admin');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unauthorized - User authentication required'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait retourner 401 si la permission utilisateur est manquante', () => {
        req.user = { userId: 1 };
        const middleware = PermissionMiddleware('admin');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unauthorized - User authentication required'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Permission Hierarchy', () => {
      it('devrait autoriser un utilisateur avec le rôle exact requis', () => {
        req.user = { userId: 1, permission: 'admin' };
        const middleware = PermissionMiddleware('admin');
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('devrait autoriser un superadmin pour une permission admin', () => {
        req.user = { userId: 1, permission: 'superadmin' };
        const middleware = PermissionMiddleware('admin');
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('devrait autoriser un admin pour une permission user', () => {
        req.user = { userId: 1, permission: 'admin' };
        const middleware = PermissionMiddleware('user');
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('devrait refuser un user pour une permission admin', () => {
        req.user = { userId: 1, permission: 'user' };
        const middleware = PermissionMiddleware('admin');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Forbidden - Requires admin permission or above'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait refuser un user pour une permission superadmin', () => {
        req.user = { userId: 1, permission: 'user' };
        const middleware = PermissionMiddleware('superadmin');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Forbidden - Requires superadmin permission or above'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait refuser un admin pour une permission superadmin', () => {
        req.user = { userId: 1, permission: 'admin' };
        const middleware = PermissionMiddleware('superadmin');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Forbidden - Requires superadmin permission or above'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait refuser une permission inconnue', () => {
        req.user = { userId: 1, permission: 'unknown' };
        const middleware = PermissionMiddleware('user');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('TeamRoleMiddleware', () => {
    describe('Authentication Check', () => {
      it('devrait retourner 401 si l\'utilisateur n\'est pas authentifié', async () => {
        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unauthorized - User authentication required'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait retourner 401 si req.user existe mais sans userId', async () => {
        req.user = {}; // user existe mais pas de userId
        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unauthorized - User authentication required'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Team Context Validation', () => {
      beforeEach(() => {
        req.user = { userId: 1, permission: 'user' };
      });

      it('devrait retourner 400 si le contexte team est requis mais absent', async () => {
        const middleware = TeamRoleMiddleware([], true);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Bad Request - Team context required for this operation'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait accepter le teamId depuis req.params', async () => {
        req.params.teamId = '1';
        const mockUserTeam = {
          id: 1,
          role: 'member',
          team: { id: 1, name: 'Test Team', default_planning_id: 10 }
        };

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUserTeam,
                  error: null
                })
              })
            })
          })
        });

        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.currentTeam).toEqual({
          id: 1,
          name: 'Test Team',
          userRole: 'member',
          userTeamId: 1,
          defaultPlanningId: 10
        });
      });

      it('devrait accepter le teamId depuis req.body', async () => {
        req.body.teamId = '1';
        const mockUserTeam = {
          id: 1,
          role: 'member',
          team: { id: 1, name: 'Test Team', default_planning_id: 10 }
        };

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUserTeam,
                  error: null
                })
              })
            })
          })
        });

        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('devrait accepter le teamId depuis req.query', async () => {
        req.query.teamId = '1';
        const mockUserTeam = {
          id: 1,
          role: 'member',
          team: { id: 1, name: 'Test Team', default_planning_id: 10 }
        };

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUserTeam,
                  error: null
                })
              })
            })
          })
        });

        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('devrait accepter le teamId depuis req.headers', async () => {
        req.headers['x-team-id'] = '1';
        const mockUserTeam = {
          id: 1,
          role: 'member',
          team: { id: 1, name: 'Test Team', default_planning_id: 10 }
        };

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUserTeam,
                  error: null
                })
              })
            })
          })
        });

        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('devrait continuer si aucun teamId n\'est fourni et non requis', async () => {
        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.currentTeam).toBeUndefined();
      });
    });

    describe('Team Membership Validation', () => {
      beforeEach(() => {
        req.user = { userId: 1, permission: 'user' };
        req.params.teamId = '1';
      });

      it('devrait retourner 403 si l\'utilisateur n\'est pas membre de l\'équipe', async () => {
        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          })
        });

        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Forbidden - User not member of this team'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait autoriser un membre de l\'équipe', async () => {
        const mockUserTeam = {
          id: 1,
          role: 'member',
          team: { id: 1, name: 'Test Team', default_planning_id: 10 }
        };

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUserTeam,
                  error: null
                })
              })
            })
          })
        });

        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.currentTeam.userRole).toBe('member');
        expect(req.body.userTeamId).toBe(1);
        expect(req.user.teamRole).toBe('member');
      });
    });

    describe('Team Role Validation', () => {
      beforeEach(() => {
        req.user = { userId: 1, permission: 'user' };
        req.params.teamId = '1';
      });

      it('devrait autoriser un utilisateur avec le rôle requis', async () => {
        const mockUserTeam = {
          id: 1,
          role: 'admin',
          team: { id: 1, name: 'Test Team', default_planning_id: 10 }
        };

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUserTeam,
                  error: null
                })
              })
            })
          })
        });

        const middleware = TeamRoleMiddleware(['admin', 'owner']);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('devrait refuser un utilisateur sans le rôle requis', async () => {
        const mockUserTeam = {
          id: 1,
          role: 'member',
          team: { id: 1, name: 'Test Team', default_planning_id: 10 }
        };

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUserTeam,
                  error: null
                })
              })
            })
          })
        });

        const middleware = TeamRoleMiddleware(['admin', 'owner']);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Forbidden - Requires one of the following team roles: admin, owner'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('devrait retourner 400 si des rôles sont requis mais aucun teamId n\'est fourni', async () => {
        req.params.teamId = undefined;
        const middleware = TeamRoleMiddleware(['admin']);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Bad Request - teamId required for team role validation'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        req.user = { userId: 1, permission: 'user' };
        req.params.teamId = '1';
      });

      it('devrait gérer les erreurs de base de données', async () => {
        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockRejectedValue(new Error('Database error'))
              })
            })
          })
        });

        const middleware = TeamRoleMiddleware();
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Internal Server Error'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});