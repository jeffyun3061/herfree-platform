'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { useContentList } from '@/hooks/useContents';
import { useVideos } from '@/hooks/useVideos';
import { PostCard } from '@/components/community/PostCard';
import { BoardListItem } from '@/components/community/BoardListItem';
import { BrandMark } from '@/components/brand/BrandMark';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { findBoardByType } from '@/domain/board/types';
import { getContentPreview } from '@/domain/content/types';
import { getVideoThumbnail } from '@/domain/video/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '편안한 저녁 되세요';
}

export default function HomePage() {
  const { isLoggedIn, user } = useAuth();
  const { boards, isLoading: boardsLoading } = useBoards();
  const freeBoard = findBoardByType(boards, 'FREE');
  const { postPage, isLoading: postsLoading } = usePostList(freeBoard?.id ?? null, 5);
  const { contentPage, isLoading: contentsLoading } = useContentList(undefined, 3);
  const { videoPage, isLoading: videosLoading } = useVideos(3);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-surface/95 px-4 backdrop-blur-md">
        <BrandMark size="sm" />
        {isLoggedIn ? (
          <span className="text-sm text-muted">{user?.nickname}님</span>
        ) : (
          <Link href="/login" className="text-sm font-medium text-primary">
            로그인
          </Link>
        )}
      </header>

      <section className="page-container">
        <div className="hero-panel mb-6">
          <p className="relative z-10 text-sm text-primary-foreground/85">{getGreeting()}</p>
          <h2 className="relative z-10 mt-1 text-xl font-semibold leading-snug">
            {isLoggedIn ? `${user?.nickname}님, 오늘 하루는 어떠세요?` : '함께 나누는 건강 커뮤니티'}
          </h2>
          <p className="relative z-10 mt-2 max-w-[18rem] text-sm leading-relaxed text-primary-foreground/80">
            경험을 나누고, 검증된 정보로 일상을 돌보는 공간입니다.
          </p>
          {!isLoggedIn && (
            <Link href="/signup" className="relative z-10 mt-5 inline-block">
              <Button variant="secondary" size="sm">
                시작하기
              </Button>
            </Link>
          )}
        </div>

        <MedicalDisclaimer />

        <div className="mt-6">
          <SectionHeader title="커뮤니티" href="/community" linkLabel="전체" />
          {boardsLoading ? (
            <LoadingSpinner label="게시판 불러오는 중…" />
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {boards.slice(0, 6).map((board) => (
                <BoardListItem key={board.id} board={board} variant="tile" />
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <SectionHeader
            title="최신 이야기"
            href={freeBoard ? `/community/${freeBoard.id}` : undefined}
          />
          {postsLoading ? (
            <LoadingSpinner label="글 불러오는 중…" />
          ) : postPage.content.length === 0 ? (
            <p className="text-sm text-muted">아직 글이 없습니다.</p>
          ) : (
            postPage.content.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>

        <div className="mt-8">
          <SectionHeader title="정보글" href="/contents" />
          {contentsLoading ? (
            <LoadingSpinner label="정보글 불러오는 중…" />
          ) : contentPage.content.length === 0 ? (
            <p className="text-sm text-muted">등록된 정보글이 없습니다.</p>
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
        </div>

        <div className="mt-8">
          <SectionHeader title="영상" href="/lounge" />
          {videosLoading ? (
            <LoadingSpinner label="영상 불러오는 중…" />
          ) : videoPage.content.length === 0 ? (
            <p className="text-sm text-muted">등록된 영상이 없습니다.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {videoPage.content.map((video) => (
                <a
                  key={video.id}
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-36 shrink-0"
                >
                  <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
                    <img
                      src={getVideoThumbnail(video)}
                      alt={video.title}
                      className="aspect-video w-full object-cover"
                    />
                    <p className="line-clamp-2 p-2.5 text-xs font-medium text-cream-foreground">
                      {video.title}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
