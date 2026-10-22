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
  await expect(page.getByRole('link', { name: /로그인/ }).first()).toHaveAttribute('href', /\/login\?from=/);
  await expect(page.getByText('private-fixture-body')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '게시글 공유' })).toHaveCount(0);
});

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
