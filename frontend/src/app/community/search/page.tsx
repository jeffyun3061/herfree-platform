'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePostList } from '@/hooks/usePosts';
import { useContentList } from '@/hooks/useContents';
import { FAQ_GROUPS } from '@/domain/faq/content';
import { getContentPreview } from '@/domain/content/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { navigateBack } from '@/lib/navigateBack';
import { cn } from '@/lib/cn';

type SearchResult = {
  id: string;
  type: 'community' | 'content' | 'faq';
  label: string;
  title: string;
  description: string;
  href: string;
};

const RECOMMENDED_KEYWORDS = ['재발', '영양제', '연애고지', '전조증상', '확진초기', '수면'];

const RESULT_GROUP_LABELS: Record<SearchResult['type'], string> = {
  community: '커뮤니티',
  content: '칼럼',
  faq: 'FAQ',
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function HighlightText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const index = text.toLowerCase().indexOf(query);
  if (!query || index < 0) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {text.slice(0, index)}
      <mark className="rounded-[4px] bg-[#FBE9C6] px-0.5 text-[#8A6B2A]">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </span>
  );
}

function ResultRow({ result, query }: { result: SearchResult; query: string }) {
  return (
    <Link
      href={result.href}
      className="block border-t border-[#F2ECE1] px-[15px] py-[13px] first:border-t-0 transition-colors hover:bg-[#FFFCF7]"
    >
      <div className="flex min-w-0 items-start gap-2">
        {result.type === 'faq' && (
          <span className="hf-display shrink-0 text-[13px] font-extrabold leading-[1.45] text-[#C9A24B]">
            Q
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'shrink-0 rounded-[6px] px-2 py-0.5 text-[10px] font-extrabold',
                result.type === 'community' && 'bg-[#E7F1EC] text-[#0B3B36]',
                result.type === 'content' && 'bg-[#F6E8C8] text-[#8A6B2A]',
                result.type === 'faq' && 'bg-[#EFE8DA] text-[#15695E]',
              )}
            >
              {result.label}
            </span>
            <HighlightText
              text={result.title}
              query={query}
              className="min-w-0 truncate text-[13.5px] font-bold leading-[1.45] text-[#1E2621]"
            />
          </div>
          <HighlightText
            text={result.description}
            query={query}
            className="line-clamp-2 text-[12px] leading-[1.55] text-[#65706B]"
          />
        </div>
        <span className="mt-1 shrink-0 text-[#C3B79E]">›</span>
      </div>
    </Link>
  );
}

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="px-0.5 pb-2 text-[12.5px] font-extrabold text-[#15695E]">{title}</h2>
      <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_30px_-24px_rgba(20,30,25,.22)]">
        {children}
      </div>
    </section>
  );
}

export default function CommunitySearchPage() {
  const router = useRouter();
  const pathname = usePathname();
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

    const faqResults = FAQ_GROUPS.flatMap((group, groupIndex) =>
      group.items
        .filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(query))
        .map((item, index) => ({
          id: `faq-${groupIndex}-${index}`,
          type: 'faq' as const,
          label: 'FAQ',
          title: item.question,
          description: item.answer,
          href: `/qna?faq=${groupIndex}-${index}#faq-${groupIndex}-${index}`,
        })),
    ).slice(0, 8);

    return [...communityResults, ...contentResults, ...faqResults];
  }, [contentPage.content, postPage.content, query]);

  const isLoading = Boolean(query) && (postsLoading || contentsLoading);
  const groupedResults = useMemo(
    () => ({
      community: results.filter((result) => result.type === 'community'),
      content: results.filter((result) => result.type === 'content'),
      faq: results.filter((result) => result.type === 'faq'),
    }),
    [results],
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-app flex-col bg-[#F3EDE3] pb-8 lg:max-w-content">
      <div className="flex items-center gap-2 border-b border-[#EAE3D6] px-4 pb-3 pt-[52px]">
        <button
          type="button"
          onClick={() => navigateBack(router, { pathname, fallbackHref: '/community' })}
          className="flex h-9 w-8 shrink-0 items-center justify-center text-[24px] leading-none text-[#65706B]"
          aria-label="이전 화면으로"
        >
          ‹
        </button>
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[12px] border border-[#E6DECF] bg-white px-3 py-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#65706B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.4-3.4" />
          </svg>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이야기 · 칼럼 · FAQ 검색"
            className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#1E2621] outline-none placeholder:text-[#9AA19C]"
            autoFocus
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="shrink-0 text-[15px] font-bold text-[#B4B2A6]"
              aria-label="검색어 지우기"
            >
              ×
            </button>
          )}
        </label>
      </div>

      <section className="flex-1 overflow-y-auto px-5 py-[18px]">
        {!query && (
          <div>
            <p className="mb-3 text-[12px] font-bold text-[#9A9F94]">추천 검색어</p>
            <div className="flex flex-wrap gap-2">
              {RECOMMENDED_KEYWORDS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setKeyword(item)}
                  className="rounded-full border border-[#EADFCB] bg-[#FBF6EA] px-3.5 py-2 text-[12.5px] font-bold text-[#5C645A]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-[22px] border border-[#E4D8C4] bg-[#FFFCF7] px-4 py-10">
            <LoadingSpinner label="검색 중..." />
          </div>
        ) : query && results.length === 0 ? (
          <div className="px-5 py-[60px] text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FBF6EA] text-[#9A9F94]">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.4-3.4" />
              </svg>
            </div>
            <h2 className="mt-4 text-[14px] font-bold text-[#65706B]">‘{keyword.trim()}’에 대한 결과가 없어요</h2>
            <p className="mt-1.5 text-[12px] leading-[1.6] text-[#9A9F94]">다른 키워드로 검색해보세요</p>
          </div>
        ) : query ? (
          <div className="flex flex-col gap-[22px]">
            <p className="text-[11.5px] font-medium text-[#9A9F94]">총 {results.length}개의 결과</p>
            {(['community', 'content', 'faq'] as const).map((type) =>
              groupedResults[type].length > 0 ? (
                <ResultGroup key={type} title={RESULT_GROUP_LABELS[type]}>
                  {groupedResults[type].map((result) => (
                    <ResultRow key={result.id} result={result} query={query} />
                  ))}
                </ResultGroup>
              ) : null,
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
