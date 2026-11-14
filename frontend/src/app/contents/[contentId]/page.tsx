'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { useContentDetail, useContentList } from '@/hooks/useContents';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { formatDate } from '@/domain/common/format';
import { estimateReadMinutes, getContentPreview } from '@/domain/content/types';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { getErrorMessage } from '@/lib/api/client';
import { navigateBack } from '@/lib/navigateBack';
import { ReadableContent } from '@/components/content/ReadableContent';

export default function ContentDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const contentId = Number(params.contentId);
  const { content, isLoading, error } = useContentDetail(contentId);
  const { contentPage, isLoading: relatedLoading, error: relatedError } = useContentList(content?.category, 6);
  const relatedContents = useMemo(
    () => contentPage.content.filter((item) => item.id !== contentId).slice(0, 3),
    [contentPage.content, contentId],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-app px-5 py-12">
        <LoadingSpinner label="칼럼을 불러오는 중..." />
      </div>
    );
  }
  if (error || !content) {
    return (
      <div className="mx-auto max-w-app px-5 py-10">
        <ErrorMessage message={error ? getErrorMessage(error) : '글을 찾을 수 없습니다.'} />
      </div>
    );
  }

  return (
    <>
      <article className="mx-auto max-w-app pb-[60px] lg:pb-10">
        <section className="overflow-hidden bg-[#07251F]">
          <div className="relative min-h-[230px]">
            <img
              src={content.imageUrl || PUBLIC_IMAGES.homeHero}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.08)_0%,rgba(7,37,31,.35)_42%,rgba(7,37,31,.88)_100%)]" />
            <button
              type="button"
              aria-label="칼럼 목록으로 돌아가기"
              className="absolute left-4 z-10 text-[24px] leading-none text-white"
              style={{ top: 'var(--hf-page-pt)' }}
              onClick={() => navigateBack(router, { pathname, fallbackHref: '/contents' })}
            >
              ‹
            </button>
            <div className="relative z-10 flex min-h-[230px] flex-col justify-end px-[22px] pb-[18px] pt-[72px] text-white">
              <span className="inline-block rounded-[7px] bg-white/[0.92] px-2.5 py-1 text-[12px] font-bold text-[#04342C]">
                {content.category}
              </span>
              <h1 className="hf-display break-words text-[22px] font-extrabold leading-[1.35] tracking-[-0.01em] drop-shadow-[0_2px_14px_rgba(7,37,31,.4)]">
                {content.title}
              </h1>
            </div>
          </div>
        </section>

        <div className="space-y-4 px-4 pt-4">
          <div className="rounded-2xl border border-[#E6DFD2] bg-[#FFFEFA] p-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#E6DFD2] pb-3 text-[12.5px] text-muted">
              <time dateTime={content.createdAt}>{formatDate(content.createdAt)}</time>
              <span aria-hidden>·</span>
              <span>약 {estimateReadMinutes(content.content)}분 읽기</span>
            </div>
            <ReadableContent text={content.content} variant="article" className="column-detail-copy mt-4" />
          </div>

          <MedicalDisclaimer className="!border-[#E6DFD2] !bg-[#F4EFE4]" />

          <section aria-labelledby="related-columns-heading">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 id="related-columns-heading" className="text-[16px] font-bold text-ink">이어 읽기</h2>
              <Link href="/contents" className="inline-flex min-h-11 items-center rounded-lg px-2 text-[13px] font-bold text-primary hover:bg-primary/5">
                전체 칼럼 <span className="ml-1" aria-hidden>›</span>
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E6DFD2] bg-[#FFFEFA]">
              {relatedLoading ? (
                <div className="p-4"><LoadingSpinner label="관련 칼럼을 불러오는 중…" /></div>
              ) : relatedContents.length > 0 ? (
                <ul className="divide-y divide-[#E6DFD2]">
                  {relatedContents.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/contents/${item.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#F0F5EF] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.category && <span className="rounded-md bg-[#EDF4F0] px-2 py-0.5 text-xs font-semibold text-primary">{item.category}</span>}
                            <span className="text-xs text-muted">약 {estimateReadMinutes(item.content)}분 읽기</span>
                          </div>
                          <h3 className="mt-1.5 break-words text-[15px] font-semibold leading-snug text-ink">{item.title}</h3>
                          <p className="mt-1 line-clamp-2 break-words text-[13px] leading-relaxed text-muted">{getContentPreview(item.content, 100)}</p>
                        </div>
                        <span aria-hidden className="shrink-0 text-xl text-primary">›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-4 text-[13px] text-muted">
                  {relatedError ? '관련 칼럼을 불러오지 못했어요. 전체 칼럼에서 다른 글을 찾아보세요.' : '같은 주제의 다른 칼럼이 아직 없어요.'}
                </p>
              )}
            </div>
          </section>

          <Link
            href="/consult"
            className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-[#E6DFD2] bg-[#FFFEFA] px-4 py-3 text-primary hover:bg-[#F0F5EF]"
          >
            <span>
              <strong className="block text-sm">서비스 이용 문의</strong>
              <span className="block text-[13px] text-muted">헤르프리 이용 중 궁금한 점을 남겨보세요.</span>
            </span>
            <span className="shrink-0 text-xl" aria-hidden>›</span>
          </Link>
        </div>
      </article>
    </>
  );
}
