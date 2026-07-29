import { PRODROMAL_OPTIONS, STRESS_OPTIONS } from '@/domain/journal/types';

/**
 * Journal input vocabulary is defined once per frontend feature.
 * A screen can intentionally show a subset, but it must not copy labels or codes.
 */
export const JOURNAL_DETAIL_STRESS_OPTIONS = STRESS_OPTIONS;

// "없었음" is a summary value, not an answer shown after the user enables prodromal symptoms.
export const JOURNAL_DETAIL_PRODROMAL_OPTIONS = PRODROMAL_OPTIONS.filter(
  (option) => option.value !== 'NONE',
);

export const JOURNAL_DETAIL_PRODROMAL_VALUES = new Set(
  JOURNAL_DETAIL_PRODROMAL_OPTIONS.map((option) => option.value),
);
