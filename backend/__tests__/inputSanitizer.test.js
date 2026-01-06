const {
  sanitizeInput,
  sanitizeObject,
  escapeHtml,
  stripHtmlTags,
  validateAndSanitizeEmail,
  validateAndSanitizeText
} = require('../src/middlewares/InputSanitizer');

describe('InputSanitizer', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
      expect(escapeHtml("It's working")).toBe('It&#x27;s working');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(123)).toBe(123);
      expect(escapeHtml(null)).toBe(null);
      expect(escapeHtml(undefined)).toBe(undefined);
    });

    it('should return empty string for empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('stripHtmlTags', () => {
    it('should remove HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      expect(stripHtmlTags(input)).toBe('Hello World');
    });

    it('should remove script tags', () => {
      const input = '<script>alert("XSS")</script>';
      expect(stripHtmlTags(input)).toBe('alert("XSS")');
    });

    it('should remove self-closing tags', () => {
      const input = 'Hello<br/>World';
      expect(stripHtmlTags(input)).toBe('HelloWorld');
    });

    it('should handle non-string input', () => {
      expect(stripHtmlTags(123)).toBe(123);
      expect(stripHtmlTags(null)).toBe(null);
      expect(stripHtmlTags(undefined)).toBe(undefined);
    });

    it('should handle text without HTML tags', () => {
      expect(stripHtmlTags('Plain text')).toBe('Plain text');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values by escaping HTML', () => {
      const input = { text: '<script>XSS</script>' };
      const result = sanitizeObject(input, false);
      expect(result.text).toBe('&lt;script&gt;XSS&lt;&#x2F;script&gt;');
    });

    it('should sanitize string values by stripping HTML in strict mode', () => {
      const input = { text: '<script>XSS</script>' };
      const result = sanitizeObject(input, true);
      expect(result.text).toBe('XSS');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          email: 'test@example.com'
        }
      };
      const result = sanitizeObject(input, true);
      expect(result.user.name).toBe('John');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should sanitize arrays', () => {
      const input = ['<script>1</script>', '<b>2</b>', 'plain'];
      const result = sanitizeObject(input, true);
      expect(result).toEqual(['1', '2', 'plain']);
    });

    it('should sanitize arrays within objects', () => {
      const input = {
        tags: ['<tag1>', '<tag2>'],
        name: '<name>'
      };
      const result = sanitizeObject(input, true);
      expect(result.tags).toEqual(['', '']);
      expect(result.name).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });

    it('should preserve numbers', () => {
      const input = { age: 25, score: 100 };
      const result = sanitizeObject(input);
      expect(result.age).toBe(25);
      expect(result.score).toBe(100);
    });

    it('should preserve booleans', () => {
      const input = { active: true, verified: false };
      const result = sanitizeObject(input);
      expect(result.active).toBe(true);
      expect(result.verified).toBe(false);
    });

    it('should handle complex nested structures', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          posts: [
            { title: '<script>Title</script>', views: 100 },
            { title: 'Normal', views: 50 }
          ]
        }
      };
      const result = sanitizeObject(input, true);
      expect(result.user.name).toBe('John');
      expect(result.user.posts[0].title).toBe('Title');
      expect(result.user.posts[0].views).toBe(100);
      expect(result.user.posts[1].title).toBe('Normal');
    });
  });

  describe('sanitizeInput middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {},
        query: {},
        params: {}
      };
      res = {};
      next = jest.fn();
    });

    it('should sanitize req.body', () => {
      const middleware = sanitizeInput();
      req.body = { message: '<script>XSS</script>' };

      middleware(req, res, next);

      expect(req.body.message).toBe('&lt;script&gt;XSS&lt;&#x2F;script&gt;');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should sanitize req.query', () => {
      const middleware = sanitizeInput();
      req.query = { search: '<b>query</b>' };

      middleware(req, res, next);

      expect(req.query.search).toBe('&lt;b&gt;query&lt;&#x2F;b&gt;');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should sanitize req.params', () => {
      const middleware = sanitizeInput();
      req.params = { id: '<script>1</script>' };

      middleware(req, res, next);

      expect(req.params.id).toBe('&lt;script&gt;1&lt;&#x2F;script&gt;');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should use strict mode when specified', () => {
      const middleware = sanitizeInput({ strict: true });
      req.body = { message: '<script>XSS</script>' };

      middleware(req, res, next);

      expect(req.body.message).toBe('XSS');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle missing req properties', () => {
      const middleware = sanitizeInput();
      delete req.body;
      delete req.query;
      delete req.params;

      expect(() => middleware(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should sanitize all request parts at once', () => {
      const middleware = sanitizeInput({ strict: true });
      req.body = { name: '<b>Body</b>' };
      req.query = { search: '<i>Query</i>' };
      req.params = { id: '<u>Param</u>' };

      middleware(req, res, next);

      expect(req.body.name).toBe('Body');
      expect(req.query.search).toBe('Query');
      expect(req.params.id).toBe('Param');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateAndSanitizeEmail', () => {
    it('should validate and sanitize correct email', () => {
      const result = validateAndSanitizeEmail('Test@Example.COM');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('test@example.com');
      expect(result.error).toBe(null);
    });

    it('should trim whitespace from email', () => {
      const result = validateAndSanitizeEmail('  test@example.com  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('test@example.com');
    });

    it('should reject invalid email format', () => {
      const result = validateAndSanitizeEmail('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject email without @', () => {
      const result = validateAndSanitizeEmail('testemail.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject email without domain', () => {
      const result = validateAndSanitizeEmail('test@');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject missing email', () => {
      const result = validateAndSanitizeEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject null email', () => {
      const result = validateAndSanitizeEmail(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject non-string email', () => {
      const result = validateAndSanitizeEmail(123);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email that is too long', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      const result = validateAndSanitizeEmail(longEmail);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email too long');
    });

    it('should accept email at max length', () => {
      const email = 'a'.repeat(240) + '@test.com'; // total < 255
      const result = validateAndSanitizeEmail(email);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAndSanitizeText', () => {
    it('should validate and sanitize correct text', () => {
      const result = validateAndSanitizeText('Hello World');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello World');
      expect(result.error).toBe(null);
    });

    it('should trim whitespace', () => {
      const result = validateAndSanitizeText('  Hello  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello');
    });

    it('should strip HTML by default', () => {
      const result = validateAndSanitizeText('<b>Hello</b>');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello');
    });

    it('should allow HTML when allowHtml is true', () => {
      const result = validateAndSanitizeText('<b>Hello</b>', { allowHtml: true });
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('<b>Hello</b>');
    });

    it('should reject text shorter than minLength', () => {
      const result = validateAndSanitizeText('Hi', { minLength: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text must be at least 5 characters');
    });

    it('should reject text longer than maxLength', () => {
      const result = validateAndSanitizeText('Hello World', { maxLength: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text must be at most 5 characters');
    });

    it('should accept text at minLength boundary', () => {
      const result = validateAndSanitizeText('Hello', { minLength: 5 });
      expect(result.valid).toBe(true);
    });

    it('should accept text at maxLength boundary', () => {
      const result = validateAndSanitizeText('Hello', { maxLength: 5 });
      expect(result.valid).toBe(true);
    });

    it('should reject empty text when required', () => {
      const result = validateAndSanitizeText('', { required: true });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text is required');
    });

    it('should accept empty text when not required', () => {
      const result = validateAndSanitizeText('', { required: false });
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('');
    });

    it('should reject null when required', () => {
      const result = validateAndSanitizeText(null, { required: true });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text is required');
    });

    it('should accept null when not required', () => {
      const result = validateAndSanitizeText(null, { required: false });
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('');
    });

    it('should reject non-string when required', () => {
      const result = validateAndSanitizeText(123, { required: true });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text is required');
    });

    it('should use default options', () => {
      const result = validateAndSanitizeText('Test');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Test');
    });

    it('should validate with multiple constraints', () => {
      const result = validateAndSanitizeText('Hello World', {
        minLength: 5,
        maxLength: 20,
        required: true,
        allowHtml: false
      });
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello World');
    });
  });
});
