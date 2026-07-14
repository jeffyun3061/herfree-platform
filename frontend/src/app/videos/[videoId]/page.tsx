'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useVideos } from '@/hooks/useVideos';
import { fetchVideo } from '@/lib/api/videos';
import { VideoPlayerSection } from '@/components/video/VideoPlayerSection';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { getVideoThumbnail } from '@/domain/video/types';
import { formatDate } from '@/domain/common/format';
import { getErrorMessage } from '@/lib/api/client';
import { navigateBack } from '@/lib/navigateBack';

export default function VideoDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const videoId = Number(params.videoId);

  const { data: video, isLoading, error } = useApiQuery(() => fetchVideo(videoId), [videoId]);
  const { videoPage, isLoading: relatedLoading } = useVideos(8);
  const relatedVideos = useMemo(
    () => videoPage.content.filter((item) => item.id !== videoId).slice(0, 3),
    [videoPage.content, videoId],
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

  const thumbnail = getVideoThumbnail(video);

  return (
    <article className="mx-auto max-w-app pb-[60px] lg:pb-10">
      <section className="overflow-hidden bg-[#07251F]">
        <div className="relative h-[230px]">
          <img src={thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.08)_0%,rgba(7,37,31,.35)_42%,rgba(7,37,31,.88)_100%)]" />
          <button
            type="button"
            aria-label="영상 목록으로 돌아가기"
            className="absolute left-4 z-10 text-[24px] leading-none text-white"
            style={{ top: 'var(--hf-page-pt)' }}
            onClick={() => navigateBack(router, { pathname, fallbackHref: '/videos' })}
          >
            ‹
          </button>
          <div className="absolute inset-x-0 bottom-[18px] px-[22px] text-white">
            <span className="inline-block rounded-[7px] bg-white/[0.92] px-2.5 py-1 text-[12px] font-bold text-[#04342C]">
              YouTube
            </span>
            {video.isFeatured && (
              <span className="ml-2 inline-block rounded-[7px] bg-[#F0C778] px-2.5 py-1 text-[12px] font-bold text-[#07251F]">
                추천 영상
              </span>
            )}
            <h1 className="hf-display mt-3 text-[22px] font-extrabold leading-[1.45] tracking-[-0.01em] drop-shadow-[0_2px_14px_rgba(7,37,31,.4)]">
              {video.title}
            </h1>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 px-6 pt-[14px] text-[12px] hf-text-muted">
        <span>{formatDate(video.createdAt)}</span>
        <span className="h-0.5 w-0.5 rounded-full bg-[#CBD0C7]" aria-hidden />
        <span>YouTube</span>
      </div>

      <div className="px-5 pt-4">
        <VideoPlayerSection youtubeVideoId={video.youtubeVideoId} title={video.title} />
      </div>

      <div className="px-6 pt-[18px]">
        {video.description ? (
          <div className="whitespace-pre-wrap text-[14px] leading-[1.95] text-[#2C342E]">{video.description}</div>
        ) : (
          <p className="text-[14px] leading-[1.85] text-[#6E766F]">영상 설명이 준비 중입니다.</p>
        )}
      </div>

      <Link
        href="/consult"
        className="mx-4 mt-3 flex items-center gap-3 rounded-[16px] bg-[#07251F] px-4 py-3.5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold text-white">영상만으로 부족하다면</span>
          <span className="mt-[3px] block text-[12px] text-white/72">
            1:1 비밀상담으로 편하게 물어보세요.
          </span>
        </span>
        <span className="text-[20px] text-[#F0C778]">›</span>
      </Link>

      {relatedVideos.length > 0 && (
        <section className="px-5 pt-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#9B8B70]">Related</p>
              <h2 className="mt-1 text-[15px] font-extrabold text-[#15201D]">다른 영상</h2>
            </div>
            <Link href="/videos" className="text-[12px] font-bold text-[#15695E]">
              전체 영상
            </Link>
          </div>
          <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_30px_-24px_rgba(20,30,25,.22)]">
            {relatedLoading ? (
              <div className="px-4 py-6">
                <LoadingSpinner label="다른 영상 확인 중..." />
              </div>
            ) : (
              relatedVideos.map((item) => (
                <Link
                  key={item.id}
                  href={`/videos/${item.id}`}
                  className="block border-t border-[#F2ECE1] px-4 py-3.5 first:border-t-0"
                >
                  <p className="text-[12px] font-extrabold text-[#15695E]">YouTube</p>
                  <h3 className="mt-1 line-clamp-2 text-[13.5px] font-bold leading-[1.45] text-[#15201D]">
                    {item.title}
                  </h3>
                </Link>
              ))
            )}
          </div>
        </section>
      )}
    </article>
  );
}
