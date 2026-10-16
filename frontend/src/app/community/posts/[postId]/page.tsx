import PostDetailContainer from '@/features/community/post-detail/PostDetailContainer';
import { loadPublicPostPreview, publicPostMetadata } from '@/lib/postMetadata';

export async function generateMetadata({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return publicPostMetadata(postId, await loadPublicPostPreview(postId));
}

export default function PostPage() {
  return <PostDetailContainer />;
}
