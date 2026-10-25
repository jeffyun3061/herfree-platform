import { expect, test, type Page } from '@playwright/test';

const memberPost = {
  id: 13, boardId: 1, boardName: '자유게시판', title: '제목 공개에 동의한 글',
  content: '회원에게만 보여 줄 본문', visibility: 'MEMBERS_ONLY',
  shareTitlePublicly: true, shareable: true, readable: true, isMyPost: true,
  isAnonymous: true, authorNickname: '익명', imageUrl: null, staffReplied: false,
  viewCount: 1, createdAt: '2026-10-25T00:00:00Z', updatedAt: '2026-10-25T00:00:00Z',
};

async function fixture(page: Page, signedIn: boolean, onCreate?: (body: Record<string, unknown>) => void) {
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let status = 200;
    let data: unknown = null;
    if (path === '/api/users/me') {
      status = signedIn ? 200 : 401;
      data = signedIn ? { id: 7, nickname: '미리보기 사용자', role: 'USER' } : null;
    } else if (path === '/api/boards') {
      data = [{ id: 1, name: '자유게시판', boardType: 'FREE', description: '' }];
    } else if (path === '/api/posts' && method === 'POST') {
      onCreate?.(route.request().postDataJSON());
      status = 201;
      data = memberPost;
    } else if (path === '/api/posts/13') {
      status = signedIn ? 200 : 404;
      data = signedIn ? memberPost : null;
    } else if (path.endsWith('/comments')) {
      data = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    } else if (path.endsWith('/bookmark')) {
      data = { bookmarked: false };
    } else if (path === '/api/reactions/summary') {
      data = { counts: [] };
    }
    await route.fulfill({ status, contentType: 'application/json',
      body: JSON.stringify({ success: status < 400, data, message: '요청을 처리할 수 없습니다.' }) });
  });
}

test('member-only title sharing needs explicit consent and resets when the title changes', async ({ page }, info) => {
  let submitted: Record<string, unknown> | null = null;
  await fixture(page, true, body => { submitted = body; });
  await page.goto('/community/write?boardId=1');
  await page.getByRole('radio', { name: /회원 공개/ }).check();
  const titleShare = page.getByRole('checkbox', { name: /로그인 전에도 글 제목만 공유 미리보기에 공개/ });
  await expect(titleShare).not.toBeChecked();
  await page.locator('#title').fill('처음 제목');
  await titleShare.check();
  await page.locator('#title').fill('제목 공개에 동의한 글');
  await expect(titleShare).not.toBeChecked();
  await titleShare.check();
  await page.getByLabel('본문', { exact: true }).fill('회원에게만 보여 줄 본문');
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.screenshot({ path: info.outputPath('member-title-optin.png') });
  await page.locator('button[type=submit]').last().click();
  await expect.poll(() => submitted).toMatchObject({
    title: '제목 공개에 동의한 글', visibility: 'MEMBERS_ONLY', shareTitlePublicly: true,
  });
});

test('editing a shared title requires a new choice', async ({ page }) => {
  await fixture(page, true);
  await page.goto('/community/write?boardId=1&postId=13');
  const titleShare = page.getByRole('checkbox', { name: /로그인 전에도 글 제목만 공유 미리보기에 공개/ });
  await expect(titleShare).toBeChecked();
  await page.locator('#title').fill('바꾼 제목');
  await expect(titleShare).not.toBeChecked();
});

test('guest opening a shared title sees the login notice and no body', async ({ page }, info) => {
  await fixture(page, false);
  await page.goto('/community/posts/13');
  await expect(page.getByRole('heading', { name: '로그인 후 글을 확인해 주세요' })).toBeVisible();
  await expect(page.getByRole('link', { name: '로그인하고 계속하기' })).toHaveAttribute('href', /from=%2Fcommunity%2Fposts%2F13/);
  await expect(page.getByText('회원에게만 보여 줄 본문')).toHaveCount(0);
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.screenshot({ path: info.outputPath('member-title-login.png') });
});
