'use client';

import Link from 'next/link';
import { useContentList } from '@/hooks/useContents';
import { useProducts } from '@/hooks/useProducts';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { LIFESTYLE_CATEGORY, getContentPreview } from '@/domain/content/types';

export default function RoutinePage() {
  const { contentPage, isLoading: contentsLoading } = useContentList(LIFESTYLE_CATEGORY, 6);
  const { productPage, isLoading: productsLoading } = useProducts(8);

  return (
    <>
      <TopBar title="루틴" />
      <div className="px-4 py-5">
        <section className="mb-6 rounded-3xl border border-gold/30 bg-gold/5 px-5 py-5">
          <h2 className="font-semibold text-cream-foreground">나만의 건강 루틴</h2>
          <p className="mt-2 text-sm text-muted">
            생활 습관과 영양 관리를 일상에 맞게 조절해 보세요.
            정보는 참고용이며 개인 상태에 맞게 조정하는 것이 중요합니다.
          </p>
        </section>

        <MedicalDisclaimer />

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-cream-foreground">생활관리 가이드</h3>
            <Link href="/contents" className="text-sm text-primary">
              전체 정보글
            </Link>
          </div>
          {contentsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3">
              {contentPage.content.map((item) => (
                <Link key={item.id} href={`/contents/${item.id}`}>
                  <Card>
                    <Badge>{item.category}</Badge>
                    <p className="mt-2 font-medium text-cream-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted">{getContentPreview(item.content)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h3 className="mb-3 font-semibold text-cream-foreground">추천 제품</h3>
          {productsLoading ? (
            <LoadingSpinner label="제품 불러오는 중…" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {productPage.content.map((product) => (
                <Card key={product.id} className="flex flex-col">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="mb-2 aspect-square w-full rounded-xl object-cover"
                    />
                  )}
                  <p className="text-sm font-medium text-cream-foreground">{product.name}</p>
                  {product.price != null && (
                    <p className="mt-1 text-xs text-muted">
                      {product.price.toLocaleString('ko-KR')}원
                    </p>
                  )}
                  {product.externalUrl && (
                    <a
                      href={product.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto pt-2 text-xs font-medium text-primary"
                    >
                      구매 링크 →
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
