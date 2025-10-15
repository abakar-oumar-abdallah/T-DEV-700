const supabase = require('../../config/supabaseClient.js');
const jwt = require('jsonwebtoken');

const AuthMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    let token = req.headers.authorization?.startsWith('Bearer ') 
      ? req.headers.authorization.substring(7) 
      : req.headers.authorization;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - No token provided" 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Add userId to request body
    if (!req.body) req.body = {};
    req.body.userId = decoded.userId;

    // Get user details from database
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, email, permission')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - User not found" 
      });
    }

    // Add user permission to request
    req.user.permission = user.permission;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - Invalid token" 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - Token expired" 
      });
    }
    
    console.error("AuthMiddleware error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

module.exports = AuthMiddleware;