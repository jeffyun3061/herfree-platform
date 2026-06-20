'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { RoutineItemId } from '@/domain/journal/routine';
import { routineItemToWizardStep, type WizardStepId } from '@/domain/journal/wizard';

const ROUTINE_IDS = new Set<RoutineItemId>(['sleep', 'supplement', 'condition']);

type JournalRecordFromQueryProps = {
  isReady: boolean;
  isLoggedIn: boolean;
  dashboardLoading: boolean;
  onOpenDaily: (stepId?: WizardStepId) => void;
  onOpenRelapse: () => void;
};

export function JournalRecordFromQuery({
  isReady,
  isLoggedIn,
  dashboardLoading,
  onOpenDaily,
  onOpenRelapse,
}: JournalRecordFromQueryProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lastTriggeredKey = useRef<string | null>(null);

  const record = searchParams.get('record');
  const step = searchParams.get('step');
  const queryKey = record ? `${record}:${step ?? ''}` : '';

  useEffect(() => {
    if (!isReady || !isLoggedIn || dashboardLoading) return;

    if (!record) {
      lastTriggeredKey.current = null;
      return;
    }

    if (lastTriggeredKey.current === queryKey) return;

    lastTriggeredKey.current = queryKey;

    if (record === 'relapse') {
      onOpenRelapse();
    } else if (record === 'daily') {
      const stepId =
        step && ROUTINE_IDS.has(step as RoutineItemId)
          ? routineItemToWizardStep(step as RoutineItemId)
          : undefined;
      onOpenDaily(stepId);
    }

    router.replace('/journal', { scroll: false });
  }, [
    isReady,
    isLoggedIn,
    dashboardLoading,
    record,
    step,
    queryKey,
    onOpenDaily,
    onOpenRelapse,
    router,
  ]);

  return null;
}
