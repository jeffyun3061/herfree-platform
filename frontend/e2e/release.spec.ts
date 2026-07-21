import { expect, test, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://127.0.0.1:3100';
const host = new URL(baseURL).hostname.toLowerCase();
const mutationEnabled = process.env.E2E_ALLOW_MUTATION === 'true';
const mutationHostAllowed =
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host.includes('staging') ||
  host.includes('amplifyapp.com') ||
  host.includes('dev.');

type Envelope<T> = { success: boolean; message: string; data: T };

async function data<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as Envelope<T>;
  expect(body.success).toBe(true);
  return body.data;
}

async function signupAndLogin(request: APIRequestContext, suffix: string) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const email = `e2e-${suffix}-${unique}@example.invalid`;
  const password = 'E2e-Test-Password!4829';
  const nickname = `e2e${suffix.slice(0, 5)}${unique.slice(-9)}`.slice(0, 20);

  const signup = await request.post('/api/auth/signup', {
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

  const login = await request.post('/api/auth/login', { data: { email, password } });
  const loginData = await data<{
    accessToken: string;
    userId: number;
    nickname: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  }>(login);
  return {
    email,
    token: loginData.accessToken,
    user: {
      userId: loginData.userId,
      nickname: loginData.nickname,
      role: loginData.role,
    },
  };
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
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

    const health = await request.get('/api/health');
    expect(health.status()).toBe(200);
    expect(health.headers()['x-request-id']).toBeTruthy();
    await data(await request.get('/api/boards'));
    await data(await request.get('/api/posts?page=0&size=5'));

    const admin = await request.get('/api/admin/reports');
    expect([401, 403]).toContain(admin.status());
  });
});

