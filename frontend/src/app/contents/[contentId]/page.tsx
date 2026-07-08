'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useContentDetail } from '@/hooks/useContents';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { estimateReadMinutes, getContentTypeLabel } from '@/domain/content/types';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { getErrorMessage } from '@/lib/api/client';

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = Number(params.contentId);
  const { content, isLoading, error } = useContentDetail(contentId);

  if (isLoading) return <LoadingSpinner />;
  if (error || !content) {
    return (
      <div className="px-4 py-6">
        <ErrorMessage message={error ? getErrorMessage(error) : '글을 찾을 수 없습니다.'} />
      </div>
    );
  }

  return (
    <>
      <article className="mx-auto max-w-app pb-16 lg:pb-8">
        <section className="overflow-hidden bg-[#07251F] shadow-[0_22px_48px_-34px_rgba(7,37,31,.7)] lg:rounded-[26px]">
          <div className="relative min-h-[230px]">
            <img
              src={content.imageUrl || PUBLIC_IMAGES.homeHero}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.08)_0%,rgba(7,37,31,.35)_42%,rgba(7,37,31,.88)_100%)]" />
            <Link
              href="/contents"
              aria-label="칼럼 목록으로 돌아가기"
              className="absolute left-4 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/18 text-[28px] leading-none text-white backdrop-blur-sm"
            >
              ‹
            </Link>
            <div className="relative flex min-h-[230px] flex-col justify-end px-[22px] pb-[18px] pt-16 text-white">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="gold">{content.category}</Badge>
                <span className="rounded-full bg-white/16 px-2.5 py-1 text-[11px] font-semibold text-white/82">
                  {getContentTypeLabel(content.contentType)}
                </span>
              </div>
              <h1 className="hf-display text-[22px] font-extrabold leading-[1.45] drop-shadow-[0_2px_14px_rgba(7,37,31,.4)]">
                {content.title}
              </h1>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2 px-6 pt-3 text-[11px] text-[#A6ABA0]">
          <span>{new Date(content.createdAt).toLocaleDateString('ko-KR')}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-[#CBD0C7]" />
          <span>{estimateReadMinutes(content.content)}분 읽기</span>
        </div>

        <div className="px-6 pt-5">
          <div className="whitespace-pre-wrap text-[14px] leading-[1.95] text-[#2C342E]">
            {content.content}
          </div>
        </div>

        <div className="px-5 pt-4">
          <MedicalDisclaimer />
        </div>

        <a
          href="https://open.kakao.com/o/srMDr6gi"
          target="_blank"
          rel="noreferrer"
          className="mx-5 mt-5 flex rounded-[20px] bg-[#07251F] px-5 py-[18px] shadow-[0_16px_34px_-24px_rgba(7,37,31,.7)]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-extrabold text-white">
              더 깊은 이야기가 필요하다면
            </span>
            <span className="mt-1 block text-[12.5px] text-white/72">
              1:1 비밀상담으로 편하게 나눠보세요.
            </span>
          </span>
          <span className="text-[22px] text-[#F0C778]">›</span>
        </a>
      </article>
    </>
  );
}
