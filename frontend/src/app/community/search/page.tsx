'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePostList } from '@/hooks/usePosts';
import { useContentList } from '@/hooks/useContents';
import { FAQ_GROUPS } from '@/domain/faq/content';
import { getContentPreview } from '@/domain/content/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type SearchResult = {
  id: string;
  type: 'community' | 'content' | 'faq';
  label: string;
  title: string;
  description: string;
  href: string;
};

const RECOMMENDED_KEYWORDS = ['재발', '검사', '전조증상', '영양제', '연애 고지'];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function ResultCard({ result }: { result: SearchResult }) {
  return (
    <Link
      href={result.href}
      className="block rounded-[18px] border border-[#E4D8C4] bg-[#FFFCF7] px-4 py-3.5 shadow-[0_12px_28px_-26px_rgba(7,37,31,.5)] transition-colors hover:border-[#0B3B36]/30 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-[#E7F1EC] px-2.5 py-1 text-[10.5px] font-extrabold text-[#0B3B36]">
            {result.label}
          </span>
          <h2 className="mt-2 truncate text-[15px] font-extrabold text-[#1E2621]">
            {result.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-[1.65] text-[#65706B]">
            {result.description}
          </p>
        </div>
        <span className="mt-7 shrink-0 text-[#B89A63]">›</span>
      </div>
    </Link>
  );
}

export default function CommunitySearchPage() {
  const [keyword, setKeyword] = useState('');
  const query = normalize(keyword);

  const { postPage, isLoading: postsLoading } = usePostList(
    undefined,
    20,
    query,
    'createdAt,desc',
  );
  const { contentPage, isLoading: contentsLoading } = useContentList(undefined, 30);

  const results = useMemo<SearchResult[]>(() => {
    if (!query) return [];

    const communityResults = postPage.content.map((post) => ({
      id: `post-${post.id}`,
      type: 'community' as const,
      label: post.boardName || '커뮤니티',
      title: post.title,
      description: post.contentPreview || '게시글 내용을 확인해 보세요.',
      href: `/community/posts/${post.id}`,
    }));

    const contentResults = contentPage.content
      .filter((content) => {
        const haystack = `${content.title} ${content.category} ${content.content}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 10)
      .map((content) => ({
        id: `content-${content.id}`,
        type: 'content' as const,
        label: content.category || '칼럼',
        title: content.title,
        description: getContentPreview(content.content, 90),
        href: `/contents/${content.id}`,
      }));

    const faqResults = FAQ_GROUPS.flatMap((group) =>
      group.items
        .filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(query))
        .map((item, index) => ({
          id: `faq-${group.category}-${index}`,
          type: 'faq' as const,
          label: 'FAQ',
          title: item.question,
          description: item.answer,
          href: '/qna',
        })),
    ).slice(0, 8);

    return [...communityResults, ...contentResults, ...faqResults];
  }, [contentPage.content, postPage.content, query]);

  const isLoading = Boolean(query) && (postsLoading || contentsLoading);

  return (
    <main className="page-container mx-auto max-w-app pb-8 lg:max-w-content lg:pb-12">
      <section className="rounded-[26px] border border-[#E1D5C1] bg-[#FBF6ED] px-4 py-5 shadow-[0_18px_42px_-34px_rgba(7,37,31,.45)] lg:px-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#9B8B70]">
          Herfree Search
        </p>
        <h1 className="hf-display mt-1 text-[24px] font-extrabold text-[#10231F]">
          통합 검색
        </h1>
        <p className="mt-1 text-[12.5px] leading-[1.6] text-[#6D746D]">
          커뮤니티 글, 칼럼, FAQ를 한 번에 찾아볼 수 있어요.
        </p>

        <label className="mt-4 flex items-center gap-3 rounded-[17px] border border-[#E3D8C7] bg-white px-4 py-3 shadow-[0_12px_28px_-26px_rgba(7,37,31,.45)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#65706B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.4-3.4" />
          </svg>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="궁금한 내용을 검색해 보세요"
            className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#1E2621] outline-none placeholder:text-[#9AA19C]"
            autoFocus
          />
        </label>

        {!query && (
          <div className="mt-4 flex flex-wrap gap-2">
            {RECOMMENDED_KEYWORDS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKeyword(item)}
                className="rounded-full border border-[#D9CBB5] bg-white px-3 py-2 text-[12px] font-bold text-[#33413B]"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mt-4 space-y-3">
        {isLoading ? (
          <div className="rounded-[22px] border border-[#E4D8C4] bg-[#FFFCF7] px-4 py-8">
            <LoadingSpinner label="검색 중..." />
          </div>
        ) : query && results.length === 0 ? (
          <div className="rounded-[22px] border border-[#E4D8C4] bg-[#FFFCF7] px-4 py-8 text-center">
            <h2 className="text-[15px] font-extrabold text-[#1E2621]">검색 결과가 없어요</h2>
            <p className="mt-2 text-[12.5px] leading-[1.6] text-[#65706B]">
              다른 표현으로 다시 검색하거나 FAQ를 확인해 보세요.
            </p>
          </div>
        ) : (
          results.map((result) => <ResultCard key={result.id} result={result} />)
        )}
      </section>
    </main>
  );
}
