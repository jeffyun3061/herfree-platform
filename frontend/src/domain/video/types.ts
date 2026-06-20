/** 공개 영상 목록에 노출할 최대 개수 (최신순) */
export const VIDEO_PUBLIC_LIST_SIZE = 6;

// 영상 응답 (VideoResponse)
export type Video = {
  id: number;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl: string | null;
  description: string | null;
  relatedBoardId: number | null;
  isVisible: boolean;
  createdAt: string;
};

// 썸네일이 비어 있으면 유튜브 기본 썸네일 URL을 만들어 빈 이미지를 방지한다
export function getVideoThumbnail(video: Video): string {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  return `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
}
