'use client';

import { useMemo } from 'react';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { useContentList } from '@/hooks/useContents';
import { HomeHero } from '@/components/home/HomeHero';
import { PrivateCommunitySection } from '@/components/home/PrivateCommunitySection';
import { QuickAccessSection } from '@/components/home/QuickAccessSection';
import { InfoCategoriesSection } from '@/components/home/InfoCategoriesSection';
import { ExpertContentSection } from '@/components/home/ExpertContentSection';
import { AboutSection } from '@/components/home/AboutSection';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { findBoardByType } from '@/domain/board/types';

export function GuestHomePage() {
  const { boards } = useBoards();
  const expertBoard = findBoardByType(boards, 'EXPERT');
  const { postPage: recentPosts, isLoading: recentLoading } = usePostList(undefined, 6);
  const { postPage: expertPosts, isLoading: expertPostsLoading } = usePostList(
    expertBoard?.id ?? null,
    4,
  );
  const { contentPage, isLoading: contentsLoading } = useContentList(undefined, 8);

  const expertContents = useMemo(
    () =>
      contentPage.content.filter(
        (item) => item.contentType === 'DOCTOR' || item.contentType === 'ADMIN',
      ),
    [contentPage.content],
  );

  return (
    <div className="bg-canvas pb-8 lg:bg-[#eceae5] lg:pb-14">
      <div className="page-container space-y-10 lg:space-y-14">
        <HomeHero />

        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
          <div className="lg:col-span-8">
            <PrivateCommunitySection posts={recentPosts.content} isLoading={recentLoading} />
          </div>
          <div className="mt-10 lg:col-span-4 lg:mt-0 lg:sticky lg:top-24">
            <QuickAccessSection layout="panel" />
          </div>
        </div>

        <div className="space-y-10 lg:space-y-14">
          <InfoCategoriesSection />
          <ExpertContentSection
            expertBoard={expertBoard}
            expertPosts={expertPosts.content}
            expertContents={expertContents}
            isLoading={expertPostsLoading || contentsLoading}
          />
          <AboutSection />
        </div>

        <MedicalDisclaimer />
      </div>
    </div>
  );
}
