import type { Metadata } from 'next';
import { communityPostUrl } from '@/domain/post/share';

type PublicPreview = { id: number; title: string; description: string; boardType: string; mode: 'FULL' | 'TITLE_ONLY' };

export async function loadPublicPostPreview(postId: string): Promise<PublicPreview | null> {
  if (!/^[1-9]\d*$/.test(postId) || !Number.isSafeInteger(Number(postId))) return null;
  try {
    const target = new URL(process.env.API_REWRITE_TARGET || (process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:8080' : ''));
    if (target.username || target.password || (target.protocol !== 'https:' &&
      !(target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname)))) return null;
    const response = await fetch(`${target.origin}/api/posts/${postId}/share-preview`, {
      headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return null;
    const envelope = await response.json();
    const value = envelope?.data;
    if (envelope?.success !== true || value?.id !== Number(postId) || typeof value.title !== 'string' ||
      !value.title.trim() || value.title.length > 200 || typeof value.description !== 'string' ||
      value.description.length > 500 || typeof value.boardType !== 'string' ||
      !['FULL', 'TITLE_ONLY'].includes(value.mode) ||
      ['INQUIRY', 'PRIVATE_CONSULT', 'SECRET_STORY'].includes(value.boardType)) return null;
    return { id: value.id, title: value.title,
      description: value.mode === 'TITLE_ONLY' ? '로그인하면 글을 볼 수 있어요.' : value.description,
      boardType: value.boardType, mode: value.mode };
  } catch { return null; }
}

export function publicPostMetadata(postId: string, preview: PublicPreview | null): Metadata {
  const validId = /^[1-9]\d*$/.test(postId) && Number.isSafeInteger(Number(postId));
  const url = validId ? communityPostUrl(Number(postId)) : 'https://www.herpfree.co.kr/community';
  const title = preview?.title ?? '커뮤니티';
  const description = preview?.description || '헤르프리 커뮤니티에서 이야기를 나누세요.';
  const image = { url: '/brand/logo-hfree-on-primary.png', width: 512, height: 512, alt: '헤르프리' };
  return {
    title, description, alternates: { canonical: url },
    openGraph: { title, description, url, siteName: '헤르프리', locale: 'ko_KR', type: preview ? 'article' : 'website', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
    robots: { index: preview?.mode === 'FULL' && preview.boardType === 'ANONYMOUS_QUESTION', follow: preview?.mode !== 'TITLE_ONLY' },
  };
}
