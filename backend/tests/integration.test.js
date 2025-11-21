const request = require('supertest');
const express = require('express');
const { pool } = require('../config/database');

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

const app = express();
app.use(express.json());
app.use('/api/links', linksRouter);
app.use('/', redirectRouter);

describe('Integration Tests - Full Flow', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full link lifecycle: create, redirect, stats, delete', async () => {
    const mockLink = {
      code: 'test123',
      target_url: 'https://example.com',
      total_clicks: 0,
      last_clicked: null,
      created_at: new Date()
    };

    // 1. Create link
    pool.query.mockResolvedValueOnce({ rows: [mockLink] });
    const createRes = await request(app)
      .post('/api/links')
      .send({ target_url: 'https://example.com', code: 'test123' });
    
    expect(createRes.status).toBe(201);
    expect(createRes.body.code).toBe('test123');

    // 2. Redirect (first click)
    const updatedLink = { ...mockLink, total_clicks: 1, last_clicked: new Date() };
    pool.query.mockResolvedValueOnce({ rows: [updatedLink] });
    const redirectRes = await request(app).get('/test123');
    
    expect(redirectRes.status).toBe(302);
    expect(redirectRes.header.location).toBe('https://example.com');

    // 3. Check stats
    pool.query.mockResolvedValueOnce({ rows: [updatedLink] });
    const statsRes = await request(app).get('/api/links/test123');
    
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.total_clicks).toBe(1);

    // 4. Delete link
    pool.query.mockResolvedValueOnce({ rows: [mockLink] });
    const deleteRes = await request(app).delete('/api/links/test123');
    
    expect(deleteRes.status).toBe(200);

    // 5. Verify redirect returns 404 after deletion
    pool.query.mockResolvedValueOnce({ rows: [] });
    const notFoundRes = await request(app).get('/test123');
    
    expect(notFoundRes.status).toBe(404);
  });

  it('should handle multiple clicks and update stats correctly', async () => {
    const mockLink = {
      code: 'popular',
      target_url: 'https://example.com',
      total_clicks: 0,
      last_clicked: null
    };

    // First click
    pool.query.mockResolvedValueOnce({ 
      rows: [{ ...mockLink, total_clicks: 1, last_clicked: new Date() }] 
    });
    await request(app).get('/popular');

    // Second click
    pool.query.mockResolvedValueOnce({ 
      rows: [{ ...mockLink, total_clicks: 2, last_clicked: new Date() }] 
    });
    await request(app).get('/popular');

    // Check stats
    pool.query.mockResolvedValueOnce({ 
      rows: [{ ...mockLink, total_clicks: 2, last_clicked: new Date() }] 
    });
    const statsRes = await request(app).get('/api/links/popular');

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.total_clicks).toBe(2);
  });

  it('should prevent duplicate code creation', async () => {
    // First creation succeeds
    pool.query.mockResolvedValueOnce({ 
      rows: [{ code: 'unique', target_url: 'https://example.com' }] 
    });
    const firstRes = await request(app)
      .post('/api/links')
      .send({ target_url: 'https://example.com', code: 'unique' });
    
    expect(firstRes.status).toBe(201);

    // Second creation with same code fails
    pool.query.mockRejectedValueOnce({ code: '23505' });
    const secondRes = await request(app)
      .post('/api/links')
      .send({ target_url: 'https://different.com', code: 'unique' });
    
    expect(secondRes.status).toBe(409);
    expect(secondRes.body.error).toBe('Code already exists');
  });

  it('should handle listing multiple links', async () => {
    const mockLinks = [
      { code: 'link1', target_url: 'https://example1.com', total_clicks: 5 },
      { code: 'link2', target_url: 'https://example2.com', total_clicks: 10 },
      { code: 'link3', target_url: 'https://example3.com', total_clicks: 0 }
    ];

    pool.query.mockResolvedValueOnce({ rows: mockLinks });
    const res = await request(app).get('/api/links');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].code).toBe('link1');
    expect(res.body[1].code).toBe('link2');
    expect(res.body[2].code).toBe('link3');
  });
});
