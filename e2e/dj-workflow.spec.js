import { test, expect } from '@playwright/test';
import { createTestDJ, createTestEvent, createTestGuest, createTestRequest, closeTestEvent } from './helpers.js';

test.describe('Full DJ Workflow', () => {
  test('DJ creates account, event, manages requests, and closes event', async ({ page }) => {
    // Step 1-2: DJ visits /dj and creates account
    await page.goto('/dj');
    await expect(page.getByText('DJ Dashboard')).toBeVisible();

    await page.getByText('Create New DJ Profile').click();
    await page.getByPlaceholder('Your DJ name').fill('DJ Workflow');
    await page.getByText('Create Profile').click();

    // Should see dashboard with DJ name
    await expect(page.getByText('DJ Workflow')).toBeVisible();
    // Should see DJ ID
    await expect(page.getByText(/ID: dj_/)).toBeVisible();

    // Step 3-4: DJ creates event
    await page.getByText('+ Create New Event').click();
    await page.getByPlaceholder(/event name/i).fill('Workflow Party');
    await page.getByText('Create Event').click();

    // Event should appear in list
    await expect(page.getByText('Workflow Party')).toBeVisible();

    // Step 5: DJ clicks manage
    await page.getByText('Manage').click();
    await expect(page.getByText('Workflow Party')).toBeVisible();
    await expect(page.getByText('0 requests')).toBeVisible();

    // Step 6: Copy link is available
    await expect(page.getByText('Copy link')).toBeVisible();
    await expect(page.getByText('QR Code')).toBeVisible();

    // Get event ID from URL
    const url = page.url();
    const eventId = url.split('/').pop();

    // Create requests via API (since we can't use YouTube search in E2E)
    const guest1 = await createTestGuest(eventId);
    const guest2 = await createTestGuest(eventId);
    await createTestRequest(eventId, guest1.id, 'Bohemian Rhapsody', 'Queen');
    await createTestRequest(eventId, guest2.id, 'Hotel California', 'Eagles');

    // Step 15: DJ sees requests sorted by votes (poll refresh)
    await expect(page.getByText('Bohemian Rhapsody')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Hotel California')).toBeVisible();
    await expect(page.getByText('2 requests')).toBeVisible();

    // Step 16: DJ sets footer text
    await page.getByPlaceholder(/tips welcome/i).fill('Thanks for coming!');
    await page.getByRole('button', { name: 'Save' }).first().click();
    await expect(page.getByText('Footer saved')).toBeVisible();

    // Step 19: DJ exports CSV
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByText('Export CSV').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);

    // Step 20: DJ closes event — set up dialog handler before clicking
    page.on('dialog', dialog => dialog.accept());
    await page.getByText('Close Event').click();

    await expect(page.getByText('Closed', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('guest can access event, see requests, and vote', async ({ page, context }) => {
    // Set up test data via API
    const dj = await createTestDJ('DJ Guest Test');
    const event = await createTestEvent(dj.id, 'Guest Voting Test');
    const guest1 = await createTestGuest(event.id);
    await createTestRequest(event.id, guest1.id, 'Stairway to Heaven', 'Led Zeppelin');
    await createTestRequest(event.id, guest1.id, 'Free Bird', 'Lynyrd Skynyrd');

    // Step 7-8: Guest opens event link
    await page.goto(`/event/${event.id}`);

    // Guest should see event name
    await expect(page.getByText('Guest Voting Test')).toBeVisible();

    // Guest gets assigned a name (NamePicker shows name)
    await page.waitForTimeout(1000);

    // Step 10: Guest sees existing requests
    await expect(page.getByText('Stairway to Heaven')).toBeVisible();
    await expect(page.getByText('Free Bird')).toBeVisible();

    // Step 14: Guest can vote on a request
    const voteButtons = page.locator('button', { hasText: /^\d+$/ });
    const firstVoteBtn = voteButtons.first();
    await firstVoteBtn.click();

    // Vote count should update
    await page.waitForTimeout(1000);
  });

  test('guest sees closed event page with contact form', async ({ page }) => {
    // Set up closed event
    const dj = await createTestDJ('DJ Closed Test');
    const event = await createTestEvent(dj.id, 'Closed Event Test');
    await closeTestEvent(event.id);

    await page.goto(`/event/${event.id}`);

    // Should see closed message
    await expect(page.getByText('This event has ended')).toBeVisible();
    await expect(page.getByText('Closed Event Test')).toBeVisible();

    // Step 22: Guest submits contact form
    await page.getByPlaceholder('Your name').fill('Test Guest');
    await page.getByPlaceholder('Email or phone').fill('test@example.com');
    await page.getByPlaceholder(/message/i).fill('Great party!');
    await page.getByText('Send Message').click();

    // Confirmation
    await expect(page.getByText(/thanks/i)).toBeVisible();
  });

  test('DJ can see guest messages in Messages tab', async ({ page }) => {
    // Set up event with contact
    const dj = await createTestDJ('DJ Messages Test');
    const event = await createTestEvent(dj.id, 'Messages Event');
    await closeTestEvent(event.id);

    // Submit a contact via API
    await fetch('http://localhost:3001/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: event.id,
        guest_name: 'Fan Person',
        contact_info: 'fan@example.com',
        message: 'Book you for my wedding!',
      }),
    });

    // DJ logs in and navigates to event
    await page.goto('/dj');
    await page.getByText('Login with DJ ID').click();
    await page.getByPlaceholder(/dj id/i).fill(dj.id);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Messages Event')).toBeVisible();

    // Navigate to event manager
    const viewBtn = page.getByText('View');
    await viewBtn.click();

    // Click Messages tab
    await page.getByRole('button', { name: 'Messages' }).click();

    // Step 23: DJ sees contact submission
    await expect(page.getByText('Fan Person')).toBeVisible();
    await expect(page.getByText('fan@example.com')).toBeVisible();
    await expect(page.getByText('Book you for my wedding!')).toBeVisible();
  });
});
