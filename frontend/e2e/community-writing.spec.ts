import { expect, test, type Locator } from '@playwright/test';

const text = [
  '오늘의 이야기를 천천히 나눠 보려고 해요. 긴 문장도 작성창에서 보이는 위치 그대로 게시글에서 줄이 바뀌면 좋겠습니다. ',
  '직접 넣은 줄바꿈도 그대로 남아요.',
  '',
  '',
  '다음 문단에는 긴 주소도 넣어 봅니다. https://example.invalid/' + 'long-path-'.repeat(12),
  '<img src=x onerror=alert(1)> 이 문장은 코드가 아니라 글자로 표시돼요.',
].join('\n');

// Browser layout evidence: record each character's rendered row. For a native
// textarea, a plain DOM mirror uses its measured content box and computed text
// styles. This catches width, padding, font and wrapping differences with the
// real preview/post while avoiding any writes to a backend.
async function layout(locator: Locator) {
  return locator.evaluate(async (element) => {
    await document.fonts.ready;
    const styles = getComputedStyle(element);
    const field = element instanceof HTMLTextAreaElement ? element : null;
    const box = element.getBoundingClientRect();
    const contentWidth = element.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    const mirror = document.createElement('div');
    for (const key of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
      'whiteSpace', 'overflowWrap', 'wordBreak', 'tabSize', 'textAlign'] as const) {
      mirror.style[key] = styles[key];
    }
    mirror.style.width = `${contentWidth}px`;
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.textContent = field ? field.value : element.textContent;
    document.body.append(mirror);
    const source = field ? mirror : element;
    const node = source.firstChild!;
    const rows: number[] = [];
    let firstTop: number | undefined;
    for (let index = 0; index < (node.textContent?.length ?? 0); index++) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const rect = range.getBoundingClientRect();
      firstTop ??= rect.top;
      rows.push(Math.round((rect.top - firstTop) / parseFloat(styles.lineHeight)));
    }
    mirror.remove();
    return { width: contentWidth, fontSize: styles.fontSize, lineHeight: styles.lineHeight,
      rows, overflow: element.scrollWidth > element.clientWidth, boxWidth: box.width };
  });
}

test.describe('community writing', () => {
  test.beforeEach(async ({ page }) => {
    // All API calls are fulfilled locally, including analytics; no account,
    // content or health data is created on the real service.
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const data = path === '/api/users/me' ? { id: 11, nickname: '미리보기 사용자', role: 'USER' }
        : path === '/api/boards' ? [{ id: 1, name: '자유방', boardType: 'FREE', description: '' }]
        : path === '/api/posts/41' ? { id: 41, boardId: 1, boardName: '자유방', title: '편하게 읽는 이야기',
          content: text, authorNickname: '미리보기 사용자', viewCount: 1, visibility: 'PUBLIC',
          isAnonymous: false, isMyPost: true, readable: true, imageUrl: null, staffReplied: false,
          createdAt: '2026-10-11T00:00:00Z', updatedAt: '2026-10-11T00:00:00Z' }
        : path.endsWith('/comments') ? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }
        : path.endsWith('/bookmark') ? { bookmarked: false }
        : path === '/api/reactions/summary' ? { targetType: 'POST', targetId: 41, counts: [] }
        : null;
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, message: '', data }) });
    });
  });

  for (const viewport of [undefined, { width: 768, height: 1024 }]) {
  test(`editor, preview and published text keep the same wrapping and plain text${viewport ? ' on tablet' : ''}`, async ({ page }, testInfo) => {
    if (viewport) await page.setViewportSize(viewport);
    await page.goto('/community/write?boardId=1');
    const editor = page.getByLabel('본문', { exact: true });
    await editor.fill(text);
    await page.getByRole('button', { name: '본문 미리보기', exact: true }).click();
    const preview = page.getByRole('region', { name: '게시글 본문 미리보기' }).locator('.hf-community-body');
    await expect(preview).toHaveText(text, { useInnerText: false });
    expect(await preview.textContent()).toBe(text);
    await expect(preview.locator('img')).toHaveCount(0);
    const inputLayout = await layout(editor);
    const previewLayout = await layout(preview);
    expect(previewLayout.width).toBe(inputLayout.width);
    expect(previewLayout.rows).toEqual(inputLayout.rows);
    expect(inputLayout.overflow).toBe(false);
    expect(await editor.evaluate((field: HTMLTextAreaElement) => field.scrollHeight <= field.clientHeight + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('writing-preview.png'), fullPage: true });

    await page.goto('/community/posts/41');
    const body = page.locator('article .hf-community-body');
    await expect(body).toHaveText(text, { useInnerText: false });
    const postedLayout = await layout(body);
    expect(postedLayout.width).toBe(inputLayout.width);
    expect(postedLayout.fontSize).toBe(inputLayout.fontSize);
    expect(postedLayout.lineHeight).toBe(inputLayout.lineHeight);
    expect(postedLayout.rows).toEqual(inputLayout.rows);
    expect(postedLayout.overflow).toBe(false);
    await expect(body.locator('img')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('published-text.png'), fullPage: true });
  });
  }
});
