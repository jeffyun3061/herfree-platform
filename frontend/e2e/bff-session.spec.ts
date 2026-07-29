import { expect, request as playwrightRequest, test } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://127.0.0.1:3100';
const origin = new URL(baseURL).origin;
const host = new URL(baseURL).hostname.toLowerCase();
const mutationEnabled = process.env.E2E_ALLOW_MUTATION === 'true';
const mutationHostAllowed =
  host === 'localhost'
  || host === '127.0.0.1'
  || host.includes('staging')
  || host.includes('amplifyapp.com')
  || host.includes('dev.');

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

      const withdrawal = await api.delete('/api/users/me', {
        headers: { 'X-Herfree-CSRF': csrfCookie!.value },
      });
      expect(withdrawal.status(), await withdrawal.text()).toBe(204);
    } finally {
      await api.dispose();
    }
  });
});
