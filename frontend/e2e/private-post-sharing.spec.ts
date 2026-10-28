import { expect, test } from '@playwright/test';

for (const boardType of ['INQUIRY', 'PRIVATE_CONSULT', 'SECRET_STORY', 'FREE', 'UNKNOWN_BOARD']) {
  test(`${boardType}: private boards do not offer a share action`, async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const data = path === '/api/users/me' ? { id: 11, nickname: '테스트', role: 'ADMIN' }
        : path === '/api/boards' ? (boardType === 'UNKNOWN_BOARD' ? [] : [{ id: 1, name: '테스트 게시판', boardType }])
        : path === '/api/posts/41' ? {
          id: 41, boardId: 1, boardName: '테스트 게시판', title: '테스트 글', content: '테스트 본문',
          authorNickname: '테스트', viewCount: 1, visibility: 'MEMBERS_ONLY', isAnonymous: false,
          isMyPost: true, readable: true, imageUrl: null, staffReplied: false,
          createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
        }
        : path.endsWith('/comments') ? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }
        : path.endsWith('/bookmark') ? { bookmarked: false }
        : null;
      await route.fulfill({ status: 200, json: { success: true, data } });
    });
    await page.goto('/community/posts/41');
    await expect(page.getByText('테스트 글', { exact: true })).toBeVisible();
    const share = page.getByRole('button', { name: '게시글 공유' });
    if (boardType === 'FREE') await expect(share).toBeVisible();
    else await expect(share).toHaveCount(0);
  });
}
