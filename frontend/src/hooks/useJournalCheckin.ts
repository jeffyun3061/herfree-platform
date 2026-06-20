'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toDateInputValue, type JournalRecord, type JournalRecordInput, type JournalTimelineDay } from '@/domain/journal/types';
import type { RoutineItemId } from '@/domain/journal/routine';
import {
  routineItemToWizardStep,
  type WizardEntryMode,
  type WizardStepId,
} from '@/domain/journal/wizard';
import { useJournalMutation } from '@/hooks/useJournal';

type UseJournalCheckinOptions = {
  isLoggedIn: boolean;
  todayRecord?: JournalRecord | null;
  timelineDays?: JournalTimelineDay[];
  loginFrom?: string;
  onAfterSave?: () => void | Promise<void>;
};

export function useJournalCheckin({
  isLoggedIn,
  todayRecord,
  timelineDays = [],
  loginFrom = '/',
  onAfterSave,
}: UseJournalCheckinOptions) {
  const router = useRouter();
  const { save, isSubmitting, error } = useJournalMutation();

  const [checkinOpen, setCheckinOpen] = useState(false);
  const [wizardTargetDate, setWizardTargetDate] = useState(toDateInputValue());
  const [wizardInitialRecord, setWizardInitialRecord] = useState<JournalRecord | null>(null);
  const [wizardEntryMode, setWizardEntryMode] = useState<WizardEntryMode>('daily');
  const [wizardInitialStepId, setWizardInitialStepId] = useState<WizardStepId | undefined>();
  const [routinePulse, setRoutinePulse] = useState(false);

  const requireLogin = useCallback(() => {
    router.push(`/login?from=${encodeURIComponent(loginFrom)}`);
  }, [router, loginFrom]);

  const openWizard = useCallback(
    (date: string, record: JournalRecord | null, mode: WizardEntryMode, stepId?: WizardStepId) => {
      setWizardTargetDate(date);
      setWizardInitialRecord(record);
      setWizardEntryMode(mode);
      setWizardInitialStepId(stepId);
      setCheckinOpen(true);
    },
    [],
  );

  const openDailyWizard = useCallback(
    (stepId?: WizardStepId) => {
      if (!isLoggedIn) {
        requireLogin();
        return;
      }
      const today = toDateInputValue();
      openWizard(today, todayRecord ?? null, 'daily', stepId);
    },
    [isLoggedIn, requireLogin, openWizard, todayRecord],
  );

  const openRelapseWizard = useCallback(() => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }
    const today = toDateInputValue();
    openWizard(today, todayRecord ?? null, 'relapse');
  }, [isLoggedIn, requireLogin, openWizard, todayRecord]);

  const handleRoutineItemClick = useCallback(
    (itemId: RoutineItemId) => {
      openDailyWizard(routineItemToWizardStep(itemId));
    },
    [openDailyWizard],
  );

  const handleSave = useCallback(
    async (input: JournalRecordInput) => {
      await save({
        ...input,
        hadSymptoms: input.hadSymptoms ?? false,
        supplementTaken: input.supplementTaken ?? false,
        exerciseDone: input.exerciseDone ?? false,
      });
      await onAfterSave?.();
      setCheckinOpen(false);
      setRoutinePulse(true);
      setTimeout(() => setRoutinePulse(false), 2000);
    },
    [save, onAfterSave],
  );

  return {
    routinePulse,
    error,
    isSubmitting,
    checkinOpen,
    wizardProps: {
      open: checkinOpen,
      targetDate: wizardTargetDate,
      initialRecord: wizardInitialRecord,
      entryMode: wizardEntryMode,
      initialStepId: wizardInitialStepId,
      timelineDays,
      isSubmitting,
      onClose: () => setCheckinOpen(false),
      onSave: handleSave,
    },
    openDailyWizard,
    openRelapseWizard,
    handleRoutineItemClick,
    openWizard,
  };
}
