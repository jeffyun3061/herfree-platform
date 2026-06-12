'use client';

import Link from 'next/link';
import type { Product } from '@/domain/product/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatPrice } from '@/domain/common/format';

type StoreSectionProps = {
  products: Product[];
  isLoading: boolean;
};

export function StoreSection({ products, isLoading }: StoreSectionProps) {
  return (
    <section id="store" className="scroll-mt-24">
      <div className="mb-4 border-t border-border pt-8">
        <h2 className="text-base font-semibold text-ink-soft lg:text-lg">생활 관리 제품</h2>
        <p className="mt-1 text-sm text-muted">
          필요할 때만 연결되는 큐레이션입니다. Herfree는 직접 판매하지 않습니다.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner label="제품 불러오는 중…" />
      ) : products.length === 0 ? (
        <p className="text-sm text-muted">등록된 제품이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {products.slice(0, 4).map((product) => (
            <article
              key={product.id}
              className="surface-card flex flex-col overflow-hidden"
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-cream text-xs text-muted">
                  이미지 없음
                </div>
              )}
              <div className="flex flex-1 flex-col p-3 lg:p-4">
                <p className="text-xs text-muted">{product.category}</p>
                <p className="mt-1 text-sm font-medium text-ink">{product.name}</p>
                <p className="mt-1 text-xs text-muted">{formatPrice(product.price)}</p>
                {product.externalUrl && (
                  <a
                    href={product.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto pt-3 text-xs font-medium text-primary"
                  >
                    외부 링크 보기
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
