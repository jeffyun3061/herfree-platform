import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  expectedMutationBackendEnvironment,
  mutationEnvironmentEnabled,
} from './support/mutation-environment';

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://127.0.0.1:3100';
const stagingApiURL = process.env.STAGING_API_URL?.trim().replace(/\/$/, '');
const origin = new URL(baseURL).origin;
const mutationEnabled = mutationEnvironmentEnabled(baseURL);
const expectedBackendEnvironment = expectedMutationBackendEnvironment(baseURL);
const basicAuthUsername = process.env.E2E_HTTP_USERNAME?.trim();
const basicAuthPassword = process.env.E2E_HTTP_PASSWORD?.trim();
const httpCredentials = basicAuthUsername && basicAuthPassword
  ? { username: basicAuthUsername, password: basicAuthPassword }
  : undefined;

type Envelope<T> = { success: boolean; message: string; data: T };
type TestAccount = {
  api: APIRequestContext;
  email: string;
  csrfToken: string;
  user: {
    userId: number;
    nickname: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  };
};

async function data<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as Envelope<T>;
  expect(body.success).toBe(true);
  return body.data;
}

async function newApiContext(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: origin },
    httpCredentials,
  });
}

async function assertMutationBackend(api: APIRequestContext): Promise<void> {
  const health = await data<{ status: string; environment: string }>(await api.get('/api/health'));
  expect(health.status).toBe('UP');
  expect(health.environment).toBe(expectedBackendEnvironment);
}

async function signupAndLogin(suffix: string): Promise<TestAccount> {
  const api = await newApiContext();
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const email = `e2e-${suffix}-${unique}@example.invalid`;
  const password = 'E2e-Test-Password!4829';
  const nickname = `e2e${suffix.slice(0, 5)}${unique.slice(-9)}`.slice(0, 20);

  try {
    await assertMutationBackend(api);
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
    const loginData = await data<{
      userId: number;
      nickname: string;
      role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
      accessToken?: unknown;
    }>(login);
    expect(loginData.accessToken).toBeUndefined();

    const state = await api.storageState();
    const accessCookie = state.cookies.find((cookie) => cookie.name.endsWith('herfree-access'));
    const csrfCookie = state.cookies.find((cookie) => cookie.name.endsWith('herfree-csrf'));
    expect(accessCookie?.httpOnly).toBe(true);
    expect(csrfCookie?.value).toBeTruthy();

    const me = await api.get('/api/users/me');
    const currentUser = await data<{ id: number; nickname: string; role: TestAccount['user']['role'] }>(me);
    expect(currentUser.id).toBe(loginData.userId);

    return {
      api,
      email,
      csrfToken: csrfCookie!.value,
      user: {
        userId: currentUser.id,
        nickname: currentUser.nickname,
        role: currentUser.role,
      },
    };
  } catch (error) {
    await api.dispose();
    throw error;
  }
}

function csrf(account: TestAccount) {
  return { 'X-Herfree-CSRF': account.csrfToken };
}

