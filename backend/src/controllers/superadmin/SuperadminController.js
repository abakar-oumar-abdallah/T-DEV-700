const supabase = require('../../../config/supabaseClient.js');

class SuperadminController {
  
  /**
   * Get all users with their permissions and teams (paginated)
   */
  getAllUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error counting users:', countError);
        return res.status(500).json({
          success: false,
          message: 'Failed to count users',
          error: countError.message
        });
      }

      // Get paginated data
      const { data, error } = await supabase
        .from('user')
        .select(`
          id,
          email,
          first_name,
          last_name,
          permission,
          phone_number,
          created_at,
          user_team (
            id,
            role,
            team:team_id (id, name)
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch users',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: data,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
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
  };

  /**
   * Search users by email
   */
  searchUserByEmail = async (req, res) => {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email parameter is required'
        });
      }

      const { data, error } = await supabase
        .from('user')
        .select(`
          id,
          email,
          first_name,
          last_name,
          permission,
          phone_number,
          created_at,
          user_team (
            id,
            role,
            team:team_id (id, name)
          )
        `)
        .ilike('email', `%${email}%`);

      if (error) {
        console.error('Error searching users:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to search users',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Users found',
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
  };

  /**
   * Update user permission (admin or superadmin)
   */
  updateUserPermission = async (req, res) => {
    try {
      const { userId } = req.params;
      const { permission } = req.body;

      // Validate permission
      const validPermissions = ['user', 'admin', 'superadmin'];
      if (!permission || !validPermissions.includes(permission)) {
        return res.status(400).json({
          success: false,
          message: `Invalid permission. Must be one of: ${validPermissions.join(', ')}`
        });
      }

      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('user')
        .select('id, email, permission')
        .eq('id', userId)
        .single();

      if (checkError || !existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update permission
      const { data, error } = await supabase
        .from('user')
        .update({ permission: permission })
        .eq('id', userId)
        .select('id, email, first_name, last_name, permission')
        .single();

      if (error) {
        console.error('Error updating user permission:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update user permission',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: `User permission updated to ${permission}`,
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
  };

  /**
   * Delete a user and all associated data
   */
  deleteUser = async (req, res) => {
    try {
      const { userId } = req.params;

      // Prevent deleting yourself
      if (req.user && req.user.userId === parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('user')
        .select('id, email, permission')
        .eq('id', userId)
        .single();

      if (checkError || !existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete user (cascade will handle user_team, clock entries, etc.)
      const { error } = await supabase
        .from('user')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete user',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: {
          deletedUser: existingUser
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
  };

  /**
   * Get all teams with member counts (paginated)
   */
  getAllTeams = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('team')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error counting teams:', countError);
        return res.status(500).json({
          success: false,
          message: 'Failed to count teams',
          error: countError.message
        });
      }

      // Get paginated data
      const { data, error } = await supabase
        .from('team')
        .select(`
          id,
          name,
          description,
          lateness_limit,
          timezone,
          created_at,
          user_team (
            id,
            user:user_id (id, email, first_name, last_name),
            role
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching teams:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch teams',
          error: error.message
        });
      }

      // Add member count to each team
      const teamsWithCounts = data.map(team => ({
        ...team,
        memberCount: team.user_team?.length || 0
      }));

      res.status(200).json({
        success: true,
        message: 'Teams retrieved successfully',
        data: teamsWithCounts,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
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
  };

  /**
   * Delete a team and all associated data
   */
  deleteTeam = async (req, res) => {
    try {
      const { teamId } = req.params;

      // Check if team exists
      const { data: existingTeam, error: checkError } = await supabase
        .from('team')
        .select(`
          id,
          name,
          user_team (id)
        `)
        .eq('id', teamId)
        .single();

      if (checkError || !existingTeam) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Delete team (cascade will handle user_team entries)
      const { error } = await supabase
        .from('team')
        .delete()
        .eq('id', teamId);

      if (error) {
        console.error('Error deleting team:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete team',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Team deleted successfully',
        data: {
          deletedTeam: {
            id: existingTeam.id,
            name: existingTeam.name,
            memberCount: existingTeam.user_team?.length || 0
          }
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
  };

  /**
   * Get dashboard statistics
   */
  getDashboardStats = async (req, res) => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true });

      // Get total admins
      const { count: totalAdmins } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true })
        .eq('permission', 'admin');

      // Get total superadmins
      const { count: totalSuperadmins } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true })
        .eq('permission', 'superadmin');

      // Get total teams
      const { count: totalTeams } = await supabase
        .from('team')
        .select('*', { count: 'exact', head: true });

      res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          totalUsers: totalUsers || 0,
          totalAdmins: totalAdmins || 0,
          totalSuperadmins: totalSuperadmins || 0,
          totalTeams: totalTeams || 0
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
  };
}

module.exports = new SuperadminController();
