'use client';

import { cn } from '@/lib/cn';

export type JournalTabId = 'today' | 'records' | 'insights';

const TABS: { id: JournalTabId; label: string }[] = [
  { id: 'today', label: '기록' },
  { id: 'records', label: '일지' },
  { id: 'insights', label: '요약' },
];

type JournalTabBarProps = {
  active: JournalTabId;
  onChange: (tab: JournalTabId) => void;
};

export function JournalTabBar({ active, onChange }: JournalTabBarProps) {
  return (
    <nav
      className="mx-auto grid w-full max-w-app grid-cols-3 rounded-[14px] bg-[#EBE2D1] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]"
      aria-label="개인일지 메뉴"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-[0.65rem] py-2 text-[13px] font-semibold transition-colors',
            active === tab.id
              ? 'bg-[#0B3B36] text-white shadow-[0_8px_18px_-14px_rgba(11,59,54,.9)]'
              : 'text-[#8A9089] hover:text-[#1E2621]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