async function useAccountOnPage(page: Page, account: TestAccount): Promise<void> {
  const state = await account.api.storageState();
  await page.context().clearCookies();
  await page.context().addCookies(state.cookies);
  await page.addInitScript(() => {
    window.sessionStorage.removeItem('accessToken');
    window.sessionStorage.removeItem('sessionUser');
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
}

async function deleteAccount(account: TestAccount): Promise<void> {
  try {
    const response = await account.api.delete('/api/users/me', { headers: csrf(account) });
    expect([204, 401, 404], await response.text()).toContain(response.status());
  } finally {
    await account.api.dispose();
  }
}

test.describe('release smoke', () => {
  for (const path of [
    '/',
    '/signup',
    '/login',
    '/community',
    '/journal',
    '/qna',
    '/mypage',
    '/mypage/account',
    '/mypage/received-reactions',
    '/mypage/bookmarks',
    '/notice',
    '/terms',
    '/privacy',
    '/admin',
  ]) {
    test(`${path} renders without a server error`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response, `${path} did not return a response`).not.toBeNull();
      expect(response!.status(), `${path} returned ${response!.status()}`).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
    });
  }

  test('primary routes load within navigation budget', async ({ page }) => {
    const routes = ['/', '/community', '/journal', '/mypage', '/login', '/qna'];
    const budgetMs = 8_000;

    for (const path of routes) {
      const started = Date.now();
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      const elapsed = Date.now() - started;

      expect(response, `${path} did not return a response`).not.toBeNull();
      expect(response!.status(), `${path} returned ${response!.status()}`).toBeLessThan(500);
      expect(elapsed, `${path} took ${elapsed}ms`).toBeLessThan(budgetMs);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('FAQ deep link opens the requested item', async ({ page }) => {
    await page.goto('/qna?faq=0-0#faq-0-0');
    await expect(page.locator('#faq-0-0')).toHaveAttribute('open', '');
  });

  test('public API and authorization boundary', async ({ request }) => {
    const home = await request.get('/');
    expect(home.headers()['content-security-policy']).toContain("default-src 'self'");

    // Always exercise the frontend same-origin proxy. Checking only the direct
    // backend URL would miss a broken Amplify -> Spring connection.
    const health = await request.get('/api/health');
    expect(health.status()).toBe(200);
    expect(health.headers()['x-request-id']).toBeTruthy();
    const healthData = await data<{ status: string; environment: string }>(health);
    expect(healthData.status).toBe('UP');
    expect(healthData.environment).toBe(expectedBackendEnvironment);
    const homeStats = await request.get('/api/journal/public/home-stats');
    const homeStatsData = await data<Record<string, unknown>>(homeStats);
    expect(typeof homeStatsData.usersRecordingToday).toBe('number');
    expect(typeof homeStatsData.totalUsers).toBe('number');
    expect(homeStats.headers()['cache-control']).toContain('no-store');
    await data(await request.get('/api/boards'));
    await data(await request.get('/api/posts?page=0&size=5'));
    await data(await request.get('/api/contents?page=0&size=1'));
    await data(await request.get('/api/videos?page=0&size=1'));

    if (stagingApiURL) {
      const backendHealth = await request.get(`${stagingApiURL}/api/health`);
      expect(backendHealth.status()).toBe(200);
    }

    const admin = await request.get('/api/admin/reports');
    expect([401, 403]).toContain(admin.status());
  });
});

test.describe('staging data flow', () => {
  test.skip(!mutationEnabled, 'Set E2E_ALLOW_MUTATION=true only for local or approved staging QA.');

  test('logged-in journal exits the initial loading state', async ({ page }, testInfo) => {
    const account = await signupAndLogin(`journal-${testInfo.project.name}`);

    try {
      await useAccountOnPage(page, account);
      const response = await page.goto('/journal', { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText('개인일지를 준비하는 중...')).toHaveCount(0);
    } finally {
      await deleteAccount(account);
    }
  });

  test('mypage account menu and security settings keep their intended order', async ({ page }, testInfo) => {
    const account = await signupAndLogin(`account-${testInfo.project.name}`);

    try {
      await useAccountOnPage(page, account);
      await page.goto('/mypage', { waitUntil: 'domcontentloaded' });
      const accountLink = page.getByRole('link', { name: /회원정보 수정/ });
      const receivedLink = page.getByRole('link', { name: /받은 공감/ });
      const bookmarkLink = page.getByRole('link', { name: /스크랩한 글/ });
      const consultLink = page.getByRole('link', { name: /1:1 비밀 상담/ });
      await expect(accountLink).toBeVisible();
      await expect(receivedLink).toBeVisible();
      await expect(bookmarkLink).toBeVisible();
      await expect(consultLink).toBeVisible();

      const positions = await Promise.all(
        [accountLink, receivedLink, bookmarkLink, consultLink].map(async (item) => (await item.boundingBox())?.y),
      );
      expect(positions.every((value) => value !== undefined)).toBe(true);
      expect(positions[0]!).toBeLessThan(positions[1]!);
      expect(positions[1]!).toBeLessThan(positions[2]!);
      expect(positions[2]!).toBeLessThan(positions[3]!);

      await accountLink.click();
      await expect(page).toHaveURL(/\/mypage\/account$/);
      await expect(page.getByRole('heading', { name: '닉네임 변경' })).toBeVisible();
      await expect(page.getByLabel('새 닉네임')).toBeVisible();
      await expect(page.getByRole('heading', { name: '비밀번호 변경' })).toBeVisible();
      await expect(page.getByLabel('현재 비밀번호')).toBeVisible();
      await expect(page.locator('#new-password')).toBeVisible();
      await expect(page.getByLabel('새 비밀번호 확인')).toBeVisible();
    } finally {
      await deleteAccount(account);
    }
  });

  test('mypage shows written, received-reaction and bookmarked post collections', async ({ page }, testInfo) => {
    const accounts: TestAccount[] = [];
    let owner: TestAccount | undefined;
    let reader: TestAccount | undefined;
    let postId: number | undefined;
    let reactionAdded = false;
    let bookmarkAdded = false;

    try {
      owner = await signupAndLogin(`collections-owner-${testInfo.project.name}`);
      accounts.push(owner);
      reader = await signupAndLogin(`collections-reader-${testInfo.project.name}`);
      accounts.push(reader);

      const boards = await data<Array<{ id: number; boardType: string }>>(await owner.api.get('/api/boards'));
      const board = boards.find((item) => item.boardType === 'FREE');
      expect(board).toBeTruthy();
      const title = `E2E mypage collections ${Date.now()}`;
      const created = await data<{ id: number }>(await owner.api.post('/api/posts', {
        headers: csrf(owner),
        data: {
          boardId: board!.id,
          title,
          content: 'Temporary automated collection verification post.',
          isAnonymous: false,
          visibility: 'PUBLIC',
        },
      }));
      postId = created.id;

      const bookmark = await reader.api.put(`/api/posts/${postId}/bookmark`, {
        headers: csrf(reader),
      });
      expect(bookmark.status(), await bookmark.text()).toBe(200);
      bookmarkAdded = true;

      const reaction = await reader.api.post('/api/reactions', {
        headers: csrf(reader),
        data: { targetType: 'POST', targetId: postId, reactionType: 'EMPATHY' },
      });
      expect(reaction.status(), await reaction.text()).toBe(200);
      reactionAdded = true;

      await useAccountOnPage(page, owner);
      await page.goto('/mypage', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /내가 쓴 글/ }).click();
      await expect(page.getByRole('heading', { name: '내가 쓴 글' })).toBeVisible();
      await expect(page.getByText(title)).toBeVisible();
      await page.getByRole('link', { name: /받은 공감/ }).click();
      await expect(page).toHaveURL(/\/mypage\/received-reactions$/);
      await expect(page.getByRole('heading', { name: '받은 공감' })).toBeVisible();
      await expect(page.getByText(title)).toBeVisible();

      await useAccountOnPage(page, reader);
      await page.goto('/mypage', { waitUntil: 'domcontentloaded' });
      await page.getByRole('link', { name: /스크랩한 글/ }).click();
      await expect(page).toHaveURL(/\/mypage\/bookmarks$/);
      await expect(page.getByRole('heading', { name: '스크랩한 글' })).toBeVisible();
      await expect(page.getByText(title)).toBeVisible();
    } finally {
      if (reader && bookmarkAdded && postId) {
        await reader.api.delete(`/api/posts/${postId}/bookmark`, { headers: csrf(reader) });
      }
      if (reader && reactionAdded && postId) {
        await reader.api.post('/api/reactions', {
          headers: csrf(reader),
          data: { targetType: 'POST', targetId: postId, reactionType: 'EMPATHY' },
        });
      }
      if (owner && postId) {
        await owner.api.delete(`/api/posts/${postId}`, { headers: csrf(owner) });
      }
      for (const account of accounts.reverse()) {
        await deleteAccount(account);
      }
    }
  });

  test('signup, post, comment, journal and private-board isolation', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Run destructive flow once.');

    const accounts: TestAccount[] = [];
    let first: TestAccount | undefined;
    let second: TestAccount | undefined;
    let publicPostId: number | undefined;
    let privatePostId: number | undefined;
    let journalId: number | undefined;

    try {
      first = await signupAndLogin('a');
      accounts.push(first);
      second = await signupAndLogin('b');
      accounts.push(second);

      const boards = await data<Array<{ id: number; boardType: string }>>(await first.api.get('/api/boards'));
      const publicBoard = boards.find((board) => board.boardType === 'FREE');
      const privateBoard = boards.find((board) => board.boardType === 'INQUIRY');
      expect(publicBoard).toBeTruthy();
      expect(privateBoard).toBeTruthy();

      const imageUpload = await first.api.post('/api/posts/images/upload', {
        headers: csrf(first),
        multipart: {
          file: {
            name: 'e2e-logo.png',
            mimeType: 'image/png',
            buffer: readFileSync(join(process.cwd(), 'public', 'assets', 'logo-h-mark.png')),
          },
        },
      });
      const uploadedImage = await data<{ imageUrl: string }>(imageUpload);

      const createdPublic = await data<{ id: number; imageUrl: string | null }>(
        await first.api.post('/api/posts', {
          headers: csrf(first),
          data: {
            boardId: publicBoard!.id,
            title: 'E2E release verification',
            content: 'Temporary automated verification post.',
            isAnonymous: false,
            visibility: 'PUBLIC',
            imageUrl: uploadedImage.imageUrl,
          },
        }),
      );
      publicPostId = createdPublic.id;
      expect(createdPublic.imageUrl).toBe(uploadedImage.imageUrl);

      const comment = await second.api.post(`/api/posts/${publicPostId}/comments`, {
        headers: csrf(second),
        data: { content: 'Temporary verification comment.', isAnonymous: false, parentId: null },
      });
      expect(comment.status(), await comment.text()).toBe(201);

      const privateImage = await data<{ imageUrl: string }>(
        await first.api.post('/api/posts/images/upload', {
          headers: csrf(first),
          multipart: {
            file: {
              name: 'e2e-private.png',
              mimeType: 'image/png',
              buffer: readFileSync(join(process.cwd(), 'public', 'assets', 'logo-h-mark.png')),
            },
          },
        }),
      );
      const createdPrivate = await data<{ id: number }>(
        await first.api.post('/api/posts', {
          headers: csrf(first),
          data: {
            boardId: privateBoard!.id,
            title: 'Private E2E verification',
            content: 'This must not be visible to another user.',
            isAnonymous: false,
            visibility: 'MEMBERS_ONLY',
            imageUrl: privateImage.imageUrl,
          },
        }),
      );
      privatePostId = createdPrivate.id;

      const guestImage = await request.get(privateImage.imageUrl);
      expect([400, 404]).toContain(guestImage.status());

      const otherImage = await second.api.get(privateImage.imageUrl);
      expect([400, 404]).toContain(otherImage.status());

      const ownerImage = await first.api.get(privateImage.imageUrl);
      expect(ownerImage.status()).toBe(200);
      expect(ownerImage.headers()['cache-control']).toContain('private');
      expect(ownerImage.headers()['cache-control']).toContain('no-store');

      const forbiddenDetail = await second.api.get(`/api/posts/${privatePostId}`);
      expect([403, 404]).toContain(forbiddenDetail.status());

      const otherPrivateList = await data<{ content: Array<{ id: number }> }>(
        await second.api.get(`/api/posts?boardId=${privateBoard!.id}&page=0&size=20`),
      );
      expect(otherPrivateList.content.some((post) => post.id === privatePostId)).toBe(false);

      const record = await data<{ id: number }>(
        await first.api.post('/api/journal/records', {
          headers: csrf(first),
          data: {
            recordDate: new Date().toISOString().slice(0, 10),
            medicationStatus: 'NORMAL',
            avgSleep: 'H6_7',
            stressLevel: 'MEDIUM',
            hadSymptoms: false,
            prodromalSymptoms: [],
            triggers: [],
            memo: 'Temporary E2E journal record.',
            mood: 'NORMAL',
            supplementTaken: false,
            exerciseDone: false,
          },
        }),
      );
      journalId = record.id;

      const otherJournal = await second.api.get(`/api/journal/records/${journalId}`);
      expect([403, 404]).toContain(otherJournal.status());

      const normalUserAdmin = await first.api.get('/api/admin/reports');
      expect(normalUserAdmin.status()).toBe(403);
    } finally {
      if (first && journalId) {
        await first.api.delete(`/api/journal/records/${journalId}`, { headers: csrf(first) });
      }
      if (first && privatePostId) {
        await first.api.delete(`/api/posts/${privatePostId}`, { headers: csrf(first) });
      }
      if (first && publicPostId) {
        await first.api.delete(`/api/posts/${publicPostId}`, { headers: csrf(first) });
      }
      for (const account of accounts.reverse()) {
        await deleteAccount(account);
      }
    }
  });
});
