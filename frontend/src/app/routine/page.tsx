'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { useMyPosts } from '@/hooks/useMyPosts';
import { useContentList } from '@/hooks/useContents';
import { useProducts } from '@/hooks/useProducts';
import { TopBar } from '@/components/layout/TopBar';
import { WeekStrip } from '@/components/layout/WeekStrip';
import { BoardListItem } from '@/components/community/BoardListItem';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PostCard } from '@/components/community/PostCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { findBoardByType } from '@/domain/board/types';
import { LIFESTYLE_CATEGORY, getContentPreview } from '@/domain/content/types';

export default function RoutinePage() {
  const { isLoggedIn } = useAuth();
  const { boards } = useBoards();
  const symptomBoard = findBoardByType(boards, 'SYMPTOM');
  const reviewBoard = findBoardByType(boards, 'PRODUCT_REVIEW');
  const { postPage, isLoading: myPostsLoading } = useMyPosts(isLoggedIn, 5);
  const { contentPage, isLoading: contentsLoading } = useContentList(LIFESTYLE_CATEGORY, 6);
  const { productPage, isLoading: productsLoading } = useProducts(8);

  return (
    <>
      <TopBar title="루틴" />
      <div className="page-container">
        <section className="hero-panel mb-5 py-5">
          <h2 className="relative z-10 text-lg font-semibold">오늘의 기록</h2>
          <p className="relative z-10 mt-2 text-sm leading-relaxed text-primary-foreground/85">
            증상·루틴·복용 기록은 증상 기록방에 남기고, 마이페이지에서 내 글을 확인할 수 있습니다.
          </p>
          {isLoggedIn ? (
            <div className="relative z-10 mt-4 flex flex-wrap gap-2">
              {symptomBoard && (
                <Link href={`/community/write?boardId=${symptomBoard.id}`}>
                  <Button variant="secondary" size="sm">
                    증상 기록하기
                  </Button>
                </Link>
              )}
              {reviewBoard && (
                <Link href={`/community/write?boardId=${reviewBoard.id}`}>
                  <Button variant="secondary" size="sm">
                    루틴·제품 후기
                  </Button>
                </Link>
              )}
              <Link href="/mypage">
                <Button variant="ghost" size="sm" className="text-primary-foreground">
                  내 기록 보기
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/login" className="relative z-10 mt-4 inline-block">
              <Button variant="secondary" size="sm">
                로그인 후 기록하기
              </Button>
            </Link>
          )}
        </section>

        <WeekStrip />

        {isLoggedIn && (
          <section className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-cream-foreground">내가 남긴 기록</h3>
            {myPostsLoading ? (
              <LoadingSpinner label="기록 불러오는 중…" />
            ) : postPage.content.length === 0 ? (
              <p className="rounded-2xl border border-border/80 bg-card p-4 text-sm text-muted">
                아직 기록이 없습니다. 첫 기록을 남겨 보세요.
              </p>
            ) : (
              postPage.content.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </section>
        )}

        <MedicalDisclaimer />

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <h3 className="text-base font-semibold text-cream-foreground">생활관리 가이드</h3>
            <Link href="/contents" className="text-xs font-medium text-primary">
              전체 정보글
            </Link>
          </div>
          {contentsLoading ? (
            <LoadingSpinner />
          ) : contentPage.content.length === 0 ? (
            <p className="text-sm text-muted">등록된 생활관리 정보글이 없습니다.</p>
          ) : (
            <div className="space-y-2.5">
              {contentPage.content.map((item) => (
                <Link
                  key={item.id}
                  href={`/contents/${item.id}`}
                  className="block rounded-2xl border border-border/80 bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <Badge variant="gold">{item.category}</Badge>
                  <p className="mt-2 font-medium text-cream-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{getContentPreview(item.content)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {symptomBoard && (
          <section className="mt-8">
            <BoardListItem board={symptomBoard} />
          </section>
        )}

        <section className="mt-8">
          <h3 className="mb-3 text-base font-semibold text-cream-foreground">추천 제품</h3>
          {productsLoading ? (
            <LoadingSpinner label="제품 불러오는 중…" />
          ) : productPage.content.length === 0 ? (
            <p className="text-sm text-muted">등록된 제품이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {productPage.content.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col rounded-2xl border border-border/80 bg-card p-3"
                >
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
                      구매 링크
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
