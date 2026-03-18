import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { resetDb, createApp } from '../setup.js';

const app = createApp();

describe('Guest Routes', () => {
  let request, dj, event;

  beforeEach(async () => {
    resetDb();
    request = supertest(app);
    const djRes = await request.post('/api/dj/create').send({ name: 'DJ Guest' });
    dj = djRes.body;
    const evtRes = await request.post('/api/events').send({ dj_id: dj.id, name: 'Guest Event' });
    event = evtRes.body;
  });

  describe('POST /api/guests', () => {
    it('creates a guest with random name', async () => {
      const res = await request.post('/api/guests').send({ event_id: event.id });

      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^guest_/);
      expect(res.body.event_id).toBe(event.id);
      expect(res.body.display_name).toBeTruthy();
      expect(res.body.display_name.split(' ')).toHaveLength(2);
    });

    it('returns 400 for missing event_id', async () => {
      const res = await request.post('/api/guests').send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent event', async () => {
      const res = await request.post('/api/guests').send({ event_id: 'evt_fake' });
      expect(res.status).toBe(404);
    });

    it('returns 400 for closed event', async () => {
      await request.put(`/api/events/${event.id}/close`);
      const res = await request.post('/api/guests').send({ event_id: event.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('closed');
    });
  });

  describe('GET /api/guests/:guestId', () => {
    it('gets guest by ID', async () => {
      const created = await request.post('/api/guests').send({ event_id: event.id });
      const res = await request.get(`/api/guests/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.display_name).toBe(created.body.display_name);
    });

    it('returns 404 for nonexistent guest', async () => {
      const res = await request.get('/api/guests/guest_fake');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/guests/:guestId/name', () => {
    it('updates guest name', async () => {
      const created = await request.post('/api/guests').send({ event_id: event.id });
      const res = await request.put(`/api/guests/${created.body.id}/name`).send({ display_name: 'Custom Name' });

      expect(res.status).toBe(200);
      expect(res.body.display_name).toBe('Custom Name');
    });

    it('trims whitespace', async () => {
      const created = await request.post('/api/guests').send({ event_id: event.id });
      const res = await request.put(`/api/guests/${created.body.id}/name`).send({ display_name: '  Trimmed  ' });

      expect(res.status).toBe(200);
      expect(res.body.display_name).toBe('Trimmed');
    });

    it('returns 400 for empty name', async () => {
      const created = await request.post('/api/guests').send({ event_id: event.id });
      const res = await request.put(`/api/guests/${created.body.id}/name`).send({ display_name: '' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent guest', async () => {
      const res = await request.put('/api/guests/guest_fake/name').send({ display_name: 'Test' });
      expect(res.status).toBe(404);
    });
  });
});
