import { expect, test, type Page } from '@playwright/test';

async function stubPostAccess(page: Page, status: number, signedIn: boolean) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/users/me') {
      return route.fulfill({ status: signedIn ? 200 : 401, json: signedIn
        ? { success: true, data: { id: 42, nickname: '테스트', role: 'USER' } }
        : { success: false, message: '인증이 필요합니다.' } });
    }
    if (path === '/api/posts/37') {
      return route.fulfill({ status, json: { success: false, message: '테스트 접근 오류' } });
    }
    if (path === '/api/boards') return route.fulfill({ json: { success: true, data: [] } });
    if (path.endsWith('/comments')) return route.fulfill({ json: { success: true, data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 } } });
    return route.fulfill({ json: { success: true, data: null } });
  });
}

for (const status of [401, 403, 404]) {
  test(`guest receives generic login guidance for unavailable post (${status})`, async ({ page }) => {
    await stubPostAccess(page, status, false);
    await page.goto('/community/posts/37');
    await expect(page.getByRole('heading', { name: '로그인이 필요하거나 글을 볼 수 없습니다' })).toBeVisible();
    await expect(page.getByText('테스트 접근 오류')).toHaveCount(0);
    await expect(page.getByRole('link', { name: '로그인하고 보기' })).toHaveAttribute('href', '/login?from=%2Fcommunity%2Fposts%2F37');
  });
}

test('a signed-in member still sees an access error', async ({ page }) => {
  await stubPostAccess(page, 404, true);
  await page.goto('/community/posts/37');
  await expect(page.getByText('테스트 접근 오류')).toBeVisible();
  await expect(page.getByRole('heading', { name: '로그인이 필요하거나 글을 볼 수 없습니다' })).toHaveCount(0);
});

test('server failures are not represented as a login requirement', async ({ page }) => {
  await stubPostAccess(page, 500, false);
  await page.goto('/community/posts/37');
  await expect(page.getByText('테스트 접근 오류')).toBeVisible();
  await expect(page.getByRole('heading', { name: '로그인이 필요하거나 글을 볼 수 없습니다' })).toHaveCount(0);
});
