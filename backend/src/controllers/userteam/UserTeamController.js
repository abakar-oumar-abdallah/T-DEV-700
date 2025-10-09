const supabase = require('../../../config/supabaseClient.js');

class UserTeamController {
  
  /**
   * Get all user-team associations
   */
  async getAllUserTeams(req, res) {
    try {
      const { data, error } = await supabase
        .from('user_team')
        .select(`
          *,
          user:user_id (id, email, first_name, last_name),
          team:team_id (id, name, description)
        `);

      if (error) {
        console.error('Error fetching user-teams:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user-teams',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'User-teams retrieved successfully',
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
   * Add a user to a team (Create a user-team association)
   */
  async createUserTeam(req, res) {
    try {
      const { user_id, team_id, role } = req.body;

      // Validate input
      if (!user_id || !team_id || !role) {
        return res.status(400).json({
          success: false,
          message: 'user_id, team_id and role are required'
        });
      }

      // Validate role
      const validRoles = ["employee", "manager"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
      }

      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('user')
        .select('id')
        .eq('id', user_id)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        console.error('Error checking user:', userError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check user existence',
          error: userError.message
        });
      }

      // Check if team exists
      const { data: existingTeam, error: teamError } = await supabase
        .from('team')
        .select('id')
        .eq('id', team_id)
        .single();

      if (teamError) {
        if (teamError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Team not found'
          });
        }
        console.error('Error checking team:', teamError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check team existence',
          error: teamError.message
        });
      }

      // Check if association already exists
      const { data: existingAssociation, error: checkError } = await supabase
        .from('user_team')
        .select('*')
        .eq('user_id', user_id)
        .eq('team_id', team_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing association:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check existing association',
          error: checkError.message
        });
      }

      if (existingAssociation) {
        return res.status(409).json({
          success: false,
          message: 'User is already associated with this team'
        });
      }

      // Create the association
      const { data, error } = await supabase
        .from('user_team')
        .insert([
          {
            user_id: user_id,
            team_id: team_id,
            role: role
          }
        ])
        .select(`
          *,
          user:user_id (id, email, first_name, last_name),
          team:team_id (id, name, description)
        `)
        .single();

      if (error) {
        console.error('Error creating user-team association:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create user-team association',
          error: error.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'User-team association created successfully',
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
   * Get user-team association by user_id and team_id
   */
  async getUserTeamById(req, res) {
    try {
      const { user_id, team_id } = req.params;

      const { data, error } = await supabase
        .from('user_team')
        .select(`
          *,
          user:user_id (id, email, first_name, last_name),
          team:team_id (id, name, description)
        `)
        .eq('user_id', user_id)
        .eq('team_id', team_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || data === null) {
          return res.status(404).json({
            success: false,
            message: 'User-team association not found'
          });
        }

        console.error('Error fetching user-team association:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user-team association',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'User-team association retrieved successfully',
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
   * Get all teams for a specific user
   */
  async getTeamsByUserId(req, res) {
    try {
      const { user_id } = req.params;

      const { data, error } = await supabase
        .from('user_team')
        .select(`
          role,
          team:team_id (id, name, description, lateness_limit)
        `)
        .eq('user_id', user_id);

      if (error) {
        console.error('Error fetching user teams:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user teams',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'User teams retrieved successfully',
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
   * Get all users for a specific team
   */
  async getUsersByTeamId(req, res) {
    try {
      const { team_id } = req.params;

      const { data, error } = await supabase
        .from('user_team')
        .select(`
          role,
          user:user_id (id, email, first_name, last_name)
        `)
        .eq('team_id', team_id);

      if (error) {
        console.error('Error fetching team users:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch team users',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Team users retrieved successfully',
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
   * Update user-team association role
   */
  async updateUserTeam(req, res) {
    try {
      const { user_id, team_id } = req.params;
      const { role } = req.body;

      // Validate input
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required for update'
        });
      }

      // Validate role
      const validRoles = ["employee", "manager"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
      }

      const { data, error } = await supabase
        .from('user_team')
        .update({ role: role })
        .eq('user_id', user_id)
        .eq('team_id', team_id)
        .select(`
          *,
          user:user_id (id, email, first_name, last_name),
          team:team_id (id, name, description)
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User-team association not found'
          });
        }

        console.error('Error updating user-team association:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update user-team association',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'User-team association updated successfully',
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
   * Delete user-team association
   */
  async deleteUserTeam(req, res) {
    try {
      const { user_id, team_id } = req.params;

      // Check if association exists
      const { data: existingAssociation, error: checkError } = await supabase
        .from('user_team')
        .select('*')
        .eq('user_id', user_id)
        .eq('team_id', team_id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User-team association not found'
          });
        }

        console.error('Error checking user-team association:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check user-team association',
          error: checkError.message
        });
      }

      // Delete the association
      const { error } = await supabase
        .from('user_team')
        .delete()
        .eq('user_id', user_id)
        .eq('team_id', team_id);

      if (error) {
        console.error('Error deleting user-team association:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete user-team association',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'User-team association deleted successfully',
        data: {
          deletedAssociation: existingAssociation
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

module.exports = new UserTeamController();