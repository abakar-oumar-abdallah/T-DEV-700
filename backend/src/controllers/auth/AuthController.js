const supabase = require('../../../config/supabaseClient.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
  
  /**
   * Handle user login request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
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

      // Find user by email
      const { data: user, error } = await supabase
        .from('user')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
          });
        }

        console.error('Error finding user:', error);
        return res.status(500).json({
          success: false,
          message: 'Login failed',
          error: error.message
        });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Remove password from user data
      const { password: userPassword, ...userWithoutPassword } = user;
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Send success response
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token: token,
          loginTime: new Date().toISOString()
        }
      });

    } catch (err) {
      console.error('Unexpected error during login:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }

  /**
   * Handle user logout request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const token = authHeader.substring(7); // Remove "Bearer "

      // Verify if token is valid
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Optional: Verify that user still exists
        const { data: user, error } = await supabase
          .from('user')
          .select('id, email')
          .eq('id', decoded.userId)
          .single();

        if (error && error.code === 'PGRST116') {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        if (error) {
          console.error('Error verifying user during logout:', error);
          return res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
          });
        }

        // Successful logout
        res.status(200).json({
          success: true,
          message: 'Logout successful',
          data: {
            userId: decoded.userId,
            email: decoded.email,
            logoutTime: new Date().toISOString()
          }
        });

      } catch (jwtError) {
        // Invalid or expired token
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

    } catch (err) {
      console.error('Unexpected error during logout:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }
}

module.exports = new AuthController();