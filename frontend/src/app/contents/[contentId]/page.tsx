'use client';

import { useParams } from 'next/navigation';
import { useContentDetail } from '@/hooks/useContents';
import { PageHeader } from '@/components/layout/PageHeader';
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
      <PageHeader title="칼럼" showBack backHref="/contents" />
      <article className="mx-auto max-w-app px-4 pb-8 pt-4 lg:max-w-content">
        <section className="overflow-hidden rounded-[26px] border border-[#E3D8C7] bg-[#07251F] shadow-[0_22px_44px_-30px_rgba(7,37,31,.65)]">
          <div className="relative min-h-[230px]">
            <img
              src={content.imageUrl || PUBLIC_IMAGES.homeHero}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.08)_0%,rgba(7,37,31,.35)_42%,rgba(7,37,31,.88)_100%)]" />
            <div className="relative flex min-h-[230px] flex-col justify-end px-5 py-5 text-white">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="gold">{content.category}</Badge>
                <span className="rounded-full bg-white/16 px-2.5 py-1 text-[11px] font-semibold text-white/82">
                  {getContentTypeLabel(content.contentType)}
                </span>
              </div>
              <h1 className="hf-display text-[24px] font-extrabold leading-[1.35] drop-shadow-[0_2px_12px_rgba(0,0,0,.35)]">
                {content.title}
              </h1>
            </div>
          </div>
        </section>

        <div className="mt-3 flex items-center gap-2 px-1 text-[11.5px] text-[#9A9F94]">
          <span>{new Date(content.createdAt).toLocaleDateString('ko-KR')}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-[#CBD0C7]" />
          <span>{estimateReadMinutes(content.content)}분 읽기</span>
        </div>

        <MedicalDisclaimer className="mt-4" />

        <div className="mt-5 whitespace-pre-wrap rounded-[24px] border border-[#E7DFD2] bg-[#FFFCF7] px-5 py-5 text-[14px] leading-[1.95] text-[#2C342E] shadow-[0_18px_42px_-34px_rgba(7,37,31,.35)]">
          {content.content}
        </div>

        <a
          href="https://open.kakao.com/o/srMDr6gi"
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex rounded-[18px] bg-[#07251F] px-5 py-4 shadow-[0_16px_34px_-24px_rgba(7,37,31,.7)]"
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
