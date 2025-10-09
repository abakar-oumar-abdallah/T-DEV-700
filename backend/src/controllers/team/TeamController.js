const supabase = require('../../../config/supabaseClient.js');

class TeamController {
  
  /**
   * Get all teams
   */
  async getAllTeams(req, res) {
    try {
      const { data, error } = await supabase
        .from('team')
        .select('*');

      if (error) {
        console.error('Error fetching teams:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch teams',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Teams retrieved successfully',
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
   * Create a new team
   */
  async createTeam(req, res) {
    try {
      const { name, description, lateness_limit } = req.body;
     if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Name is required',
        });
      } 
      if (lateness_limit == null || lateness_limit < 0) {
      return res.status(400).json({
        success: false,
        message: 'lateness_limit must not be null or negative',
      });
      }
      const { data, error } = await supabase
        .from('team')
        .insert([
          {
            name: name,
            description: description,
            lateness_limit: lateness_limit
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating team:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create team',
          error: error.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data
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
   * Get team by ID
   */
  async getTeamById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('team')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || data === null) {
          return res.status(404).json({
            success: false,
            message: 'Team not found'
          });
        }

        console.error('Error fetching team:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch team',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Team retrieved successfully',
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
   * Update team
   */
  async updateTeam(req, res) {
    try {
      const { id } = req.params;
      const { name, description, lateness_limit } = req.body;

      const updatedFields = {};
      if (name) updatedFields.name = name.trim();
      if (description) updatedFields.description = description;
      if (lateness_limit !== undefined) {
      if (lateness_limit == null || lateness_limit < 0) {
        return res.status(400).json({
          success: false,
          message: 'lateness_limit must not be null or negative',
        });
      }
      updatedFields.lateness_limit = lateness_limit;
     }
      if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields provided for update',
        });
      }

      const { data, error } = await supabase
        .from('team')
        .update(updatedFields)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Team not found',
          });
        }

        console.error('Error updating team:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update team',
          error: error.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Team updated successfully',
        data: data,
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message,
      });
    }
  }

  /**
   * Delete team
   */
  async deleteTeam(req, res) {
    try {
      const { id } = req.params;

      const { data: existingTeam, error: checkError } = await supabase
        .from('team')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Team not found',
          });
        }

        console.error('Error checking team:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check team',
          error: checkError.message,
        });
      }

      const { error } = await supabase
        .from('team')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting team:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete team',
          error: error.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Team deleted successfully',
        data: existingTeam,
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message,
      });
    }
  }
}

module.exports = new TeamController();