const TotpController = require('../src/controllers/totp/TotpController.js');
const speakeasy = require('speakeasy');

// Mock speakeasy
jest.mock('speakeasy');

describe('TotpController', () => {
  let req, res, mockIo;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockIo = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis()
    };

    // Clear team secrets before each test
    TotpController.teamSecrets.clear();
    TotpController.setSocketServer(mockIo);

    jest.clearAllMocks();
  });

  describe('generateTotp', () => {
    const mockSecret = {
      base32: 'TESTSECRETBASE32',
      otpauth_url: 'otpauth://totp/Team%201?secret=TESTSECRETBASE32'
    };

    beforeEach(() => {
      speakeasy.generateSecret.mockReturnValue(mockSecret);
      speakeasy.totp.mockReturnValue('123456');
    });

    it('should return 400 if teamId is missing', async () => {
      req.params = {};

      await TotpController.generateTotp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team ID is required'
      });
    });

    it('should generate a new secret and TOTP code for a new team', async () => {
      req.params = { teamId: '1' };

      await TotpController.generateTotp(req, res);

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'Team 1',
        length: 32
      });
      expect(speakeasy.totp).toHaveBeenCalledWith({
        secret: mockSecret.base32,
        encoding: 'base32',
        step: 30
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Code TOTP généré et envoyé via WebSocket',
        data: expect.objectContaining({
          teamId: '1',
          code: '123456',
          expiresIn: expect.any(Number)
        })
      });
    });

    it('should reuse existing secret for a team', async () => {
      req.params = { teamId: '1' };

      // First call - creates secret
      await TotpController.generateTotp(req, res);
      expect(speakeasy.generateSecret).toHaveBeenCalledTimes(1);

      // Second call - reuses secret
      jest.clearAllMocks();
      speakeasy.totp.mockReturnValue('654321');

      await TotpController.generateTotp(req, res);

      expect(speakeasy.generateSecret).not.toHaveBeenCalled();
      expect(speakeasy.totp).toHaveBeenCalledWith({
        secret: mockSecret.base32,
        encoding: 'base32',
        step: 30
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Code TOTP généré et envoyé via WebSocket',
        data: expect.objectContaining({
          code: '654321'
        })
      });
    });

    it('should emit TOTP code via WebSocket', async () => {
      req.params = { teamId: '1' };

      await TotpController.generateTotp(req, res);

      expect(mockIo.emit).toHaveBeenCalledWith(
        'totp:1',
        expect.objectContaining({
          teamId: '1',
          code: '123456',
          expiresIn: expect.any(Number),
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle errors gracefully', async () => {
      req.params = { teamId: '1' };
      speakeasy.generateSecret.mockImplementation(() => {
        throw new Error('Speakeasy error');
      });

      await TotpController.generateTotp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Speakeasy error'
      });
    });
  });

  describe('verifyTotp', () => {
    beforeEach(() => {
      speakeasy.generateSecret.mockReturnValue({
        base32: 'TESTSECRET'
      });
      speakeasy.totp.mockReturnValue('123456');
    });

    it('should return 400 if teamId is missing', async () => {
      req.params = {};
      req.body = { code: '123456' };

      await TotpController.verifyTotp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team ID is required'
      });
    });

    it('should return 400 if code is missing', async () => {
      req.params = { teamId: '1' };
      req.body = {};

      await TotpController.verifyTotp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP code is required'
      });
    });

    it('should return 400 if code format is invalid', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '12345' }; // Only 5 digits

      await TotpController.verifyTotp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP code must be exactly 6 digits'
      });
    });

    it('should return 400 if code contains non-digits', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '12345a' };

      await TotpController.verifyTotp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'TOTP code must be exactly 6 digits'
      });
    });

    it('should return 404 if no secret exists for the team', async () => {
      req.params = { teamId: '999' };
      req.body = { code: '123456' };

      await TotpController.verifyTotp(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No TOTP secret found for team 999. Please generate a TOTP code first.'
      });
    });

    it('should verify a valid TOTP code', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '123456' };

      // First generate a code to create the secret
      await TotpController.generateTotp({ params: { teamId: '1' } }, res);

      // Mock verification to return true
      speakeasy.totp.verify = jest.fn().mockReturnValue(true);

      await TotpController.verifyTotp(req, res);

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: expect.any(String),
        encoding: 'base32',
        token: '123456',
        step: 30,
        window: 2
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Valid TOTP',
        data: expect.objectContaining({
          teamId: '1',
          isValid: true,
          code: '123456'
        })
      });
    });

    it('should reject an invalid TOTP code', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '999999' };

      // First generate a code to create the secret
      await TotpController.generateTotp({ params: { teamId: '1' } }, res);

      // Mock verification to return false
      speakeasy.totp.verify = jest.fn().mockReturnValue(false);

      await TotpController.verifyTotp(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Invalid or expired TOTP code',
        data: expect.objectContaining({
          isValid: false
        })
      });
    });

    it('should emit verification result via WebSocket', async () => {
      req.params = { teamId: '1' };
      req.body = { code: '123456' };

      // Generate secret first
      await TotpController.generateTotp({ params: { teamId: '1' } }, res);

      speakeasy.totp.verify = jest.fn().mockReturnValue(true);
      jest.clearAllMocks();

      await TotpController.verifyTotp(req, res);

      expect(mockIo.to).toHaveBeenCalledWith('team:1');
      expect(mockIo.emit).toHaveBeenCalledWith(
        'totp:verify:1',
        expect.objectContaining({
          teamId: '1',
          code: '123456',
          isValid: true
        })
      );
    });
  });

  describe('resetTeamSecret', () => {
    it('should return 400 if teamId is missing', async () => {
      req.params = {};

      await TotpController.resetTeamSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Team ID is required'
      });
    });

    it('should reset existing secret for a team', async () => {
      req.params = { teamId: '1' };

      // First generate a secret
      speakeasy.generateSecret.mockReturnValue({ base32: 'TEST' });
      speakeasy.totp.mockReturnValue('123456');
      await TotpController.generateTotp(req, res);

      // Now reset it
      await TotpController.resetTeamSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Secret reset successfully for team 1',
        data: {
          teamId: '1',
          secretExisted: true
        }
      });

      // Verify secret was deleted
      expect(TotpController.teamSecrets.has('1')).toBe(false);
    });

    it('should handle reset for non-existent team', async () => {
      req.params = { teamId: '999' };

      await TotpController.resetTeamSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'No secret found for team 999, nothing to reset',
        data: {
          teamId: '999',
          secretExisted: false
        }
      });
    });

    it('should handle errors gracefully', async () => {
      req.params = { teamId: '1' };

      // Mock delete to throw error
      const originalDelete = TotpController.teamSecrets.delete;
      TotpController.teamSecrets.delete = jest.fn().mockImplementation(() => {
        throw new Error('Delete error');
      });

      await TotpController.resetTeamSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Delete error'
      });

      // Restore original method
      TotpController.teamSecrets.delete = originalDelete;
    });
  });

  describe('setSocketServer', () => {
    it('should set the socket server reference', () => {
      const newIo = { test: 'socket' };
      TotpController.setSocketServer(newIo);

      expect(TotpController.io).toBe(newIo);
    });
  });
});
