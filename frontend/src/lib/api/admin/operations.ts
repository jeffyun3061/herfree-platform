import { request } from '@/lib/api/client';

export type OperatorTasks = {
  generatedAt: string;
  overdueReports: number;
  queues: { boardType: string; pending: number; overdue: number; oldest: string | null }[];
  oldestTasks: { id: number; boardType: string; createdAt: string }[];
};
export type DeveloperOverview = {
  sampledAt: string; environment: string; image: string; uptimeSeconds: number;
  heapUsedBytes: number; heapMaxBytes: number;
  database: { state: string; version: string | null; migrationVersion: string | null;
    migrationsSuccessful: boolean | null; tables: { name: string; estimatedRows: number; bytes: number }[];
    poolActive: number | null; poolIdle: number | null; poolWaiting: number | null };
  host: { state: string; collectedAt: string | null; memoryPercent: number | null;
    rootDiskPercent: number | null; databaseDiskPercent: number | null; databaseHealthy: boolean | null;
    httpsHealthy: boolean | null; backupAgeHours: number | null; restoreAgeDays: number | null; restoreHealthy: boolean | null };
};
export type RequestSnapshot = {
  sampledAt: string; capacity: number; retainedCount: number; errors: number; maxDurationMs: number;
  entries: { at: string; requestId: string; method: string; route: string; status: number; durationMs: number }[];
};
export type AuditAction = { id: number; actorId: number; method: string; path: string; status: number; requestId: string; at: string };
export type MemberChange = { id: number; actorId: number; targetUserId: number; action: string;
  previousRole: string | null; newRole: string | null; previousStatus: string | null; newStatus: string | null; at: string };
export type AuditResult<T> = { content: T[]; hasNext: boolean; page: number };

export const fetchOperatorTasks = () => request<OperatorTasks>('/api/admin/operator/tasks');
export const fetchDeveloperOverview = () => request<DeveloperOverview>('/api/admin/developer/overview');
export function fetchRequestDiagnostics(errorsOnly: boolean, requestId: string) {
  const query = new URLSearchParams({ errorsOnly: String(errorsOnly) });
  if (requestId.trim()) query.set('requestId', requestId.trim());
  return request<RequestSnapshot>(`/api/admin/developer/requests?${query}`);
}
export function fetchAuditActions(page: number, days: number, actorId: string) {
  const query = new URLSearchParams({ page: String(page), days: String(days) });
  if (actorId) query.set('actorId', actorId);
  return request<AuditResult<AuditAction>>(`/api/admin/audit/actions?${query}`);
}
export function fetchMemberChanges(page: number, days: number, targetId: string) {
  const query = new URLSearchParams({ page: String(page), days: String(days) });
  if (targetId) query.set('targetUserId', targetId);
  return request<AuditResult<MemberChange>>(`/api/admin/audit/members?${query}`);
}
