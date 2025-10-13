const TeamController = require('../src/controllers/team/TeamController.js');
const supabase = require('../config/supabaseClient.js');

// Mock de Supabase
jest.mock('../config/supabaseClient.js', () => ({
  from: jest.fn()
}));

describe('TeamController', () => {
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

  describe('getAllTeams', () => {
    it('devrait retourner toutes les équipes avec succès', async () => {
      const mockTeams = [
        { 
          id: 1, 
          name: 'Team Alpha', 
          description: 'First team',
          lateness_limit: 15
        },
        { 
          id: 2, 
          name: 'Team Beta', 
          description: 'Second team',
          lateness_limit: 10
        }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockTeams,
          error: null
        })
      });

      await TeamController.getAllTeams(req, res);

      expect(supabase.from).toHaveBeenCalledWith('team');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Teams retrieved successfully',
        data: mockTeams,
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

      await TeamController.getAllTeams(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch teams',
        error: 'Database error'
      });
    });

    it('devrait gérer les erreurs inattendues', async () => {
      supabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await TeamController.getAllTeams(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Unexpected error'
      });
    });
  });

  describe('createTeam', () => {
    it('devrait créer une équipe avec succès', async () => {
      req.body = {
        name: 'Team Gamma',
        description: 'New team',
        lateness_limit: 20
      };

      const mockTeam = {
        id: 1,
        name: 'Team Gamma',
        description: 'New team',
        lateness_limit: 20
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeam,
              error: null
            })
          })
        })
      });

      await TeamController.createTeam(req, res);

      expect(supabase.from).toHaveBeenCalledWith('team');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Team created successfully',
        data: mockTeam
      });
    });

    it('devrait retourner une erreur si le nom est vide', async () => {
      req.body = {
        name: '',
        description: 'Test',
        lateness_limit: 10
      };

      await TeamController.createTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Name is required'
      });
    });

    it('devrait retourner une erreur si le nom est manquant', async () => {
      req.body = {
        description: 'Test',
        lateness_limit: 10
      };

      await TeamController.createTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Name is required'
      });
    });

    it('devrait retourner une erreur si lateness_limit est null', async () => {
      req.body = {
        name: 'Team Test',
        description: 'Test',
        lateness_limit: null
      };

      await TeamController.createTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'lateness_limit must not be null or negative'
      });
    });

    it('devrait retourner une erreur si lateness_limit est négatif', async () => {
      req.body = {
        name: 'Team Test',
        description: 'Test',
        lateness_limit: -5
      };

      await TeamController.createTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'lateness_limit must not be null or negative'
      });
    });

    it('devrait gérer les erreurs lors de la création', async () => {
      req.body = {
        name: 'Team Test',
        description: 'Test',
        lateness_limit: 10
      };

      const mockError = { message: 'Constraint violation' };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      await TeamController.createTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create team',
        error: 'Constraint violation'
      });
    });
  });

  describe('getTeamById', () => {
    it('devrait retourner une équipe par son ID', async () => {
      req.params.id = '1';
      const mockTeam = {
        id: 1,
        name: 'Team Alpha',
        description: 'First team',
        lateness_limit: 15
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeam,
              error: null
            })
          })
        })
      });

      await TeamController.getTeamById(req, res);

      expect(supabase.from).toHaveBeenCalledWith('team');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Team retrieved successfully',
        data: mockTeam
      });
    });

    it('devrait retourner 404 si l\'équipe n\'existe pas', async () => {
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

      await TeamController.getTeamById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team not found'
      });
    });

    it('devrait gérer les erreurs de base de données', async () => {
      req.params.id = '1';
      const mockError = { message: 'Database error', code: 'DB_ERROR' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, name: 'Test' }, // data non null pour éviter le 404
              error: mockError
            })
          })
        })
      });

      await TeamController.getTeamById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch team',
        error: 'Database error'
      });
    });
  });

  describe('getTeamByName', () => {
    it('devrait retourner une équipe par son nom', async () => {
      req.params.name = 'Team Alpha';
      const mockTeam = {
        id: 1,
        name: 'Team Alpha',
        description: 'First team',
        lateness_limit: 15
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeam,
              error: null
            })
          })
        })
      });

      await TeamController.getTeamByName(req, res);

      expect(supabase.from).toHaveBeenCalledWith('team');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Team retrieved successfully',
        data: mockTeam
      });
    });

    it('devrait retourner 404 si l\'équipe n\'existe pas', async () => {
      req.params.name = 'Nonexistent Team';

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

      await TeamController.getTeamByName(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team not found'
      });
    });

    it('devrait gérer les erreurs de base de données', async () => {
      req.params.name = 'Team Alpha';
      const mockError = { message: 'Database error', code: 'DB_ERROR' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, name: 'Team Alpha' }, // data non null pour éviter le 404
              error: mockError
            })
          })
        })
      });

      await TeamController.getTeamByName(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch team',
        error: 'Database error'
      });
    });
  });

  describe('updateTeam', () => {
    beforeEach(() => {
      req.params.id = '1';
    });

    it('devrait mettre à jour une équipe avec succès', async () => {
      req.body = {
        name: 'Updated Team',
        description: 'Updated description',
        lateness_limit: 25
      };

      const mockUpdatedTeam = {
        id: 1,
        name: 'Updated Team',
        description: 'Updated description',
        lateness_limit: 25
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedTeam,
                error: null
              })
            })
          })
        })
      });

      await TeamController.updateTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Team updated successfully',
        data: mockUpdatedTeam
      });
    });

    it('devrait mettre à jour uniquement le nom', async () => {
      req.body = {
        name: 'New Name'
      };

      const mockUpdatedTeam = {
        id: 1,
        name: 'New Name',
        description: 'Old description',
        lateness_limit: 15
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedTeam,
                error: null
              })
            })
          })
        })
      });

      await TeamController.updateTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('devrait retourner une erreur si aucun champ n\'est fourni', async () => {
      req.body = {};

      await TeamController.updateTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No fields provided for update'
      });
    });

    it('devrait retourner une erreur si lateness_limit est null', async () => {
      req.body = {
        lateness_limit: null
      };

      await TeamController.updateTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'lateness_limit must not be null or negative'
      });
    });

    it('devrait retourner une erreur si lateness_limit est négatif', async () => {
      req.body = {
        lateness_limit: -10
      };

      await TeamController.updateTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'lateness_limit must not be null or negative'
      });
    });

    it('devrait retourner 404 si l\'équipe n\'existe pas', async () => {
      req.body = { name: 'New Name' };

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

      await TeamController.updateTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team not found'
      });
    });

    it('devrait gérer les erreurs de base de données lors de la mise à jour', async () => {
      req.body = { name: 'New Name' };
      const mockError = { message: 'Constraint violation', code: 'DB_ERROR' };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: mockError
              })
            })
          })
        })
      });

      await TeamController.updateTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update team',
        error: 'Constraint violation'
      });
    });
  });

  describe('deleteTeam', () => {
    it('devrait supprimer une équipe avec succès', async () => {
      req.params.id = '1';
      const mockTeam = {
        id: 1,
        name: 'Team Alpha',
        description: 'First team',
        lateness_limit: 15
      };

      // Mock pour vérifier l'existence
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeam,
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

      await TeamController.deleteTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Team deleted successfully',
        data: mockTeam
      });
    });

    it('devrait retourner 404 si l\'équipe n\'existe pas', async () => {
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

      await TeamController.deleteTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team not found'
      });
    });

    it('devrait gérer les erreurs lors de la vérification d\'existence', async () => {
      req.params.id = '1';
      const mockError = { message: 'Database error', code: 'DB_ERROR' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      await TeamController.deleteTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to check team',
        error: 'Database error'
      });
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      req.params.id = '1';
      const mockTeam = {
        id: 1,
        name: 'Team Alpha',
        description: 'First team',
        lateness_limit: 15
      };

      // Mock pour vérifier l'existence
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeam,
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

      await TeamController.deleteTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete team',
        error: 'Deletion failed'
      });
    });
  });
});