test.describe('staging data flow', () => {
  test.skip(!mutationEnabled, 'Set E2E_ALLOW_MUTATION=true only for local or staging QA.');
  test.skip(!mutationHostAllowed, 'Mutation tests are blocked on the production hostname.');

  test('logged-in journal exits the initial loading state', async ({ page, request }, testInfo) => {
    const account = await signupAndLogin(request, `journal-${testInfo.project.name}`);

    try {
      // 실제 브라우저와 같은 출처를 먼저 연 뒤 세션을 저장해 opaque-origin 오차를 피한다.
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ token, user }) => {
        window.sessionStorage.setItem('accessToken', token);
        window.sessionStorage.setItem('sessionUser', JSON.stringify(user));
      }, account);

      const response = await page.goto('/journal', { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText('개인일지를 준비하는 중...')).toHaveCount(0);
    } finally {
      await request.delete('/api/users/me', { headers: auth(account.token) });
    }
  });

  test('mypage account menu and security settings keep their intended order', async ({ page, request }, testInfo) => {
    const account = await signupAndLogin(request, `account-${testInfo.project.name}`);

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ token, user }) => {
        window.sessionStorage.setItem('accessToken', token);
        window.sessionStorage.setItem('sessionUser', JSON.stringify(user));
      }, account);

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
      await request.delete('/api/users/me', { headers: auth(account.token) });
    }
  });

  test('mypage shows written, received-reaction and bookmarked post collections', async ({ page, request }, testInfo) => {
    const owner = await signupAndLogin(request, `collections-owner-${testInfo.project.name}`);
    const reader = await signupAndLogin(request, `collections-reader-${testInfo.project.name}`);
    let postId: number | undefined;
    let reactionAdded = false;
    let bookmarkAdded = false;

    try {
      const boards = await data<Array<{ id: number; boardType: string }>>(await request.get('/api/boards'));
      const board = boards.find((item) => item.boardType === 'FREE');
      expect(board).toBeTruthy();
      const title = `E2E mypage collections ${Date.now()}`;
      const created = await data<{ id: number }>(await request.post('/api/posts', {
        headers: auth(owner.token),
        data: {
          boardId: board!.id,
          title,
          content: 'Temporary automated collection verification post.',
          isAnonymous: false,
          visibility: 'PUBLIC',
        },
      }));
      postId = created.id;

      const bookmark = await request.put(`/api/posts/${postId}/bookmark`, {
        headers: auth(reader.token),
      });
      expect(bookmark.status(), await bookmark.text()).toBe(200);
      bookmarkAdded = true;

      const reaction = await request.post('/api/reactions', {
        headers: auth(reader.token),
        data: { targetType: 'POST', targetId: postId, reactionType: 'EMPATHY' },
      });
      expect(reaction.status(), await reaction.text()).toBe(200);
      reactionAdded = true;

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ token, user }) => {
        window.sessionStorage.setItem('accessToken', token);
        window.sessionStorage.setItem('sessionUser', JSON.stringify(user));
      }, owner);
      await page.goto('/mypage', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /내가 쓴 글/ }).click();
      await expect(page.getByRole('heading', { name: '내가 쓴 글' })).toBeVisible();
      await expect(page.getByText(title)).toBeVisible();
      await page.getByRole('link', { name: /받은 공감/ }).click();
      await expect(page).toHaveURL(/\/mypage\/received-reactions$/);
      await expect(page.getByRole('heading', { name: '받은 공감' })).toBeVisible();
      await expect(page.getByText(title)).toBeVisible();

      await page.evaluate(({ token, user }) => {
        window.sessionStorage.setItem('accessToken', token);
        window.sessionStorage.setItem('sessionUser', JSON.stringify(user));
      }, reader);
      await page.goto('/mypage', { waitUntil: 'domcontentloaded' });
      await page.getByRole('link', { name: /스크랩한 글/ }).click();
      await expect(page).toHaveURL(/\/mypage\/bookmarks$/);
      await expect(page.getByRole('heading', { name: '스크랩한 글' })).toBeVisible();
      await expect(page.getByText(title)).toBeVisible();
    } finally {
      if (bookmarkAdded && postId) {
        await request.delete(`/api/posts/${postId}/bookmark`, { headers: auth(reader.token) });
      }
      if (reactionAdded && postId) {
        await request.post('/api/reactions', {
          headers: auth(reader.token),
          data: { targetType: 'POST', targetId: postId, reactionType: 'EMPATHY' },
        });
      }
      if (postId) {
        await request.delete(`/api/posts/${postId}`, { headers: auth(owner.token) });
      }
      await request.delete('/api/users/me', { headers: auth(owner.token) });
      await request.delete('/api/users/me', { headers: auth(reader.token) });
    }
  });

  test('signup, post, comment, journal and private-board isolation', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Run destructive flow once.');

    const first = await signupAndLogin(request, 'a');
    const second = await signupAndLogin(request, 'b');
    let publicPostId: number | undefined;
    let privatePostId: number | undefined;
    let journalId: number | undefined;

    try {
      const boards = await data<Array<{ id: number; boardType: string }>>(await request.get('/api/boards'));
      const publicBoard = boards.find((board) => board.boardType === 'FREE');
      const privateBoard = boards.find((board) => board.boardType === 'INQUIRY');
      expect(publicBoard).toBeTruthy();
      expect(privateBoard).toBeTruthy();

      const imageUpload = await request.post('/api/posts/images/upload', {
        headers: auth(first.token),
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
        await request.post('/api/posts', {
          headers: auth(first.token),
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

      const comment = await request.post(`/api/posts/${publicPostId}/comments`, {
        headers: auth(second.token),
        data: { content: 'Temporary verification comment.', isAnonymous: false, parentId: null },
      });
      expect(comment.status(), await comment.text()).toBe(201);

      const privateImage = await data<{ imageUrl: string }>(
        await request.post('/api/posts/images/upload', {
          headers: auth(first.token),
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
        await request.post('/api/posts', {
          headers: auth(first.token),
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

      const otherImage = await request.get(privateImage.imageUrl, {
        headers: auth(second.token),
      });
      expect([400, 404]).toContain(otherImage.status());

      const ownerImage = await request.get(privateImage.imageUrl, {
        headers: auth(first.token),
      });
      expect(ownerImage.status()).toBe(200);
      expect(ownerImage.headers()['cache-control']).toContain('private');
      expect(ownerImage.headers()['cache-control']).toContain('no-store');

      const forbiddenDetail = await request.get(`/api/posts/${privatePostId}`, {
        headers: auth(second.token),
      });
      expect([403, 404]).toContain(forbiddenDetail.status());

      const otherPrivateList = await data<{ content: Array<{ id: number }> }>(
        await request.get(`/api/posts?boardId=${privateBoard!.id}&page=0&size=20`, {
          headers: auth(second.token),
        }),
      );
      expect(otherPrivateList.content.some((post) => post.id === privatePostId)).toBe(false);

      const record = await data<{ id: number }>(
        await request.post('/api/journal/records', {
          headers: auth(first.token),
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

      const otherJournal = await request.get(`/api/journal/records/${journalId}`, {
        headers: auth(second.token),
      });
      expect([403, 404]).toContain(otherJournal.status());

      const normalUserAdmin = await request.get('/api/admin/reports', {
        headers: auth(first.token),
      });
      expect(normalUserAdmin.status()).toBe(403);
    } finally {
      if (journalId) {
        await request.delete(`/api/journal/records/${journalId}`, { headers: auth(first.token) });
      }
      if (privatePostId) {
        await request.delete(`/api/posts/${privatePostId}`, { headers: auth(first.token) });
      }
      if (publicPostId) {
        await request.delete(`/api/posts/${publicPostId}`, { headers: auth(first.token) });
      }
      await request.delete('/api/users/me', { headers: auth(first.token) });
      await request.delete('/api/users/me', { headers: auth(second.token) });
    }
  });
});
