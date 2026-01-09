const supabase = require('../../../config/supabaseClient.js');

class SuperadminController {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res) {
    try {
      // Count total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error counting users:', usersError);
        return res.status(500).json({
          success: false,
          message: 'Failed to count users',
          error: usersError.message
        });
      }

      // Count admins
      const { count: totalAdmins, error: adminsError } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true })
        .eq('permission', 'admin');

      if (adminsError) {
        console.error('Error counting admins:', adminsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to count admins',
          error: adminsError.message
        });
      }

      // Count superadmins
      const { count: totalSuperadmins, error: superadminsError } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true })
        .eq('permission', 'superadmin');

      if (superadminsError) {
        console.error('Error counting superadmins:', superadminsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to count superadmins',
          error: superadminsError.message
        });
      }

      // Count teams
      const { count: totalTeams, error: teamsError } = await supabase
        .from('team')
        .select('*', { count: 'exact', head: true });

      if (teamsError) {
        console.error('Error counting teams:', teamsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to count teams',
          error: teamsError.message
        });
      }

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
  }

  /**
   * Update user permission
   */
  async updateUserPermission(req, res) {
    try {
      const { userId } = req.params;
      const { permission } = req.body;

      // Validate permission value
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

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        console.error('Error checking user:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check user',
          error: checkError.message
        });
      }

      // Update permission
      const { data: updatedUser, error: updateError } = await supabase
        .from('user')
        .update({ permission })
        .eq('id', userId)
        .select('id, email, first_name, last_name, permission')
        .single();

      if (updateError) {
        console.error('Error updating permission:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to update permission',
          error: updateError.message
        });
      }

      res.status(200).json({
        success: true,
        message: `User permission updated to ${permission}`,
        data: updatedUser
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

module.exports = new SuperadminController();