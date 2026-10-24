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
    const writeText = vi.fn(); const share = vi.fn();
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    await expect(shareCommunityPost({ title: 'private-title', content: 'private-health-body', url: 'https://www.herpfree.co.kr/community/posts/12', publicPreview: false })).rejects.toThrow('이 글은 공유할 수 없습니다.');
    expect(writeText).not.toHaveBeenCalled();
    expect(share).not.toHaveBeenCalled();
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
