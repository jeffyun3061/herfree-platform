import { afterEach, describe, expect, it, vi } from 'vitest';
import { postShareExcerpt, shareCommunityPost } from './share';

afterEach(() => vi.unstubAllGlobals());
describe('community sharing privacy', () => {
  it('copies a public title, readable excerpt and canonical link', async () => {
    const writeText = vi.fn(); vi.stubGlobal('navigator', { clipboard: { writeText } });
    await shareCommunityPost({ title: '고민 제목', content: '첫 문단\n\n두 번째 문단', url: 'https://www.herpfree.co.kr/community/posts/11', publicPreview: true });
    expect(writeText).toHaveBeenCalledWith('고민 제목\n첫 문단 두 번째 문단\n\nhttps://www.herpfree.co.kr/community/posts/11');
  });
  it('does not export private text even when the author can read it', async () => {
    const writeText = vi.fn(); vi.stubGlobal('navigator', { clipboard: { writeText } });
    await shareCommunityPost({ title: 'private-title', content: 'private-health-body', url: 'https://www.herpfree.co.kr/community/posts/12', publicPreview: false });
    expect(writeText).toHaveBeenCalledWith('https://www.herpfree.co.kr/community/posts/12');
  });
  it('copies only the consented member title and URL, never the body', async () => {
    const writeText = vi.fn(); vi.stubGlobal('navigator', { clipboard: { writeText } });
    await shareCommunityPost({ title: '공개 선택한 제목', content: '민감한 건강 본문', url: 'https://www.herpfree.co.kr/community/posts/12', publicPreview: true, titleOnly: true });
    expect(writeText).toHaveBeenCalledWith('공개 선택한 제목\n\nhttps://www.herpfree.co.kr/community/posts/12');
  });
  it('does not copy after native sharing is cancelled', async () => {
    const writeText = vi.fn(); vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')), clipboard: { writeText } });
    expect(await shareCommunityPost({ title: '고민', content: '내용', url: 'https://www.herpfree.co.kr/community/posts/1', publicPreview: true })).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });
  it('bounds long Korean/emoji excerpts without splitting characters', () => {
    expect(postShareExcerpt('🙂'.repeat(181))).toBe('🙂'.repeat(180) + '…');
  });
});
