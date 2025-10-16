const supabase = require('../../../config/supabaseClient.js');
const PlanningController = require('../planning/PlanningController');

class ClockController {
  
  /**
   * Get all clocks
   */
  async getAllClocks(req, res) {
    try {
      const { data, error } = await supabase
        .from('clock')
        .select('*');

      if (error) {
        console.error('Error fetching clocks:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch clocks',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Clocks retrieved successfully',
        data: data,
        count: data.length
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }

  /**
   * Create a new clock entry
   */
  async createClock(req, res) {
    try {
      const { user_team_id, planning_id, arrival_time, departure_time } = req.body;

      const { data, error } = await supabase
        .from('clock')
        .insert([
          {
            user_team_id: user_team_id,
            arrival_time: arrival_time,
            departure_time: departure_time,
            planning_id: planning_id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating clock:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create clock',
          error: error.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Clock created successfully',
        data: data
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }

  /**
   * Get clock by ID
   */
  async getClockById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('clock')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Clock not found'
          });
        }

        console.error('Error fetching clock:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch clock',
          error: error.message
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Clock not found'
        });
      }


      res.status(200).json({
        success: true,
        message: 'Clock retrieved successfully',
        data: data
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }

    /**
   * Get clock by user team ID
   */
  async getClockByUserTeamId(req, res) {
    try {
      const { user_team_id } = req.params;

      const { data, error } = await supabase
        .from('clock')
        .select('*')
        .eq('user_team_id', user_team_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || data === null) {
          return res.status(404).json({
            success: false,
            message: 'Clock not found'
          });
        }

        console.error('Error fetching clock:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch clock',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Clock retrieved successfully',
        data: data
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }

  /**
   * Update clock entry
   */
  async updateClock(req, res) {
    try {
      const { id } = req.params;
      const { user_team_id, planning_id,  arrival_time, departure_time } = req.body;

      const updateData = {};
      
      if (user_team_id) updateData.user_team_id = user_team_id;
      if (arrival_time) updateData.arrival_time = arrival_time;
      if (departure_time) updateData.departure_time = departure_time;
      if (planning_id) updateData.planning_id = planning_id;

      const { data, error } = await supabase
        .from('clock')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Clock not found'
          });
        }

        console.error('Error updating clock:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update clock',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Clock updated successfully',
        data: data
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }

  /**
   * Delete clock entry
   */
  async deleteClock(req, res) {
    try {
      const { id } = req.params;

      const { data: existingClock, error: checkError } = await supabase
        .from('clock')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Clock not found'
          });
        }

        console.error('Error checking clock existence:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check clock existence',
          error: checkError.message
        });
      }

      const { error } = await supabase
        .from('clock')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting clock:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete clock',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Clock deleted successfully',
        data: {
          deletedClock: existingClock
        }
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }

