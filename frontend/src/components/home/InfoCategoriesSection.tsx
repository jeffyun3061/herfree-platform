import Link from 'next/link';
import { CONTENT_CATEGORIES } from '@/domain/content/types';

const CATEGORY_DESC: Record<string, string> = {
  의학정보: '검사·치료·재발에 대한 기본 정보',
  생활관리: '일상 루틴과 자가 관리 가이드',
  영양관리: '면역과 회복을 돕는 식습관',
  심리케어: '불안·고립감을 다루는 마음 돌봄',
};

export function InfoCategoriesSection() {
  return (
    <section>
      <h2 className="section-heading">칼럼 카테고리</h2>
      <p className="mt-1 mb-4 text-sm text-muted">검증된 건강 정보를 주제별로 탐색하세요.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CONTENT_CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/contents?category=${encodeURIComponent(category)}`}
            className="surface-card group p-5 transition-colors hover:border-primary/30"
          >
            <p className="text-sm font-semibold text-ink group-hover:text-primary">
              {category}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {CATEGORY_DESC[category] ?? '관련 칼럼 모음'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
