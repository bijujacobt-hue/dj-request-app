import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { resetDb, createApp } from '../setup.js';

const app = createApp();

describe('Request & Vote Routes', () => {
  let request, dj, event, guest1, guest2;

  beforeEach(async () => {
    resetDb();
    request = supertest(app);
    const djRes = await request.post('/api/dj/create').send({ name: 'DJ Req' });
    dj = djRes.body;
    const evtRes = await request.post('/api/events').send({ dj_id: dj.id, name: 'Req Event' });
    event = evtRes.body;
    const g1Res = await request.post('/api/guests').send({ event_id: event.id });
    guest1 = g1Res.body;
    const g2Res = await request.post('/api/guests').send({ event_id: event.id });
    guest2 = g2Res.body;
  });

  describe('POST /api/requests', () => {
    it('creates a song request', async () => {
      const res = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Bohemian Rhapsody', artist: 'Queen',
        source: 'youtube', source_url: 'https://youtube.com/watch?v=test1',
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^req_/);
      expect(res.body.title).toBe('Bohemian Rhapsody');
      expect(res.body.vote_count).toBe(1);
      expect(res.body.voters).toHaveLength(1);
      expect(res.body.voters[0].guest_id).toBe(guest1.id);
    });

    it('merges duplicate request (same source_url)', async () => {
      const url = 'https://youtube.com/watch?v=dupe';
      await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Song', source: 'youtube', source_url: url,
      });

      const res = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest2.id,
        title: 'Song', source: 'youtube', source_url: url,
      });

      expect(res.status).toBe(200);
      expect(res.body.merged).toBe(true);
      expect(res.body.vote_count).toBe(2);
      expect(res.body.voters).toHaveLength(2);
    });

    it('returns 409 if same guest requests same song twice', async () => {
      const url = 'https://youtube.com/watch?v=twice';
      const payload = {
        event_id: event.id, guest_id: guest1.id,
        title: 'Song', source: 'youtube', source_url: url,
      };
      await request.post('/api/requests').send(payload);
      const res = await request.post('/api/requests').send(payload);
      expect(res.status).toBe(409);
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for closed event', async () => {
      await request.put(`/api/events/${event.id}/close`);
      const res = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Song', source: 'youtube', source_url: 'https://youtube.com/watch?v=closed',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('closed');
    });

    it('returns 404 for nonexistent event', async () => {
      const res = await request.post('/api/requests').send({
        event_id: 'evt_fake', guest_id: guest1.id,
        title: 'Song', source: 'youtube', source_url: 'https://youtube.com/watch?v=x',
      });
      expect(res.status).toBe(404);
    });

    it('returns 404 for nonexistent guest', async () => {
      const res = await request.post('/api/requests').send({
        event_id: event.id, guest_id: 'guest_fake',
        title: 'Song', source: 'youtube', source_url: 'https://youtube.com/watch?v=x',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/requests/event/:eventId', () => {
    it('lists requests sorted by votes desc', async () => {
      const url1 = 'https://youtube.com/watch?v=s1';
      const url2 = 'https://youtube.com/watch?v=s2';

      await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Song 1', source: 'youtube', source_url: url1,
      });
      await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Song 2', source: 'youtube', source_url: url2,
      });
      await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest2.id,
        title: 'Song 2', source: 'youtube', source_url: url2,
      });

      const res = await request.get(`/api/requests/event/${event.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Song 2');
      expect(res.body[0].vote_count).toBe(2);
      expect(res.body[1].title).toBe('Song 1');
      expect(res.body[0].voters).toHaveLength(2);
    });

    it('returns empty array for event with no requests', async () => {
      const res = await request.get(`/api/requests/event/${event.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 404 for nonexistent event', async () => {
      const res = await request.get('/api/requests/event/evt_fake');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/requests/:id/guest/:guestId (sole voter delete)', () => {
    it('allows sole voter to delete', async () => {
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Delete Me', source: 'youtube', source_url: 'https://youtube.com/watch?v=del',
      });
      const res = await request.delete(`/api/requests/${created.body.id}/guest/${guest1.id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('rejects delete when not sole voter', async () => {
      const url = 'https://youtube.com/watch?v=multi';
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Multi Vote', source: 'youtube', source_url: url,
      });
      await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest2.id,
        title: 'Multi Vote', source: 'youtube', source_url: url,
      });
      const res = await request.delete(`/api/requests/${created.body.id}/guest/${guest1.id}`);
      expect(res.status).toBe(403);
    });

    it('rejects delete with wrong guest ID', async () => {
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Wrong Guest', source: 'youtube', source_url: 'https://youtube.com/watch?v=wg',
      });
      const res = await request.delete(`/api/requests/${created.body.id}/guest/${guest2.id}`);
      expect(res.status).toBe(403);
    });

    it('returns 404 for nonexistent request', async () => {
      const res = await request.delete(`/api/requests/req_fake/guest/${guest1.id}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/requests/:id (DJ delete)', () => {
    it('deletes any request', async () => {
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'DJ Delete', source: 'youtube', source_url: 'https://youtube.com/watch?v=djd',
      });
      const res = await request.delete(`/api/requests/${created.body.id}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 for nonexistent request', async () => {
      const res = await request.delete('/api/requests/req_fake');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/requests/votes', () => {
    it('adds a vote to a request', async () => {
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Vote Song', source: 'youtube', source_url: 'https://youtube.com/watch?v=vote1',
      });
      const res = await request.post('/api/requests/votes').send({
        request_id: created.body.id, guest_id: guest2.id,
      });
      expect(res.status).toBe(200);
      expect(res.body.vote_count).toBe(2);
    });

    it('returns 409 for duplicate vote', async () => {
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Dupe Vote', source: 'youtube', source_url: 'https://youtube.com/watch?v=dv',
      });
      const res = await request.post('/api/requests/votes').send({
        request_id: created.body.id, guest_id: guest1.id,
      });
      expect(res.status).toBe(409);
    });

    it('returns 400 for missing fields', async () => {
      const res = await request.post('/api/requests/votes').send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent request', async () => {
      const res = await request.post('/api/requests/votes').send({
        request_id: 'req_fake', guest_id: guest1.id,
      });
      expect(res.status).toBe(404);
    });

    it('returns 404 for nonexistent guest', async () => {
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Ghost Vote', source: 'youtube', source_url: 'https://youtube.com/watch?v=gv',
      });
      const res = await request.post('/api/requests/votes').send({
        request_id: created.body.id, guest_id: 'guest_fake',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/requests/votes/:requestId/:guestId', () => {
    it('removes a vote', async () => {
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Unvote', source: 'youtube', source_url: 'https://youtube.com/watch?v=uv',
      });
      await request.post('/api/requests/votes').send({
        request_id: created.body.id, guest_id: guest2.id,
      });
      const res = await request.delete(`/api/requests/votes/${created.body.id}/${guest2.id}`);
      expect(res.status).toBe(200);
      expect(res.body.vote_count).toBe(1);
    });

    it('returns 404 for nonexistent vote', async () => {
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'No Vote', source: 'youtube', source_url: 'https://youtube.com/watch?v=nv',
      });
      const res = await request.delete(`/api/requests/votes/${created.body.id}/${guest2.id}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Vote merging regression', () => {
    it('5 guests requesting same URL results in vote_count=5', async () => {
      const url = 'https://youtube.com/watch?v=popular';
      const guests = [guest1, guest2];
      for (let i = 0; i < 3; i++) {
        const g = await request.post('/api/guests').send({ event_id: event.id });
        guests.push(g.body);
      }
      for (const g of guests) {
        await request.post('/api/requests').send({
          event_id: event.id, guest_id: g.id,
          title: 'Popular Song', source: 'youtube', source_url: url,
        });
      }

      const res = await request.get(`/api/requests/event/${event.id}`);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].vote_count).toBe(5);
      expect(res.body[0].voters).toHaveLength(5);
    });

    it('unvote after merge decrements correctly', async () => {
      const url = 'https://youtube.com/watch?v=unmerge';
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Merged', source: 'youtube', source_url: url,
      });
      await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest2.id,
        title: 'Merged', source: 'youtube', source_url: url,
      });

      await request.delete(`/api/requests/votes/${created.body.id}/${guest2.id}`);

      const res = await request.get(`/api/requests/event/${event.id}`);
      expect(res.body[0].vote_count).toBe(1);
      expect(res.body[0].voters).toHaveLength(1);
    });

    it('sole voter can delete after others unvote', async () => {
      const url = 'https://youtube.com/watch?v=backtosole';
      const created = await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest1.id,
        title: 'Back to Sole', source: 'youtube', source_url: url,
      });
      await request.post('/api/requests').send({
        event_id: event.id, guest_id: guest2.id,
        title: 'Back to Sole', source: 'youtube', source_url: url,
      });

      await request.delete(`/api/requests/votes/${created.body.id}/${guest2.id}`);
      const res = await request.delete(`/api/requests/${created.body.id}/guest/${guest1.id}`);
      expect(res.status).toBe(200);
    });
  });
});
