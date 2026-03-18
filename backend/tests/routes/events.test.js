import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { resetDb, createApp } from '../setup.js';

const app = createApp();

describe('Event Routes', () => {
  let request, dj;

  beforeEach(async () => {
    resetDb();
    request = supertest(app);
    const res = await request.post('/api/dj/create').send({ name: 'DJ Events' });
    dj = res.body;
  });

  describe('POST /api/events', () => {
    it('creates an event', async () => {
      const res = await request
        .post('/api/events')
        .send({ dj_id: dj.id, name: 'Friday Night' });

      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^evt_/);
      expect(res.body.name).toBe('Friday Night');
      expect(res.body.dj_id).toBe(dj.id);
      expect(res.body.is_active).toBe(1);
    });

    it('returns 400 for missing dj_id', async () => {
      const res = await request.post('/api/events').send({ name: 'Test' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing name', async () => {
      const res = await request.post('/api/events').send({ dj_id: dj.id });
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent DJ', async () => {
      const res = await request.post('/api/events').send({ dj_id: 'dj_fake', name: 'Test' });
      expect(res.status).toBe(404);
    });

    it('stores optional event_date', async () => {
      const res = await request
        .post('/api/events')
        .send({ dj_id: dj.id, name: 'Dated Event', event_date: '2026-04-01' });

      expect(res.status).toBe(201);
      expect(res.body.event_date).toBe('2026-04-01');
    });
  });

  describe('GET /api/events/dj/:djId', () => {
    it('lists events for a DJ', async () => {
      await request.post('/api/events').send({ dj_id: dj.id, name: 'Event 1' });
      await request.post('/api/events').send({ dj_id: dj.id, name: 'Event 2' });

      const res = await request.get(`/api/events/dj/${dj.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('request_count');
      expect(res.body[0]).toHaveProperty('total_votes');
    });

    it('returns empty array for DJ with no events', async () => {
      const res = await request.get(`/api/events/dj/${dj.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/events/:id', () => {
    it('gets single event', async () => {
      const created = await request.post('/api/events').send({ dj_id: dj.id, name: 'Get Me' });
      const res = await request.get(`/api/events/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Get Me');
      expect(res.body).toHaveProperty('request_count');
    });

    it('returns 404 for nonexistent event', async () => {
      const res = await request.get('/api/events/evt_fake');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/events/:id/close', () => {
    it('closes an event', async () => {
      const created = await request.post('/api/events').send({ dj_id: dj.id, name: 'Close Me' });
      const res = await request.put(`/api/events/${created.body.id}/close`);

      expect(res.status).toBe(200);
      expect(res.body.is_active).toBe(0);
      expect(res.body.closed_at).toBeTruthy();
    });

    it('returns 404 for nonexistent event', async () => {
      const res = await request.put('/api/events/evt_fake/close');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('updates footer_text', async () => {
      const created = await request.post('/api/events').send({ dj_id: dj.id, name: 'Footer Test' });
      const res = await request.put(`/api/events/${created.body.id}`).send({ footer_text: 'Thanks for coming!' });

      expect(res.status).toBe(200);
      expect(res.body.footer_text).toBe('Thanks for coming!');
    });

    it('updates download_folder', async () => {
      const created = await request.post('/api/events').send({ dj_id: dj.id, name: 'Folder Test' });
      const res = await request.put(`/api/events/${created.body.id}`).send({ download_folder: '/music/downloads' });

      expect(res.status).toBe(200);
      expect(res.body.download_folder).toBe('/music/downloads');
    });

    it('returns 404 for nonexistent event', async () => {
      const res = await request.put('/api/events/evt_fake').send({ footer_text: 'test' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('deletes an event', async () => {
      const created = await request.post('/api/events').send({ dj_id: dj.id, name: 'Delete Me' });
      const res = await request.delete(`/api/events/${created.body.id}`);
      expect(res.status).toBe(200);

      const get = await request.get(`/api/events/${created.body.id}`);
      expect(get.status).toBe(404);
    });

    it('returns 404 for nonexistent event', async () => {
      const res = await request.delete('/api/events/evt_fake');
      expect(res.status).toBe(404);
    });

    it('cascade deletes requests and guests', async () => {
      const evt = await request.post('/api/events').send({ dj_id: dj.id, name: 'Cascade' });
      const guest = await request.post('/api/guests').send({ event_id: evt.body.id });
      await request.post('/api/requests').send({
        event_id: evt.body.id, guest_id: guest.body.id,
        title: 'Song', source: 'youtube', source_url: 'https://youtube.com/watch?v=abc',
      });

      await request.delete(`/api/events/${evt.body.id}`);

      const guestGet = await request.get(`/api/guests/${guest.body.id}`);
      expect(guestGet.status).toBe(404);
    });
  });
});
