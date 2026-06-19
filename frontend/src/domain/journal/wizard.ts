import type { RoutineItemId } from '@/domain/journal/routine';

export const WIZARD_STEP = {
  SYMPTOM: 1,
  SEVERITY: 2,
  PRODROMAL: 3,
  TRIGGERS: 4,
  SLEEP: 5,
  SUPPLEMENT: 6,
  CONDITION: 7,
  MEDICATION: 8,
  MEMO: 9,
} as const;

export type WizardStepId = (typeof WIZARD_STEP)[keyof typeof WIZARD_STEP];

/** daily: 루틴 4스텝 | relapse: 재발 상세 | edit: 기존 기록 수정 */
export type WizardEntryMode = 'daily' | 'relapse' | 'edit';

export function buildWizardStepSequence(mode: WizardEntryMode, hadSymptoms: boolean): WizardStepId[] {
  if (mode === 'daily') {
    return [
      WIZARD_STEP.SLEEP,
      WIZARD_STEP.SUPPLEMENT,
      WIZARD_STEP.CONDITION,
      WIZARD_STEP.MEMO,
    ];
  }
  if (mode === 'relapse' || hadSymptoms) {
    return [
      WIZARD_STEP.SYMPTOM,
      WIZARD_STEP.SEVERITY,
      WIZARD_STEP.PRODROMAL,
      WIZARD_STEP.TRIGGERS,
      WIZARD_STEP.SLEEP,
      WIZARD_STEP.SUPPLEMENT,
      WIZARD_STEP.CONDITION,
      WIZARD_STEP.MEMO,
    ];
  }
  return [
    WIZARD_STEP.SYMPTOM,
    WIZARD_STEP.SLEEP,
    WIZARD_STEP.SUPPLEMENT,
    WIZARD_STEP.CONDITION,
    WIZARD_STEP.MEMO,
  ];
}

export function wizardStepIndex(sequence: WizardStepId[], stepId: WizardStepId): number {
  const index = sequence.indexOf(stepId);
  return index >= 0 ? index : 0;
}

export function routineItemToWizardStep(itemId: RoutineItemId): WizardStepId {
  switch (itemId) {
    case 'sleep':
      return WIZARD_STEP.SLEEP;
    case 'supplement':
      return WIZARD_STEP.SUPPLEMENT;
    case 'condition':
      return WIZARD_STEP.CONDITION;
  }
}
