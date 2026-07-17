import { MyPostCollectionPage } from '@/components/mypage/MyPostCollectionPage';

export default function ReceivedReactionsPage() {
  return (
    <MyPostCollectionPage
      collection="received"
      title="받은 공감"
      subtitle="내가 쓴 글에 회원들이 남긴 공감을 모아봤어요"
      emptyTitle="공감받은 글이 없습니다"
      emptyDescription="내 글에 공감이 남겨지면 여기에 표시됩니다"
      pathname="/mypage/received-reactions"
    />
  );
}
