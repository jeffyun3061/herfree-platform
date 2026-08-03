/**
 * Journal feature boundary.
 *
 * Transport details stay in lib/api while feature hooks import this module.
 * This lets the transport be replaced or composed without leaking endpoint
 * paths into journal UI code.
 */
export {
  deleteJournalRecord,
  fetchJournalDashboard,
  fetchJournalInsights,
  fetchJournalPublicHomeStats,
  fetchJournalRecordByDate,
  fetchJournalRecords,
  fetchJournalRecordsByMonth,
  fetchJournalReviewSummary,
  upsertJournalRecord,
} from '@/lib/api/journal';
