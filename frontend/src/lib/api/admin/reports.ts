import type { PageData } from '@/domain/common/types';
import type { AdminReportTarget, Report, ReportDecisionInput, ReportProcessInput, ReportStatus, ReportTargetType } from '@/domain/report/types';
import { request } from '@/lib/api/client';

export function fetchReports(status: ReportStatus, page: number, size = 10): Promise<PageData<Report>> {
  return request<PageData<Report>>('/api/admin/reports', {
    query: { status, page, size, sort: 'createdAt,desc' },
  });
}

export function processReport(reportId: number, input: ReportProcessInput): Promise<Report> {
  return request<Report>(`/api/admin/reports/${reportId}/process`, {
    method: 'PATCH',
    body: input,
  });
}

export function decideReport(reportId: number, input: ReportDecisionInput): Promise<Report> {
  return request<Report>(`/api/admin/reports/${reportId}/decision`, {
    method: 'PATCH',
    body: input,
  });
}

export function fetchReportTargets(minCount = 1, size = 50): Promise<AdminReportTarget[]> {
  return request<AdminReportTarget[]>('/api/admin/reports/targets', {
    query: { minCount, size },
  });
}

export function processReportTarget(
  targetType: ReportTargetType,
  targetId: number,
  input: ReportProcessInput,
): Promise<Report[]> {
  return request<Report[]>(`/api/admin/reports/targets/${targetType}/${targetId}/process`, {
    method: 'PATCH',
    body: input,
  });
}

export function decideReportTarget(
  targetType: ReportTargetType,
  targetId: number,
  input: ReportDecisionInput,
): Promise<Report[]> {
  return request<Report[]>(`/api/admin/reports/targets/${targetType}/${targetId}/decision`, {
    method: 'PATCH',
    body: input,
  });
}
