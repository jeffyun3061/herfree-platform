'use client';

import { SEVERITY_EMOJIS } from '@/domain/journal/types';
import { cn } from '@/lib/cn';

type SeveritySelectorProps = {
  value: number | null;
  onChange: (value: number) => void;
};

export function SeveritySelector({ value, onChange }: SeveritySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {SEVERITY_EMOJIS.map((emoji, index) => {
        const level = index + 1;
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full border text-lg transition-all',
              active
                ? 'border-primary bg-primary/10 scale-110'
                : 'border-border bg-white hover:border-primary/30',
            )}
            aria-label={`심각도 ${level}`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
