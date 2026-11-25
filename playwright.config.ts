import { defineConfig, devices } from '@playwright/test';

const PORT = 4330;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    // Build first (npm run test:a11y does this). Node runs Astro directly so the server is killable on Windows.
    command: `node node_modules/astro/astro.js preview --port ${PORT}`,
    // The enquiry endpoint logs instead of sending, and the rate limit is relaxed for the suite.
    env: { CONTACT_DRY_RUN: 'true', CONTACT_RATE_LIMIT: '1000', RESEND_API_KEY: '' },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
