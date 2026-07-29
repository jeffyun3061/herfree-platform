'use client';

import { useCallback, useState } from 'react';
import type { JournalRecordInput } from '@/domain/journal/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getErrorMessage } from '@/lib/api/client';
import * as journalApi from '@/lib/api/journal';

export function useJournalDashboard(enabled = true) {
  return useApiQuery<import('@/domain/journal/types').JournalDashboard>(
    () => journalApi.fetchJournalDashboard(),
    [],
    { enabled },
  );
}

export function useJournalReviewSummary(enabled = true) {
  return useApiQuery<import('@/domain/journal/types').JournalReviewSummary>(
    () => journalApi.fetchJournalReviewSummary(),
    [],
    { enabled },
  );
}

export function useJournalInsights(enabled = true) {
  return useApiQuery(() => journalApi.fetchJournalInsights(), [], { enabled });
}

export function useJournalPublicHomeStats() {
  return useApiQuery(() => journalApi.fetchJournalPublicHomeStats(), []);
}

export function useJournalRecordByDate(date: string, enabled = true) {
  return useApiQuery(
    async () => {
      const result = await journalApi.fetchJournalRecordByDate(date);
      return result ?? null;
    },
    [date],
    { enabled },
  );
}

/**
 * Imperative date lookup for calendar/timeline actions.
 * `null` means no record exists; transport and authorization errors remain errors so a blank form is not opened.
 */
export function useJournalRecordLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (date: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await journalApi.fetchJournalRecordByDate(date);
    } catch (cause) {
      setError(getErrorMessage(cause));
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { lookup, isLoading, error };
}

export function useJournalRecords(
  page: number,
  size = 20,
  enabled = true,
  hadSymptoms?: boolean,
) {
  return useApiQuery(
    () => journalApi.fetchJournalRecords(page, size, hadSymptoms),
    [page, size, hadSymptoms],
    { enabled },
  );
}

export function useJournalMonthlyRecords(
  year: number,
  month: number,
  enabled = true,
  hadSymptoms?: boolean,
) {
  return useApiQuery(
    () => journalApi.fetchJournalRecordsByMonth(year, month, hadSymptoms),
    [year, month, hadSymptoms],
    { enabled },
  );
}

export function useJournalMutation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (input: JournalRecordInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await journalApi.upsertJournalRecord(input);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickToggle = async (
    current: JournalRecordInput,
    field: 'supplementTaken' | 'exerciseDone',
  ) => {
    return save({
      ...current,
      [field]: !current[field],
    });
  };

  return { save, quickToggle, isSubmitting, error };
}

export function useJournalDelete() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (recordId: number) => {
    setIsDeleting(true);
    setError(null);
    try {
      await journalApi.deleteJournalRecord(recordId);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return { remove, isDeleting, error };
}
