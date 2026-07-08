'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchVideo } from '@/lib/api/videos';
import { VideoPlayerSection } from '@/components/video/VideoPlayerSection';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getErrorMessage } from '@/lib/api/client';

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = Number(params.videoId);

  const { data: video, isLoading, error } = useApiQuery(
    () => fetchVideo(videoId),
    [videoId],
  );

  if (isLoading) return <LoadingSpinner label="영상 불러오는 중…" />;

  if (error || !video) {
    return (
      <div className="px-4 py-6">
        <ErrorMessage message={error ? getErrorMessage(error) : '영상을 찾을 수 없습니다.'} />
        <Link href="/videos" className="mt-4 inline-block">
          <Button size="sm" variant="secondary">
            영상 목록으로
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="media-screen mx-auto max-w-app px-5 pb-16 pt-[54px] lg:pb-8">
        <Link
          href="/videos"
          className="mb-3 inline-flex items-center gap-1 text-[13px] font-bold text-[#5C645A]"
        >
          <span className="text-[22px] leading-none">‹</span>
          영상
        </Link>
        <VideoPlayerSection youtubeVideoId={video.youtubeVideoId} title={video.title} />

        <article className="mt-4 rounded-[24px] border border-[#E7DFD2] bg-[#FFF9EE] px-4 py-4 shadow-[0_18px_40px_-32px_rgba(7,37,31,.42)]">
          <div className="flex flex-wrap items-center gap-2">
            {video.isFeatured && <Badge variant="gold">추천 영상</Badge>}
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/70">
              YouTube
            </span>
          </div>
          <h1 className="hf-display mt-3 text-[22px] font-extrabold leading-[1.42] text-[#1E2621]">
            {video.title}
          </h1>
          {video.description ? (
            <p className="mt-4 whitespace-pre-wrap rounded-[18px] bg-[#FFFCF7] px-4 py-4 text-[14px] leading-[1.85] text-[#4F5A53]">{video.description}</p>
          ) : (
            <p className="mt-4 rounded-[18px] bg-[#FFFCF7] px-4 py-4 text-[14px] leading-[1.8] text-[#6E766F]">영상 설명이 준비 중입니다.</p>
          )}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-[#EAE3D6] pt-5">
            <Link href="/videos">
              <Button size="sm" variant="secondary" className="rounded-full">
                목록으로
              </Button>
            </Link>
          </div>
        </article>

        <a
          href="https://open.kakao.com/o/srMDr6gi"
          target="_blank"
          rel="noreferrer"
          className="mx-5 mt-5 flex rounded-2xl bg-[#07251F] px-5 py-[18px] shadow-[0_16px_34px_-24px_rgba(7,37,31,.7)]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-extrabold text-white">영상만으로 부족하다면</span>
            <span className="mt-1 block text-[12.5px] text-white/72">1:1 비밀상담으로 편하게 물어보세요.</span>
          </span>
          <span className="text-[22px] text-[#F0C778]">›</span>
        </a>
      </div>
    </>
  );
}
