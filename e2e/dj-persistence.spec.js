import { test, expect } from '@playwright/test';

test.describe('DJ LocalStorage Persistence', () => {
  test('DJ stays logged in after page reload', async ({ page }) => {
    await page.goto('/dj');

    // Create DJ account
    await page.getByText('Create New DJ Profile').click();
    await page.getByPlaceholder('Your DJ name').fill('DJ Persist');
    await page.getByText('Create Profile').click();

    await expect(page.getByText('DJ Persist')).toBeVisible();

    // Get the DJ ID
    const idText = await page.getByText(/ID: dj_/).textContent();
    const djId = idText.replace('ID: ', '');

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page.getByText('DJ Persist')).toBeVisible();
    await expect(page.getByText(`ID: ${djId}`)).toBeVisible();
  });

  test('DJ login form works with existing ID', async ({ page, context }) => {
    // Create a DJ via API first
    const res = await fetch('http://localhost:3001/api/dj/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'DJ Login Test' }),
    });
    const dj = await res.json();

    // Visit DJ dashboard in a fresh page (no localStorage)
    await page.goto('/dj');

    // Login with existing ID
    await page.getByText('Login with DJ ID').click();
    await page.getByPlaceholder(/dj id/i).fill(dj.id);
    await page.getByRole('button', { name: 'Login' }).click();

    // Should see dashboard
    await expect(page.getByText('DJ Login Test')).toBeVisible();
  });

  test('DJ logout clears session', async ({ page }) => {
    await page.goto('/dj');

    // Create DJ
    await page.getByText('Create New DJ Profile').click();
    await page.getByPlaceholder('Your DJ name').fill('DJ Logout Test');
    await page.getByText('Create Profile').click();

    await expect(page.getByText('DJ Logout Test')).toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();

    // Should see login/create buttons again
    await expect(page.getByText('Login with DJ ID')).toBeVisible();
    await expect(page.getByText('Create New DJ Profile')).toBeVisible();

    // Refresh — should still be logged out
    await page.reload();
    await expect(page.getByText('Login with DJ ID')).toBeVisible();
  });

  test('DJ creates event and sees it after reload', async ({ page }) => {
    await page.goto('/dj');

    // Create DJ
    await page.getByText('Create New DJ Profile').click();
    await page.getByPlaceholder('Your DJ name').fill('DJ Event Persist');
    await page.getByText('Create Profile').click();

    // Create event
    await page.getByText('+ Create New Event').click();
    await page.getByPlaceholder(/event name/i).fill('Persistent Party');
    await page.getByText('Create Event').click();

    await expect(page.getByText('Persistent Party')).toBeVisible();

    // Reload
    await page.reload();

    // Event should still be there
    await expect(page.getByText('Persistent Party')).toBeVisible();
  });

  test('invalid DJ ID shows error', async ({ page }) => {
    await page.goto('/dj');

    await page.getByText('Login with DJ ID').click();
    await page.getByPlaceholder(/dj id/i).fill('dj_nonexistent_id');
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show error
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
