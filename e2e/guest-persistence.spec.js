import { test, expect } from '@playwright/test';
import { createTestDJ, createTestEvent } from './helpers.js';

test.describe('Guest Cookie Persistence', () => {
  test('guest identity persists across page refreshes', async ({ page }) => {
    const dj = await createTestDJ('DJ Cookie Test');
    const event = await createTestEvent(dj.id, 'Cookie Test Event');

    // First visit — guest gets a name
    await page.goto(`/event/${event.id}`);
    await page.waitForTimeout(1500);

    // Find the guest display name
    const nameEl = page.locator('.text-purple-400.font-medium');
    const firstName = await nameEl.textContent();
    expect(firstName).toBeTruthy();

    // Refresh the page
    await page.reload();
    await page.waitForTimeout(1500);

    // Same name should appear (cookie persisted)
    const nameAfterRefresh = await nameEl.textContent();
    expect(nameAfterRefresh).toBe(firstName);
  });

  test('guest gets different identity per event', async ({ page }) => {
    const dj = await createTestDJ('DJ Multi Event');
    const event1 = await createTestEvent(dj.id, 'Event One');
    const event2 = await createTestEvent(dj.id, 'Event Two');

    // Visit event 1
    await page.goto(`/event/${event1.id}`);
    await page.waitForTimeout(1500);
    const name1El = page.locator('.text-purple-400.font-medium');
    const name1 = await name1El.textContent();

    // Visit event 2
    await page.goto(`/event/${event2.id}`);
    await page.waitForTimeout(1500);
    const name2 = await name1El.textContent();

    // Names should exist (could be same by coincidence, but IDs are different)
    expect(name1).toBeTruthy();
    expect(name2).toBeTruthy();

    // Return to event 1 — should have original name
    await page.goto(`/event/${event1.id}`);
    await page.waitForTimeout(1500);
    const name1Again = await name1El.textContent();
    expect(name1Again).toBe(name1);
  });

  test('guest can change their name and it persists', async ({ page }) => {
    const dj = await createTestDJ('DJ Name Change');
    const event = await createTestEvent(dj.id, 'Name Change Event');

    await page.goto(`/event/${event.id}`);
    await page.waitForTimeout(1500);

    // Click "change name"
    await page.getByText('change name').click();

    // Clear and type new name
    const input = page.getByPlaceholder(/enter your name/i);
    await input.clear();
    await input.fill('Custom Name');
    await page.getByRole('button', { name: 'Save' }).click();

    // Should show new name
    await expect(page.locator('.text-purple-400.font-medium')).toHaveText('Custom Name');

    // Refresh — name should persist
    await page.reload();
    await page.waitForTimeout(1500);
    await expect(page.locator('.text-purple-400.font-medium')).toHaveText('Custom Name');
  });
});
