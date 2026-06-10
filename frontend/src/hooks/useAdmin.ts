'use client';

import { useState } from 'react';
import { emptyPage } from '@/domain/common/types';
import type { Report, ReportProcessInput, ReportStatus } from '@/domain/report/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getErrorMessage } from '@/lib/api/client';
import * as adminApi from '@/lib/api/admin';

export function useAdminReports(status: ReportStatus, size = 10) {
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminApi.fetchReports(status, page, size),
    [status, page, size],
  );

  const processReport = async (reportId: number, input: ReportProcessInput): Promise<boolean> => {
    setIsProcessing(true);
    setActionError(null);
    try {
      await adminApi.processReport(reportId, input);
      await refetch();
      return true;
    } catch (err) {
      setActionError(getErrorMessage(err));
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const hidePost = async (postId: number): Promise<boolean> => {
    setIsProcessing(true);
    setActionError(null);
    try {
      await adminApi.hidePost(postId);
      return true;
    } catch (err) {
      setActionError(getErrorMessage(err));
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const hideComment = async (commentId: number): Promise<boolean> => {
    setIsProcessing(true);
    setActionError(null);
    try {
      await adminApi.hideComment(commentId);
      return true;
    } catch (err) {
      setActionError(getErrorMessage(err));
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    reportPage: data ?? emptyPage<Report>(),
    page,
    setPage,
    isLoading,
    error,
    actionError,
    isProcessing,
    processReport,
    hidePost,
    hideComment,
    refetch,
  };
}
