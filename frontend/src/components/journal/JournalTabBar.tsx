'use client';

import { cn } from '@/lib/cn';

export type JournalTabId = 'home' | 'records' | 'insights';

const TABS: { id: JournalTabId; label: string }[] = [
  { id: 'home', label: '홈' },
  { id: 'records', label: '기록' },
  { id: 'insights', label: '인사이트' },
];

type JournalTabBarProps = {
  active: JournalTabId;
  onChange: (tab: JournalTabId) => void;
};

export function JournalTabBar({ active, onChange }: JournalTabBarProps) {
  return (
    <nav
      className="mx-auto flex w-full max-w-app rounded-[0.875rem] border border-[var(--color-border-tertiary)] bg-white/90 p-0.5 shadow-sm backdrop-blur-sm"
      aria-label="일지 메뉴"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 rounded-[0.65rem] py-2 text-[13px] font-semibold transition-colors',
            active === tab.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
