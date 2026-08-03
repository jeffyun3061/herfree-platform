'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { useContentDetail, useContentList } from '@/hooks/useContents';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { estimateReadMinutes, getContentPreview } from '@/domain/content/types';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { getErrorMessage } from '@/lib/api/client';
import { navigateBack } from '@/lib/navigateBack';

export default function ContentDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const contentId = Number(params.contentId);
  const { content, isLoading, error } = useContentDetail(contentId);
  const { contentPage, isLoading: relatedLoading } = useContentList(content?.category, 6);
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
          <div className="relative h-[230px]">
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
            <div className="absolute inset-x-0 bottom-[18px] px-[22px] text-white">
              <span className="inline-block rounded-[7px] bg-white/[0.92] px-2.5 py-1 text-[12px] font-bold text-[#04342C]">
                {content.category}
              </span>
              <h1 className="hf-display mt-3 text-[22px] font-extrabold leading-[1.45] tracking-[-0.01em] drop-shadow-[0_2px_14px_rgba(7,37,31,.4)]">
                {content.title}
              </h1>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2 px-6 pt-[14px] text-[12px] hf-text-muted">
          <span>{new Date(content.createdAt).toLocaleDateString('ko-KR')}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-[#CBD0C7]" />
          <span>{estimateReadMinutes(content.content)}분 읽기</span>
        </div>

        <div className="px-6 pt-[18px]">
          <div className="whitespace-pre-wrap text-[14px] leading-[1.95] text-[#2C342E]">
            {content.content}
          </div>
        </div>

        <div className="px-5 pt-4">
          <MedicalDisclaimer />
        </div>

        <Link
          href="/consult"
          className="mx-4 mt-3 flex items-center gap-3 rounded-[16px] bg-[#07251F] px-4 py-3.5"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-white">
              더 깊은 이야기가 필요하다면
            </span>
            <span className="mt-[3px] block text-[12px] text-white/72">
              상담문의로 서비스 이용 관련 내용을 남겨보세요
            </span>
          </span>
          <span className="text-[20px] text-[#F0C778]">›</span>
        </Link>

        <section className="px-5 pt-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#9B8B70]">
                Related
              </p>
              <h2 className="mt-1 text-[15px] font-extrabold text-[#15201D]">이어 읽기</h2>
            </div>
            <Link href="/contents" className="text-[12px] font-bold text-[#15695E]">
              전체 칼럼
            </Link>
          </div>

          {relatedLoading ? (
            <div className="rounded-[16px] border border-[#E7DFD2] bg-white px-4 py-6">
              <LoadingSpinner label="관련 칼럼 확인 중..." />
            </div>
          ) : relatedContents.length > 0 ? (
            <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_30px_-24px_rgba(20,30,25,.22)]">
              {relatedContents.map((item) => (
                <Link
                  key={item.id}
                  href={`/contents/${item.id}`}
                  className="block border-t border-[#F2ECE1] px-4 py-3.5 first:border-t-0"
                >
                  <p className="text-[12px] font-extrabold text-[#15695E]">{item.category}</p>
                  <h3 className="mt-1 line-clamp-2 text-[13.5px] font-bold leading-[1.45] text-[#15201D]">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-[12px] text-[#7A847C]">
                    {getContentPreview(item.content, 70)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] border border-[#E7DFD2] bg-[#FBF6EA] px-4 py-4 text-[12.5px] leading-[1.6] text-[#65706B]">
              관련 칼럼이 준비되면 이곳에 이어서 보여드릴게요.
            </div>
          )}
        </section>
      </article>
    </>
  );
}
