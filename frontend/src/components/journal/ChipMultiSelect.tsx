'use client';

import { cn } from '@/lib/cn';

type ChipOption = { value: string; label: string };

type ChipMultiSelectProps = {
  options: ChipOption[];
  values: string[];
  onChange: (values: string[]) => void;
  exclusiveNone?: string;
};

export function ChipMultiSelect({
  options,
  values,
  onChange,
  exclusiveNone,
}: ChipMultiSelectProps) {
  const toggle = (value: string) => {
    if (exclusiveNone && value === exclusiveNone) {
      onChange(values.includes(value) ? [] : [value]);
      return;
    }

    const withoutNone = exclusiveNone
      ? values.filter((item) => item !== exclusiveNone)
      : values;

    if (withoutNone.includes(value)) {
      onChange(withoutNone.filter((item) => item !== value));
      return;
    }

    onChange([...withoutNone, value]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={cn(
              'rounded-full border px-3.5 py-2 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-white text-ink-soft hover:border-primary/40',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
