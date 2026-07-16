'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';

type AuthImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
};

/**
 * /api 이미지 프록시는 비공개 게시판·작성 중 미리보기 이미지를 로그인 사용자에게만 준다.
 * <img>는 Authorization 헤더를 못 보내므로, 토큰이 있으면 fetch로 받아 blob URL로 표시한다.
 */
export function AuthImage({ src, alt = '', ...rest }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const needsAuthFetch = Boolean(token) && src.startsWith('/api/');

  useEffect(() => {
    setFailed(false);
    setBlobUrl(null);
    if (!needsAuthFetch) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const currentToken = getAccessToken();
        if (!currentToken) throw new Error('missing access token');
        const headers: Record<string, string> = {
          Authorization: `Bearer ${currentToken}`,
        };
        if (window.location.hostname.includes('ngrok')) {
          headers['ngrok-skip-browser-warning'] = '1';
        }
        const response = await fetch(src, { headers });
        if (!response.ok) throw new Error(`image fetch failed: ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, needsAuthFetch]);

  if (!needsAuthFetch) {
    return <img src={src} alt={alt} {...rest} />;
  }
  if (failed) {
    // 권한이 없거나 삭제된 이미지 — 깨진 이미지 아이콘 대신 아무것도 표시하지 않는다.
    return null;
  }
  if (!blobUrl) {
    return null;
  }
  return <img src={blobUrl} alt={alt} {...rest} />;
}
