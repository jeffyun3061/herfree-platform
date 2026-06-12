'use client';

import { CommunityFeed } from '@/components/community/CommunityFeed';
import { TopBar } from '@/components/layout/TopBar';

export default function CommunityPage() {
  return (
    <>
      <TopBar title="커뮤니티" className="lg:hidden" />
      <CommunityFeed />
    </>
  );
}
