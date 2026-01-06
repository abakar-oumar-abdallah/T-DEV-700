const TotpMiddleware = require('../src/middlewares/TotpMiddleware');
const totpController = require('../src/controllers/totp/TotpController');

// Mock the totpController
jest.mock('../src/controllers/totp/TotpController');

describe('TotpMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should return 400 if teamId is missing', async () => {
      req.body = { code: '123456' };

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team ID is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if code is missing', async () => {
      req.params = { teamId: '1' };

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP code is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept code with lowercase "code" field', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '123456' };

      totpController.teamSecrets = new Map([['1', { base32: 'SECRET' }]]);
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        mockRes.status(200).json({
          success: true,
          data: { isValid: true }
        });
      });

      await TotpMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should accept code with uppercase "Code" field', async () => {
      req.params = { teamId: '1' };
      req.body = { Code: '123456' };

      totpController.teamSecrets = new Map([['1', { base32: 'SECRET' }]]);
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        mockRes.status(200).json({
          success: true,
          data: { isValid: true }
        });
      });

      await TotpMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 400 if code is not 6 digits', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '12345' };

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP code must be exactly 6 digits'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if code contains non-digits', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '12345a' };

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP code must be exactly 6 digits'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if code has more than 6 digits', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '1234567' };

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP code must be exactly 6 digits'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if no TOTP secret exists for team', async () => {
      req.params = { teamId: '999' };
      req.body = { code: '123456' };

      totpController.teamSecrets = new Map();

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No active TOTP session found for this team',
        error: 'Team must generate a TOTP code first'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if teamSecrets is undefined', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '123456' };

      totpController.teamSecrets = undefined;

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No active TOTP session found for this team',
        error: 'Team must generate a TOTP code first'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('TOTP Verification', () => {
    beforeEach(() => {
      req.params = { teamId: '1' };
      req.body = { code: '123456' };
      totpController.teamSecrets = new Map([['1', { base32: 'SECRET' }]]);
    });

    it('should return 401 if verification returns non-200 status', async () => {
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        mockRes.status(500).json({
          success: false,
          message: 'Server error'
        });
      });

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
        error: 'Invalid or expired TOTP code'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if verification response is not successful', async () => {
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        mockRes.status(200).json({
          success: false,
          message: 'Verification failed'
        });
      });

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Verification failed',
        error: 'Invalid or expired TOTP code'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if code is invalid (isValid = false)', async () => {
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        mockRes.status(200).json({
          success: true,
          data: { isValid: false }
        });
      });

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid TOTP code',
        error: 'The provided TOTP code is incorrect or expired'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 if verification returns no result', async () => {
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        // Do nothing - no response
      });

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP verification failed',
        error: 'No response from verification service'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if verification is successful', async () => {
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        mockRes.status(200).json({
          success: true,
          data: {
            isValid: true,
            teamId: '1',
            code: '123456'
          }
        });
      });

      await TotpMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should attach verification info to req.totpVerified', async () => {
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        mockRes.status(200).json({
          success: true,
          data: {
            isValid: true,
            teamId: '1',
            code: '123456'
          }
        });
      });

      await TotpMiddleware(req, res, next);

      expect(req.totpVerified).toBeDefined();
      expect(req.totpVerified.teamId).toBe('1');
      expect(req.totpVerified.code).toBe('123456');
      expect(req.totpVerified.verified).toBe(true);
      expect(req.totpVerified.timestamp).toBeDefined();
      expect(req.totpVerified.validationData).toEqual({
        isValid: true,
        teamId: '1',
        code: '123456'
      });
    });

    it('should log success message on successful verification', async () => {
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        mockRes.status(200).json({
          success: true,
          data: { isValid: true }
        });
      });

      await TotpMiddleware(req, res, next);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ TOTP verification successful for team 1 with code 123456')
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      req.params = { teamId: '1' };
      req.body = { code: '123456' };
      totpController.teamSecrets = new Map([['1', { base32: 'SECRET' }]]);
    });

    it('should handle errors thrown by verifyTotp', async () => {
      totpController.verifyTotp = jest.fn(() => {
        throw new Error('Verification service error');
      });

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP verification failed due to server error',
        error: 'Verification service error'
      });
      expect(console.error).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      totpController.verifyTotp = jest.fn(() => {
        throw new Error('Unexpected error');
      });

      await TotpMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP verification failed due to server error',
        error: 'Unexpected error'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete successful flow', async () => {
      req.params = { teamId: '5' };
      req.body = { Code: '654321' };
      totpController.teamSecrets = new Map([['5', { base32: 'TESTSECRET' }]]);
      totpController.verifyTotp = jest.fn((mockReq, mockRes) => {
        mockRes.status(200).json({
          success: true,
          message: 'Valid TOTP',
          data: {
            isValid: true,
            teamId: '5',
            code: '654321',
            timestamp: new Date().toISOString()
          }
        });
      });

      await TotpMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.totpVerified).toBeDefined();
      expect(req.totpVerified.teamId).toBe('5');
      expect(req.totpVerified.code).toBe('654321');
      expect(req.totpVerified.verified).toBe(true);
    });
  });
});
