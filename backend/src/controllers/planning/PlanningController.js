const supabase = require('../../../config/supabaseClient.js');

class PlanningController {

  // Consolidated validation and error handling
  validateSchedules(schedules, allowEmpty = false) {
    if (!schedules || !Array.isArray(schedules)) return 'Schedules array is required';
    if (!allowEmpty && schedules.length === 0) return 'Schedules array must not be empty';
    if (schedules.length === 0) return null;

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;

    for (let schedule of schedules) {
      if (!schedule.day || !validDays.includes(schedule.day.toLowerCase())) {
        return `Invalid day: ${schedule.day}. Must be one of: ${validDays.join(', ')}`;
      }
      if (!schedule.time_in || !schedule.time_out) return 'Each schedule must have time_in and time_out';
      if (!timeRegex.test(schedule.time_in) || !timeRegex.test(schedule.time_out)) return 'Time format must be HH:MM:SS';
    }

    const days = schedules.map(s => s.day.toLowerCase());
    if (days.length !== [...new Set(days)].length) return 'Duplicate days are not allowed';
    return null;
  }

  handleResponse(res, error, data, successMessage, errorMessage = 'Resource not found', status = 200) {
    if (error?.code === 'PGRST116') {
      return res.status(404).json({ success: false, message: errorMessage });
    }
    if (error) {
      console.error(`${errorMessage}:`, error);
      return res.status(500).json({ success: false, message: errorMessage, error: error.message });
    }
    return res.status(status).json({ success: true, message: successMessage, data, ...(Array.isArray(data) && { count: data.length }) });
  }

