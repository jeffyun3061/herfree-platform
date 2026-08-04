'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JournalRecordSheet } from '@/components/journal/JournalRecordSheet';
import { HealthDataConsentGate } from '@/components/journal/HealthDataConsentGate';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toDateInputValue, type JournalRecordInput } from '@/domain/journal/types';
import { useAuth } from '@/hooks/useAuth';
import { useHealthDataConsent, useJournalMutation, useJournalRecordByDate } from '@/hooks/useJournal';

function normalizeDateParam(value: string | null): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return toDateInputValue();
}

function RecordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isReady } = useAuth();
  const targetDate = useMemo(() => normalizeDateParam(searchParams.get('date')), [searchParams]);
  const entryMode = searchParams.get('type') === 'relapse' ? 'relapse' : 'daily';
  const {
    data: healthDataConsent,
    isLoading: healthDataConsentLoading,
    error: healthDataConsentError,
    update: updateHealthDataConsent,
    isUpdating: isHealthDataConsentUpdating,
    updateError: healthDataConsentUpdateError,
  } = useHealthDataConsent(isReady && isLoggedIn);
  const {
    data: initialRecord,
    isLoading: recordLoading,
    error: loadError,
  } = useJournalRecordByDate(targetDate, isReady && isLoggedIn && healthDataConsent?.agreed === true);
  const { save, isSubmitting, error: saveError } = useJournalMutation();

  useEffect(() => {
    if (!isReady || isLoggedIn) return;
    router.replace(`/login?from=${encodeURIComponent(`/record?date=${targetDate}`)}`);
  }, [isReady, isLoggedIn, router, targetDate]);

  const handleSave = async (input: JournalRecordInput) => {
    await save({
      ...input,
      recordDate: input.recordDate || targetDate,
      hadSymptoms: input.hadSymptoms ?? false,
      supplementTaken: input.supplementTaken ?? false,
      exerciseDone: input.exerciseDone ?? false,
    });
    router.push('/journal?tab=records');
  };

  if (!isReady || (!isLoggedIn && isReady)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F3F6F4]">
        <LoadingSpinner label="불러오는 중..." />
      </div>
    );
  }

  if (healthDataConsentLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F3F6F4]">
        <LoadingSpinner label="개인일지 권한을 확인하는 중..." />
      </div>
    );
  }

  if (!healthDataConsent?.agreed) {
    return (
      <div className="min-h-[50vh] bg-[#F3F6F4] px-4 py-10">
        <HealthDataConsentGate
          isUpdating={isHealthDataConsentUpdating}
          error={healthDataConsentUpdateError ?? healthDataConsentError}
          onAgree={() => updateHealthDataConsent(true).then(() => undefined)}
        />
      </div>
    );
  }

  if (recordLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F3F6F4]">
        <LoadingSpinner label="기록을 확인하는 중..." />
      </div>
    );
  }

  return (
    <>
      {(loadError || saveError) && (
        <div className="fixed left-1/2 top-4 z-[70] w-[calc(100%-2rem)] max-w-app -translate-x-1/2">
          <ErrorMessage message={loadError ?? saveError ?? ''} />
        </div>
      )}
      <JournalRecordSheet
        open
        targetDate={targetDate}
        initialRecord={initialRecord ?? null}
        entryMode={initialRecord ? 'edit' : entryMode}
        isSubmitting={isSubmitting}
        closeOnSave={false}
        onClose={() => router.push('/journal')}
        onSave={handleSave}
      />
    </>
  );
}

export default function RecordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#F3F6F4]">
          <LoadingSpinner label="기록 화면을 준비하는 중..." />
        </div>
      }
    >
      <RecordPageContent />
    </Suspense>
  );
}
