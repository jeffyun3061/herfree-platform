import { MyPostCollectionPage } from '@/components/mypage/MyPostCollectionPage';

export default function BookmarksPage() {
  return (
    <MyPostCollectionPage
      collection="bookmarked"
      title="스크랩한 글"
      subtitle="나중에 다시 보고 싶은 글을 한곳에서 확인해요"
      emptyTitle="스크랩한 글이 없습니다"
      emptyDescription="다시 보고 싶은 글을 스크랩해 보세요"
      pathname="/mypage/bookmarks"
    />
  );
}
