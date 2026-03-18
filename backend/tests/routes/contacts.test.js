import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { resetDb, createApp } from '../setup.js';

const app = createApp();

describe('Contact Routes', () => {
  let request, dj, event;

  beforeEach(async () => {
    resetDb();
    request = supertest(app);
    const djRes = await request.post('/api/dj/create').send({ name: 'DJ Contact' });
    dj = djRes.body;
    const evtRes = await request.post('/api/events').send({ dj_id: dj.id, name: 'Contact Event' });
    event = evtRes.body;
  });

  describe('POST /api/contacts', () => {
    it('submits a contact form', async () => {
      const res = await request.post('/api/contacts').send({
        event_id: event.id, guest_name: 'John Doe',
        contact_info: 'john@test.com', message: 'Great party, thanks!',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toMatch(/^contact_/);
    });

    it('submits without optional message', async () => {
      const res = await request.post('/api/contacts').send({
        event_id: event.id, guest_name: 'Jane', contact_info: 'jane@test.com',
      });
      expect(res.status).toBe(201);
    });

    it('returns 400 for missing guest_name', async () => {
      const res = await request.post('/api/contacts').send({
        event_id: event.id, contact_info: 'test@test.com',
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing contact_info', async () => {
      const res = await request.post('/api/contacts').send({
        event_id: event.id, guest_name: 'Test',
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing event_id', async () => {
      const res = await request.post('/api/contacts').send({
        guest_name: 'Test', contact_info: 'test@test.com',
      });
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent event', async () => {
      const res = await request.post('/api/contacts').send({
        event_id: 'evt_fake', guest_name: 'Test', contact_info: 'test@test.com',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/contacts/event/:eventId', () => {
    it('lists contacts for an event', async () => {
      await request.post('/api/contacts').send({
        event_id: event.id, guest_name: 'A', contact_info: 'a@test.com', message: 'Hi',
      });
      await request.post('/api/contacts').send({
        event_id: event.id, guest_name: 'B', contact_info: 'b@test.com', message: 'Hello',
      });

      const res = await request.get(`/api/contacts/event/${event.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('guest_name');
      expect(res.body[0]).toHaveProperty('contact_info');
      expect(res.body[0]).toHaveProperty('message');
    });

    it('returns empty array for event with no contacts', async () => {
      const res = await request.get(`/api/contacts/event/${event.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
