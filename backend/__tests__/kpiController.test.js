const KpiController = require('../src/controllers/kpi/KpiController.js');
const supabase = require('../config/supabaseClient.js');

// Mock Supabase
jest.mock('../config/supabaseClient');

describe('KpiController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getLatenessRateByEmployee', () => {
    const mockUserTeam = { id: 1 };
    const mockTeam = {
      id: 1,
      lateness_limit: 15,
      timezone: 'UTC'
    };
    const mockClocks = [
      {
        id: 1,
        arrival_time: '2024-01-15T09:10:00Z',
        planning: {
          schedule: [
            { day: 'monday', time_in: '09:00' }
          ]
        }
      },
      {
        id: 2,
        arrival_time: '2024-01-16T08:55:00Z',
        planning: {
          schedule: [
            { day: 'tuesday', time_in: '09:00' }
          ]
        }
      }
    ];

    it('should return 400 if teamId or userId is missing', async () => {
      req.params = { teamId: null, userId: null };

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team ID and User ID are required'
      });
    });

    it('should return 400 if days is invalid', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = { days: '-5' };

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Days must be greater than 0 or omitted for all-time data'
      });
    });

    it('should return 404 if user is not a member of the team', async () => {
      req.params = { teamId: '1', userId: '999' };

      supabase.from = jest.fn().mockReturnValue({
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

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User is not a member of this team'
      });
    });

    it('should successfully calculate lateness rate for an employee', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = {};

      // Mock user-team association
      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        // Mock team data
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTeam,
                error: null
              })
            })
          })
        })
        // Mock clocks data
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockClocks,
                  error: null
                })
              })
            })
          })
        });

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            userId: 1,
            teamId: 1,
            totalClocks: expect.any(Number)
          })
        })
      );
    });

    it('should handle errors gracefully', async () => {
      req.params = { teamId: '1', userId: '1' };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        })
      });

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Database error'
      });
    });
  });

  describe('getDepartureRateByEmployee', () => {
    const mockUserTeam = { id: 1 };
    const mockTeam = {
      id: 1,
      timezone: 'UTC'
    };
    const mockClocks = [
      {
        id: 1,
        departure_time: '2024-01-15T17:05:00Z',
        planning: {
          schedule: [
            { day: 'monday', time_out: '17:00' }
          ]
        }
      }
    ];

    it('should return 400 if teamId or userId is missing', async () => {
      req.params = {};

      await KpiController.getDepartureRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team ID and User ID are required'
      });
    });

    it('should successfully calculate departure rate for an employee', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = {};

      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTeam,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockClocks,
                  error: null
                })
              })
            })
          })
        });

      await KpiController.getDepartureRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            userId: 1,
            teamId: 1,
            totalClocks: expect.any(Number)
          })
        })
      );
    });

    it('should handle date range filtering', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTeam,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    lte: jest.fn().mockResolvedValue({
                      data: mockClocks,
                      error: null
                    })
                  })
                })
              })
            })
          })
        });

      await KpiController.getDepartureRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle startDate and endDate parameters', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTeam,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    lte: jest.fn().mockResolvedValue({
                      data: mockClocks,
                      error: null
                    })
                  })
                })
              })
            })
          })
        });

      await KpiController.getDepartureRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle days parameter for date range calculation', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = { days: '7' };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTeam,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    lte: jest.fn().mockResolvedValue({
                      data: mockClocks,
                      error: null
                    })
                  })
                })
              })
            })
          })
        });

      await KpiController.getDepartureRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid days parameter', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = { days: '-10' };

      await KpiController.getDepartureRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Days must be greater than 0 or omitted for all-time data'
      });
    });

    it('should handle database errors in departure rate calculation', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = {};

      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Team not found' }
              })
            })
          })
        });

      await KpiController.getDepartureRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Team not found'
        })
      );
    });
  });

  describe('Additional getLatenessRateByEmployee scenarios', () => {
    const mockUserTeam = { id: 1 };
    const mockTeam = {
      id: 1,
      lateness_limit: 15,
      timezone: 'UTC'
    };
    const mockClocks = [
      {
        id: 1,
        arrival_time: '2024-01-15T09:10:00Z',
        planning: {
          schedule: [
            { day: 'monday', time_in: '09:00' }
          ]
        }
      }
    ];

    it('should handle startDate and endDate parameters for lateness', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTeam,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    lte: jest.fn().mockResolvedValue({
                      data: mockClocks,
                      error: null
                    })
                  })
                })
              })
            })
          })
        });

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle days parameter for lateness calculation', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = { days: '30' };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTeam,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    lte: jest.fn().mockResolvedValue({
                      data: mockClocks,
                      error: null
                    })
                  })
                })
              })
            })
          })
        });

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle zero days parameter', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = { days: '0' };

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Days must be greater than 0 or omitted for all-time data'
      });
    });

    it('should handle team not found error', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = {};

      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Team not found' }
              })
            })
          })
        });

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Team not found'
        })
      );
    });

    it('should handle clocks fetch error', async () => {
      req.params = { teamId: '1', userId: '1' };
      req.query = {};

      supabase.from = jest.fn()
        .mockReturnValueOnce({
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
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTeam,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Clocks fetch error' }
                })
              })
            })
          })
        });

      await KpiController.getLatenessRateByEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch clocks',
        error: 'Clocks fetch error'
      });
    });
  });
});
