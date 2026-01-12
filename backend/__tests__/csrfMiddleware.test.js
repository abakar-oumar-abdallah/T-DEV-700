const { csrfTokenGenerator, csrfProtection, getCsrfToken } = require('../src/middlewares/CsrfMiddleware');

describe('CsrfMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      cookies: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      locals: {}
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('csrfTokenGenerator', () => {
    it('should generate a CSRF token and set it in cookie', () => {
      csrfTokenGenerator(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          maxAge: 3600000
        })
      );
    });

    it('should set the CSRF token in res.locals', () => {
      csrfTokenGenerator(req, res, next);

      expect(res.locals.csrfToken).toBeDefined();
      expect(typeof res.locals.csrfToken).toBe('string');
      expect(res.locals.csrfToken.length).toBeGreaterThan(0);
    });

    it('should call next()', () => {
      csrfTokenGenerator(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should generate different tokens on each call', () => {
      csrfTokenGenerator(req, res, next);
      const token1 = res.locals.csrfToken;

      res.locals = {};
      csrfTokenGenerator(req, res, next);
      const token2 = res.locals.csrfToken;

      expect(token1).not.toBe(token2);
    });

    it('should use secure cookie in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      csrfTokenGenerator(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({
          secure: true,
          sameSite: 'lax'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should use lax sameSite in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      csrfTokenGenerator(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({
          secure: false,
          sameSite: 'lax'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('csrfProtection', () => {
    it('should allow GET requests without CSRF token', () => {
      req.method = 'GET';

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow HEAD requests without CSRF token', () => {
      req.method = 'HEAD';

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow OPTIONS requests without CSRF token', () => {
      req.method = 'OPTIONS';

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if cookie token is missing', () => {
      req.method = 'POST';
      req.headers['x-csrf-token'] = 'some-token';

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'CSRF token missing',
        error: 'CSRF_TOKEN_MISSING'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if header token is missing', () => {
      req.method = 'POST';
      req.cookies['XSRF-TOKEN'] = 'some-token';

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'CSRF token missing',
        error: 'CSRF_TOKEN_MISSING'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if tokens do not match', () => {
      req.method = 'POST';
      req.cookies['XSRF-TOKEN'] = 'cookie-token';
      req.headers['x-csrf-token'] = 'different-token';

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid CSRF token',
        error: 'CSRF_TOKEN_INVALID'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if tokens match', () => {
      req.method = 'POST';
      const token = 'matching-token';
      req.cookies['XSRF-TOKEN'] = token;
      req.headers['x-csrf-token'] = token;

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept token from x-xsrf-token header', () => {
      req.method = 'POST';
      const token = 'matching-token';
      req.cookies['XSRF-TOKEN'] = token;
      req.headers['x-xsrf-token'] = token;

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should work with PUT method', () => {
      req.method = 'PUT';
      const token = 'matching-token';
      req.cookies['XSRF-TOKEN'] = token;
      req.headers['x-csrf-token'] = token;

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should work with DELETE method', () => {
      req.method = 'DELETE';
      const token = 'matching-token';
      req.cookies['XSRF-TOKEN'] = token;
      req.headers['x-csrf-token'] = token;

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should work with PATCH method', () => {
      req.method = 'PATCH';
      const token = 'matching-token';
      req.cookies['XSRF-TOKEN'] = token;
      req.headers['x-csrf-token'] = token;

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCsrfToken', () => {
    it('should generate and return a CSRF token', () => {
      getCsrfToken(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        csrfToken: expect.any(String)
      });
    });

    it('should set the CSRF token in a cookie', () => {
      getCsrfToken(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          maxAge: 3600000
        })
      );
    });

    it('should return the same token in cookie and response', () => {
      getCsrfToken(req, res);

      const cookieCall = res.cookie.mock.calls[0];
      const jsonCall = res.json.mock.calls[0];

      const cookieToken = cookieCall[1];
      const responseToken = jsonCall[0].csrfToken;

      expect(cookieToken).toBe(responseToken);
    });

    it('should use secure cookie in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      getCsrfToken(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({
          secure: true,
          sameSite: 'lax'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should generate different tokens on each call', () => {
      getCsrfToken(req, res);
      const token1 = res.json.mock.calls[0][0].csrfToken;

      jest.clearAllMocks();
      getCsrfToken(req, res);
      const token2 = res.json.mock.calls[0][0].csrfToken;

      expect(token1).not.toBe(token2);
    });
  });
});
