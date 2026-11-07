export function communityPostUrl(postId: number, origin = 'https://www.herpfree.co.kr'): string {
  return new URL(`/community/posts/${postId}`, origin).toString();
}

export async function shareCommunityPost(input: { title: string; url: string; publicPreview: boolean }): Promise<'shared' | 'copied' | 'cancelled'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ url: input.url });
      return 'shared';
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled';
    }
  }
  await navigator.clipboard.writeText(input.url);
  return 'copied';
}
