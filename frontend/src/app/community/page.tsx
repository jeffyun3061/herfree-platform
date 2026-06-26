'use client';

import { Suspense } from 'react';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CommunityPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="커뮤니티 불러오는 중…" />}>
      <CommunityFeed />
    </Suspense>
  );
}
