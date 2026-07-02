'use client';

import Link from 'next/link';
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
    const ok = await processReport(reportId, {
      status: 'ACCEPTED',
      processNote: targetType === 'USER' ? '회원 제재 검토 필요' : '신고 승인 및 숨김 처리',
    });
    if (!ok) return;
    if (targetType === 'POST') await hidePost(targetId);
    if (targetType === 'COMMENT') await hideComment(targetId);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#E7DFD2] bg-white px-4 py-4 shadow-[0_16px_34px_-30px_rgba(20,31,26,.35)]">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#8B9590]">
          Report queue
        </p>
        <h2 className="mt-1 text-[18px] font-extrabold text-[#1E2621]">신고 접수 관리</h2>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-[#65706B]">
          광고글·악성 댓글은 승인과 동시에 숨김 처리합니다. 사용자 신고는 승인 후 회원 관리에서
          ID를 검색해 정지 여부를 결정하세요.
        </p>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setStatus(tab);
              setPage(0);
            }}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-bold transition-colors',
              status === tab
                ? 'border-[#0B3B36] bg-[#0B3B36] text-white'
                : 'border-[#E7DFD2] bg-white text-[#65706B]',
            )}
          >
            {REPORT_STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner label="신고를 불러오는 중..." />}
      {error && <ErrorMessage message={getErrorMessage(error)} />}
      {actionError && <ErrorMessage message={actionError} className="mb-4" />}

      <div className="space-y-3">
        {reportPage.content.map((report) => (
          <Card key={report.id} className="space-y-3 rounded-[18px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{REPORT_TARGET_LABELS[report.targetType]}</Badge>
                  <span className="rounded-full bg-[#F4F0E8] px-2 py-0.5 text-[10.5px] font-bold text-[#65706B]">
                    대상 #{report.targetId}
                  </span>
                  <span className="text-[10.5px] text-[#8B9590]">{formatDate(report.createdAt)}</span>
                </div>
                <p className="mt-2 text-[14px] font-extrabold leading-snug text-[#1E2621]">
                  {report.reason}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#EAF3EF] px-2 py-1 text-[10.5px] font-bold text-[#0B3B36]">
                신고자 #{report.reporterId}
              </span>
            </div>

            {report.detail && (
              <p className="rounded-[14px] bg-[#F8F4EC] px-3 py-2.5 text-[12.5px] leading-[1.55] text-[#5B6864]">
                {report.detail}
              </p>
            )}

            {status === 'PENDING' && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={report.targetType === 'USER' ? 'primary' : 'danger'}
                  disabled={isProcessing}
                  onClick={() => void handleAccept(report.id, report.targetType, report.targetId)}
                  className="min-h-10"
                >
                  {report.targetType === 'USER' ? '승인 처리' : '승인·숨김'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() =>
                    void processReport(report.id, {
                      status: 'REJECTED',
                      processNote: '운영 기준상 조치 없음',
                    })
                  }
                  className="min-h-10"
                >
                  반려
                </Button>
              </div>
            )}

            {report.targetType === 'USER' && (
              <Link
                href={`/admin?tab=users&q=%23${report.targetId}`}
                className="block rounded-[13px] border border-[#E7DFD2] bg-[#FFFCF7] px-3 py-2 text-center text-[12px] font-bold text-[#0B3B36]"
              >
                회원 #{report.targetId} 제재 검토
              </Link>
            )}
          </Card>
        ))}

        {!isLoading && reportPage.content.length === 0 && (
          <p className="rounded-[18px] border border-dashed border-[#D9CEBC] bg-white/60 px-4 py-8 text-center text-[12.5px] text-[#65706B]">
            이 상태의 신고가 없습니다.
          </p>
        )}
      </div>

      <Pagination page={page} totalPages={reportPage.totalPages} onPageChange={setPage} />
    </div>
  );
}
