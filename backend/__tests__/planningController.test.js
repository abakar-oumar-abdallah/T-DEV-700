const PlanningController = require('../src/controllers/planning/PlanningController.js');
const supabase = require('../config/supabaseClient.js');

// Mock de Supabase
jest.mock('../config/supabaseClient.js', () => ({
  from: jest.fn()
}));

describe('PlanningController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('validateSchedules', () => {
    it("devrait retourner une erreur si schedules est manquant ou n'est pas un tableau", () => {
      const err1 = PlanningController.validateSchedules(undefined);
      const err2 = PlanningController.validateSchedules({});
      expect(err1).toBe('Schedules array is required');
      expect(err2).toBe('Schedules array is required');
    });

    it("devrait retourner une erreur si schedules est vide quand non autorisé", () => {
      const err = PlanningController.validateSchedules([], false);
      expect(err).toBe('Schedules array must not be empty');
    });

    it('devrait retourner une erreur pour un jour invalide', () => {
      const err = PlanningController.validateSchedules([
        { day: 'invalidday', time_in: '09:00:00', time_out: '17:00:00' }
      ], false);
      expect(err).toContain('Invalid day');
    });

    it('devrait retourner une erreur pour un format d\'heure invalide', () => {
      const err = PlanningController.validateSchedules([
        { day: 'monday', time_in: '25:00:00', time_out: '17:00:00' }
      ], false);
      expect(err).toBe('Time format must be HH:MM:SS');
    });

    it('devrait retourner une erreur pour des jours dupliqués', () => {
      const err = PlanningController.validateSchedules([
        { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' },
        { day: 'monday', time_in: '10:00:00', time_out: '18:00:00' }
      ], false);
      expect(err).toBe('Duplicate days are not allowed');
    });

    it('devrait retourner null pour un tableau valide', () => {
      const err = PlanningController.validateSchedules([
        { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' },
        { day: 'tuesday', time_in: '09:00:00', time_out: '17:00:00' }
      ], false);
      expect(err).toBeNull();
    });
  });

  describe('getAllPlannings', () => {
    it('devrait retourner tous les plannings avec succès', async () => {
      const mockPlannings = [
        { id: 'p2', is_default: false, schedule: [] },
        { id: 'p1', is_default: true, schedule: [ { id: 's1', day: 'monday', time_in: '09:00:00', time_out: '17:00:00' } ] }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockPlannings, error: null })
        })
      });

      await PlanningController.getAllPlannings(req, res);

      expect(supabase.from).toHaveBeenCalledWith('planning');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Plannings retrieved successfully', data: mockPlannings, count: 2 });
    });

    it('devrait gérer les erreurs de base de données', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        })
      });

      await PlanningController.getAllPlannings(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to fetch plannings', error: 'Database error' });
    });
  });

  describe('createPlanning', () => {
    it('devrait créer un planning avec des horaires avec succès', async () => {
      req.body = {
        is_default: false,
        schedules: [
          { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' },
          { day: 'tuesday', time_in: '10:00:00', time_out: '18:00:00' }
        ]
      };

      const mockPlanning = { id: 'p1', is_default: false };
      const mockSchedules = [
        { id: 's1', planning_id: 'p1', day: 'monday', time_in: '09:00:00', time_out: '17:00:00' },
        { id: 's2', planning_id: 'p1', day: 'tuesday', time_in: '10:00:00', time_out: '18:00:00' }
      ];

      // insert planning
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      // insert schedules
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: mockSchedules, error: null })
        })
      });

      await PlanningController.createPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Planning created successfully', data: { ...mockPlanning, schedules: mockSchedules } });
    });

    it('devrait créer un planning sans horaires (tableau vide) avec succès', async () => {
      req.body = { is_default: true, schedules: [] };

      const mockPlanning = { id: 'p2', is_default: true };

      // insert planning
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      await PlanningController.createPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Planning created successfully', data: { ...mockPlanning, schedules: [] } });
    });

    it('devrait retourner une erreur de validation pour un jour invalide', async () => {
      req.body = { is_default: false, schedules: [ { day: 'badday', time_in: '09:00:00', time_out: '17:00:00' } ] };

      await PlanningController.createPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining('Invalid day') });
    });

    it('devrait retourner 500 si la création échoue (insertion planning)', async () => {
      req.body = { is_default: false, schedules: [ { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' } ] };

      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert error' } })
          })
        })
      });

      await PlanningController.createPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to create planning', error: 'Insert error' });
    });

    it('devrait retourner 500 si la création échoue (insertion schedules avec rollback)', async () => {
      req.body = { is_default: false, schedules: [ { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' } ] };

      const mockPlanning = { id: 'p1', is_default: false };
      const deleteMock = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({}) });

      // insert planning OK
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      // insert schedules KO
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Schedules insert error' } })
        })
      });

      // rollback delete planning
      supabase.from.mockReturnValueOnce({
        delete: deleteMock
      });

      await PlanningController.createPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to create planning', error: 'Schedules insert error' });
      expect(supabase.from).toHaveBeenCalledWith('planning');
    });
  });

  describe('getPlanningById', () => {
    it('devrait retourner un planning par ID', async () => {
      req.params.id = 'p1';
      const mockPlanning = { id: 'p1', is_default: false, schedule: [] };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      await PlanningController.getPlanningById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Planning retrieved successfully', data: mockPlanning });
    });

    it('devrait retourner 404 si le planning est introuvable', async () => {
      req.params.id = 'invalid';

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await PlanningController.getPlanningById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Planning not found' });
    });
  });

  describe('updatePlanning', () => {
    it('devrait mettre à jour un planning avec succès', async () => {
      req.params.id = 'p1';
      req.body = { is_default: true };

      const mockUpdated = { id: 'p1', is_default: true, schedule: [] };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null })
            })
          })
        })
      });

      await PlanningController.updatePlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Planning updated successfully', data: mockUpdated });
    });

    it('devrait retourner une erreur si aucun champ fourni', async () => {
      req.params.id = 'p1';
      req.body = {};

      await PlanningController.updatePlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'At least one field must be provided to update' });
    });

    it('devrait retourner 404 si le planning est introuvable', async () => {
      req.params.id = 'invalid';
      req.body = { is_default: false };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      });

      await PlanningController.updatePlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Planning not found' });
    });
  });

  describe('deletePlanning', () => {
    it('devrait supprimer un planning avec succès', async () => {
      req.params.id = 'p1';
      const mockPlanning = { id: 'p1', schedule: [] };

      // existence planning
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      // team references (none)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // clock references (none)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      // delete planning
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      await PlanningController.deletePlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Planning deleted successfully', data: { deletedPlanning: mockPlanning } });
    });

    it('devrait retourner 404 si planning introuvable', async () => {
      req.params.id = 'invalid';

      // existence planning KO
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await PlanningController.deletePlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Planning not found' });
    });

    it('devrait retourner 409 si le planning est référencé par des équipes', async () => {
      req.params.id = 'p1';
      const mockPlanning = { id: 'p1', schedule: [] };

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [ { id: 't1', name: 'Team 1' } ], error: null })
        })
      });

      await PlanningController.deletePlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Cannot delete planning: it is referenced by teams', data: [ { id: 't1', name: 'Team 1' } ] });
    });

    it('devrait retourner 409 si le planning est référencé par des entrées de clock', async () => {
      req.params.id = 'p1';
      const mockPlanning = { id: 'p1', schedule: [] };

      // existence ok
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      // teams none
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // clocks some
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [ { id: 'c1' } ], error: null })
          })
        })
      });

      await PlanningController.deletePlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Cannot delete planning: it is referenced by clock entries' });
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      req.params.id = 'p1';
      const mockPlanning = { id: 'p1', schedule: [] };

      // existence ok
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      // teams none
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // clocks none
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      // delete error
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Deletion failed' } })
        })
      });

      await PlanningController.deletePlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to delete planning', error: 'Deletion failed' });
    });
  });

  describe('getDefaultPlanningByTeam', () => {
    it('devrait retourner le planning par défaut d\'une équipe', async () => {
      req.params.teamId = 't1';
      const mockTeam = { id: 't1', name: 'Team 1', default_planning_id: 'p1' };
      const mockPlanning = { id: 'p1', is_default: true, schedule: [] };

      // team
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
          })
        })
      });

      // planning
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      await PlanningController.getDefaultPlanningByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Default planning retrieved successfully', data: { team: { id: 't1', name: 'Team 1' }, planning: mockPlanning } });
    });

    it('devrait retourner 404 si l\'équipe est introuvable', async () => {
      req.params.teamId = 'invalid';

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await PlanningController.getDefaultPlanningByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Team not found' });
    });

    it('devrait retourner 404 si aucune planning par défaut', async () => {
      req.params.teamId = 't1';
      const mockTeam = { id: 't1', name: 'Team 1', default_planning_id: null };

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
          })
        })
      });

      await PlanningController.getDefaultPlanningByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No default planning assigned to this team' });
    });

    it('devrait retourner 404 si le planning par défaut est introuvable', async () => {
      req.params.teamId = 't1';
      const mockTeam = { id: 't1', name: 'Team 1', default_planning_id: 'p1' };

      // team ok
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
          })
        })
      });

      // planning not found
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await PlanningController.getDefaultPlanningByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Default planning not found' });
    });
  });

  describe('getPlanningByUserTeam', () => {
    it('devrait retourner le planning de l\'association user-team (planning spécifique)', async () => {
      req.params.userTeamId = 'ut1';

      const mockUserTeam = {
        id: 'ut1',
        role: 'employee',
        planning_id: 'p1',
        user: { id: 'u1' },
        team: { id: 't1', default_planning_id: 'p2' }
      };
      const mockPlanning = { id: 'p1', schedule: [] };

      // user_team
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
          })
        })
      });

      // planning by id
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      await PlanningController.getPlanningByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Planning retrieved successfully',
        data: {
          userTeam: { id: 'ut1', role: 'employee', user: { id: 'u1' }, team: { id: 't1', default_planning_id: 'p2' } },
          planning: mockPlanning,
          isTeamDefault: false
        }
      });
    });

    it('devrait retourner le planning par défaut de l\'équipe si aucun planning spécifique', async () => {
      req.params.userTeamId = 'ut1';

      const mockUserTeam = {
        id: 'ut1',
        role: 'employee',
        planning_id: null,
        user: { id: 'u1' },
        team: { id: 't1', default_planning_id: 'p2' }
      };
      const mockPlanning = { id: 'p2', schedule: [] };

      // user_team
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
          })
        })
      });

      // planning by team default
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPlanning, error: null })
          })
        })
      });

      await PlanningController.getPlanningByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Planning retrieved successfully',
        data: expect.objectContaining({ isTeamDefault: true })
      });
    });

    it('devrait retourner 404 si aucune planification assignée', async () => {
      req.params.userTeamId = 'ut1';

      const mockUserTeam = { id: 'ut1', role: 'employee', planning_id: null, user: { id: 'u1' }, team: { id: 't1', default_planning_id: null } };

      // user_team
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
          })
        })
      });

      await PlanningController.getPlanningByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No planning assigned to this user or team' });
    });

    it('devrait retourner 404 si association introuvable', async () => {
      req.params.userTeamId = 'invalid';

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await PlanningController.getPlanningByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User-team association not found' });
    });

    it('devrait retourner 404 si le planning est introuvable', async () => {
      req.params.userTeamId = 'ut1';

      const mockUserTeam = { id: 'ut1', role: 'employee', planning_id: 'p1', user: { id: 'u1' }, team: { id: 't1', default_planning_id: 'p2' } };

      // user_team ok
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
          })
        })
      });

      // planning not found
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await PlanningController.getPlanningByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Planning not found' });
    });
  });

  describe('modifyTeamPlanning', () => {
    it('devrait modifier le planning par défaut d\'une équipe (création nouveau planning)', async () => {
      req.params.teamId = 't1';
      req.body = {
        schedules: [ { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' } ]
      };

      const mockTeam = { id: 't1', name: 'Team 1', default_planning_id: 'p0' };
      const mockNewPlanning = { id: 'p2', is_default: false };

      // team exists
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
          })
        })
      });

      // create planning insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockNewPlanning, error: null })
          })
        })
      });

      // schedules insert (none - optional): allow one schedule insert call
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [ { id: 's1', planning_id: 'p2', day: 'monday', time_in: '09:00:00', time_out: '17:00:00' } ], error: null })
        })
      });

      // update team default_planning_id
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      await PlanningController.modifyTeamPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Team planning modified successfully (new planning created)',
        data: expect.objectContaining({
          team: expect.objectContaining({ previous_planning_id: 'p0', new_planning_id: 'p2' }),
          newPlanning: expect.objectContaining({ id: 'p2' })
        })
      });
    });

    it('devrait retourner une erreur de validation si schedules vide', async () => {
      req.params.teamId = 't1';
      req.body = { schedules: [] };

      await PlanningController.modifyTeamPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Schedules array must not be empty' });
    });

    it('devrait retourner 404 si équipe introuvable', async () => {
      req.params.teamId = 'invalid';
      req.body = { schedules: [ { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' } ] };

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await PlanningController.modifyTeamPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Team not found' });
    });

    it('devrait retourner 500 si la mise à jour du team échoue (rollback)', async () => {
      req.params.teamId = 't1';
      req.body = { schedules: [ { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' } ] };

      const mockTeam = { id: 't1', name: 'Team 1', default_planning_id: 'p0' };
      const mockNewPlanning = { id: 'p2', is_default: false };

      // team ok
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
          })
        })
      });

      // create planning
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockNewPlanning, error: null })
          })
        })
      });

      // insert schedule
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [ { id: 's1' } ], error: null })
        })
      });

      // update team fails -> triggers rollback
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } })
        })
      });

      // rollback delete planning
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({})
        })
      });

      await PlanningController.modifyTeamPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to update team planning', error: 'Update failed' });
    });
  });

  describe('modifyUserTeamPlanning', () => {
    it('devrait modifier le planning d\'une association (création nouveau planning)', async () => {
      req.params.userTeamId = 'ut1';
      req.body = { schedules: [ { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' } ] };

      const mockUserTeam = { id: 'ut1', role: 'employee', planning_id: 'p0', user: { id: 'u1' }, team: { id: 't1' } };
      const mockNewPlanning = { id: 'p2', is_default: false };

      // user_team ok
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
          })
        })
      });

      // create planning
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockNewPlanning, error: null })
          })
        })
      });

      // schedules insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [ { id: 's1' } ], error: null })
        })
      });

      // update user_team planning_id
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      await PlanningController.modifyUserTeamPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User-team planning modified successfully (new planning created)',
        data: expect.objectContaining({
          userTeam: expect.objectContaining({ previous_planning_id: 'p0', new_planning_id: 'p2' }),
          newPlanning: expect.objectContaining({ id: 'p2' }),
          isVacationPlanning: false
        })
      });
    });

    it('devrait gérer un planning de vacances (schedules vide autorisé)', async () => {
      req.params.userTeamId = 'ut1';
      req.body = { schedules: [] };

      const mockUserTeam = { id: 'ut1', role: 'employee', planning_id: 'p0', user: { id: 'u1' }, team: { id: 't1' } };
      const mockNewPlanning = { id: 'p3', is_default: false };

      // user_team ok
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
          })
        })
      });

      // create planning
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockNewPlanning, error: null })
          })
        })
      });

      // schedules insert skipped? Controller insère seulement si length > 0, donc ne pas mocker ici.

      // update user_team planning_id
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      await PlanningController.modifyUserTeamPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User-team planning modified successfully (new planning created)',
        data: expect.objectContaining({ isVacationPlanning: true })
      });
    });

    it('devrait retourner une erreur de validation si schedules n\'est pas un tableau', async () => {
      req.params.userTeamId = 'ut1';
      req.body = { schedules: null };

      await PlanningController.modifyUserTeamPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Schedules array is required' });
    });

    it('devrait retourner 404 si association introuvable', async () => {
      req.params.userTeamId = 'invalid';
      req.body = { schedules: [] };

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await PlanningController.modifyUserTeamPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User-team association not found' });
    });

    it('devrait retourner 500 si la mise à jour de l\'association échoue (rollback)', async () => {
      req.params.userTeamId = 'ut1';
      req.body = { schedules: [ { day: 'monday', time_in: '09:00:00', time_out: '17:00:00' } ] };

      const mockUserTeam = { id: 'ut1', role: 'employee', planning_id: 'p0', user: { id: 'u1' }, team: { id: 't1' } };
      const mockNewPlanning = { id: 'p2', is_default: false };

      // user_team ok
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
          })
        })
      });

      // create planning
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockNewPlanning, error: null })
          })
        })
      });

      // insert schedule
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [ { id: 's1' } ], error: null })
        })
      });

      // update user_team fails
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } })
        })
      });

      // rollback delete planning
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({})
        })
      });

      await PlanningController.modifyUserTeamPlanning(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to update user-team planning', error: 'Update failed' });
    });
  });
});
