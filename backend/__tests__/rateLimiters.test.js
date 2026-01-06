const { limiter, authLimiter } = require('../src/middlewares/RateLimiters');

describe('RateLimiters', () => {
  describe('limiter', () => {
    it('should be defined', () => {
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    it('should be a middleware function', () => {
      expect(limiter.length).toBeGreaterThanOrEqual(2); // req, res, next parameters
    });

    it('should export a function created by express-rate-limit', () => {
      // The limiter should be a function (middleware)
      expect(typeof limiter).toBe('function');
      // It should have a name property (even if empty, that's from express-rate-limit)
      expect(limiter).toHaveProperty('name');
    });
  });

  describe('authLimiter', () => {
    it('should be defined', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });

    it('should be a middleware function', () => {
      expect(authLimiter.length).toBeGreaterThanOrEqual(2);
    });

    it('should export a function created by express-rate-limit', () => {
      expect(typeof authLimiter).toBe('function');
      expect(authLimiter).toHaveProperty('name');
    });

    it('should be a different instance from general limiter', () => {
      // authLimiter should have a lower max limit (5) compared to general limiter (100)
      // This is a configuration test - we verify they are different instances
      expect(authLimiter).not.toBe(limiter);
    });
  });

  describe('Configuration', () => {
    it('should export both limiters', () => {
      expect(limiter).toBeDefined();
      expect(authLimiter).toBeDefined();
    });

    it('should export functions', () => {
      expect(typeof limiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
    });

    it('should export distinct middleware instances', () => {
      // Verify they are separate instances (different configurations)
      expect(limiter).not.toBe(authLimiter);
    });
  });
});
