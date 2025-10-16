const supabase = require('../../../config/supabaseClient.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserController {
  
  /**
   * Get all users
   */
  async getAllUsers(req, res) {
    try {
      const { data, error } = await supabase
        .from('user')
        .select('*');

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
   * Create a new user
   */
  async createUser(req, res) {
    try {
      const { email, password, first_name, last_name, permission, phone_number} = req.body;

      // Validation des champs requis
      if (!email || !password || !first_name || !last_name || !permission || !phone_number) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, first_name, last_name, permission and phone number are required'
        });
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Validation des noms
      if (first_name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'First name must be at least 2 characters long'
        });
      }

      if (last_name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Last name must be at least 2 characters long'
        });
      }

      if (phone_number.length < 9) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be at least 9 characters long'
        });
      }

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser, error: checkError } = await supabase
        .from('user')
        .select('id')
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check existing user',
          error: checkError.message
        });
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash du mot de passe
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Créer l'utilisateur
      const { data, error } = await supabase
        .from('user')
        .insert([
          {
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            permission:permission.trim()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create user',
          error: error.message
        });
      }

      const { password: _, ...userWithoutPassword } = data;

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userWithoutPassword
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
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || data === null) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        console.error('Error fetching user:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
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
   * Get user by email
   */
  async getUserByEmail(req, res) {
    try {
      const { email } = req.params;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format provided'
        });
      }

      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        console.error('Error fetching user by email:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
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
   * Update user
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { email, password, first_name, last_name, permission, phone_number } = req.body;

      // Vérifier qu'au moins un champ est fourni
      if (!email && !password && !first_name && !last_name  && !permission && !phone_number) {
        return res.status(400).json({
          success: false,
          message: 'At least one field must be provided to update'
        });
      }

      const updateData = {};

      // Validation et ajout de l'email
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }

        // Vérifier si l'email existe déjà pour un autre utilisateur
        const { data: existingUser, error: checkError } = await supabase
          .from('user')
          .select('id')
          .eq('email', email)
          .neq('id', id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing email:', checkError);
          return res.status(500).json({
            success: false,
            message: 'Failed to check existing email',
            error: checkError.message
          });
        }

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists for another user'
          });
        }

        updateData.email = email.toLowerCase().trim();
      }

      // Validation et hash du mot de passe
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
          });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        updateData.password = hashedPassword;
      }

      // Validation et ajout du prénom
      if (first_name) {
        if (first_name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: 'First name must be at least 2 characters long'
          });
        }
        updateData.first_name = first_name.trim();
      }

      // Validation et ajout du nom
      if (last_name) {
        if (last_name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Last name must be at least 2 characters long'
          });
        }
        updateData.last_name = last_name.trim();
      }
      // Ajout de la permission
      if (permission) {
        updateData.permission = permission.trim();
      }
        
      // Validation et ajout du numéro de téléphone
      if (phone_number) {
        if (phone_number.length < 9) {
          return res.status(400).json({
            success: false,
            message: 'Phone number must be at least 9 characters long'
          });
        }
        updateData.phone_number = phone_number;
      }
      // Ajouter la date de mise à jour
      updateData.updated_at = new Date().toISOString();

      // Mettre à jour l'utilisateur
      const { data, error } = await supabase
        .from('user')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        console.error('Error updating user:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update user',
          error: error.message
        });
      }

      // Retourner l'utilisateur sans le mot de passe
      const { password: userPassword, ...userWithoutPassword } = data;

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: userWithoutPassword
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
   * Delete user
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const { data: existingUser, error: checkError } = await supabase
        .from('user')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        console.error('Error checking user existence:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check user existence',
          error: checkError.message
        });
      }

      const { error } = await supabase
        .from('user')
        .delete()
        .eq('id', id);

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
  }
}

module.exports = new UserController();