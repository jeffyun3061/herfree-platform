import { expect, test, type Page } from '@playwright/test';

async function fixture(page: Page, signedIn: boolean, status = 200, shareable: boolean | undefined = false) {
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let code = 200;
    let data: unknown = null;
    if (path === '/api/users/me') {
      code = signedIn ? 200 : 401;
      data = signedIn ? { id: 7, nickname: '작성자', role: 'USER' } : null;
    } else if (path === '/api/boards') data = [{ id: 3, name: '운영 문의', boardType: 'INQUIRY' }];
    else if (path === '/api/posts/11') {
      code = status;
      data = status === 200 ? { id: 11, boardId: 3, boardName: '운영 문의', title: '나만 볼 문의', content: 'private-fixture-body',
        visibility: 'MEMBERS_ONLY', readable: true, shareable, isMyPost: true, authorNickname: '작성자', isAnonymous: false,
        staffReplied: false, viewCount: 1, createdAt: '2026-10-23T00:00:00Z' } : null;
    } else if (path.endsWith('/comments')) data = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    else if (path.endsWith('/bookmark')) data = { bookmarked: false };
    else if (path === '/api/reactions/summary') data = { counts: [] };
    await route.fulfill({ status: code, contentType: 'application/json', body: JSON.stringify({ success: code === 200, data, message: '요청을 처리할 수 없습니다.' }) });
  });
}

test('even an authorized author cannot share a private inquiry', async ({ page }) => {
  await fixture(page, true); await page.goto('/community/posts/11');
  await expect(page.getByText('private-fixture-body', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '게시글 공유' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: '하단 메뉴' })).toHaveCount(0);
});

test('guest direct URLs offer login without private data', async ({ page }) => {
  await fixture(page, false, 404); await page.goto('/community/posts/11');
  await expect(page.getByRole('heading', { name: '로그인 후 글을 확인해 주세요' })).toBeVisible();
  await expect(page.getByRole('link', { name: /로그인/ }).first()).toHaveAttribute('href', /\/login\?from=/);
  await expect(page.getByText('private-fixture-body')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '게시글 공유' })).toHaveCount(0);
});

test('public ordinary posts are readable without a login wall', async ({ page }) => {
  await fixture(page, false);
  await page.route('**/api/posts/11', route => route.fulfill({ json: { success: true, data: {
    id: 11, boardId: 1, boardName: '자유', title: '공개한 이야기', content: '공개 글은 비회원도 읽을 수 있습니다.',
    visibility: 'PUBLIC', readable: true, shareable: true, isMyPost: false, authorNickname: '익명', isAnonymous: true,
    staffReplied: false, viewCount: 1, createdAt: '2026-10-23T00:00:00Z',
  } } }));
  await page.goto('/community/posts/11');
  await expect(page.getByText('공개 글은 비회원도 읽을 수 있습니다.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '로그인 후 글을 확인해 주세요' })).toHaveCount(0);
});

for (const allowed of [true, false]) {
  test(`shared member link returns to its post after login and checks access (${allowed})`, async ({ page }, info) => {
    let signedIn = false;
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      let status = 200; let data: unknown = null;
      if (path === '/api/auth/login') {
        signedIn = true; data = { userId: 7, nickname: '테스트 회원', role: 'USER' };
      } else if (path === '/api/users/me') {
        status = signedIn ? 200 : 401; data = signedIn ? { userId: 7, nickname: '테스트 회원', role: 'USER' } : null;
      } else if (path === '/api/boards') data = [{ id: 1, name: '자유', boardType: 'FREE' }];
      else if (path === '/api/posts/42') {
        status = signedIn && allowed ? 200 : 404;
        data = status === 200 ? { id: 42, boardId: 1, boardName: '자유', title: '회원용 이야기', content: '허용된 회원에게만 표시할 본문',
          visibility: 'MEMBERS_ONLY', readable: true, shareable: false, isMyPost: false, authorNickname: '익명', isAnonymous: true,
          staffReplied: false, viewCount: 1, createdAt: '2026-10-23T00:00:00Z' } : null;
      } else if (path.endsWith('/comments')) data = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
      else if (path.endsWith('/bookmark')) data = { bookmarked: false };
      else if (path === '/api/reactions/summary') data = { counts: [] };
      await route.fulfill({ status, json: { success: status === 200, data, message: '요청을 처리할 수 없습니다.' } });
    });
    await page.goto('/community/posts/42');
    await expect(page.getByText('허용된 회원에게만 표시할 본문')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '로그인 후 글을 확인해 주세요' })).toBeVisible();
    if (allowed) await page.screenshot({ path: info.outputPath('shared-member-login-notice.png'), fullPage: true });
    await page.getByRole('link', { name: '로그인하고 계속하기' }).click();
    await expect(page).toHaveURL(/\/login\?from=%2Fcommunity%2Fposts%2F42/);
    await expect(page.getByRole('status')).toContainText('요청한 글로 돌아갑니다');
    await page.getByLabel('이메일', { exact: true }).fill('member-link@example.invalid');
    await page.getByLabel('비밀번호', { exact: true }).fill('Fixture-Only!1234');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/community\/posts\/42$/);
    if (allowed) await expect(page.getByText('허용된 회원에게만 표시할 본문', { exact: true })).toBeVisible();
    else {
      await expect(page.getByText('이 글에 접근할 수 없습니다.')).toBeVisible();
      await expect(page.getByText('허용된 회원에게만 표시할 본문')).toHaveCount(0);
      await expect(page.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/');
    }
  });
}

test('signed-in non-owners get an unavailable message and home link', async ({ page }) => {
  await fixture(page, true, 404); await page.goto('/community/posts/11');
  await expect(page.getByText('이 글에 접근할 수 없습니다.')).toBeVisible();
  await expect(page.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/');
  await expect(page.getByText('private-fixture-body')).toHaveCount(0);
});

test('server outages are not mistaken for missing login', async ({ page }) => {
  await fixture(page, false, 503); await page.goto('/community/posts/11');
  await expect(page.getByText('요청을 처리할 수 없습니다.')).toBeVisible();
  await expect(page.getByRole('link', { name: /로그인/ })).toHaveCount(0);
});
