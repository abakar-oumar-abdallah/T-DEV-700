const UserTeamController = require('../src/controllers/userteam/UserTeamController.js');
const supabase = require('../config/supabaseClient.js');

// Mock de Supabase
jest.mock('../config/supabaseClient.js', () => ({
  from: jest.fn()
}));

describe('UserTeamController', () => {
  let req, res;

  beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();

    // Mock de la requête et de la réponse
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getAllUserTeams', () => {
    it('devrait retourner toutes les associations user-team avec succès', async () => {
      const mockUserTeams = [
        {
          id: 'ut1',
          user_id: 'u1',
          team_id: 't1',
          role: 'employee',
          user: { id: 'u1', email: 'user1@example.com', first_name: 'John', last_name: 'Doe' },
          team: { id: 't1', name: 'Team 1', description: 'First team' }
        },
        {
          id: 'ut2',
          user_id: 'u2',
          team_id: 't1',
          role: 'manager',
          user: { id: 'u2', email: 'user2@example.com', first_name: 'Jane', last_name: 'Smith' },
          team: { id: 't1', name: 'Team 1', description: 'First team' }
        }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockUserTeams, error: null })
      });

      await UserTeamController.getAllUserTeams(req, res);

      expect(supabase.from).toHaveBeenCalledWith('user_team');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User-teams retrieved successfully',
        data: mockUserTeams,
        count: 2
      });
    });

    it('devrait gérer les erreurs de base de données', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      });

      await UserTeamController.getAllUserTeams(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch user-teams',
        error: 'Database error'
      });
    });
  });

  describe('createUserTeam', () => {
    it('devrait créer une association user-team avec succès', async () => {
      req.body = { userId: 'u1', teamId: 't1', role: 'employee' };

      const mockCreated = {
        id: 'ut1',
        user_id: 'u1',
        team_id: 't1',
        role: 'employee',
        user: { id: 'u1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' },
        team: { id: 't1', name: 'Team 1', description: 'First team' }
      };

      // Vérification user existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null })
          })
        })
      });

      // Vérification team existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 't1' }, error: null })
          })
        })
      });

      // Vérification association inexistante
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      });

      // Insertion association
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockCreated, error: null })
          })
        })
      });

      await UserTeamController.createUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User-team association created successfully',
        data: mockCreated
      });
    });

    it('devrait retourner une erreur si des champs requis sont manquants (userId)', async () => {
      req.body = { teamId: 't1', role: 'employee' };

      await UserTeamController.createUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'userId, teamId and role are required' });
    });

    it('devrait retourner une erreur si des champs requis sont manquants (teamId)', async () => {
      req.body = { userId: 'u1', role: 'employee' };

      await UserTeamController.createUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'userId, teamId and role are required' });
    });

    it('devrait retourner une erreur si des champs requis sont manquants (role)', async () => {
      req.body = { userId: 'u1', teamId: 't1' };

      await UserTeamController.createUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'userId, teamId and role are required' });
    });

    it('devrait retourner une erreur si le role est invalide', async () => {
      req.body = { userId: 'u1', teamId: 't1', role: 'invalid_role' };

      await UserTeamController.createUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid role. Must be one of: employee, manager' });
    });

    it('devrait retourner 404 si l\'utilisateur est introuvable', async () => {
      req.body = { userId: 'invalid', teamId: 't1', role: 'employee' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await UserTeamController.createUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
    });

    it('devrait retourner 404 si l\'équipe est introuvable', async () => {
      req.body = { userId: 'u1', teamId: 'invalid', role: 'employee' };

      // user existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null })
          })
        })
      });

      // team introuvable
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await UserTeamController.createUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Team not found' });
    });

    it('devrait retourner 409 si l\'association existe déjà', async () => {
      req.body = { userId: 'u1', teamId: 't1', role: 'employee' };

      // user existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null })
          })
        })
      });

      // team existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 't1' }, error: null })
          })
        })
      });

      // association existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'ut1' }, error: null })
            })
          })
        })
      });

      await UserTeamController.createUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User is already associated with this team' });
    });
  });

  describe('createUserTeamWithEmail', () => {
    it('devrait créer une association via email avec succès', async () => {
      req.body = { email: 'user@example.com', teamId: 't1', role: 'employee' };

      const mockUser = { id: 'u1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' };
      const mockCreated = {
        id: 'ut1',
        user_id: 'u1',
        team_id: 't1',
        role: 'employee',
        user: mockUser,
        team: { id: 't1', name: 'Team 1', description: 'First team' }
      };

      // user par email
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      // team existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 't1' }, error: null })
          })
        })
      });

      // association n'existe pas
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      });

      // insertion
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockCreated, error: null })
          })
        })
      });

      await UserTeamController.createUserTeamWithEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User-team association created successfully using email',
        data: mockCreated
      });
    });

    it('devrait retourner une erreur si email manquant', async () => {
      req.body = { teamId: 't1', role: 'employee' };

      await UserTeamController.createUserTeamWithEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'email, teamId and role are required' });
    });

    it('devrait retourner une erreur si email invalide', async () => {
      req.body = { email: 'invalid-email', teamId: 't1', role: 'employee' };

      await UserTeamController.createUserTeamWithEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid email format' });
    });

    it('devrait retourner 404 si utilisateur introuvable via email', async () => {
      req.body = { email: 'notfound@example.com', teamId: 't1', role: 'employee' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await UserTeamController.createUserTeamWithEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found with this email' });
    });

    it('devrait retourner 404 si équipe introuvable', async () => {
      req.body = { email: 'user@example.com', teamId: 'invalid', role: 'employee' };

      const mockUser = { id: 'u1', email: 'user@example.com' };

      // user par email
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      // team introuvable
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await UserTeamController.createUserTeamWithEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Team not found' });
    });

    it('devrait retourner 409 si l\'association existe déjà', async () => {
      req.body = { email: 'user@example.com', teamId: 't1', role: 'employee' };

      const mockUser = { id: 'u1', email: 'user@example.com' };

      // user par email
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      // team existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 't1' }, error: null })
          })
        })
      });

      // association existe
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'ut1' }, error: null })
            })
          })
        })
      });

      await UserTeamController.createUserTeamWithEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User is already associated with this team' });
    });
  });

  describe('getUserTeamById', () => {
    it('devrait retourner une association par userId et teamId', async () => {
      req.params = { userId: 'u1', teamId: 't1' };

      const mockUserTeam = {
        id: 'ut1',
        user_id: 'u1',
        team_id: 't1',
        role: 'employee',
        user: { id: 'u1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' },
        team: { id: 't1', name: 'Team 1', description: 'First team' }
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
            })
          })
        })
      });

      await UserTeamController.getUserTeamById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User-team association retrieved successfully', data: mockUserTeam });
    });

    it('devrait retourner 404 si association introuvable', async () => {
      req.params = { userId: 'u1', teamId: 't1' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      });

      await UserTeamController.getUserTeamById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User-team association not found' });
    });
  });

  describe('getTeamsByUserId', () => {
    it('devrait retourner toutes les équipes d\'un utilisateur', async () => {
      req.params = { userId: 'u1' };

      const mockTeams = [
        { role: 'employee', team: { id: 't1', name: 'Team 1', description: 'First team', lateness_limit: 10 } },
        { role: 'manager', team: { id: 't2', name: 'Team 2', description: 'Second team', lateness_limit: 15 } }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockTeams, error: null })
        })
      });

      await UserTeamController.getTeamsByUserId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User teams retrieved successfully', data: mockTeams, count: 2 });
    });

    it('devrait gérer les erreurs de base de données', async () => {
      req.params = { userId: 'u1' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        })
      });

      await UserTeamController.getTeamsByUserId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to fetch user teams', error: 'Database error' });
    });
  });

  describe('getUsersByTeamId', () => {
    it('devrait retourner tous les utilisateurs d\'une équipe', async () => {
      req.params = { teamId: 't1' };

      const mockUsers = [
        { role: 'employee', user: { id: 'u1', email: 'user1@example.com', first_name: 'John', last_name: 'Doe' } },
        { role: 'manager', user: { id: 'u2', email: 'user2@example.com', first_name: 'Jane', last_name: 'Smith' } }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockUsers, error: null })
        })
      });

      await UserTeamController.getUsersByTeamId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Team users retrieved successfully', data: mockUsers, count: 2 });
    });

    it('devrait gérer les erreurs de base de données', async () => {
      req.params = { teamId: 't1' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        })
      });

      await UserTeamController.getUsersByTeamId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to fetch team users', error: 'Database error' });
    });
  });

  describe('updateUserTeam', () => {
    it('devrait mettre à jour le role avec succès', async () => {
      req.params = { userId: 'u1', teamId: 't1' };
      req.body = { role: 'manager' };

      const mockUpdated = {
        id: 'ut1',
        user_id: 'u1',
        team_id: 't1',
        role: 'manager',
        user: { id: 'u1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' },
        team: { id: 't1', name: 'Team 1', description: 'First team' }
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null })
              })
            })
          })
        })
      });

      await UserTeamController.updateUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User-team association updated successfully', data: mockUpdated });
    });

    it('devrait retourner une erreur si role manquant', async () => {
      req.params = { userId: 'u1', teamId: 't1' };
      req.body = {};

      await UserTeamController.updateUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Role is required for update' });
    });

    it('devrait retourner une erreur si role invalide', async () => {
      req.params = { userId: 'u1', teamId: 't1' };
      req.body = { role: 'invalid_role' };

      await UserTeamController.updateUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid role. Must be one of: employee, manager' });
    });

    it('devrait retourner 404 si association introuvable', async () => {
      req.params = { userId: 'u1', teamId: 't1' };
      req.body = { role: 'manager' };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
              })
            })
          })
        })
      });

      await UserTeamController.updateUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User-team association not found' });
    });
  });

  describe('deleteUserTeam', () => {
    it('devrait supprimer une association avec succès', async () => {
      req.params = { userId: 'u1', teamId: 't1' };

      const mockExisting = { id: 'ut1', user_id: 'u1', team_id: 't1', role: 'employee' };

      // Vérifier l'existence
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockExisting, error: null })
            })
          })
        })
      });

      // Suppression
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      await UserTeamController.deleteUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User-team association deleted successfully',
        data: { deletedAssociation: mockExisting }
      });
    });

    it('devrait retourner 404 si association introuvable', async () => {
      req.params = { userId: 'u1', teamId: 't1' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      });

      await UserTeamController.deleteUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User-team association not found' });
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      req.params = { userId: 'u1', teamId: 't1' };

      const mockExisting = { id: 'ut1', user_id: 'u1', team_id: 't1', role: 'employee' };

      // Vérifier l'existence
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockExisting, error: null })
            })
          })
        })
      });

      // Erreur de suppression
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: { message: 'Database error' } })
          })
        })
      });

      await UserTeamController.deleteUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to delete user-team association', error: 'Database error' });
    });

    it('devrait gérer les erreurs inattendues', async () => {
      req.params = { userId: 'u1', teamId: 't1' };

      supabase.from.mockImplementation(() => { throw new Error('Unexpected error'); });

      await UserTeamController.deleteUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error', error: 'Unexpected error' });
    });
  });
});
