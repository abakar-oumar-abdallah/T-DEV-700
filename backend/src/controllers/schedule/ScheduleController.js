const supabase = require('../../../config/supabaseClient.js');

class ScheduleController {

  /**
   * Get all schedules
   */
  async getAllSchedules(req, res) {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select(`
          *,
          planning:planning_id (
            id,
            is_default,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching schedules:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch schedules',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
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
   * Get schedule by ID
   */
  async getScheduleById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('schedule')
        .select(`
          *,
          planning:planning_id (
            id,
            is_default,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Schedule not found'
          });
        }

        console.error('Error fetching schedule:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch schedule',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Schedule retrieved successfully',
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
   * Get schedules by planning ID
   */
  async getSchedulesByPlanningId(req, res) {
    try {
      const { planningId } = req.params;

      // First check if planning exists
      const { data: planning, error: planningError } = await supabase
        .from('planning')
        .select('id')
        .eq('id', planningId)
        .single();

      if (planningError) {
        if (planningError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Planning not found'
          });
        }

        console.error('Error checking planning:', planningError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check planning',
          error: planningError.message
        });
      }

      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('planning_id', planningId)
        .order('day');

      if (error) {
        console.error('Error fetching schedules:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch schedules',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
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
   * Update schedule
   */
  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const { day, time_in, time_out } = req.body;

      // Check if at least one field is provided
      if (!day && !time_in && !time_out) {
        return res.status(400).json({
          success: false,
          message: 'At least one field must be provided to update'
        });
      }

      const updateData = {};

      // Validate and add day
      if (day) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(day.toLowerCase())) {
          return res.status(400).json({
            success: false,
            message: `Invalid day: ${day}. Must be one of: ${validDays.join(', ')}`
          });
        }
        updateData.day = day.toLowerCase();
      }

      // Validate and add time_in
      if (time_in) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (!timeRegex.test(time_in)) {
          return res.status(400).json({
            success: false,
            message: 'time_in format must be HH:MM:SS'
          });
        }
        updateData.time_in = time_in;
      }

      // Validate and add time_out
      if (time_out) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (!timeRegex.test(time_out)) {
          return res.status(400).json({
            success: false,
            message: 'time_out format must be HH:MM:SS'
          });
        }
        updateData.time_out = time_out;
      }

      // Check for duplicate day in the same planning (if day is being updated)
      if (day) {
        // First get the current schedule to know its planning_id
        const { data: currentSchedule, error: currentError } = await supabase
          .from('schedule')
          .select('planning_id')
          .eq('id', id)
          .single();

        if (currentError) {
          if (currentError.code === 'PGRST116') {
            return res.status(404).json({
              success: false,
              message: 'Schedule not found'
            });
          }

          console.error('Error fetching current schedule:', currentError);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch current schedule',
            error: currentError.message
          });
        }

        // Check for duplicate day in the same planning
        const { data: existingSchedule, error: duplicateError } = await supabase
          .from('schedule')
          .select('id')
          .eq('planning_id', currentSchedule.planning_id)
          .eq('day', day.toLowerCase())
          .neq('id', id)
          .single();

        if (duplicateError && duplicateError.code !== 'PGRST116') {
          console.error('Error checking duplicate day:', duplicateError);
          return res.status(500).json({
            success: false,
            message: 'Failed to check duplicate day',
            error: duplicateError.message
          });
        }

        if (existingSchedule) {
          return res.status(409).json({
            success: false,
            message: 'A schedule for this day already exists in the planning'
          });
        }
      }

      const { data, error } = await supabase
        .from('schedule')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          planning:planning_id (
            id,
            is_default,
            created_at
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Schedule not found'
          });
        }

        console.error('Error updating schedule:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update schedule',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
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
   * Delete schedule
   */
  async deleteSchedule(req, res) {
    try {
      const { id } = req.params;

      // Check if schedule exists
      const { data: existingSchedule, error: checkError } = await supabase
        .from('schedule')
        .select(`
          *,
          planning:planning_id (
            id,
            is_default,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Schedule not found'
          });
        }

        console.error('Error checking schedule existence:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check schedule existence',
          error: checkError.message
        });
      }

      // Delete the schedule
      const { error } = await supabase
        .from('schedule')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting schedule:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete schedule',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully',
        data: {
          deletedSchedule: existingSchedule
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
}

module.exports = new ScheduleController();