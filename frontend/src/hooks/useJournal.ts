'use client';

import { useState } from 'react';
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

export function useJournalInsights() {
  return useApiQuery(() => journalApi.fetchJournalInsights(), []);
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
