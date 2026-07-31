import { request } from '@/lib/api/client';
import type { AdminStatsOverview } from './types';

export function fetchAdminStatsOverview(): Promise<AdminStatsOverview> {
  return request<AdminStatsOverview>('/api/admin/stats/overview');
}
