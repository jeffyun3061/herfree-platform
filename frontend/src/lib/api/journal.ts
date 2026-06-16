import type { PageData } from '@/domain/common/types';
import type {
  JournalDashboard,
  JournalInsights,
  JournalRecord,
  JournalRecordInput,
} from '@/domain/journal/types';
import { request } from '@/lib/api/client';

export function upsertJournalRecord(input: JournalRecordInput) {
  return request<JournalRecord>('/api/journal/records', {
    method: 'POST',
    body: input,
  });
}

export function fetchJournalDashboard() {
  return request<JournalDashboard>('/api/journal/dashboard');
}

export function fetchJournalInsights() {
  return request<JournalInsights>('/api/journal/insights');
}

export function fetchJournalRecords(page = 0, size = 20, hadSymptoms?: boolean) {
  return request<PageData<JournalRecord>>('/api/journal/records', {
    query: { page, size, hadSymptoms },
  });
}

export function fetchJournalRecordByDate(date: string) {
  return request<JournalRecord | null>('/api/journal/records/by-date', {
    query: { date },
  });
}

export function deleteJournalRecord(recordId: number) {
  return request<void>(`/api/journal/records/${recordId}`, {
    method: 'DELETE',
  });
}
