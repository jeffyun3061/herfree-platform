import { afterEach, describe, expect, it, vi } from 'vitest';
import { shareCommunityPost } from './share';

afterEach(() => vi.unstubAllGlobals());
describe('community sharing privacy', () => {
  it('copies only the link so the preview supplies the title', async () => {
    const writeText = vi.fn(); vi.stubGlobal('navigator', { clipboard: { writeText } });
    await shareCommunityPost({ title: '고민 제목', url: 'https://www.herpfree.co.kr/community/posts/11', publicPreview: true });
    expect(writeText).toHaveBeenCalledWith('https://www.herpfree.co.kr/community/posts/11');
  });
  it('shares only the URL through the native share sheet', async () => {
    const share = vi.fn().mockResolvedValue(undefined); vi.stubGlobal('navigator', { share });
    await shareCommunityPost({ title: '고민 제목', url: 'https://www.herpfree.co.kr/community/posts/11', publicPreview: true });
    expect(share).toHaveBeenCalledWith({ url: 'https://www.herpfree.co.kr/community/posts/11' });
  });
  it('does not export private text even when the author can read it', async () => {
    const writeText = vi.fn(); vi.stubGlobal('navigator', { clipboard: { writeText } });
    await shareCommunityPost({ title: 'private-title', url: 'https://www.herpfree.co.kr/community/posts/12', publicPreview: false });
    expect(writeText).toHaveBeenCalledWith('https://www.herpfree.co.kr/community/posts/12');
  });
  it('does not copy after native sharing is cancelled', async () => {
    const writeText = vi.fn(); vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')), clipboard: { writeText } });
    expect(await shareCommunityPost({ title: '고민', url: 'https://www.herpfree.co.kr/community/posts/1', publicPreview: true })).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });
});
