import { expect, request as playwrightRequest, test } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://127.0.0.1:3100';
const origin = new URL(baseURL).origin;
const host = new URL(baseURL).hostname.toLowerCase();
const mutationEnabled = process.env.E2E_ALLOW_MUTATION === 'true';
const mutationAllowedHosts = new Set([
  'localhost',
  '127.0.0.1',
  'staging.herpfree.co.kr',
  'develop.d2bcg3vnlv5hkh.amplifyapp.com',
]);
const mutationHostAllowed = mutationAllowedHosts.has(host);

type Envelope<T> = { success: boolean; message: string; data: T };

test.describe('bff staging data flow', () => {
  test.skip(!mutationEnabled, 'Mutation is enabled only in an isolated staging environment.');
  test.skip(!mutationHostAllowed, 'Mutation is blocked on the production hostname.');

  test('keeps the bearer token HttpOnly and supports an authenticated journal session', async ({ page }) => {
    const api = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: origin },
    });
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const email = `bff-e2e-${unique}@example.invalid`;
    const password = 'E2e-Test-Password!4829';
    const nickname = `bff${unique}`.slice(0, 20);
    let accountCreated = false;
    let accountDeleted = false;
    let csrfToken: string | undefined;
    let journalId: number | undefined;

    try {
      const signup = await api.post('/api/auth/signup', {
        data: {
          email,
          password,
          nickname,
          agreeTerms: true,
          agreePrivacy: true,
          agreeSensitive: true,
          agreeAge: true,
          agreeMarketing: false,
          agreeHealthStatistics: false,
        },
      });
      expect(signup.status(), await signup.text()).toBe(201);
      accountCreated = true;

      const login = await api.post('/api/auth/login', { data: { email, password } });
      expect(login.status(), await login.text()).toBe(200);
      const loginBody = await login.json() as Envelope<Record<string, unknown>>;
      expect(loginBody.success).toBe(true);
      expect(loginBody.data.accessToken).toBeUndefined();

      const state = await api.storageState();
      const accessCookie = state.cookies.find((cookie) => cookie.name.endsWith('herfree-access'));
      const csrfCookie = state.cookies.find((cookie) => cookie.name.endsWith('herfree-csrf'));
      expect(accessCookie?.httpOnly).toBe(true);
      expect(csrfCookie?.value).toBeTruthy();
      csrfToken = csrfCookie?.value;

      const me = await api.get('/api/users/me');
      expect(me.status(), await me.text()).toBe(200);
      const meBody = await me.json() as Envelope<{ id: number; nickname: string; role: string }>;

      await page.context().addCookies(state.cookies);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.evaluate((user) => {
        window.sessionStorage.setItem('sessionUser', JSON.stringify({
          userId: user.id,
          nickname: user.nickname,
          role: user.role,
        }));
      }, meBody.data);
      await page.goto('/journal', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 8_000 });

      const journal = await api.post('/api/journal/records', {
        headers: { 'X-Herfree-CSRF': csrfToken! },
        data: {
          recordDate: new Date().toISOString().slice(0, 10),
          medicationStatus: 'NORMAL',
          avgSleep: 'H6_7',
          stressLevel: 'MEDIUM',
          hadSymptoms: false,
          prodromalSymptoms: [],
          triggers: [],
          memo: 'Temporary BFF release verification record.',
          mood: 'NORMAL',
          supplementTaken: false,
          exerciseDone: false,
        },
      });
      expect(journal.status(), await journal.text()).toBe(200);
      expect(journal.headers()['cache-control']).toContain('no-store');
      const journalBody = await journal.json() as Envelope<{ id: number }>;
      journalId = journalBody.data.id;

      const savedJournal = await api.get(`/api/journal/records/${journalId}`);
      expect(savedJournal.status(), await savedJournal.text()).toBe(200);
      expect(savedJournal.headers()['cache-control']).toContain('no-store');

      const journalDeletion = await api.delete(`/api/journal/records/${journalId}`, {
        headers: { 'X-Herfree-CSRF': csrfToken! },
      });
      expect(journalDeletion.status(), await journalDeletion.text()).toBe(204);
      journalId = undefined;

      const withdrawal = await api.delete('/api/users/me', {
        headers: { 'X-Herfree-CSRF': csrfToken! },
      });
      expect(withdrawal.status(), await withdrawal.text()).toBe(204);
      accountDeleted = true;
    } finally {
      if (journalId && csrfToken) {
        await api.delete(`/api/journal/records/${journalId}`, {
          headers: { 'X-Herfree-CSRF': csrfToken },
        }).catch(() => undefined);
      }
      if (accountCreated && !accountDeleted && csrfToken) {
        await api.delete('/api/users/me', {
          headers: { 'X-Herfree-CSRF': csrfToken },
        }).catch(() => undefined);
      }
      await api.dispose();
    }
  });

  test('does not render a cached member before the server verifies the session', async ({ page }) => {
    await page.route('**/api/users/me', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthorized', data: null }),
      });
    });
    await page.addInitScript(() => {
      window.sessionStorage.setItem('sessionUser', JSON.stringify({
        userId: 999_999,
        nickname: 'stale-member',
        role: 'USER',
      }));
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);
    await expect(page.locator('.home-dashboard-screen')).toHaveCount(0);

    await page.waitForTimeout(500);
    const cachedUser = await page.evaluate(() => window.sessionStorage.getItem('sessionUser'));
    expect(cachedUser).toBeNull();
    await expect(page.locator('.home-dashboard-screen')).toHaveCount(0);
  });
});
