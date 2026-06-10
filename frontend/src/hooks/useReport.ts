'use client';

import { useState } from 'react';
import type { ReportCreateInput } from '@/domain/report/types';
import { getErrorMessage } from '@/lib/api/client';
import * as reportsApi from '@/lib/api/reports';

export function useReport() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = async (input: ReportCreateInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await reportsApi.createReport(input);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, error, submitReport, clearError: () => setError(null) };
}
