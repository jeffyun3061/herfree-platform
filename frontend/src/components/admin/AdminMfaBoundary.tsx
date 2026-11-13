'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isStaff, canWriteContent, canViewDeveloperTools } from '@/domain/user/types';
import { request, getErrorMessage } from '@/lib/api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type Status = { enrolled: boolean; verified: boolean; expiresIn: number };
type Enrollment = { secret: string; otpauthUri: string; expiresIn: number };
type Verified = { expiresIn: number; recoveryCodes: string[] };

export function AdminMfaBoundary({ children }: { children: ReactNode }) {
  const { isReady, isLoggedIn, user } = useAuth();
  const eligible = isLoggedIn && (isStaff(user?.role) || canWriteContent(user?.role) || canViewDeveloperTools(user?.role));
  const [status, setStatus] = useState<Status | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [approval, setApproval] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setStatus(await request<Status>('/api/auth/admin-mfa/status')); setError(''); }
    catch (e) { setStatus({ enrolled: false, verified: false, expiresIn: 0 }); setError(getErrorMessage(e)); }
  }, []);

  useEffect(() => {
    setStatus(null); setEnrollment(null); setCodes([]); setCode(''); setApproval('');
    if (eligible) void refresh();
  }, [eligible, user?.userId, user?.role, refresh]);

  useEffect(() => {
    const requireMfa = () => { setStatus((s) => s ? { ...s, verified: false } : s); setCode(''); };
    window.addEventListener('herfree:admin-mfa-required', requireMfa);
    const timer = status?.verified
      ? window.setTimeout(requireMfa, Math.max(1, status.expiresIn) * 1000) : undefined;
    return () => { window.removeEventListener('herfree:admin-mfa-required', requireMfa); if (timer) window.clearTimeout(timer); };
  }, [status]);

  async function enroll() {
    setBusy(true); setError('');
    try {
      setEnrollment(await request<Enrollment>('/api/auth/admin-mfa/enroll', { method: 'POST', body: { approvalCode: approval } }));
      setApproval(''); setCode(''); setReset(false);
      setStatus({ enrolled: false, verified: false, expiresIn: 0 });
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setError('');
    const action = enrollment ? 'confirm' : recovery ? 'recover' : 'verify';
    try {
      const result = await request<Verified>(`/api/auth/admin-mfa/${action}`, { method: 'POST', body: { code } });
      setCodes(result.recoveryCodes); setEnrollment(null); setCode(''); setRecovery(false);
      setStatus({ enrolled: true, verified: true, expiresIn: result.expiresIn });
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  if (!isReady || (eligible && !status)) return <LoadingSpinner />;
  if (!eligible || (status?.verified && codes.length === 0)) return <>{children}</>;

  return (
    <main className="min-h-screen bg-[#F3EDE3] px-4 py-10">
      <section className="mx-auto max-w-lg rounded-2xl bg-[#FBF7EF] p-6 shadow-sm">
        <h1 className="text-xl font-bold">관리자 추가 인증</h1>
        {codes.length > 0 ? <>
          <p className="my-4">복구 코드는 한 번씩 사용할 수 있습니다. 안전한 곳에 보관해 주세요. 이 화면을 닫으면 다시 표시되지 않습니다.</p>
          <textarea className="w-full rounded border p-3 font-mono text-sm" rows={8} readOnly aria-label="일회용 복구 코드" value={codes.join('\n')} />
          <button className="mt-4 rounded bg-[#123D37] px-4 py-2 text-white" onClick={() => setCodes([])}>보관 완료 · 관리자 화면으로</button>
        </> : <>
          <p className="my-4 text-sm">운영 기능을 사용하려면 추가 인증이 필요합니다. 인증은 15분 동안 유지됩니다.</p>
          {(!status?.enrolled || reset) && !enrollment ? <>
            <p className="mb-3 text-sm">운영 책임자에게 본인 확인 후 등록 승인 코드를 받아 입력해 주세요. 기기를 분실한 경우에도 같은 절차로 재등록할 수 있습니다.</p>
            <label className="block text-sm">등록 승인 코드<input className="mt-1 w-full rounded border p-3" autoComplete="off" type="password" value={approval} onChange={(e) => setApproval(e.target.value)} /></label>
            <button disabled={busy || !approval} onClick={() => void enroll()} className="mt-4 rounded bg-[#123D37] px-4 py-2 text-white disabled:opacity-50">인증앱 등록 시작</button>
            <button className="ml-3 text-sm underline" onClick={() => void refresh()}>다시 확인</button>
          </> : <>
            {enrollment && <div className="mb-4 rounded bg-white p-4">
              <p className="text-sm">인증앱에서 계정을 추가하고 아래 키를 입력하세요. 15분 안에 등록을 완료해 주세요.</p>
              <p className="mt-3 break-all font-mono" aria-label="인증앱 등록 키">{enrollment.secret}</p>
            </div>}
            <label className="block text-sm">{recovery ? '일회용 복구 코드' : '인증앱 6자리 번호'}
              <input className="mt-1 w-full rounded border p-3" autoComplete="off" inputMode={recovery ? 'text' : 'numeric'} maxLength={recovery ? 128 : 6} value={code} onChange={(e) => setCode(e.target.value)} />
            </label>
            <button disabled={busy || !code} onClick={() => void verify()} className="mt-4 rounded bg-[#123D37] px-4 py-2 text-white disabled:opacity-50">인증 확인</button>
            {!enrollment && <div className="mt-4 flex gap-4 text-sm underline">
              <button onClick={() => { setRecovery(!recovery); setCode(''); }}>{recovery ? '인증앱 사용' : '복구 코드 사용'}</button>
              <button onClick={() => { setReset(true); setCode(''); }}>기기 분실 · 재등록</button>
            </div>}
          </>}
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        </>}
      </section>
    </main>
  );
}
