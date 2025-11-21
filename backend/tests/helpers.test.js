const { validateUrl, generateCode, validateCode } = require('../utils/helpers');

describe('Helper Functions Tests', () => {
  
  describe('validateUrl', () => {
    it('should validate correct HTTP URLs', () => {
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('http://www.example.com')).toBe(true);
    });

    it('should validate correct HTTPS URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('https://www.example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl('javascript:alert(1)')).toBe(false);
    });

    it('should handle URLs with query parameters', () => {
      expect(validateUrl('https://example.com?param=value')).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      expect(validateUrl('https://example.com#section')).toBe(true);
    });
  });

  describe('generateCode', () => {
    it('should generate a 6 character code', () => {
      const code = generateCode();
      expect(code).toHaveLength(6);
    });

    it('should generate alphanumeric codes only', () => {
      const code = generateCode();
      expect(code).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateCode());
      }
      expect(codes.size).toBeGreaterThan(90); // Should be mostly unique
    });
  });

  describe('validateCode', () => {
    it('should accept valid 6 character codes', () => {
      expect(validateCode('abc123')).toBe(true);
      expect(validateCode('ABC123')).toBe(true);
      expect(validateCode('aBc123')).toBe(true);
    });

    it('should accept valid 7 character codes', () => {
      expect(validateCode('abc1234')).toBe(true);
    });

    it('should accept valid 8 character codes', () => {
      expect(validateCode('abcd1234')).toBe(true);
    });

    it('should reject codes shorter than 6 characters', () => {
      expect(validateCode('abc12')).toBe(false);
      expect(validateCode('a')).toBe(false);
      expect(validateCode('')).toBe(false);
    });

    it('should reject codes longer than 8 characters', () => {
      expect(validateCode('abcd12345')).toBe(false);
      expect(validateCode('abcdefghij')).toBe(false);
    });

    it('should reject codes with special characters', () => {
      expect(validateCode('abc@123')).toBe(false);
      expect(validateCode('abc-123')).toBe(false);
      expect(validateCode('abc_123')).toBe(false);
      expect(validateCode('abc 123')).toBe(false);
    });

    it('should reject codes with only special characters', () => {
      expect(validateCode('!@#$%^')).toBe(false);
    });
  });
});