  // Consolidated database operations
  async safeQuery(query) {
    try {
      const result = await query;
      return { data: result.data, error: result.error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async createPlanningWithSchedules(schedules, isDefault = false) {
    const { data: planning, error } = await supabase.from('planning').insert([{ is_default: isDefault }]).select().single();
    if (error) throw error;

    let createdSchedules = [];
    if (schedules?.length > 0) {
      const schedulesToInsert = schedules.map(s => ({
        planning_id: planning.id,
        day: s.day.toLowerCase(),
        time_in: s.time_in,
        time_out: s.time_out
      }));

      const { data: schedData, error: schedError } = await supabase.from('schedule').insert(schedulesToInsert).select();
      if (schedError) {
        await supabase.from('planning').delete().eq('id', planning.id); // Rollback
        throw schedError;
      }
      createdSchedules = schedData;
    }
    return { ...planning, schedules: createdSchedules };
  }

  // Main CRUD operations - using arrow functions to preserve 'this' context
  getAllPlannings = async (req, res) => {
    const result = await this.safeQuery(
      supabase.from('planning').select('*, schedule:schedule (id, day, time_in, time_out, created_at)').order('created_at', { ascending: false })
    );
    return this.handleResponse(res, result.error, result.data, 'Plannings retrieved successfully', 'Failed to fetch plannings');
  }

  createPlanning = async (req, res) => {
    const { is_default, schedules } = req.body;
    const validationError = this.validateSchedules(schedules, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    try {
      const data = await this.createPlanningWithSchedules(schedules, is_default);
      return this.handleResponse(res, null, data, 'Planning created successfully', null, 201);
    } catch (err) {
      return this.handleResponse(res, err, null, null, 'Failed to create planning');
    }
  }

  getPlanningById = async (req, res) => {
    const result = await this.safeQuery(
      supabase.from('planning').select('*, schedule:schedule (id, day, time_in, time_out, created_at)').eq('id', req.params.id).single()
    );
    return this.handleResponse(res, result.error, result.data, 'Planning retrieved successfully', 'Planning not found');
  }

  updatePlanning = async (req, res) => {
    const { is_default } = req.body;
    if (is_default === undefined) return res.status(400).json({ success: false, message: 'At least one field must be provided to update' });

    const result = await this.safeQuery(
      supabase.from('planning').update({ is_default }).eq('id', req.params.id)
        .select('*, schedule:schedule (id, day, time_in, time_out, created_at)').single()
    );
    return this.handleResponse(res, result.error, result.data, 'Planning updated successfully', 'Planning not found');
  }

  deletePlanning = async (req, res) => {
    const planningResult = await this.safeQuery(
      supabase.from('planning').select('*, schedule:schedule (*)').eq('id', req.params.id).single()
    );
    if (planningResult.error) return this.handleResponse(res, planningResult.error, null, null, 'Planning not found');

    // Check references
    const { data: teams } = await supabase.from('team').select('id, name').eq('default_planning_id', req.params.id);
    if (teams?.length > 0) {
      return res.status(409).json({ success: false, message: 'Cannot delete planning: it is referenced by teams', data: teams });
    }

    const { data: clocks } = await supabase.from('clock').select('id').eq('planning_id', req.params.id).limit(1);
    if (clocks?.length > 0) {
      return res.status(409).json({ success: false, message: 'Cannot delete planning: it is referenced by clock entries' });
    }

    const { error } = await supabase.from('planning').delete().eq('id', req.params.id);
    return this.handleResponse(res, error, { deletedPlanning: planningResult.data }, 'Planning deleted successfully', 'Failed to delete planning');
  }

  // Resource-specific operations - using arrow functions to preserve 'this' context
  getDefaultPlanningByTeam = async (req, res) => {
    const teamResult = await this.safeQuery(
      supabase.from('team').select('id, name, default_planning_id').eq('id', req.params.teamId).single()
    );
    if (teamResult.error) return this.handleResponse(res, teamResult.error, null, null, 'Team not found');
    if (!teamResult.data.default_planning_id) {
      return res.status(404).json({ success: false, message: 'No default planning assigned to this team' });
    }

    const planningResult = await this.safeQuery(
      supabase.from('planning').select('*, schedule:schedule (*)').eq('id', teamResult.data.default_planning_id).single()
    );
    if (planningResult.error) return this.handleResponse(res, planningResult.error, null, null, 'Default planning not found');

    return this.handleResponse(res, null, { team: { id: teamResult.data.id, name: teamResult.data.name }, planning: planningResult.data }, 'Default planning retrieved successfully');
  }

  getPlanningByUserTeam = async (req, res) => {
    const userTeamResult = await this.safeQuery(
      supabase.from('user_team').select('id, role, planning_id, user:user_id (*), team:team_id (*)').eq('id', req.params.userTeamId).single()
    );
    if (userTeamResult.error) return this.handleResponse(res, userTeamResult.error, null, null, 'User-team association not found');

    const planningId = userTeamResult.data.planning_id || userTeamResult.data.team.default_planning_id;
    if (!planningId) return res.status(404).json({ success: false, message: 'No planning assigned to this user or team' });

    const planningResult = await this.safeQuery(
      supabase.from('planning').select('*, schedule:schedule (*)').eq('id', planningId).single()
    );
    if (planningResult.error) return this.handleResponse(res, planningResult.error, null, null, 'Planning not found');

    return this.handleResponse(res, null, {
      userTeam: { id: userTeamResult.data.id, role: userTeamResult.data.role, user: userTeamResult.data.user, team: userTeamResult.data.team },
      planning: planningResult.data,
      isTeamDefault: !userTeamResult.data.planning_id
    }, 'Planning retrieved successfully');
  }

  // Modification operations
  modifyTeamPlanning = async (req, res) => {
    const { schedules } = req.body;
    const validationError = this.validateSchedules(schedules, false);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const teamResult = await this.safeQuery(
      supabase.from('team').select('id, name, default_planning_id').eq('id', req.params.teamId).single()
    );
    if (teamResult.error) return this.handleResponse(res, teamResult.error, null, null, 'Team not found');

    try {
      const newPlanning = await this.createPlanningWithSchedules(schedules, false);
      const { error } = await supabase.from('team').update({ default_planning_id: newPlanning.id }).eq('id', req.params.teamId);
      
      if (error) {
        await supabase.from('planning').delete().eq('id', newPlanning.id); // Rollback
        throw error;
      }

      return this.handleResponse(res, null, {
        team: { ...teamResult.data, previous_planning_id: teamResult.data.default_planning_id, new_planning_id: newPlanning.id },
        newPlanning
      }, 'Team planning modified successfully (new planning created)', null, 201);
    } catch (err) {
      return this.handleResponse(res, err, null, null, 'Failed to update team planning');
    }
  }

  modifyUserTeamPlanning = async (req, res) => {
    const { schedules } = req.body;
    const validationError = this.validateSchedules(schedules, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const userTeamResult = await this.safeQuery(
      supabase.from('user_team').select('id, role, planning_id, user:user_id (*), team:team_id (*)').eq('id', req.params.userTeamId).single()
    );
    if (userTeamResult.error) return this.handleResponse(res, userTeamResult.error, null, null, 'User-team association not found');

    try {
      const newPlanning = await this.createPlanningWithSchedules(schedules, false);
      const { error } = await supabase.from('user_team').update({ planning_id: newPlanning.id }).eq('id', req.params.userTeamId);
      
      if (error) {
        await supabase.from('planning').delete().eq('id', newPlanning.id); // Rollback
        throw error;
      }

      return this.handleResponse(res, null, {
        userTeam: { ...userTeamResult.data, previous_planning_id: userTeamResult.data.planning_id, new_planning_id: newPlanning.id },
        newPlanning,
        isVacationPlanning: schedules.length === 0
      }, 'User-team planning modified successfully (new planning created)', null, 201);
    } catch (err) {
      return this.handleResponse(res, err, null, null, 'Failed to update user-team planning');
    }
  }
}

module.exports = new PlanningController();