  /**
   * Create clock in/out for current user (token-based)
   */
  async createClockInOut(req, res) {
    try {
      const userTeamId = req.body.userTeamId;
      if (!userTeamId) {
        return res.status(400).json({ success: false, message: 'User team ID is required' });
      }

      // Get user team info with timezone
      const { data: userTeam, error: userTeamError } = await supabase
        .from('user_team')
        .select('id, team:team_id(id, name, lateness_limit, timezone), planning_id')
        .eq('id', userTeamId)
        .single();

      if (userTeamError || !userTeam) {
        return res.status(404).json({ success: false, message: 'User team association not found' });
      }

      // Get planning ID
      let planningId = null;
      await PlanningController.getPlanningByUserTeam(
        { body: { userTeamId }, params: {} },
        { status: (code) => ({ json: (data) => { 
          if (code === 200 && data.success && data.data.planning) planningId = data.data.planning.id; 
        }})}
      );

      if (!planningId) {
        return res.status(404).json({ success: false, message: 'No planning found for user team' });
      }

      // Get current day and schedule
      const timeZone = userTeam.team.timezone || 'UTC';
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long', timeZone }).toLowerCase();

      const { data: schedule, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('planning_id', planningId)
        .eq('day', currentDay)
        .single();

      if (scheduleError || !schedule) {
        return res.status(400).json({
          success: false,
          message: `No schedule found for ${currentDay}. Cannot clock in/out on days without scheduled work.`
        });
      }

      // Check for active clock and anomalies
      const { data: activeClock } = await supabase
        .from('clock')
        .select('*')
        .eq('user_team_id', userTeamId)
        .is('departure_time', null)
        .order('arrival_time', { ascending: false })
        .limit(1)
        .single();

      const { data: lastClocks } = await supabase
        .from('clock')
        .select('*')
        .eq('user_team_id', userTeamId)
        .order('arrival_time', { ascending: false })
        .limit(5);

      // Check for anomalies (unclosed clocks from previous days)
      let anomalies = [];
      if (lastClocks?.length > 0) {
        const todayStart = new Date(now.toDateString()).toISOString();
        lastClocks
          .filter(clock => !clock.departure_time && new Date(clock.arrival_time) < new Date(todayStart))
          .forEach(clock => {
            const clockDate = new Date(clock.arrival_time).toLocaleDateString('en-US', {
              timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
            });
            anomalies.push(`Anomaly detected: You have an unclosed clock from ${clockDate}. Please contact your manager.`);
          });
      }

      // Get current time and timestamp
      const currentTime = now.toLocaleTimeString('en-GB', {
        timeZone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      const nowInTeamZone = new Date(now.toLocaleString('en-US', { timeZone }));
      const nowISO = nowInTeamZone.toISOString();

      if (activeClock) {
        // Clock out
        const scheduledEnd = schedule.time_out;
        const [schedHours, schedMinutes] = scheduledEnd.split(':').map(Number);
        const [currHours, currMinutes] = currentTime.split(':').map(Number);
        const scheduledEndMinutes = schedHours * 60 + schedMinutes;
        const currentMinutes = currHours * 60 + currMinutes;

        let warnings = [...anomalies];
        if (currentMinutes < scheduledEndMinutes) {
          warnings.push(`Leaving ${scheduledEndMinutes - currentMinutes} minutes early (scheduled until ${scheduledEnd})`);
        } else if (currentMinutes > scheduledEndMinutes) {
          warnings.push(`Working ${currentMinutes - scheduledEndMinutes} minutes overtime (scheduled until ${scheduledEnd})`);
        }

        const { data, error } = await supabase
          .from('clock')
          .update({ departure_time: nowISO })
          .eq('id', activeClock.id)
          .select()
          .single();

        if (error) {
          return res.status(500).json({ success: false, message: 'Failed to clock out', error: error.message });
        }

        return res.status(201).json({
          success: true,
          message: 'Clock out successful',
          data,
          warnings: warnings.length > 0 ? warnings : undefined
        });

      } else {
        // Clock in - Check for duplicates and validate time
        const [schedHours] = schedule.time_in.split(':').map(Number);
        const [schedEndHours] = schedule.time_out.split(':').map(Number);
        const isNightShift = schedEndHours < schedHours;

        // Calculate work day start
        let workDayStart = new Date(nowInTeamZone);
        if (isNightShift && currentTime.split(':')[0] < 12) {
          workDayStart.setDate(workDayStart.getDate() - 1);
        }

        const workDayStartISO = new Date(workDayStart.toDateString()).toISOString();
        const workDayEndISO = new Date(workDayStart.getTime() + 24 * 60 * 60 * 1000).toISOString();

        // Check for existing clocks in work day
        const { data: existingClocks, error: existingError } = await supabase
          .from('clock')
          .select('*')
          .eq('user_team_id', userTeamId)
          .eq('planning_id', planningId)
          .gte('arrival_time', workDayStartISO)
          .lt('arrival_time', workDayEndISO);

        if (existingError) {
          return res.status(500).json({ success: false, message: 'Failed to check existing clocks', error: existingError.message });
        }

        // Prevent duplicate clocks
        if (existingClocks?.length > 0) {
          const workDayFormatted = workDayStart.toLocaleDateString('en-US', {
            timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
          });
          return res.status(400).json({
            success: false,
            message: `You have already clocked in for the work day starting ${workDayFormatted}. Multiple clock-ins per work day are not allowed.`,
            existingClocks: existingClocks.map(clock => ({
              id: clock.id, arrival_time: clock.arrival_time, departure_time: clock.departure_time
            }))
          });
        }

        // Validate arrival time
        const scheduledStart = schedule.time_in;
        const latenessLimit = userTeam.team.lateness_limit || 0;
        const [schedHours2, schedMinutes] = scheduledStart.split(':').map(Number);
        const [currHours2, currMinutes2] = currentTime.split(':').map(Number);
        const scheduledStartMinutes = schedHours2 * 60 + schedMinutes;
        const currentMinutes = currHours2 * 60 + currMinutes2;

        let warnings = [...anomalies];
        let isLate = false;

        if (currentMinutes > scheduledStartMinutes) {
          const lateMinutes = currentMinutes - scheduledStartMinutes;
          if (lateMinutes > latenessLimit) {
            warnings.push(`Warning: You are ${lateMinutes} minutes late (limit: ${latenessLimit} minutes). Scheduled start: ${scheduledStart}`);
          } else {
            warnings.push(`Late by ${lateMinutes} minutes (scheduled start: ${scheduledStart})`);
          }
          isLate = true;
        } else if (currentMinutes < scheduledStartMinutes) {
          warnings.push(`Early by ${scheduledStartMinutes - currentMinutes} minutes (scheduled start: ${scheduledStart})`);
        }

        const { data, error } = await supabase
          .from('clock')
          .insert([{ user_team_id: userTeamId, planning_id: planningId, arrival_time: nowISO, departure_time: null }])
          .select()
          .single();

        if (error) {
          return res.status(500).json({ success: false, message: 'Failed to clock in', error: error.message });
        }

        return res.status(201).json({
          success: true,
          message: 'Clock in successful',
          data,
          warnings: warnings.length > 0 ? warnings : undefined,
          isLate
        });
      }

    } catch (err) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
  }

  /**
   * Get all clocks for current user across all teams
   */
  async getClocksByCurrentUser(req, res) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Get all user_team associations for current user
      const { data: userTeams, error: userTeamsError } = await supabase
        .from('user_team')
        .select('id, team:team_id(id, name)')
        .eq('user_id', userId);

      if (userTeamsError) {
        console.error('Error fetching user teams:', userTeamsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user teams',
          error: userTeamsError.message
        });
      }

      if (!userTeams || userTeams.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No clocks found for user',
          data: [],
          count: 0
        });
      }

