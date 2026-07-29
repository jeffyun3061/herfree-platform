'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAdminReports } from '@/hooks/useAdmin';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  type AdminReportTarget,
  REPORT_STATUS_LABELS,
  REPORT_TARGET_LABELS,
  type ReportStatus,
} from '@/domain/report/types';
import * as adminApi from '@/lib/api/admin';
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

function targetKey(target: Pick<AdminReportTarget, 'targetType' | 'targetId'>): string {
  return `${target.targetType}:${target.targetId}`;
}

function targetStatusLabel(status: string): string {
  if (status === 'ACTIVE') return '노출 중';
  if (status === 'HIDDEN') return '숨김';
  if (status === 'SUSPENDED') return '정지';
  if (status === 'DELETED') return '삭제됨';
  return status;
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
    refetch,
  } = useAdminReports(status);
  const {
    data: reportTargetsData,
    isLoading: targetsLoading,
    error: targetsError,
    refetch: refetchTargets,
  } = useApiQuery(() => adminApi.fetchReportTargets(1, 50), []);
  const [targetActionError, setTargetActionError] = useState<string | null>(null);
  const [targetProcessingKey, setTargetProcessingKey] = useState<string | null>(null);
  const [deleteTargetCandidate, setDeleteTargetCandidate] = useState<AdminReportTarget | null>(null);
  const reportTargets = reportTargetsData ?? [];

  const refreshQueues = async () => {
    await Promise.all([refetch(), refetchTargets()]);
  };

  const handleAccept = async (reportId: number, targetType: string, targetId: number) => {
    const ok = await adminApi.decideReport(reportId, {
      status: 'ACCEPTED',
      moderationAction: targetType === 'USER' ? 'NONE' : 'HIDE',
      processNote: targetType === 'USER' ? '회원 제재 검토 필요' : '신고 승인 및 숨김 처리',
    });
    if (!ok) return;
    await refetchTargets();
  };

  const processTarget = async (
    target: AdminReportTarget,
    nextStatus: 'ACCEPTED' | 'REJECTED',
  ) => {
    setTargetProcessingKey(targetKey(target));
    setTargetActionError(null);
    try {
      await adminApi.processReportTarget(target.targetType, target.targetId, {
        status: nextStatus,
        processNote: nextStatus === 'ACCEPTED' ? '누적 신고 검토 후 조치' : '누적 신고 검토 후 반려',
      });
      await refreshQueues();
    } catch (err) {
      setTargetActionError(getErrorMessage(err));
    } finally {
      setTargetProcessingKey(null);
    }
  };

  const hideTarget = async (target: AdminReportTarget) => {
    setTargetProcessingKey(targetKey(target));
    setTargetActionError(null);
    try {
      await adminApi.decideReportTarget(target.targetType, target.targetId, {
        status: 'ACCEPTED',
        moderationAction: 'HIDE',
        processNote: '누적 신고 검토 후 숨김 처리',
      });
      await refreshQueues();
    } catch (err) {
      setTargetActionError(getErrorMessage(err));
    } finally {
      setTargetProcessingKey(null);
    }
  };

  const deleteTarget = async (target: AdminReportTarget) => {
    setTargetProcessingKey(targetKey(target));
    setTargetActionError(null);
    try {
      await adminApi.decideReportTarget(target.targetType, target.targetId, {
        status: 'ACCEPTED',
        moderationAction: 'DELETE',
        processNote: '누적 신고 검토 후 삭제 처리',
      });
      await refreshQueues();
      setDeleteTargetCandidate(null);
    } catch (err) {
      setTargetActionError(getErrorMessage(err));
    } finally {
      setTargetProcessingKey(null);
    }
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

      <section className="rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] p-4 shadow-[0_16px_34px_-30px_rgba(20,31,26,.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8B9590]">
              Risk targets
            </p>
            <h3 className="mt-1 text-[17px] font-extrabold text-[#1E2621]">누적 신고 대상</h3>
            <p className="mt-1 text-[12px] leading-[1.55] text-[#65706B]">
              같은 대상에 쌓인 미처리 신고를 묶어서 봅니다. 10건 이상은 긴급 확인으로 표시됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshQueues()}
            className="shrink-0 rounded-full border border-[#E7DFD2] bg-white px-3 py-1.5 text-[11px] font-bold text-[#0B3B36]"
          >
            새로고침
          </button>
        </div>

        {targetActionError && <ErrorMessage message={targetActionError} className="mt-3" />}
        {targetsError && <ErrorMessage message={getErrorMessage(targetsError)} className="mt-3" />}

        <div className="mt-4 space-y-2.5">
          {targetsLoading ? (
            <LoadingSpinner label="누적 신고를 확인하는 중..." />
          ) : reportTargets.length === 0 ? (
            <p className="rounded-[16px] border border-dashed border-[#D9CEBC] bg-white/60 px-4 py-6 text-center text-[12.5px] text-[#65706B]">
              지금 누적된 미처리 신고 대상이 없습니다.
            </p>
          ) : (
            reportTargets.map((target) => {
              const processing = targetProcessingKey === targetKey(target);
              return (
                <article
                  key={targetKey(target)}
                  className="rounded-[18px] border border-[#E7DFD2] bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge>{REPORT_TARGET_LABELS[target.targetType]}</Badge>
                        <span className="rounded-full bg-[#F4F0E8] px-2 py-0.5 text-[10.5px] font-bold text-[#65706B]">
                          #{target.targetId}
                        </span>
                        <span className="rounded-full bg-[#EAF3EF] px-2 py-0.5 text-[10.5px] font-bold text-[#0B3B36]">
                          신고 {target.reportCount}건
                        </span>
                        {target.urgent && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-extrabold text-red-600">
                            긴급 확인
                          </span>
                        )}
                      </div>
                      <p className="mt-2 truncate text-[14px] font-extrabold text-[#1E2621]">
                        {target.targetTitle}
                      </p>
                      {target.targetPreview && (
                        <p className="mt-1 line-clamp-2 text-[12px] leading-[1.5] text-[#65706B]">
                          {target.targetPreview}
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-[#8B9590]">
                        {target.authorNickname ? `작성자 ${target.authorNickname}` : '작성자 확인 불가'} ·{' '}
                        {targetStatusLabel(target.targetStatus)} · 최근 {formatDate(target.lastReportedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(target.targetType === 'POST' || target.targetType === 'COMMENT') && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={processing || target.targetStatus !== 'ACTIVE'}
                          onClick={() => void hideTarget(target)}
                        >
                          숨김 처리
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={processing || target.targetStatus === 'DELETED'}
                          onClick={() => setDeleteTargetCandidate(target)}
                        >
                          삭제
                        </Button>
                      </>
                    )}
                    {target.authorId && (
                      <Link
                        href={`/admin?tab=users&q=%23${target.authorId}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-[13px] border border-[#E7DFD2] bg-[#FFFCF7] px-3 text-center text-[12px] font-bold text-[#0B3B36]"
                      >
                        작성자 제재
                      </Link>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={processing}
                      onClick={() => void processTarget(target, 'REJECTED')}
                    >
                      일괄 반려
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>
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

            {status !== 'PENDING' && report.processNote && (
              <div className="rounded-[14px] border border-[#E7DFD2] bg-[#FFFCF7] px-3 py-2.5">
                <p className="text-[10.5px] font-bold text-[#8B9590]">처리 근거</p>
                <p className="mt-1 text-[12px] leading-[1.55] text-[#44504A]">{report.processNote}</p>
              </div>
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

      <ConfirmModal
        open={deleteTargetCandidate !== null}
        title="신고 대상 영구 삭제"
        message="삭제 후에는 일반 화면과 관리자 화면에서 복구할 수 없습니다. 신고 근거를 확인한 경우에만 진행해 주세요."
        confirmLabel="영구 삭제"
        variant="danger"
        isLoading={deleteTargetCandidate ? targetProcessingKey === targetKey(deleteTargetCandidate) : false}
        onConfirm={() => deleteTargetCandidate && void deleteTarget(deleteTargetCandidate)}
        onClose={() => !targetProcessingKey && setDeleteTargetCandidate(null)}
      />
    </div>
  );
}
