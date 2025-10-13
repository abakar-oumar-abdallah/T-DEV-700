const supabase = require('../../../config/supabaseClient.js');

class PlanningController {

  /**
   * Get all plannings with their schedules
   */
  async getAllPlannings(req, res) {
    try {
      const { data, error } = await supabase
        .from('planning')
        .select(`
          *,
          schedule:schedule (
            id,
            day,
            time_in,
            time_out,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching plannings:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch plannings',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Plannings retrieved successfully',
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
   * Create a new planning with schedules
   */
  async createPlanning(req, res) {
    try {
      const { is_default, schedules } = req.body;

      // Validate input
      if (schedules && !Array.isArray(schedules)) {
        return res.status(400).json({
          success: false,
          message: 'Schedules must be an array'
        });
      }

      // Validate schedules if provided
      if (schedules && schedules.length > 0) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        for (let schedule of schedules) {
          if (!schedule.day || !validDays.includes(schedule.day.toLowerCase())) {
            return res.status(400).json({
              success: false,
              message: `Invalid day: ${schedule.day}. Must be one of: ${validDays.join(', ')}`
            });
          }
          
          if (!schedule.time_in || !schedule.time_out) {
            return res.status(400).json({
              success: false,
              message: 'Each schedule must have time_in and time_out'
            });
          }

          // Validate time format (basic check)
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
          if (!timeRegex.test(schedule.time_in) || !timeRegex.test(schedule.time_out)) {
            return res.status(400).json({
              success: false,
              message: 'Time format must be HH:MM:SS'
            });
          }
        }

        // Check for duplicate days
        const days = schedules.map(s => s.day.toLowerCase());
        const uniqueDays = [...new Set(days)];
        if (days.length !== uniqueDays.length) {
          return res.status(400).json({
            success: false,
            message: 'Duplicate days are not allowed'
          });
        }
      }

      // Create the planning
      const { data: planningData, error: planningError } = await supabase
        .from('planning')
        .insert([
          {
            is_default: is_default || false
          }
        ])
        .select()
        .single();

      if (planningError) {
        console.error('Error creating planning:', planningError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create planning',
          error: planningError.message
        });
      }

      let schedulesData = [];

      // Create schedules if provided
      if (schedules && schedules.length > 0) {
        const schedulesToInsert = schedules.map(schedule => ({
          planning_id: planningData.id,
          day: schedule.day.toLowerCase(),
          time_in: schedule.time_in,
          time_out: schedule.time_out
        }));

        const { data: createdSchedules, error: schedulesError } = await supabase
          .from('schedule')
          .insert(schedulesToInsert)
          .select();

        if (schedulesError) {
          // Rollback: delete the planning if schedule creation fails
          await supabase
            .from('planning')
            .delete()
            .eq('id', planningData.id);

          console.error('Error creating schedules:', schedulesError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create schedules, planning creation rolled back',
            error: schedulesError.message
          });
        }

        schedulesData = createdSchedules;
      }

      res.status(201).json({
        success: true,
        message: 'Planning created successfully',
        data: {
          ...planningData,
          schedules: schedulesData
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
   * Get planning by ID with schedules
   */
  async getPlanningById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('planning')
        .select(`
          *,
          schedule:schedule (
            id,
            day,
            time_in,
            time_out,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Planning not found'
          });
        }

        console.error('Error fetching planning:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch planning',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Planning retrieved successfully',
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
   * Update planning (only is_default field)
   */
  async updatePlanning(req, res) {
    try {
      const { id } = req.params;
      const { is_default } = req.body;

      // Check if at least one field is provided
      if (is_default === undefined) {
        return res.status(400).json({
          success: false,
          message: 'At least one field must be provided to update'
        });
      }

      const updateData = {};
      if (is_default !== undefined) {
        updateData.is_default = is_default;
      }

      const { data, error } = await supabase
        .from('planning')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          schedule:schedule (
            id,
            day,
            time_in,
            time_out,
            created_at
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Planning not found'
          });
        }

        console.error('Error updating planning:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update planning',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Planning updated successfully',
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
   * Delete planning (will also delete associated schedules due to foreign key)
   */
  async deletePlanning(req, res) {
    try {
      const { id } = req.params;

      // Check if planning exists and get its data
      const { data: existingPlanning, error: checkError } = await supabase
        .from('planning')
        .select(`
          *,
          schedule:schedule (
            id,
            day,
            time_in,
            time_out
          )
        `)
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Planning not found'
          });
        }

        console.error('Error checking planning existence:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check planning existence',
          error: checkError.message
        });
      }

      // Check if planning is referenced by any team
      const { data: referencingTeams, error: teamCheckError } = await supabase
        .from('team')
        .select('id, name')
        .eq('default_planning_id', id);

      if (teamCheckError) {
        console.error('Error checking team references:', teamCheckError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check team references',
          error: teamCheckError.message
        });
      }

      if (referencingTeams && referencingTeams.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete planning: it is referenced by teams',
          data: {
            referencingTeams: referencingTeams
          }
        });
      }

      // Check if planning is referenced by any clocks
      const { data: referencingClocks, error: clockCheckError } = await supabase
        .from('clock')
        .select('id')
        .eq('planning_id', id)
        .limit(1);

      if (clockCheckError) {
        console.error('Error checking clock references:', clockCheckError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check clock references',
          error: clockCheckError.message
        });
      }

      if (referencingClocks && referencingClocks.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete planning: it is referenced by clock entries'
        });
      }

      // Delete the planning (schedules will be deleted automatically due to foreign key)
      const { error } = await supabase
        .from('planning')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting planning:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete planning',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Planning deleted successfully',
        data: {
          deletedPlanning: existingPlanning
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

module.exports = new PlanningController();