      // Get all clocks for all user_team associations
      const userTeamIds = userTeams.map(ut => ut.id);
      const { data: clocks, error: clocksError } = await supabase
        .from('clock')
        .select(`
          *,
          user_team:user_team_id (
            id,
            team:team_id (id, name)
          ),
          planning:planning_id (id, is_default)
        `)
        .in('user_team_id', userTeamIds)
        .order('arrival_time', { ascending: false });

      if (clocksError) {
        console.error('Error fetching clocks:', clocksError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch clocks',
          error: clocksError.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'User clocks retrieved successfully',
        data: clocks || [],
        count: clocks ? clocks.length : 0
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }

  /**
   * Get clocks for current user by specific date
   */
  async getClocksByDate(req, res) {
    try {
      const userTeamId = req.body.userTeamId;
      const { date } = req.params;
      
      if (!userTeamId) {
        return res.status(400).json({
          success: false,
          message: 'User team ID is required'
        });
      }

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Valid date is required (YYYY-MM-DD format)'
        });
      }

      const startDate = `${date}T00:00:00.000Z`;
      const endDate = `${date}T23:59:59.999Z`;

      const { data: clocks, error } = await supabase
        .from('clock')
        .select(`
          *,
          user_team:user_team_id (
            id,
            team:team_id (id, name)
          ),
          planning:planning_id (id, is_default)
        `)
        .eq('user_team_id', userTeamId)
        .gte('arrival_time', startDate)
        .lte('arrival_time', endDate)
        .order('arrival_time', { ascending: false });

      if (error) {
        console.error('Error fetching clocks by date:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch clocks',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: `Clocks for ${date} retrieved successfully`,
        data: clocks || [],
        count: clocks ? clocks.length : 0
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }

  /**
   * Get clocks for current user by date range
   */
  async getClocksByDateRange(req, res) {
    try {
      const userTeamId = req.body.userTeamId;
      const { startDate, endDate } = req.params;
      
      if (!userTeamId) {
        return res.status(400).json({
          success: false,
          message: 'User team ID is required'
        });
      }

      if (!startDate || !endDate || 
          !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || 
          !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Valid start and end dates are required (YYYY-MM-DD format)'
        });
      }

      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before or equal to end date'
        });
      }

      const start = `${startDate}T00:00:00.000Z`;
      const end = `${endDate}T23:59:59.999Z`;

      const { data: clocks, error } = await supabase
        .from('clock')
        .select(`
          *,
          user_team:user_team_id (
            id,
            team:team_id (id, name)
          ),
          planning:planning_id (id, is_default)
        `)
        .eq('user_team_id', userTeamId)
        .gte('arrival_time', start)
        .lte('arrival_time', end)
        .order('arrival_time', { ascending: false });

      if (error) {
        console.error('Error fetching clocks by date range:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch clocks',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: `Clocks from ${startDate} to ${endDate} retrieved successfully`,
        data: clocks || [],
        count: clocks ? clocks.length : 0
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }
  
}

module.exports = new ClockController();