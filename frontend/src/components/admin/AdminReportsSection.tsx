'use client';

import { useState } from 'react';
import { useAdminReports } from '@/hooks/useAdmin';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  REPORT_STATUS_LABELS,
  REPORT_TARGET_LABELS,
  type ReportStatus,
} from '@/domain/report/types';
import { getErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';

const STATUS_TABS: ReportStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED'];

export function AdminReportsSection() {
  const [status, setStatus] = useState<ReportStatus>('PENDING');
  const {
    reportPage,
    page,
    setPage,
    isLoading,
    error,
    actionError,
    isProcessing,
    processReport,
    hidePost,
    hideComment,
  } = useAdminReports(status);

  const handleAccept = async (reportId: number, targetType: string, targetId: number) => {
    const ok = await processReport(reportId, { status: 'ACCEPTED' });
    if (!ok) return;
    if (targetType === 'POST') await hidePost(targetId);
    if (targetType === 'COMMENT') await hideComment(targetId);
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm',
              status === tab ? 'bg-primary text-primary-foreground' : 'bg-cream-dark text-muted',
            )}
          >
            {REPORT_STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={getErrorMessage(error)} />}
      {actionError && <ErrorMessage message={actionError} className="mb-4" />}

      <div className="space-y-3">
        {reportPage.content.map((report) => (
          <Card key={report.id}>
            <div className="mb-2 flex items-center gap-2">
              <Badge>{REPORT_TARGET_LABELS[report.targetType]}</Badge>
              <span className="text-xs text-muted">#{report.targetId}</span>
            </div>
            <p className="text-sm font-medium text-cream-foreground">{report.reason}</p>
            {report.detail && <p className="mt-1 text-sm text-muted">{report.detail}</p>}
            <p className="mt-2 text-xs text-muted">
              {new Date(report.createdAt).toLocaleString('ko-KR')}
            </p>
            {status === 'PENDING' && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => void handleAccept(report.id, report.targetType, report.targetId)}
                >
                  승인·숨김
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => void processReport(report.id, { status: 'REJECTED' })}
                >
                  반려
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      <Pagination page={page} totalPages={reportPage.totalPages} onPageChange={setPage} />
    </div>
  );
}
