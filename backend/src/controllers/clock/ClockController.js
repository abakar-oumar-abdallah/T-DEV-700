const supabase = require('../../../config/supabaseClient.js');

class ClockController {
  
  /**
   * Get all clocks
   */
  async getAllClocks(req, res) {
    try {
      const { data, error } = await supabase
        .from('clock')
        .select('*');

      if (error) {
        console.error('Error fetching clocks:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch clocks',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Clocks retrieved successfully',
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
   * Create a new clock entry
   */
  async createClock(req, res) {
    try {
      const { user_id, clock_in, clock_out } = req.body;

      const { data, error } = await supabase
        .from('clock')
        .insert([
          {
            user_id: user_id,
            clock_in: clock_in,
            clock_out: clock_out
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating clock:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create clock',
          error: error.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Clock created successfully',
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
   * Get clock by ID
   */
  async getClockById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('clock')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || data === null) {
          return res.status(404).json({
            success: false,
            message: 'Clock not found'
          });
        }

        console.error('Error fetching clock:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch clock',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Clock retrieved successfully',
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
   * Update clock entry
   */
  async updateClock(req, res) {
    try {
      const { id } = req.params;
      const { user_id, clock_in, clock_out } = req.body;

      const updateData = {};
      
      if (user_id) updateData.user_id = user_id;
      if (clock_in) updateData.clock_in = clock_in;
      if (clock_out) updateData.clock_out = clock_out;

      const { data, error } = await supabase
        .from('clock')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Clock not found'
          });
        }

        console.error('Error updating clock:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update clock',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Clock updated successfully',
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
   * Delete clock entry
   */
  async deleteClock(req, res) {
    try {
      const { id } = req.params;

      const { data: existingClock, error: checkError } = await supabase
        .from('clock')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Clock not found'
          });
        }

        console.error('Error checking clock existence:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check clock existence',
          error: checkError.message
        });
      }

      const { error } = await supabase
        .from('clock')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting clock:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete clock',
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Clock deleted successfully',
        data: {
          deletedClock: existingClock
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

module.exports = new ClockController();