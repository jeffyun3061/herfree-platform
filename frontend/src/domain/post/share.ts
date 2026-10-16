export function postShareExcerpt(content: string, limit = 180): string {
  const plain = content.replace(/[\u0000-\u001f\u007f\s]+/g, ' ').trim();
  const characters = Array.from(plain);
  return characters.length > limit ? characters.slice(0, limit).join('').trimEnd() + '…' : plain;
}

export function communityPostUrl(postId: number, origin = 'https://www.herpfree.co.kr'): string {
  return new URL(`/community/posts/${postId}`, origin).toString();
}

export async function shareCommunityPost(input: { title: string; content: string; url: string; publicPreview: boolean }): Promise<'shared' | 'copied' | 'cancelled'> {
  const title = input.publicPreview ? input.title : '헤르프리 커뮤니티';
  const text = input.publicPreview ? postShareExcerpt(input.content) : '';
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: input.publicPreview ? `${title}\n${text}` : '', url: input.url });
      return 'shared';
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled';
    }
  }
  const copiedText = input.publicPreview ? `${title}\n${text}\n\n${input.url}` : input.url;
  await navigator.clipboard.writeText(copiedText);
  return 'copied';
}
