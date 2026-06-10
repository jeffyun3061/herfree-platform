import type { Report, ReportCreateInput } from '@/domain/report/types';
import { request } from '@/lib/api/client';

export function createReport(input: ReportCreateInput): Promise<Report> {
  return request<Report>('/api/reports', { method: 'POST', body: input });
}
