'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function QnaDeepLinkSync() {
  const searchParams = useSearchParams();
  const faq = searchParams.get('faq');
  const category = searchParams.get('category');

  useEffect(() => {
    let frameId = 0;
    let attempts = 0;

    const openTarget = () => {
      let target: HTMLDetailsElement | null = null;

      if (faq) {
        target = document.querySelector<HTMLDetailsElement>(`#faq-${CSS.escape(faq)}`);
      } else if (category) {
        const section = document.getElementById(`faq-category-${category}`);
        target = section?.querySelector<HTMLDetailsElement>('details') ?? null;
      }

      if (target) {
        target.open = true;
        return;
      }

      // 스트리밍 렌더링에서는 URL 동기화 효과가 FAQ 본문보다 먼저 실행될 수 있다.
      attempts += 1;
      if (attempts < 30) {
        frameId = window.requestAnimationFrame(openTarget);
      }
    };

    frameId = window.requestAnimationFrame(openTarget);
    return () => window.cancelAnimationFrame(frameId);
  }, [faq, category]);

  return null;
}
