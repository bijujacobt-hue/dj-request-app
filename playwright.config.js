import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'cd backend && node server.js',
      port: 3001,
      reuseExistingServer: true,
    },
    {
      command: 'cd frontend && npx vite --port 5173',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
