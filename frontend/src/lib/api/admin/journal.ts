import type { AdminJournalStats } from '@/domain/journal/types';
import { request } from '@/lib/api/client';

// 개인 기록이 아닌 운영 화면용 비식별 집계만 요청한다.
export function fetchAdminJournalStats(): Promise<AdminJournalStats> {
  return request<AdminJournalStats>('/api/admin/journal/stats');
}
