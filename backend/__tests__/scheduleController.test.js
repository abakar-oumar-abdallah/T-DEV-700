const ScheduleController = require('../src/controllers/schedule/ScheduleController.js');
const supabase = require('../config/supabaseClient.js');

jest.mock('../config/supabaseClient.js');

describe('ScheduleController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('validateScheduleFields', () => {
    it('should return error for invalid day', () => {
      const error = ScheduleController.validateScheduleFields('invalidday', '09:00:00', '17:00:00');
      expect(error).toContain('Invalid day');
    });

    it('should return error for invalid time_in format', () => {
      const error = ScheduleController.validateScheduleFields('monday', '25:00:00', '17:00:00');
      expect(error).toBe('time_in format must be HH:MM:SS');
    });

    it('should return error for invalid time_out format', () => {
      const error = ScheduleController.validateScheduleFields('monday', '09:00:00', '25:00:00');
      expect(error).toBe('time_out format must be HH:MM:SS');
    });

    it('should return null for valid fields', () => {
      const error = ScheduleController.validateScheduleFields('monday', '09:00:00', '17:00:00');
      expect(error).toBeNull();
    });
  });
  
  describe('helper methods', () => {
  it('safeQuery should return data on success', async () => {
  const result = await ScheduleController.safeQuery(Promise.resolve({ data: [1], error: null }));
  expect(result).toEqual({ data: [1], error: null });
  });
  
  it('safeQuery should catch and return error on rejection', async () => {
  const testError = new Error('Reject');
  const result = await ScheduleController.safeQuery(Promise.reject(testError));
  expect(result).toEqual({ data: null, error: testError });
  });
  
  it('handleError should map PGRST116 to 404 and transform message if needed', () => {
  ScheduleController.handleError(res, { code: 'PGRST116' }, 'Failed to create schedule');
  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not found - create schedule' });
  });
  
  it('handleError should return provided status and include error message for non-PGRST116', () => {
  ScheduleController.handleError(res, { message: 'Boom' }, 'Custom error', 418);
  expect(res.status).toHaveBeenCalledWith(418);
  expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Custom error', error: 'Boom' });
  });
  
  it('getCurrentDay should return a valid weekday', () => {
  const day = ScheduleController.getCurrentDay();
  expect(['sunday','monday','tuesday','wednesday','thursday','friday','saturday']).toContain(day);
  });
  });
  
  describe('getAllSchedules', () => {
    it('should retrieve all schedules successfully', async () => {
      const mockSchedules = [
        { id: 's1', day: 'monday', time_in: '09:00:00', time_out: '17:00:00', planning: { id: 'p1' } },
        { id: 's2', day: 'tuesday', time_in: '09:00:00', time_out: '17:00:00', planning: { id: 'p1' } }
      ];

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockSchedules, error: null })
        })
      });

      await ScheduleController.getAllSchedules(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Schedules retrieved successfully',
        data: mockSchedules,
        count: 2
      });
    });

    it('should handle database errors', async () => {
      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          })
        })
      });

      await ScheduleController.getAllSchedules(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch schedules',
        error: 'Database error'
      });
    });

    it('should handle unexpected errors', async () => {
      supabase.from = jest.fn().mockImplementation(() => { throw new Error('Unexpected error'); });

      await ScheduleController.getAllSchedules(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error', error: 'Unexpected error' });
    });
  });

  describe('getScheduleById', () => {
    it('should retrieve schedule by id successfully', async () => {
      req.params.id = 's1';
      const mockSchedule = { 
        id: 's1', 
        day: 'monday', 
        time_in: '09:00:00', 
        time_out: '17:00:00',
        planning: { id: 'p1', is_default: false }
      };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSchedule, error: null })
          })
        })
      });

      await ScheduleController.getScheduleById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Schedule retrieved successfully',
        data: mockSchedule
      });
    });

    it('should return 404 if schedule not found', async () => {
      req.params.id = 'invalid-id';

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

      await ScheduleController.getScheduleById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Schedule not found'
      });
    });
  it('should return 404 with error details when DB error occurs', async () => {
      req.params.id = 's1';

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'XYZ', message: 'DB broken' } })
          })
        })
      });

      await ScheduleController.getScheduleById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Schedule not found', error: 'DB broken' });
    });
  });
  
  describe('getSchedulesByPlanningId', () => {
    it('should retrieve schedules for a planning', async () => {
      req.params.planningId = 'p1';
      const mockSchedules = [
        { id: 's1', day: 'monday', time_in: '09:00:00', time_out: '17:00:00', planning_id: 'p1' },
        { id: 's2', day: 'tuesday', time_in: '09:00:00', time_out: '17:00:00', planning_id: 'p1' }
      ];

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'p1' }, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockSchedules, error: null })
            })
          })
        });

      await ScheduleController.getSchedulesByPlanningId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Schedules retrieved successfully',
        data: mockSchedules,
        count: 2
      });
    });

    it('should return 404 if planning not found', async () => {
      req.params.planningId = 'invalid-id';

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

      await ScheduleController.getSchedulesByPlanningId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Planning not found'
      });
    });

    it('should handle database errors while fetching schedules', async () => {
      req.params.planningId = 'p1';

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'p1' }, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
            })
          })
        });

      await ScheduleController.getSchedulesByPlanningId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to fetch schedules', error: 'Database error' });
    });

    it('should handle unexpected errors', async () => {
      req.params.planningId = 'p1';
      supabase.from = jest.fn().mockImplementation(() => { throw new Error('Unexpected error'); });

      await ScheduleController.getSchedulesByPlanningId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error', error: 'Unexpected error' });
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule successfully', async () => {
      req.params.id = 's1';
      req.body = { day: 'tuesday', time_in: '10:00:00' };

      const mockCurrentSchedule = { planning_id: 'p1' };
      const mockUpdated = { 
        id: 's1', 
        day: 'tuesday', 
        time_in: '10:00:00', 
        time_out: '17:00:00',
        planning: { id: 'p1' }
      };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockCurrentSchedule, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                neq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'PGRST116' } 
                  })
                })
              })
            })
          })
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null })
              })
            })
          })
        });

      await ScheduleController.updateSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Schedule updated successfully',
        data: mockUpdated
      });
    });

    it('should fail if no fields provided', async () => {
      req.params.id = 's1';
      req.body = {};

      await ScheduleController.updateSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'At least one field must be provided to update'
      });
    });

    it('should fail with invalid day', async () => {
      req.params.id = 's1';
      req.body = { day: 'invalidday' };

      await ScheduleController.updateSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('Invalid day')
      });
    });

    it('should fail with invalid time_in', async () => {
      req.params.id = 's1';
      req.body = { time_in: '25:00:00' };

      await ScheduleController.updateSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'time_in format must be HH:MM:SS' });
    });

    it('should return 404 when current schedule not found before duplicate check', async () => {
      req.params.id = 's1';
      req.body = { day: 'tuesday' };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await ScheduleController.updateSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Schedule not found' });
    });

    it('should return 500 when duplicate check fails with DB error', async () => {
      req.params.id = 's1';
      req.body = { day: 'tuesday' };

      const mockCurrentSchedule = { planning_id: 'p1' };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockCurrentSchedule, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                neq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB failure' } })
                })
              })
            })
          })
        });

      await ScheduleController.updateSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to check duplicate day', error: 'DB failure' });
    });

    it('should return 404 when update returns not found', async () => {
      req.params.id = 's1';
      req.body = { time_out: '18:00:00' };

      supabase.from = jest.fn()
        // No day: skip duplicate logic, go straight to update
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
              })
            })
          })
        });

      await ScheduleController.updateSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Schedule not found' });
    });

    it('should handle unexpected errors', async () => {
    req.params.id = 's1';
    req.body = { time_out: '18:00:00' };
    
    supabase.from = jest.fn().mockImplementation(() => { throw new Error('Unexpected error'); });
    
    await ScheduleController.updateSchedule(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error', error: 'Unexpected error' });
    });
    
    it('should fail with invalid time_out', async () => {
    req.params.id = 's1';
    req.body = { time_out: '28:00:00' };
    
    await ScheduleController.updateSchedule(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'time_out format must be HH:MM:SS' });
    });
    
    it('should return 409 when a schedule for the same day already exists', async () => {
    req.params.id = 's1';
    req.body = { day: 'monday' };
    
    const mockCurrentSchedule = { planning_id: 'p1' };
    
    supabase.from = jest.fn()
    .mockReturnValueOnce({
    select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({ data: mockCurrentSchedule, error: null })
    })
    })
    })
    .mockReturnValueOnce({
    select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
    neq: jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({ data: { id: 's2' }, error: null })
    })
    })
    })
    })
    });
    
    await ScheduleController.updateSchedule(req, res);
    
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'A schedule for this day already exists in the planning' });
    });
    });
    
    describe('deleteSchedule', () => {
    it('should delete schedule successfully', async () => {
      req.params.id = 's1';
      const mockSchedule = { 
        id: 's1', 
        day: 'monday', 
        time_in: '09:00:00', 
        time_out: '17:00:00',
        planning: { id: 'p1' }
      };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSchedule, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        });

      await ScheduleController.deleteSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Schedule deleted successfully',
        data: { deletedSchedule: mockSchedule }
      });
    });

    it('should return 404 if schedule not found', async () => {
      req.params.id = 'invalid-id';

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

      await ScheduleController.deleteSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Schedule not found'
      });
    });

    it('should handle deletion errors', async () => {
      req.params.id = 's1';
      const mockSchedule = { id: 's1' };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSchedule, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: { message: 'Deletion failed' } })
          })
        });

      await ScheduleController.deleteSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to delete schedule', error: 'Deletion failed' });
    });

    it('should handle unexpected errors', async () => {
      req.params.id = 's1';
      supabase.from = jest.fn().mockImplementation(() => { throw new Error('Unexpected error'); });

      await ScheduleController.deleteSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error', error: 'Unexpected error' });
    });
  });

  describe('getCurrentScheduleByUserTeam', () => {
    beforeEach(() => {
      jest.spyOn(ScheduleController, 'getCurrentDay').mockReturnValue('monday');
    });

    it('should retrieve current schedule for user team', async () => {
      req.params.userTeamId = 'ut1';
      
      const mockUserTeam = {
        id: 'ut1',
        role: 'employee',
        planning_id: 'p1',
        user: { id: 'u1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' },
        team: { id: 't1', name: 'Team 1', default_planning_id: 'p2' }
      };

      const mockSchedule = {
        id: 's1',
        day: 'monday',
        time_in: '09:00:00',
        time_out: '17:00:00',
        planning: { id: 'p1' }
      };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockSchedule, error: null })
              })
            })
          })
        });

      await ScheduleController.getCurrentScheduleByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Current schedule for monday retrieved successfully',
        data: {
          currentDay: 'monday',
          userTeam: {
            id: mockUserTeam.id,
            role: mockUserTeam.role,
            user: mockUserTeam.user,
            team: mockUserTeam.team
          },
          schedule: mockSchedule,
          isTeamDefault: false
        }
      });
    });

    it('should use team default planning if user has no specific planning', async () => {
      req.params.userTeamId = 'ut1';
      
      const mockUserTeam = {
        id: 'ut1',
        role: 'employee',
        planning_id: null,
        user: { id: 'u1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' },
        team: { id: 't1', name: 'Team 1', default_planning_id: 'p2' }
      };

      const mockSchedule = {
        id: 's1',
        day: 'monday',
        time_in: '09:00:00',
        time_out: '17:00:00',
        planning: { id: 'p2' }
      };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockSchedule, error: null })
              })
            })
          })
        });

      await ScheduleController.getCurrentScheduleByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Current schedule for monday retrieved successfully',
        data: expect.objectContaining({
          isTeamDefault: true
        })
      });
    });

    it('should return 404 if no schedule found for current day', async () => {
      req.params.userTeamId = 'ut1';
      
      const mockUserTeam = {
        id: 'ut1',
        role: 'employee',
        planning_id: 'p1',
        user: { id: 'u1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' },
        team: { id: 't1', name: 'Team 1', default_planning_id: 'p2' }
      };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: null, 
                  error: { code: 'PGRST116' } 
                })
              })
            })
          })
        });

      await ScheduleController.getCurrentScheduleByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No schedule found for monday',
        data: expect.objectContaining({
          currentDay: 'monday'
        })
      });
    });

    it('should return 404 if no planning assigned', async () => {
      req.params.userTeamId = 'ut1';
      
      const mockUserTeam = {
        id: 'ut1',
        role: 'employee',
        planning_id: null,
        user: { id: 'u1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' },
        team: { id: 't1', name: 'Team 1', default_planning_id: null }
      };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
          })
        })
      });

      await ScheduleController.getCurrentScheduleByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No planning assigned to this user or team'
      });
    });

    it('should return 404 if user-team association not found', async () => {
      req.params.userTeamId = 'invalid';

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await ScheduleController.getCurrentScheduleByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User-team association not found' });
    });

    it('should handle database errors while fetching schedule', async () => {
      req.params.userTeamId = 'ut1';
      const mockUserTeam = { id: 'ut1', role: 'employee', planning_id: 'p1', user: { id: 'u1' }, team: { id: 't1', default_planning_id: 'p2' } };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUserTeam, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
              })
            })
          })
        });

      await ScheduleController.getCurrentScheduleByUserTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to fetch schedule', error: 'Database error' });
    });
  });

  describe('getCurrentDefaultScheduleByTeam', () => {
    beforeEach(() => {
      jest.spyOn(ScheduleController, 'getCurrentDay').mockReturnValue('monday');
    });

    it('should retrieve current default schedule for team', async () => {
      req.params.teamId = 't1';
      
      const mockTeam = {
        id: 't1',
        name: 'Team 1',
        default_planning_id: 'p1'
      };

      const mockSchedule = {
        id: 's1',
        day: 'monday',
        time_in: '09:00:00',
        time_out: '17:00:00',
        planning: { id: 'p1' }
      };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockSchedule, error: null })
              })
            })
          })
        });

      await ScheduleController.getCurrentDefaultScheduleByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Current default schedule for monday retrieved successfully',
        data: {
          currentDay: 'monday',
          team: mockTeam,
          schedule: mockSchedule
        }
      });
    });

    it('should return 404 if team not found', async () => {
      req.params.teamId = 'invalid-id';

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

      await ScheduleController.getCurrentDefaultScheduleByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team not found'
      });
    });

    it('should return 404 if team has no default planning', async () => {
      req.params.teamId = 't1';
      
      const mockTeam = {
        id: 't1',
        name: 'Team 1',
        default_planning_id: null
      };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
          })
        })
      });

      await ScheduleController.getCurrentDefaultScheduleByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No default planning assigned to this team'
      });
    });

    it('should return 404 if no default schedule found for current day', async () => {
      req.params.teamId = 't1';
      const mockTeam = { id: 't1', name: 'Team 1', default_planning_id: 'p1' };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
              })
            })
          })
        });

      await ScheduleController.getCurrentDefaultScheduleByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No default schedule found for monday', data: expect.objectContaining({ currentDay: 'monday' }) });
    });

    it('should handle database errors while fetching schedule', async () => {
      req.params.teamId = 't1';
      const mockTeam = { id: 't1', name: 'Team 1', default_planning_id: 'p1' };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
              })
            })
          })
        });

      await ScheduleController.getCurrentDefaultScheduleByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to fetch schedule', error: 'Database error' });
    });
  });
});
