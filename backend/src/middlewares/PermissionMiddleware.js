const PermissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be called after AuthMiddleware)
    if (!req.user || !req.user.permission) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - User authentication required" 
      });
    }

    // Check global user permission
    const hasPermission = checkUserPermission(req.user.permission, requiredPermission);
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden - Requires ${requiredPermission} permission or above` 
      });
    }

    next();
  };
};

// Helper function to check user permissions (hierarchical)
const checkUserPermission = (userRole, requiredPermission) => {
  const permissions = {
    'user': 1,
    'admin': 2,
    'superadmin': 3
  };

  const userLevel = permissions[userRole] || 0;
  const requiredLevel = permissions[requiredPermission] || 0;

  return userLevel >= requiredLevel;
};

module.exports = PermissionMiddleware;