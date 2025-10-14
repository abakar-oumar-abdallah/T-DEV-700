const supabase = require('../../../config/supabaseClient.js');

class ScheduleController {

  // Consolidated helpers
  validateScheduleFields(day, time_in, time_out) {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;

    if (day && !validDays.includes(day.toLowerCase())) return `Invalid day: ${day}. Must be one of: ${validDays.join(', ')}`;
    if (time_in && !timeRegex.test(time_in)) return 'time_in format must be HH:MM:SS';
    if (time_out && !timeRegex.test(time_out)) return 'time_out format must be HH:MM:SS';
    return null;
  }

  handleError(res, error, defaultMessage, defaultStatus = 500) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: defaultMessage.includes('not found') ? defaultMessage : defaultMessage.replace('Failed to', 'Not found -')
      });
    }
    console.error(`${defaultMessage}:`, error);
    return res.status(defaultStatus).json({ success: false, message: defaultMessage, error: error.message });
  }

  async safeQuery(query) {
    try {
      const result = await query;
      return { data: result.data, error: result.error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  getCurrentDay() {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[today.getDay()];
  }

  // Main CRUD operations - using arrow functions to preserve 'this' context
  getAllSchedules = async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('*, planning:planning_id (id, is_default, created_at)')
        .order('created_at', { ascending: false });

      if (error) return this.handleError(res, error, 'Failed to fetch schedules');

      return res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: data,
        count: data.length
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
  }

  getScheduleById = async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await this.safeQuery(
        supabase.from('schedule').select('*, planning:planning_id (id, is_default, created_at)').eq('id', id).single()
      );
      
      if (result.error) return this.handleError(res, result.error, 'Schedule not found', 404);

      return res.status(200).json({
        success: true,
        message: 'Schedule retrieved successfully',
        data: result.data
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
  }

  getSchedulesByPlanningId = async (req, res) => {
    try {
      const { planningId } = req.params;

      // Check if planning exists
      const { data: planning, error: planningError } = await supabase
        .from('planning').select('id').eq('id', planningId).single();

      if (planningError) return this.handleError(res, planningError, 'Planning not found', 404);

      const { data, error } = await supabase
        .from('schedule').select('*').eq('planning_id', planningId).order('day');

      if (error) return this.handleError(res, error, 'Failed to fetch schedules');

      return res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: data,
        count: data.length
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
  }

  updateSchedule = async (req, res) => {
    try {
      const { id } = req.params;
      const { day, time_in, time_out } = req.body;

      if (!day && !time_in && !time_out) {
        return res.status(400).json({ success: false, message: 'At least one field must be provided to update' });
      }

      const validationError = this.validateScheduleFields(day, time_in, time_out);
      if (validationError) return res.status(400).json({ success: false, message: validationError });

      const updateData = {};
      if (day) updateData.day = day.toLowerCase();
      if (time_in) updateData.time_in = time_in;
      if (time_out) updateData.time_out = time_out;

      // Check for duplicate day if day is being updated
      if (day) {
        const { data: currentSchedule, error: currentError } = await supabase
          .from('schedule').select('planning_id').eq('id', id).single();

        if (currentError) return this.handleError(res, currentError, 'Schedule not found', 404);

        const { data: existingSchedule, error: duplicateError } = await supabase
          .from('schedule').select('id').eq('planning_id', currentSchedule.planning_id)
          .eq('day', day.toLowerCase()).neq('id', id).single();

        if (duplicateError && duplicateError.code !== 'PGRST116') {
          return this.handleError(res, duplicateError, 'Failed to check duplicate day');
        }

        if (existingSchedule) {
          return res.status(409).json({ success: false, message: 'A schedule for this day already exists in the planning' });
        }
      }

      const { data, error } = await supabase
        .from('schedule').update(updateData).eq('id', id)
        .select('*, planning:planning_id (id, is_default, created_at)').single();

      if (error) return this.handleError(res, error, 'Schedule not found', 404);

      return res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: data
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
  }

  deleteSchedule = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if schedule exists
      const scheduleResult = await this.safeQuery(
        supabase.from('schedule').select('*, planning:planning_id (*)').eq('id', id).single()
      );
      if (scheduleResult.error) return this.handleError(res, scheduleResult.error, 'Schedule not found', 404);

      const { error } = await supabase.from('schedule').delete().eq('id', id);
      if (error) return this.handleError(res, error, 'Failed to delete schedule');

      return res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully',
        data: { deletedSchedule: scheduleResult.data }
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
  }

  // Resource-specific operations
  getCurrentScheduleByUserTeam = async (req, res) => {
    try {
      const { userTeamId } = req.params;
      const currentDay = this.getCurrentDay();

      // Get user team info
      const userTeamResult = await this.safeQuery(
        supabase.from('user_team').select('id, role, planning_id, user:user_id (id, email, first_name, last_name), team:team_id (id, name, default_planning_id)')
          .eq('id', userTeamId).single()
      );
      if (userTeamResult.error) return this.handleError(res, userTeamResult.error, 'User-team association not found', 404);

      const userTeam = userTeamResult.data;
      const planningId = userTeam.planning_id || userTeam.team.default_planning_id;
      
      if (!planningId) {
        return res.status(404).json({ success: false, message: 'No planning assigned to this user or team' });
      }

      // Get today's schedule
      const scheduleResult = await this.safeQuery(
        supabase.from('schedule').select('*, planning:planning_id (*)').eq('planning_id', planningId).eq('day', currentDay).single()
      );
      
      if (scheduleResult.error) {
        if (scheduleResult.error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: `No schedule found for ${currentDay}`,
            data: {
              currentDay: currentDay,
              userTeam: { id: userTeam.id, role: userTeam.role, user: userTeam.user, team: userTeam.team },
              isTeamDefault: !userTeam.planning_id
            }
          });
        }
        return this.handleError(res, scheduleResult.error, 'Failed to fetch schedule');
      }

      return res.status(200).json({
        success: true,
        message: `Current schedule for ${currentDay} retrieved successfully`,
        data: {
          currentDay: currentDay,
          userTeam: { id: userTeam.id, role: userTeam.role, user: userTeam.user, team: userTeam.team },
          schedule: scheduleResult.data,
          isTeamDefault: !userTeam.planning_id
        }
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
  }

  getCurrentDefaultScheduleByTeam = async (req, res) => {
    try {
      const { teamId } = req.params;
      const currentDay = this.getCurrentDay();

      // Get team info
      const teamResult = await this.safeQuery(
        supabase.from('team').select('id, name, default_planning_id').eq('id', teamId).single()
      );
      if (teamResult.error) return this.handleError(res, teamResult.error, 'Team not found', 404);

      const team = teamResult.data;
      if (!team.default_planning_id) {
        return res.status(404).json({ success: false, message: 'No default planning assigned to this team' });
      }

      // Get today's schedule from default planning
      const scheduleResult = await this.safeQuery(
        supabase.from('schedule').select('*, planning:planning_id (*)').eq('planning_id', team.default_planning_id).eq('day', currentDay).single()
      );

      if (scheduleResult.error) {
        if (scheduleResult.error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: `No default schedule found for ${currentDay}`,
            data: { currentDay: currentDay, team: { id: team.id, name: team.name, default_planning_id: team.default_planning_id } }
          });
        }
        return this.handleError(res, scheduleResult.error, 'Failed to fetch schedule');
      }

      return res.status(200).json({
        success: true,
        message: `Current default schedule for ${currentDay} retrieved successfully`,
        data: {
          currentDay: currentDay,
          team: { id: team.id, name: team.name, default_planning_id: team.default_planning_id },
          schedule: scheduleResult.data
        }
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
  }
}

module.exports = new ScheduleController();