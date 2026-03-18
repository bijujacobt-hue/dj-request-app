import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { resetDb, createApp } from '../setup.js';

const app = createApp();

describe('DJ Routes', () => {
  let request;

  beforeEach(() => {
    resetDb();
    request = supertest(app);
  });

  describe('POST /api/dj/create', () => {
    it('creates a new DJ', async () => {
      const res = await request
        .post('/api/dj/create')
        .send({ name: 'DJ Test' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toMatch(/^dj_/);
      expect(res.body.name).toBe('DJ Test');
    });

    it('returns 400 for empty name', async () => {
      const res = await request
        .post('/api/dj/create')
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 for missing name', async () => {
      const res = await request
        .post('/api/dj/create')
        .send({});

      expect(res.status).toBe(400);
    });

    it('trims whitespace from name', async () => {
      const res = await request
        .post('/api/dj/create')
        .send({ name: '  DJ Spaces  ' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('DJ Spaces');
    });

    it('stores optional contact fields', async () => {
      const res = await request
        .post('/api/dj/create')
        .send({ name: 'DJ Contact', contact_email: 'dj@test.com', contact_phone: '555-1234' });

      expect(res.status).toBe(201);
      expect(res.body.contact_email).toBe('dj@test.com');
      expect(res.body.contact_phone).toBe('555-1234');
    });
  });

  describe('POST /api/dj/login', () => {
    it('logs in with valid DJ ID', async () => {
      const created = await request.post('/api/dj/create').send({ name: 'DJ Login' });
      const res = await request
        .post('/api/dj/login')
        .send({ id: created.body.id });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('DJ Login');
    });

    it('returns 404 for invalid ID', async () => {
      const res = await request
        .post('/api/dj/login')
        .send({ id: 'dj_nonexistent' });

      expect(res.status).toBe(404);
    });

    it('returns 400 for missing ID', async () => {
      const res = await request
        .post('/api/dj/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/dj/:id', () => {
    it('gets DJ by ID', async () => {
      const created = await request.post('/api/dj/create').send({ name: 'DJ Get' });
      const res = await request.get(`/api/dj/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('DJ Get');
    });

    it('returns 404 for nonexistent ID', async () => {
      const res = await request.get('/api/dj/dj_nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/dj/:id', () => {
    it('updates DJ name', async () => {
      const created = await request.post('/api/dj/create').send({ name: 'Old Name' });
      const res = await request
        .put(`/api/dj/${created.body.id}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('updates contact info', async () => {
      const created = await request.post('/api/dj/create').send({ name: 'DJ Update' });
      const res = await request
        .put(`/api/dj/${created.body.id}`)
        .send({ contact_email: 'new@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.contact_email).toBe('new@test.com');
    });

    it('returns 404 for nonexistent DJ', async () => {
      const res = await request
        .put('/api/dj/dj_nonexistent')
        .send({ name: 'Whatever' });

      expect(res.status).toBe(404);
    });
  });
});
