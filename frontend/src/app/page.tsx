'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { useContentList } from '@/hooks/useContents';
import { useVideos } from '@/hooks/useVideos';
import { PostCard } from '@/components/community/PostCard';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { findBoardByType, getBoardIcon } from '@/domain/board/types';
import { getContentPreview } from '@/domain/content/types';
import { getVideoThumbnail } from '@/domain/video/types';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { isLoggedIn, user } = useAuth();
  const { boards, isLoading: boardsLoading } = useBoards();
  const freeBoard = findBoardByType(boards, 'FREE');
  const { postPage, isLoading: postsLoading } = usePostList(freeBoard?.id ?? null, 5);
  const { contentPage, isLoading: contentsLoading } = useContentList(undefined, 3);
  const { videoPage, isLoading: videosLoading } = useVideos(3);

  return (
    <>
      <TopBar
        title="Herfree"
        rightSlot={
          isLoggedIn ? (
            <span className="text-sm text-muted">{user?.nickname}님</span>
          ) : (
            <Link href="/login" className="text-sm font-medium text-primary">
              로그인
            </Link>
          )
        }
      />

      <section className="px-4 py-5">
        <div className="mb-6 rounded-3xl bg-primary px-5 py-6 text-primary-foreground">
          <p className="text-sm opacity-90">함께 나누는 건강 이야기</p>
          <h2 className="mt-1 text-xl font-semibold">오늘도 편안한 하루 되세요</h2>
          <p className="mt-2 text-sm opacity-80">
            증상·경험을 나누고, 검증된 정보와 루틴으로 일상을 돌보는 공간입니다.
          </p>
          {!isLoggedIn && (
            <Link href="/signup" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">
                회원가입
              </Button>
            </Link>
          )}
        </div>

        <MedicalDisclaimer />

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-cream-foreground">커뮤니티</h3>
            <Link href="/community" className="text-sm text-primary">
              전체 보기
            </Link>
          </div>
          {boardsLoading ? (
            <LoadingSpinner label="게시판 불러오는 중…" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {boards.slice(0, 6).map((board) => (
                <Link key={board.id} href={`/community/${board.id}`}>
                  <Card className="h-full">
                    <span className="text-xl">{getBoardIcon(board.boardType)}</span>
                    <p className="mt-2 text-sm font-medium text-cream-foreground">{board.name}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-cream-foreground">최신 커뮤니티 글</h3>
            {freeBoard && (
              <Link href={`/community/${freeBoard.id}`} className="text-sm text-primary">
                더 보기
              </Link>
            )}
          </div>
          {postsLoading ? (
            <LoadingSpinner label="글 불러오는 중…" />
          ) : (
            <div>
              {postPage.content.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-cream-foreground">추천 정보글</h3>
            <Link href="/contents" className="text-sm text-primary">
              더 보기
            </Link>
          </div>
          {contentsLoading ? (
            <LoadingSpinner label="정보글 불러오는 중…" />
          ) : (
            <div className="space-y-3">
              {contentPage.content.map((item) => (
                <Link key={item.id} href={`/contents/${item.id}`}>
                  <Card>
                    <Badge variant="gold">{item.category}</Badge>
                    <p className="mt-2 font-medium text-cream-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted">{getContentPreview(item.content)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-cream-foreground">추천 영상</h3>
            <Link href="/lounge" className="text-sm text-primary">
              평온라운지
            </Link>
          </div>
          {videosLoading ? (
            <LoadingSpinner label="영상 불러오는 중…" />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {videoPage.content.map((video) => (
                <a
                  key={video.id}
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-40 shrink-0"
                >
                  <Card className="p-2">
                    <img
                      src={getVideoThumbnail(video)}
                      alt={video.title}
                      className="aspect-video w-full rounded-xl object-cover"
                    />
                    <p className="mt-2 line-clamp-2 text-xs font-medium text-cream-foreground">
                      {video.title}
                    </p>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
