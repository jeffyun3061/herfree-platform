import type { PageData } from '@/domain/common/types';
import type {
  JournalDashboard,
  JournalInsights,
  JournalRecord,
  JournalRecordInput,
} from '@/domain/journal/types';
import {
  normalizeJournalDashboard,
  normalizeJournalRecord,
} from '@/domain/journal/types';
import { request } from '@/lib/api/client';

export async function upsertJournalRecord(input: JournalRecordInput) {
  const record = await request<JournalRecord>('/api/journal/records', {
    method: 'POST',
    body: input,
  });
  return normalizeJournalRecord(record);
}

export async function fetchJournalDashboard() {
  const dashboard = await request<JournalDashboard>('/api/journal/dashboard');
  return normalizeJournalDashboard(dashboard);
}

export function fetchJournalInsights() {
  return request<JournalInsights>('/api/journal/insights');
}

export async function fetchJournalRecords(page = 0, size = 20, hadSymptoms?: boolean) {
  const pageData = await request<PageData<JournalRecord>>('/api/journal/records', {
    query: { page, size, hadSymptoms },
  });
  return {
    ...pageData,
    content: pageData.content.map(normalizeJournalRecord),
  };
}

export async function fetchJournalRecordByDate(date: string) {
  const record = await request<JournalRecord | null>('/api/journal/records/by-date', {
    query: { date },
  });
  return record ? normalizeJournalRecord(record) : null;
}

export function deleteJournalRecord(recordId: number) {
  return request<void>(`/api/journal/records/${recordId}`, {
    method: 'DELETE',
  });
}
