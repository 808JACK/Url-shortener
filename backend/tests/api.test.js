const request = require('supertest');
const express = require('express');
const { pool } = require('../config/database');

// Mock the database
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn()
    }))
  },
  initDatabase: jest.fn()
}));

const linksRouter = require('../routes/links');
const redirectRouter = require('../routes/redirect');
const healthRouter = require('../routes/health');

const app = express();
app.use(express.json());
app.use('/healthz', healthRouter);
app.use('/api/links', linksRouter);
app.use('/', redirectRouter);

describe('TinyLink API Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Health Check Tests
  describe('GET /healthz', () => {
    it('should return 200 and health status', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('version');
    });
  });

  // Create Link Tests
  describe('POST /api/links', () => {
    it('should create a new link with custom code', async () => {
      const mockLink = {
        code: 'test123',
        target_url: 'https://example.com',
        total_clicks: 0,
        created_at: new Date()
      };

      pool.query.mockResolvedValueOnce({ rows: [mockLink] });

      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com', code: 'test123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('code', 'test123');
      expect(res.body).toHaveProperty('target_url', 'https://example.com');
    });

    it('should create a link with auto-generated code', async () => {
      const mockLink = {
        code: 'abc123',
        target_url: 'https://example.com',
        total_clicks: 0,
        created_at: new Date()
      };

      pool.query.mockResolvedValueOnce({ rows: [mockLink] });

      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('code');
      expect(res.body.code).toMatch(/^[A-Za-z0-9]{6}$/);
    });

    it('should return 409 if code already exists', async () => {
      pool.query.mockRejectedValueOnce({ code: '23505' });

      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com', code: 'test123' });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'Code already exists');
    });

    it('should return 400 for invalid URL', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'not-a-valid-url', code: 'test123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid URL');
    });

    it('should return 400 for invalid code format', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com', code: 'ab' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Code must be 6-8 alphanumeric characters');
    });

    it('should reject code with special characters', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com', code: 'test@123' });

      expect(res.status).toBe(400);
    });
  });

  // Get All Links Tests
  describe('GET /api/links', () => {
    it('should return all links', async () => {
      const mockLinks = [
        { code: 'abc123', target_url: 'https://example.com', total_clicks: 5 },
        { code: 'xyz789', target_url: 'https://test.com', total_clicks: 10 }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockLinks });

      const res = await request(app).get('/api/links');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('code', 'abc123');
    });

    it('should return empty array when no links exist', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/links');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // Get Single Link Stats Tests
  describe('GET /api/links/:code', () => {
    it('should return stats for a specific link', async () => {
      const mockLink = {
        code: 'test123',
        target_url: 'https://example.com',
        total_clicks: 15,
        last_clicked: new Date(),
        created_at: new Date()
      };

      pool.query.mockResolvedValueOnce({ rows: [mockLink] });

      const res = await request(app).get('/api/links/test123');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('code', 'test123');
      expect(res.body).toHaveProperty('total_clicks', 15);
    });

    it('should return 404 for non-existent link', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/links/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Link not found');
    });
  });

  // Delete Link Tests
  describe('DELETE /api/links/:code', () => {
    it('should delete a link successfully', async () => {
      const mockLink = { code: 'test123', target_url: 'https://example.com' };

      pool.query.mockResolvedValueOnce({ rows: [mockLink] });

      const res = await request(app).delete('/api/links/test123');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Link deleted successfully');
    });

    it('should return 404 when deleting non-existent link', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).delete('/api/links/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Link not found');
    });
  });

  // Redirect Tests
  describe('GET /:code', () => {
    it('should redirect to target URL and increment clicks', async () => {
      const mockLink = { target_url: 'https://example.com' };

      pool.query.mockResolvedValueOnce({ rows: [mockLink] });

      const res = await request(app).get('/test123');

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('https://example.com');
    });

    it('should return 404 for non-existent code', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Link not found');
    });

    it('should return 404 after link is deleted', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/deleted123');

      expect(res.status).toBe(404);
    });
  });

  // Code Validation Tests
  describe('Code Validation', () => {
    it('should accept 6 character alphanumeric code', async () => {
      pool.query.mockResolvedValueOnce({ 
        rows: [{ code: 'abc123', target_url: 'https://example.com' }] 
      });

      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com', code: 'abc123' });

      expect(res.status).toBe(201);
    });

    it('should accept 8 character alphanumeric code', async () => {
      pool.query.mockResolvedValueOnce({ 
        rows: [{ code: 'abcd1234', target_url: 'https://example.com' }] 
      });

      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com', code: 'abcd1234' });

      expect(res.status).toBe(201);
    });

    it('should reject code shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com', code: 'abc12' });

      expect(res.status).toBe(400);
    });

    it('should reject code longer than 8 characters', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com', code: 'abcd12345' });

      expect(res.status).toBe(400);
    });
  });
});
