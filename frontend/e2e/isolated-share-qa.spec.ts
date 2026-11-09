import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { expect, request as playwrightRequest, test, type APIRequestContext } from '@playwright/test';

// This suite is deliberately bound to the exact pre-merge candidate frontend.
// It must only be run by the isolated QA coordinator; it cannot approve release.
const enabled = process.env.ISOLATED_SHARE_QA === 'true';
const origin = 'https://qa-4160aee7de7a-4160aee7.d2bcg3vnlv5hkh.amplifyapp.com';
const candidate = '4160aee7de7a7e7a8b8333813580332fe2ba7785';
const image = '439777528445.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api@sha256:e54f5b149fc128e521fadebb98ca3d80ede98161ff9cab7c4e9c6b57de428f23';
const username = process.env.E2E_HTTP_USERNAME?.trim();
const password = process.env.E2E_HTTP_PASSWORD;

function verifyTarget(): void {
  const run = process.env.ISOLATED_QA_RUN || '';
  const candidateDir = process.env.ISOLATED_QA_CANDIDATE_DIR;
  if (process.env.PLAYWRIGHT_BASE_URL !== origin || process.env.ISOLATED_QA_COMMIT !== candidate
      || process.env.ISOLATED_QA_IMAGE !== image || !/^[a-f0-9]{8}$/.test(run)
      || !username || !password || !candidateDir) {
    throw new Error('Isolated QA target or credentials are not the pinned candidate.');
  }
  // Recheck the fixed instance, DNS, installed tools, image and datasource.
  // Do not print SSM output, credentials or database data in test logs.
  try {
    execFileSync('python3', [join(process.cwd(), '../infra/scripts/verify-isolated-staging.py'),
      '--run', run, '--image', image], { stdio: 'pipe', timeout: 120_000 });
    execFileSync('python3', [join(process.cwd(), '../infra/scripts/verify-isolated-frontend.py'),
      '--account', '439777528445', '--app', 'd2bcg3vnlv5hkh',
      '--branch', 'qa-4160aee7de7a-4160aee7', '--sha', candidate,
      '--api', 'https://api-staging.herpfree.co.kr', '--repo', candidateDir, '--candidate-pr', '195'], {
      stdio: 'pipe', timeout: 120_000,
      env: { ...process.env, ISOLATED_QA_BASIC_USERNAME: username, ISOLATED_QA_BASIC_PASSWORD: password },
    });
  } catch {
    throw new Error('Isolated staging verification failed; no test write was attempted.');
  }
}

async function payload<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { success: boolean; data: T };
  expect(body.success).toBe(true);
  return body.data;
}

test.describe('isolated share QA', () => {
  test.skip(!enabled, 'Only the isolated staging QA coordinator may enable this suite.');
  // Avoid retaining authenticated requests, cookies or screenshots as CI artifacts.
  test.use({ trace: 'off', screenshot: 'off', video: 'off' });

  test('community previews hide bodies and require login for public and member posts', async ({ page, request }) => {
    test.setTimeout(240_000);
    verifyTarget();
    const api = await playwrightRequest.newContext({
      baseURL: origin,
      httpCredentials: { username: username!, password: password! },
      extraHTTPHeaders: { Origin: origin },
    });
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const email = `qa-${unique}@example.invalid`;
    const accountPassword = 'E2e-Test-Password!4829';
    const postIds: number[] = [];
    let csrf = '';
    try {
      const signup = await api.post('/api/auth/signup', { data: {
        email, password: accountPassword, nickname: `qa${unique}`.slice(0, 20),
        agreeTerms: true, agreePrivacy: true, agreeSensitive: true, agreeAge: true,
        agreeMarketing: false, agreeHealthStatistics: false,
      } });
      expect(signup.status()).toBe(201);
      const login = await api.post('/api/auth/login', { data: { email, password: accountPassword } });
      expect(login.ok()).toBeTruthy();
      csrf = (await api.storageState()).cookies.find(c => c.name.endsWith('herfree-csrf'))?.value || '';
      expect(csrf).not.toBe('');
      const headers = { 'X-Herfree-CSRF': csrf };
      const boards = await payload<Array<{ id: number; boardType: string }>>(await api.get('/api/boards'));
      const board = boards.find(item => item.boardType === 'FREE');
      expect(board).toBeTruthy();
      await page.addInitScript(() => {
        window.sessionStorage.removeItem('accessToken');
        window.sessionStorage.removeItem('sessionUser');
        Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
          (window as Window & { qaShared?: ShareData }).qaShared = data;
        } });
      });
      for (const visibility of ['PUBLIC', 'MEMBERS_ONLY']) {
        const title = `QA ${visibility} ${unique}`;
        const content = `private-test-body-${unique}`;
        const created = await payload<{ id: number }>(await api.post('/api/posts', {
          headers, data: { boardId: board!.id, title, content, isAnonymous: false, visibility },
        }));
        postIds.push(created.id);
        expect((await request.get(`/api/posts/${created.id}`)).status()).toBe(404);
        const preview = await payload<{ title: string; description: string }>(
          await request.get(`/api/posts/${created.id}/share-preview`));
        expect(preview.title).toBe(title);
        expect(preview.description).toBe('로그인 후 게시글을 확인해 주세요.');
        const html = await request.get(`/community/posts/${created.id}`, {
          headers: { 'User-Agent': 'kakaotalk-scrap/1.0' },
        });
        const head = (await html.text()).match(/<head>[\s\S]*?<\/head>/)?.[0] || '';
        expect(head).toContain(`property="og:title" content="${Array.from(title).slice(0, 17).join('')}…"`);
        expect(head).not.toContain(content);
        await page.context().clearCookies();
        await page.goto(`/community/posts/${created.id}`);
        await expect(page.getByRole('link', { name: '로그인하고 보기' })).toBeVisible();
        const memberPost = await payload<{ content: string }>(await api.get(`/api/posts/${created.id}`));
        expect(memberPost.content).toBe(content);
        const comment = `qa-comment-${unique}`;
        await payload(await api.post(`/api/posts/${created.id}/comments`, { headers, data: { content: comment } }));
        expect((await request.get(`/api/posts/${created.id}/comments`)).status()).toBe(404);
        const comments = await payload<{ content: Array<{ content: string }> }>(await api.get(`/api/posts/${created.id}/comments`));
        expect(comments.content.some(item => item.content === comment)).toBe(true);
        await page.context().addCookies((await api.storageState()).cookies);
        await page.goto('/');
        await page.goto(`/community/posts/${created.id}`);
        await page.getByRole('button', { name: '게시글 공유' }).click();
        const shared = await page.evaluate(() => (window as Window & { qaShared?: ShareData }).qaShared);
        expect(shared).toEqual({ url: `${origin}/community/posts/${created.id}` });
      }
      // Reconfirm the environment after writes; this remains point-in-time
      // evidence and is not a replacement for workflow serialization.
      verifyTarget();
    } finally {
      try {
        // Never send cleanup requests if the target can no longer be proven.
        if (csrf) {
          verifyTarget();
          const headers = { 'X-Herfree-CSRF': csrf };
          for (const id of postIds) expect((await api.delete(`/api/posts/${id}`, { headers })).status()).toBe(204);
          expect((await api.delete('/api/users/me', { headers })).status()).toBe(204);
        }
      } finally {
        await api.dispose();
      }
    }
  });
});
