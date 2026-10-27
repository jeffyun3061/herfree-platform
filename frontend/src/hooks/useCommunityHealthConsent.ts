'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { COMMUNITY_HEALTH_PURPOSE, fetchCommunityHealthConsent, updateCommunityHealthConsent, type CommunityHealthConsent } from '@/lib/api/users';

function checkedConsent(value: CommunityHealthConsent): CommunityHealthConsent {
  if (value?.purpose !== COMMUNITY_HEALTH_PURPOSE || typeof value.agreed !== 'boolean'
    || (value.latestDecisionAgreed !== null && typeof value.latestDecisionAgreed !== 'boolean')
    || typeof value.requiredPolicyVersion !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.requiredPolicyVersion)
    || (value.policyVersion !== null && (typeof value.policyVersion !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.policyVersion)))
    || (value.decidedAt !== null && typeof value.decidedAt !== 'string')
    || (value.deletionRequestId !== null && (!Number.isSafeInteger(value.deletionRequestId) || value.deletionRequestId <= 0))) {
    throw new Error('익명 고민 건강정보 동의 상태를 확인할 수 없습니다. 다시 확인해 주세요.');
  }
  return value;
}

export function useCommunityHealthConsent(enabled = true) {
  const { isReady, isLoggedIn, user } = useAuth();
  const actor = enabled && isReady && isLoggedIn ? user?.userId ?? null : null;
  const actorRef = useRef(actor);
  actorRef.current = actor;
  const [snapshot, setSnapshot] = useState<{ actor: number; value: CommunityHealthConsent } | null>(null);
  const consent = snapshot?.actor === actor ? snapshot.value : null;
  const [isLoading, setLoading] = useState(Boolean(actor));
  const [isUpdating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (actor === null) return;
    setLoading(true);
    try {
      const result = checkedConsent(await fetchCommunityHealthConsent());
      if (actorRef.current === actor) { setSnapshot({ actor, value: result }); setError(null); }
    } catch (cause) {
      if (actorRef.current === actor) { setSnapshot(null); setError(getErrorMessage(cause)); }
    } finally {
      if (actorRef.current === actor) setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    setSnapshot(null); setError(null); setUpdating(false);
    if (actor === null) { setLoading(false); return; }
    void refresh();
    const reload = () => { void refresh(); };
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, [actor, refresh]);

  const update = async (agreed: boolean) => {
    if (actor === null || !consent || isUpdating) return null;
    const requestedActor = actor;
    setUpdating(true); setError(null);
    try {
      const result = checkedConsent(await updateCommunityHealthConsent(agreed, consent.requiredPolicyVersion));
      if (actorRef.current !== requestedActor) return null;
      setSnapshot({ actor: requestedActor, value: result });
      return result;
    } catch (cause) {
      if (actorRef.current === requestedActor) setError(getErrorMessage(cause));
      return null;
    } finally {
      if (actorRef.current === requestedActor) setUpdating(false);
    }
  };

  const agreed = Boolean(actor !== null && consent?.agreed && consent.policyVersion === consent.requiredPolicyVersion
    && consent.purpose === COMMUNITY_HEALTH_PURPOSE);
  return { consent, agreed, isLoading, isUpdating, error, refresh, update };
}

export type CommunityHealthConsentState = ReturnType<typeof useCommunityHealthConsent>;
