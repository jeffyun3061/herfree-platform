'use client';

import Link from 'next/link';
import type { Product } from '@/domain/product/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatPrice } from '@/domain/common/format';

type CuratedEssentialsSectionProps = {
  products: Product[];
  isLoading: boolean;
};

export function CuratedEssentialsSection({ products, isLoading }: CuratedEssentialsSectionProps) {
  return (
    <section id="store">
      <div className="mb-5 flex items-end justify-between lg:mb-6">
        <h2 className="section-heading">Curated Essentials</h2>
        <Link href="/#store" className="section-link lg:text-sm">
          전체보기 &gt;
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner label="제품 불러오는 중…" />
      ) : products.length === 0 ? (
        <p className="text-sm text-muted">큐레이션 제품이 준비 중입니다.</p>
      ) : (
        <div className="flex gap-3.5 overflow-x-auto pb-1 scrollbar-hide lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible">
          {products.map((product) => (
            <article
              key={product.id}
              className="product-card lg:transition-transform lg:hover:-translate-y-1"
            >
              <div className="product-pedestal lg:aspect-[5/6]">
                <div className="product-pedestal-ring lg:h-[5.5rem] lg:w-[5.5rem]">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="max-h-[3.25rem] w-auto object-contain lg:max-h-[4rem]"
                    />
                  ) : (
                    <span className="text-[10px] text-muted">—</span>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 pt-3 lg:px-5 lg:pb-5 lg:pt-4">
                <p className="line-clamp-2 text-xs font-medium leading-snug text-ink lg:text-sm">
                  {product.name}
                </p>
                <p className="mt-1.5 text-sm font-bold text-ink lg:mt-2 lg:text-base">
                  {formatPrice(product.price)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted lg:mt-4 lg:text-xs">
        Herfree는 직접 판매하지 않으며, 필요 시에만 외부 링크를 제공합니다.
      </p>
    </section>
  );
}
