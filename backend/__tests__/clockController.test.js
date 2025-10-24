const ClockController = require('../src/controllers/clock/ClockController.js');
const supabase = require('../config/supabaseClient.js');

// Mock de Supabase
jest.mock('../config/supabaseClient.js', () => ({
  from: jest.fn()
}));

describe('ClockController', () => {
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

  describe('getAllClocks', () => {
    it('devrait retourner tous les clocks avec succès', async () => {
      const mockClocks = [
        { 
          id: 1, 
          user_team_id: 1, 
          planning_id: 1,
          arrival_time: '2025-10-10T08:00:00Z', 
          departure_time: '2025-10-10T17:00:00Z' 
        },
        { 
          id: 2, 
          user_team_id: 2, 
          planning_id: 2,
          arrival_time: '2025-10-10T09:00:00Z', 
          departure_time: '2025-10-10T18:00:00Z' 
        }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockClocks,
          error: null
        })
      });

      await ClockController.getAllClocks(req, res);

      expect(supabase.from).toHaveBeenCalledWith('clock');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Clocks retrieved successfully',
        data: mockClocks,
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

      await ClockController.getAllClocks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch clocks',
        error: 'Database error'
      });
    });

    it('devrait gérer les erreurs inattendues', async () => {
      supabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await ClockController.getAllClocks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Unexpected error'
      });
    });
  });

  describe('createClock', () => {
    beforeEach(() => {
      req.body = {
        user_team_id: 1,
        planning_id: 1,
        arrival_time: '2025-10-10T08:00:00Z',
        departure_time: '2025-10-10T17:00:00Z'
      };
    });

    it('devrait créer un clock avec succès', async () => {
      const mockClock = {
        id: 1,
        user_team_id: 1,
        planning_id: 1,
        arrival_time: '2025-10-10T08:00:00Z',
        departure_time: '2025-10-10T17:00:00Z'
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockClock,
              error: null
            })
          })
        })
      });

      await ClockController.createClock(req, res);

      expect(supabase.from).toHaveBeenCalledWith('clock');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Clock created successfully',
        data: mockClock
      });
    });

    it('devrait créer un clock avec des champs optionnels manquants', async () => {
      req.body = {
        user_team_id: 1,
        arrival_time: '2025-10-10T08:00:00Z'
      };

      const mockClock = {
        id: 1,
        user_team_id: 1,
        planning_id: undefined,
        arrival_time: '2025-10-10T08:00:00Z',
        departure_time: undefined
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockClock,
              error: null
            })
          })
        })
      });

      await ClockController.createClock(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Clock created successfully',
        data: mockClock
      });
    });

    it('devrait gérer les erreurs lors de la création', async () => {
      const mockError = { message: 'Foreign key violation' };

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

      await ClockController.createClock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create clock',
        error: 'Foreign key violation'
      });
    });
  });

  describe('getClockById', () => {
    it('devrait retourner un clock par son ID', async () => {
      req.params.id = '1';
      const mockClock = {
        id: 1,
        user_team_id: 1,
        planning_id: 1,
        arrival_time: '2025-10-10T08:00:00Z',
        departure_time: '2025-10-10T17:00:00Z'
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockClock,
              error: null
            })
          })
        })
      });

      await ClockController.getClockById(req, res);

      expect(supabase.from).toHaveBeenCalledWith('clock');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Clock retrieved successfully',
        data: mockClock
      });
    });

    it('devrait retourner 404 si le clock n\'existe pas', async () => {
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

      await ClockController.getClockById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Clock not found'
      });
    });

    it('devrait gérer les erreurs de base de données', async () => {
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

      await ClockController.getClockById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch clock',
        error: 'Database error'
      });
    });
  });

  describe('getClockByUserTeamId', () => {
    it('devrait retourner un clock par user_team_id', async () => {
      req.params.user_team_id = '1';
      const mockClock = {
        id: 1,
        user_team_id: 1,
        planning_id: 1,
        arrival_time: '2025-10-10T08:00:00Z',
        departure_time: '2025-10-10T17:00:00Z'
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockClock,
              error: null
            })
          })
        })
      });

      await ClockController.getClockByUserTeamId(req, res);

      expect(supabase.from).toHaveBeenCalledWith('clock');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Clock retrieved successfully',
        data: mockClock
      });
    });

    it('devrait retourner 404 si aucun clock n\'est trouvé pour user_team_id', async () => {
      req.params.user_team_id = '999';

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

      await ClockController.getClockByUserTeamId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Clock not found'
      });
    });
  });

  describe('updateClock', () => {
    beforeEach(() => {
      req.params.id = '1';
    });

    it('devrait mettre à jour un clock avec succès', async () => {
      req.body = {
        departure_time: '2025-10-10T18:00:00Z'
      };

      const mockUpdatedClock = {
        id: 1,
        user_team_id: 1,
        planning_id: 1,
        arrival_time: '2025-10-10T08:00:00Z',
        departure_time: '2025-10-10T18:00:00Z'
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedClock,
                error: null
              })
            })
          })
        })
      });

      await ClockController.updateClock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Clock updated successfully',
        data: mockUpdatedClock
      });
    });

    it('devrait mettre à jour plusieurs champs', async () => {
      req.body = {
        arrival_time: '2025-10-10T07:00:00Z',
        departure_time: '2025-10-10T16:00:00Z',
        planning_id: 2
      };

      const mockUpdatedClock = {
        id: 1,
        user_team_id: 1,
        planning_id: 2,
        arrival_time: '2025-10-10T07:00:00Z',
        departure_time: '2025-10-10T16:00:00Z'
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedClock,
                error: null
              })
            })
          })
        })
      });

      await ClockController.updateClock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Clock updated successfully',
        data: mockUpdatedClock
      });
    });

    it('devrait retourner 404 si le clock n\'existe pas', async () => {
      req.body = { departure_time: '2025-10-10T18:00:00Z' };

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

      await ClockController.updateClock(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Clock not found'
      });
    });

    it('devrait gérer les mises à jour vides (aucun champ fourni)', async () => {
      req.body = {};

      const mockClock = {
        id: 1,
        user_team_id: 1,
        planning_id: 1,
        arrival_time: '2025-10-10T08:00:00Z',
        departure_time: '2025-10-10T17:00:00Z'
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockClock,
                error: null
              })
            })
          })
        })
      });

      await ClockController.updateClock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('devrait gérer les erreurs de base de données lors de la mise à jour', async () => {
      req.body = { departure_time: '2025-10-10T18:00:00Z' };
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

      await ClockController.updateClock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update clock',
        error: 'Constraint violation'
      });
    });
  });

  describe('deleteClock', () => {
    it('devrait supprimer un clock avec succès', async () => {
      req.params.id = '1';
      const mockClock = {
        id: 1,
        user_team_id: 1,
        planning_id: 1,
        arrival_time: '2025-10-10T08:00:00Z',
        departure_time: '2025-10-10T17:00:00Z'
      };

      // Mock pour vérifier l'existence
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockClock,
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

      await ClockController.deleteClock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Clock deleted successfully',
        data: {
          deletedClock: mockClock
        }
      });
    });

    it('devrait retourner 404 si le clock n\'existe pas', async () => {
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

      await ClockController.deleteClock(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Clock not found'
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

      await ClockController.deleteClock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to check clock existence',
        error: 'Database error'
      });
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      req.params.id = '1';
      const mockClock = {
        id: 1,
        user_team_id: 1,
        arrival_time: '2025-10-10T08:00:00Z'
      };

      // Mock pour vérifier l'existence
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockClock,
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

      await ClockController.deleteClock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete clock',
        error: 'Deletion failed'
      });
    });
  });
});