import { expect, test, type Locator } from '@playwright/test';

async function positions(locator: Locator) {
  return locator.evaluate(async (element) => {
    await document.fonts.ready;
    const origin = element.getBoundingClientRect();
    const rows: { text: string; positions: number[][] }[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const chars: number[][] = [];
      for (let i = 0; i < (node.textContent?.length ?? 0); i++) {
        const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        chars.push([Math.round(rect.left - origin.left), Math.round(rect.top - origin.top)]);
      }
      rows.push({ text: node.textContent ?? '', positions: chars });
    }
    return { width: origin.width, rows };
  });
}

test.describe('community writing rich formats', () => {
  test('formats, safe links and wrapping survive preview, save and editing', async ({ page }, info) => {
    let saved: { content: string; richContent: string; title: string } | undefined;
    await page.route('**/api/**', async (route) => {
      const request = route.request(); const path = new URL(request.url()).pathname;
      if (path === '/api/posts' && request.method() === 'POST') saved = request.postDataJSON();
      const post = { id: 41, boardId: 1, boardName: '자유방', title: saved?.title ?? '서식 테스트', content: saved?.content ?? '', richContent: saved?.richContent ?? null,
        authorNickname: '편집 사용자', viewCount: 1, visibility: 'PUBLIC', isAnonymous: false, isMyPost: true, readable: true, imageUrl: null, staffReplied: false, createdAt: '2026-10-11T00:00:00Z', updatedAt: '2026-10-11T00:00:00Z' };
      const data = path === '/api/users/me' ? { id: 11, nickname: '편집 사용자', role: 'USER' }
        : path === '/api/boards' ? [{ id: 1, name: '자유방', boardType: 'FREE', description: '' }]
        : path === '/api/posts/41' || (path === '/api/posts' && request.method() === 'POST') ? post
        : path.endsWith('/comments') ? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }
        : path.endsWith('/bookmark') ? { bookmarked: false }
        : path === '/api/reactions/summary' ? { targetType: 'POST', targetId: 41, counts: [] } : null;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
    });
    await page.goto('/community/write?boardId=1');
    await page.getByPlaceholder('주제를 입력해 주세요', { exact: true }).fill('읽기 편한 글');
    const text = '작은 이야기의 시작\n이 문장은 충분히 길어서 모바일과 PC에서 여러 줄로 접혀 보입니다. 같은 폭과 글꼴을 쓰면 작성할 때와 읽을 때 모두 편하게 볼 수 있어요.\n\n마지막 안내';
    await page.getByLabel('본문', { exact: true }).fill(text);
    await page.getByRole('button', { name: /서식 편집 시작/ }).click();
    const editor = page.getByRole('textbox', { name: '본문', exact: true }); await expect(editor).toHaveAttribute('contenteditable', 'true');
    await editor.focus(); await page.keyboard.press('Control+Home'); await page.keyboard.press('Shift+End');
    await page.getByRole('button', { name: '소제목', exact: true }).click(); await expect(editor.locator('h2')).toHaveText('작은 이야기의 시작');
    await editor.focus(); await page.keyboard.press('Control+End'); await page.keyboard.press('Shift+Home');
    await page.getByRole('button', { name: '굵게', exact: true }).click();
    await page.getByRole('button', { name: '링크', exact: true }).click();
    await page.getByLabel('링크 주소', { exact: true }).fill('javascript:alert(1)');
    await page.getByRole('button', { name: '링크 적용', exact: true }).click(); await expect(page.getByRole('alert').filter({ hasText: 'http 또는 https' })).toBeVisible();
    await page.getByLabel('링크 주소', { exact: true }).fill('https://example.test/guide');
    await page.getByRole('button', { name: '링크 적용', exact: true }).click();
    await expect(editor.locator('a strong')).toHaveText('마지막 안내');
    await page.getByRole('button', { name: '글머리 목록', exact: true }).click(); await expect(editor.locator('ul')).toHaveCount(1);
    await page.getByRole('button', { name: '번호 목록', exact: true }).click(); await expect(editor.locator('ol')).toHaveCount(1);
    await editor.locator('p').filter({ hasText: '이 문장은 충분히 길어서' }).click();
    await page.getByRole('button', { name: '인용', exact: true }).click(); await expect(editor.locator('blockquote')).toHaveCount(1);
    await page.getByRole('button', { name: '본문 미리보기', exact: true }).click();
    const preview = page.getByRole('region', { name: '게시글 본문 미리보기' }).locator('.hf-community-rich');
    const inputPositions = await positions(editor); expect(await positions(preview)).toEqual(inputPositions);
    await page.screenshot({ path: info.outputPath('rich-writing-preview.png'), fullPage: true });
    await page.getByRole('button', { name: '등록하기', exact: true }).click();
    await expect.poll(() => saved?.richContent).toBeTruthy(); expect(saved?.content).toContain('마지막 안내');
    expect(saved?.richContent).not.toContain('javascript:');
    await expect(page).toHaveURL(/\/community\/posts\/41/);
    const body = page.locator('article .hf-community-rich'); await expect(body).toBeVisible(); expect(await positions(body)).toEqual(inputPositions);
    await expect(body.locator('a')).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc');
    await page.screenshot({ path: info.outputPath('rich-published-text.png'), fullPage: true });
    await page.goto('/community/write?postId=41'); await expect(page.getByRole('textbox', { name: '본문', exact: true })).toHaveAttribute('contenteditable', 'true');
    await expect(page.locator('.tiptap h2')).toHaveText('작은 이야기의 시작'); await expect(page.locator('.tiptap a strong')).toHaveText('마지막 안내');
  });
});
