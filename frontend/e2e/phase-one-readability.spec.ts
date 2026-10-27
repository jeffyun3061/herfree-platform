import { expect, test, type Locator } from '@playwright/test';

const body = '긴 고민을 천천히 나누고 싶어요. 작성할 때와 게시된 글에서 줄이 바뀌는 위치가 같으면 읽기 편합니다.\n\n다음 문단입니다. https://example.invalid/' + 'very-long-path-'.repeat(8);
const post = { id: 41, boardId: 1, boardName: '자유게시판', title: '편하게 읽는 글', content: body,
  authorNickname: '테스트', viewCount: 1, visibility: 'PUBLIC', isAnonymous: false, isMyPost: true,
  readable: true, imageUrl: null, staffReplied: false, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' };

async function textLayout(locator: Locator) {
  return locator.evaluate(async (element) => {
    await document.fonts.ready;
    const styles = getComputedStyle(element);
    const field = element instanceof HTMLTextAreaElement ? element : null;
    const width = element.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    const mirror = document.createElement('div');
    for (const key of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'whiteSpace', 'overflowWrap', 'wordBreak', 'tabSize', 'textAlign'] as const) mirror.style[key] = styles[key];
    mirror.style.width = `${width}px`;
    mirror.style.position = 'absolute'; mirror.style.visibility = 'hidden';
    mirror.textContent = field ? field.value : element.textContent;
    document.body.append(mirror);
    const node = mirror.firstChild!;
    const rows: number[] = [];
    let firstTop: number | undefined;
    for (let i = 0; i < (node.textContent?.length ?? 0); i++) {
      const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + 1);
      const top = range.getBoundingClientRect().top; firstTop ??= top;
      rows.push(Math.round((top - firstTop) / parseFloat(styles.lineHeight)));
    }
    mirror.remove();
    return { width, rows, fontSize: styles.fontSize, overflow: element.scrollWidth > element.clientWidth };
  });
}

test('editor, preview and post preserve readable wrapping without the bottom menu', async ({ page }, testInfo) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path === '/api/users/me' ? { id: 11, nickname: '테스트', role: 'USER' }
      : path === '/api/boards' ? [{ id: 1, name: '자유게시판', boardType: 'FREE', description: '' }]
      : path === '/api/posts/41' ? post
      : path.endsWith('/comments') ? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }
      : path.endsWith('/bookmark') ? { bookmarked: false }
      : path === '/api/reactions/summary' ? { targetType: 'POST', targetId: 41, counts: [] } : null;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: '', data }) });
  });
  await page.goto('/community/write?boardId=1');
  await expect(page.getByRole('navigation', { name: '하단 메뉴' })).toHaveCount(0);
  const editor = page.locator('#content'); await editor.fill(body);
  const editorLayout = await textLayout(editor);
  await page.getByRole('button', { name: '미리보기', exact: true }).click();
  const preview = page.getByTestId('community-post-preview').locator('.hf-readable-content--community');
  await expect(preview).toHaveText(body);
  const previewLayout = await textLayout(preview);
  expect(previewLayout).toEqual(editorLayout);
  expect(previewLayout.fontSize).toBe('17px'); expect(previewLayout.overflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('writing-preview.png'), fullPage: true });
  await page.goto('/community/posts/41');
  await expect(page.getByRole('navigation', { name: '하단 메뉴' })).toHaveCount(0);
  const published = page.locator('.hf-readable-content--community');
  await expect(published).toHaveText(body);
  expect(await textLayout(published)).toEqual(previewLayout);
  await page.screenshot({ path: testInfo.outputPath('post-detail.png'), fullPage: true });
  if (page.viewportSize()!.width >= 1024) {
    await expect(page.locator('.community-reader-shell')).toHaveCSS('border-radius', '0px');
  }
});
