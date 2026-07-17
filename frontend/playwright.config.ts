import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://127.0.0.1:3100';
const parsedBaseURL = new URL(baseURL);
const isLocal = parsedBaseURL.hostname === '127.0.0.1' || parsedBaseURL.hostname === 'localhost';
const basicAuthUsername = process.env.E2E_HTTP_USERNAME?.trim();
const basicAuthPassword = process.env.E2E_HTTP_PASSWORD?.trim();
const httpCredentials = basicAuthUsername && basicAuthPassword
  ? { username: basicAuthUsername, password: basicAuthPassword }
  : undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    httpCredentials,
  },
  webServer: isLocal && process.env.PLAYWRIGHT_NO_WEBSERVER !== 'true'
    ? {
        command: `node ./node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${parsedBaseURL.port || '3100'}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: true,
        timeout: 60_000,
        env: {
          ...process.env,
          API_REWRITE_TARGET: process.env.API_REWRITE_TARGET || 'http://127.0.0.1:8080',
        },
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? undefined : 'chrome',
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        channel: process.env.CI ? undefined : 'chrome',
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
