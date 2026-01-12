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

  async createUserTeam(req, res) {
    try {
      const { userId, teamId, role } = req.body;

      // Validate input
      if (!userId || !teamId || !role) {
        return res.status(400).json({
          success: false,
          message: 'userId, teamId and role are required'
        });
      }

      // Validate role
      const validRoles = ['employee', 'manager', 'owner'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
      }

      // Check if user is superadmin
      const isSuperadmin = req.user?.permission === 'superadmin';

      // Only owner or superadmin can create managers or owners
      if ((role === 'manager' || role === 'owner') && !isSuperadmin && req.currentTeam?.userRole !== 'owner') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden - Only team owner or superadmin can create managers or owners'
        });
      }

      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('user')
        .select('id')
        .eq('id', userId)
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
          message: 'Failed to verify user',
          error: userError.message
        });
      }

      // Check if team exists
      const { data: existingTeam, error: teamError } = await supabase
        .from('team')
        .select('id')
        .eq('id', teamId)
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
          message: 'Failed to verify team',
          error: teamError.message
        });
      }

      // Check if association already exists
      const { data: existingAssoc, error: assocError } = await supabase
        .from('user_team')
        .select('id')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .single();

      if (existingAssoc) {
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
            user_id: userId,
            team_id: teamId,
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
        data: {
          id: data.id,
          user_id: data.user_id,
          team_id: data.team_id,
          role: data.role,
          user: data.user,
          team: data.team,
          ...data 
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

  async createUserTeamWithEmail(req, res) {
    try {
      const { email, teamId, role } = req.body;

      // Validate input
      if (!email || !teamId || !role) {
        return res.status(400).json({
          success: false,
          message: 'email, teamId and role are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Validate role
      const validRoles = ['employee', 'manager', 'owner'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
      }

      // Check if user is superadmin
      const isSuperadmin = req.user?.permission === 'superadmin';

      // Only owner or superadmin can create managers or owners
      if ((role === 'manager' || role === 'owner') && !isSuperadmin && req.currentTeam?.userRole !== 'owner') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden - Only team owner or superadmin can create managers or owners'
        });
      }

      // Get user by email
      const { data: user, error: userError } = await supabase
        .from('user')
        .select('id, email, first_name, last_name')
        .eq('email', email)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found with this email'
          });
        }
        console.error('Error finding user:', userError);
        return res.status(500).json({
          success: false,
          message: 'Failed to find user',
          error: userError.message
        });
      }

      const userId = user.id;

      // Check if team exists
      const { data: existingTeam, error: teamError } = await supabase
        .from('team')
        .select('id')
        .eq('id', teamId)
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
          message: 'Failed to verify team',
          error: teamError.message
        });
      }

      // Check if association already exists
      const { data: existingAssoc } = await supabase
        .from('user_team')
        .select('id')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .single();

      if (existingAssoc) {
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
            user_id: userId,
            team_id: teamId,
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
        message: 'User-team association created successfully using email',
        data: {
          id: data.id,
          user_id: data.user_id,
          team_id: data.team_id,
          role: data.role,
          user: data.user,
          team: data.team,
          ...data
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
   * Get user-team association by user_id and team_id
   * If userId not in params, uses current user from token
   */
  async getUserTeamById(req, res) {
    try {
      // Use userId from params, or fall back to current user from token
      const userId = req.params.userId || req.user?.userId;
      const { teamId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const { data, error } = await supabase
        .from('user_team')
        .select(`
          *,
          user:user_id (id, email, first_name, last_name),
          team:team_id (id, name, description)
        `)
        .eq('user_id', userId)
        .eq('team_id', teamId)
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
   * If userId not in params, uses current user from token
   */
  async getTeamsByUserId(req, res) {
    try {
      // Use userId from params, or fall back to current user from token
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const { data, error } = await supabase
        .from('user_team')
        .select(`
          role,
          team:team_id (id, name, description, lateness_limit)
        `)
        .eq('user_id', userId);

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
      const { teamId } = req.params;

      const { data, error } = await supabase
        .from('user_team')
        .select(`
          *,
          user:user_id (id, email, first_name, last_name)
        `)
        .eq('team_id', teamId);

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

 async updateUserTeam(req, res) {
    try {
      const userId = req.params.userId || req.user?.userId;
      const { teamId } = req.params;
      const { role } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Validate input
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required for update'
        });
      }

      // Validate role
      const validRoles = ['employee', 'manager', 'owner'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
      }

      // Get target user's current role
      const { data: targetUserTeam, error: targetError } = await supabase
        .from('user_team')
        .select('role, user_id')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .single();

      if (targetError || !targetUserTeam) {
        return res.status(404).json({
          success: false,
          message: 'User-team association not found'
        });
      }

      // Check if user is superadmin
      const isSuperadmin = req.user?.permission === 'superadmin';

      // Superadmin can modify anyone without restrictions
      if (!isSuperadmin) {
        // Check permissions for non-superadmin users:
        // - Only owner can modify roles
        // - Cannot modify owner's role
        // - Managers cannot modify themselves or other managers/owners
        if (req.user.teamRole !== 'owner') {
          // If user is manager trying to modify
          if (req.user.teamRole === 'manager') {
            // Managers cannot modify themselves
            if (userId === req.user.userId) {
              return res.status(403).json({
                success: false,
                message: 'Forbidden - Managers cannot modify their own role'
              });
            }
            // Managers cannot modify other managers or owners
            if (targetUserTeam.role === 'manager' || targetUserTeam.role === 'owner') {
              return res.status(403).json({
                success: false,
                message: 'Forbidden - Managers cannot modify other managers or owners'
              });
            }
          } else {
            return res.status(403).json({
              success: false,
              message: 'Forbidden - Only team owner can modify roles'
            });
          }
        }

        // Cannot modify owner's role (unless superadmin)
        if (targetUserTeam.role === 'owner' && role !== 'owner') {
          return res.status(403).json({
            success: false,
            message: 'Forbidden - Cannot modify owner role'
          });
        }

        // Only owner can promote to manager or owner (unless superadmin)
        if ((role === 'manager' || role === 'owner') && req.currentTeam?.userRole !== 'owner') {
          return res.status(403).json({
            success: false,
            message: 'Forbidden - Only team owner can promote to manager or owner'
          });
        }
      }

      const { data, error } = await supabase
        .from('user_team')
        .update({ role: role })
        .eq('user_id', userId)
        .eq('team_id', teamId)
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

 async deleteUserTeam(req, res) {
    try {
      const userId = req.params.userId || req.user?.userId;
      const { teamId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Get target user's current role
      const { data: targetUserTeam, error: targetError } = await supabase
        .from('user_team')
        .select('role, user_id')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .single();

      if (targetError || !targetUserTeam) {
        return res.status(404).json({
          success: false,
          message: 'User-team association not found'
        });
      }

      // Check if user is superadmin
      const isSuperadmin = req.user?.permission === 'superadmin';

      // Superadmin can delete anyone without restrictions
      if (!isSuperadmin) {
        // Cannot delete owner (unless superadmin)
        if (targetUserTeam.role === 'owner') {
          return res.status(403).json({
            success: false,
            message: 'Forbidden - Cannot remove team owner. Transfer ownership first or delete the team.'
          });
        }

        // Check permissions for non-superadmin users:
        // - Owner can remove anyone (except themselves as owner)
        // - Managers cannot remove themselves, other managers, or owners
        if (req.currentTeam?.userRole !== 'owner') {
          if (req.currentTeam?.userRole === 'manager') {
            // Managers cannot remove themselves
            if (userId === req.user.userId) {
              return res.status(403).json({
                success: false,
                message: 'Forbidden - Managers cannot remove themselves from the team'
              });
            }
            // Managers cannot remove other managers or owners
            if (targetUserTeam.role === 'manager' || targetUserTeam.role === 'owner') {
              return res.status(403).json({
                success: false,
                message: 'Forbidden - Managers cannot remove other managers or owners'
              });
            }
          } else {
            return res.status(403).json({
              success: false,
              message: 'Forbidden - Insufficient permissions to remove team members'
            });
          }
        }
      }

      const { error } = await supabase
        .from('user_team')
        .delete()
        .eq('user_id', userId)
        .eq('team_id', teamId);

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
        message: 'User-team association deleted successfully'
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