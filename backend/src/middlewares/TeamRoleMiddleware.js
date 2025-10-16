const supabase = require('../../config/supabaseClient.js');

const TeamRoleMiddleware = (allowedTeamRoles = [], requireTeamContext = false) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated (should be called after AuthMiddleware)

      if (!req.user || !req.user.userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized - User authentication required' 
        });
      }

      // Get team context from multiple sources
      const teamId = req.params.teamId || req.body.teamId || req.query.teamId || req.headers['x-team-id'];
      
      // Check if team context is required
      if (requireTeamContext && !teamId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bad Request - Team context required for this operation' 
        });
      }

      // Handle team-specific validation if teamId is present
      if (teamId) {
        // Verify user is member of this team and get team info
        const { data: userTeam, error: teamError } = await supabase
          .from('user_team')
          .select(`
            id,
            role,
            team:team_id (
              id,
              name,
              default_planning_id
            )
          `)
          .eq('user_id', req.user.userId)
          .eq('team_id', teamId)
          .single();

        if (teamError || !userTeam) {
          return res.status(403).json({ 
            success: false, 
            message: 'Forbidden - User not member of this team' 
          });
        }

        // Check team role permissions if specified
        if (allowedTeamRoles.length > 0 && !allowedTeamRoles.includes(userTeam.role)) {
          return res.status(403).json({ 
            success: false, 
            message: `Forbidden - Requires one of the following team roles: ${allowedTeamRoles.join(', ')}` 
          });
        }

        // Add team context to request
        req.currentTeam = {
          id: parseInt(teamId),
          name: userTeam.team.name,
          userRole: userTeam.role,
          userTeamId: userTeam.id,
          defaultPlanningId: userTeam.team.default_planning_id
        };

        // Add userTeamId to request body
        if (!req.body) req.body = {};
        req.body.userTeamId = userTeam.id;

        req.user.teamRole = userTeam.role;
      } else if (allowedTeamRoles.length > 0) {
        // Team roles specified but no teamId provided
        return res.status(400).json({ 
          success: false, 
          message: 'Bad Request - teamId required for team role validation' 
        });
      }

      next();
    } catch (error) {
      console.error('TeamRoleMiddleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  };
};

module.exports = TeamRoleMiddleware;