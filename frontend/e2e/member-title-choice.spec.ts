import { expect, test, type Page } from '@playwright/test';

async function fixture(page: Page, signedIn: boolean, save?: (body: unknown) => void) {
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let status = 200;
    let data: unknown = null;
    if (path === '/api/users/me') { status = signedIn ? 200 : 401; data = signedIn ? { id: 7, nickname: '테스트', role: 'USER' } : null; }
    else if (path === '/api/boards') data = [{ id: 1, name: '자유게시판', boardType: 'FREE', description: '' }];
    else if (path === '/api/posts' && route.request().method() === 'POST') {
      save?.(route.request().postDataJSON()); status = 201;
      data = { id: 13, boardId: 1, title: '제목', content: '본문', visibility: 'MEMBERS_ONLY' };
    } else if (path === '/api/posts/13') { status = 404; }
    else if (path.endsWith('/comments')) data = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    else if (path.endsWith('/bookmark')) data = { bookmarked: false };
    await route.fulfill({ status, json: { success: status < 400, data, message: '요청을 처리할 수 없습니다.' } });
  });
}

test('title sharing requires a fresh choice after title changes', async ({ page }) => {
  let submitted: unknown = null;
  await fixture(page, true, body => { submitted = body; });
  await page.goto('/community/write?boardId=1');
  await page.getByRole('radio', { name: /회원 공개/ }).check();
  const choice = page.getByRole('checkbox', { name: /로그인 전에도 글 제목만 공유/ });
  await expect(choice).not.toBeChecked();
  await page.locator('#title').fill('처음 제목');
  await choice.check();
  await page.locator('#title').fill('수정한 제목');
  await expect(choice).not.toBeChecked();
  await choice.check();
  await page.getByLabel('본문', { exact: true }).fill('합성 테스트 본문');
  await page.locator('button[type=submit]').last().click();
  await expect.poll(() => submitted).toMatchObject({ title: '수정한 제목', visibility: 'MEMBERS_ONLY', shareTitlePublicly: true });
});

test('a guest sees login guidance without member content', async ({ page }) => {
  await fixture(page, false);
  await page.goto('/community/posts/13');
  await expect(page.getByRole('heading', { name: '로그인이 필요하거나 글을 볼 수 없습니다' })).toBeVisible();
  await expect(page.getByRole('link', { name: '로그인하고 보기' })).toHaveAttribute('href', '/login?from=%2Fcommunity%2Fposts%2F13');
  await expect(page.getByText('합성 테스트 본문')).toHaveCount(0);
});
