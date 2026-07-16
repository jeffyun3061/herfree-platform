'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function QnaDeepLinkSync() {
  const searchParams = useSearchParams();
  const faq = searchParams.get('faq');
  const category = searchParams.get('category');

  useEffect(() => {
    let target: HTMLDetailsElement | null = null;

    if (faq) {
      target = document.querySelector<HTMLDetailsElement>(`#faq-${CSS.escape(faq)}`);
    } else if (category) {
      const section = document.getElementById(`faq-category-${category}`);
      target = section?.querySelector<HTMLDetailsElement>('details') ?? null;
    }

    if (target) {
      target.open = true;
    }
  }, [faq, category]);

  return null;
}
