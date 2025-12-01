const totpController = require('../controllers/totp/TotpController');

const TotpMiddleware = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const code = req.body['code'] || req.body['Code'];

    // Validate required parameters
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'TOTP code is required'
      });
    }

    // Validate code format (must be 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'TOTP code must be exactly 6 digits'
      });
    }

    // Check if TOTP controller has the team secret
    if (!totpController.teamSecrets || !totpController.teamSecrets.has(teamId)) {
      return res.status(404).json({
        success: false,
        message: 'No active TOTP session found for this team',
        error: 'Team must generate a TOTP code first'
      });
    }

    // Create mock response to capture controller result
    let verificationResult = null;
    const mockRes = {
      status: (statusCode) => ({
        json: (data) => {
          verificationResult = { status: statusCode, data };
          return mockRes;
        }
      })
    };

    // Verify TOTP code via controller
    await totpController.verifyTotp(
      { params: { teamId }, body: { code } },
      mockRes
    );

    // Check verification result thoroughly
    if (!verificationResult) {
      return res.status(500).json({
        success: false,
        message: 'TOTP verification failed',
        error: 'No response from verification service'
      });
    }

    // Check if the controller returned an error status
    if (verificationResult.status !== 200) {
      return res.status(401).json({
        success: false,
        message: verificationResult.data?.message || 'TOTP code verification failed',
        error: 'Invalid or expired TOTP code'
      });
    }

    // Check if the controller response indicates success
    if (!verificationResult.data || !verificationResult.data.success) {
      return res.status(401).json({
        success: false,
        message: verificationResult.data?.message || 'TOTP code verification failed',
        error: 'Invalid or expired TOTP code'
      });
    }

    // Most importantly: Check if the code is actually valid
    if (!verificationResult.data.data || !verificationResult.data.data.isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid TOTP code',
        error: 'The provided TOTP code is incorrect or expired'
      });
    }

    console.log(`✅ TOTP verification successful for team ${teamId} with code ${code}`);

    // Attach verification info to request
    req.totpVerified = {
      teamId,
      code,
      verified: true,
      validationData: verificationResult.data.data,
      timestamp: new Date().toISOString()
    };

    next();

  } catch (error) {
    console.error('❌ TOTP Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'TOTP verification failed due to server error',
      error: error.message
    });
  }
};

module.exports = TotpMiddleware;