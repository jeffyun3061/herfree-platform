'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchDeveloperOverview, fetchRequestDiagnostics } from '@/lib/api/admin/operations';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const panel = 'rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] p-4';
const date = (at: string | null) => at ? new Date(at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '확인 불가';
const mib = (bytes: number) => `${(bytes / 1048576).toLocaleString('ko-KR', { maximumFractionDigits: 1 })} MiB`;
const state = (value: boolean | null, fresh: boolean) => !fresh || value === null ? '확인 불가' : value ? '정상' : '점검 필요';

export function DeveloperOperationsSection() {
  const [errorsOnly, setErrorsOnly] = useState(true);
  const [draftId, setDraftId] = useState('');
  const [requestId, setRequestId] = useState('');
  const overview = useApiQuery(fetchDeveloperOverview, []);
  const logs = useApiQuery(() => fetchRequestDiagnostics(errorsOnly, requestId), [errorsOnly, requestId]);
  const data = overview.data;
  const fresh = data?.host.state === 'FRESH';
  return <section className="grid gap-4" aria-label="개발자 진단">
    <div className="flex items-center justify-between gap-3">
      <div><h2 className="text-xl font-extrabold">서비스 진단</h2><p className="mt-1 text-xs text-[#687269]">상태·용량·요청 메타데이터를 조회합니다.</p></div>
      <button type="button" disabled={overview.isLoading || logs.isLoading} onClick={() => { void overview.refetch(); void logs.refetch(); }} className="min-h-11 shrink-0 rounded-xl bg-[#0B3B36] px-4 text-sm font-bold text-white disabled:opacity-50">새로고침</button>
    </div>
    {overview.isLoading ? <LoadingSpinner label="서비스 상태 확인 중…" /> : overview.error ? <ErrorMessage message={overview.error} /> : data && <>
      <section className={panel}>
        <h3 className="font-bold">현재 실행 환경</h3>
        <dl className="mt-3 grid gap-2 text-sm">
          <Row label="환경" value={data.environment} />
          <Row label="API 가동 시간" value={`${Math.floor(data.uptimeSeconds / 3600)}시간 ${Math.floor(data.uptimeSeconds / 60) % 60}분`} />
          <Row label="JVM 힙 메모리" value={`${mib(data.heapUsedBytes)} / ${data.heapMaxBytes > 0 ? mib(data.heapMaxBytes) : '미확인'}`} />
          <Row label="DB 응답" value={data.database.state === 'UP' ? '정상 · SELECT 1 성공' : '점검 필요 · 연결 실패'} />
          <Row label="MySQL 버전" value={data.database.version ?? '확인 불가'} />
          <Row label="마지막 마이그레이션" value={data.database.migrationVersion ? `V${data.database.migrationVersion} · ${data.database.migrationsSuccessful ? '적용 성공' : '점검 필요'}` : '확인 불가'} />
          <Row label="DB 연결 풀" value={`사용 ${data.database.poolActive ?? '?'} · 여유 ${data.database.poolIdle ?? '?'} · 대기 ${data.database.poolWaiting ?? '?'}`} />
        </dl>
        <p className="mt-3 text-xs font-bold text-[#687269]">실행 중인 이미지</p><p className="mt-1 break-all rounded-xl bg-[#F7F1E7] p-3 font-mono text-xs">{data.image}</p>
        <p className="mt-3 text-xs text-[#687269]">API 확인 {date(data.sampledAt)} · 상태 조회는 15초 동안 재사용됩니다.</p>
      </section>
      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">서버·백업·복구</h3><span className={`rounded-full px-3 py-1 text-xs font-bold ${fresh ? 'bg-[#EEF4EF] text-[#0B3B36]' : 'bg-amber-100 text-amber-900'}`}>{fresh ? '최근 수집' : data.host.state === 'STALE' ? '수집 지연 · 확인 필요' : '수집되지 않음'}</span></div>
        {!fresh && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">최신 서버 상태를 확인할 수 없습니다. 운영 모니터 실행과 수집 시각을 확인하세요.</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Percent label="서버 메모리" value={data.host.memoryPercent} fresh={fresh} />
          <Percent label="루트 디스크" value={data.host.rootDiskPercent} fresh={fresh} />
          <Percent label="DB 디스크" value={data.host.databaseDiskPercent} fresh={fresh} />
        </div>
        <dl className="mt-4 grid gap-2 text-sm">
          <Row label="외부 HTTPS" value={state(data.host.httpsHealthy, fresh)} />
          <Row label="DB 모니터" value={state(data.host.databaseHealthy, fresh)} />
          <Row label="마지막 6시간 백업" value={fresh && data.host.backupAgeHours !== null ? `${data.host.backupAgeHours.toFixed(1)}시간 전${data.host.backupAgeHours > 8 ? ' · 지연, 점검 필요' : ''}` : '확인 불가'} />
          <Row label="마지막 복구 성공" value={fresh && data.host.restoreAgeDays !== null ? `${data.host.restoreAgeDays.toFixed(1)}일 전${data.host.restoreAgeDays > 35 ? ' · 훈련 필요' : ''}` : '확인 불가'} />
          <Row label="최근 복구 시도" value={state(data.host.restoreHealthy, fresh)} />
        </dl>
        <p className="mt-3 text-xs text-[#687269]">서버 수집 {date(data.host.collectedAt)} · 10분이 지나면 지표를 정상으로 표시하지 않습니다. 백업 존재 여부와 복구 성공은 별도로 확인합니다.</p>
      </section>
      <section className={panel}>
        <h3 className="font-bold">DB 테이블 용량</h3><p className="mt-1 text-xs text-[#687269]">MySQL 통계의 추정 행 수입니다. 데이터·인덱스 용량을 포함하며 회원 데이터 원문은 조회하지 않습니다.</p>
        {data.database.tables.length === 0 ? <p className="mt-3 text-sm">테이블 통계를 확인할 수 없습니다.</p> : <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs"><caption className="sr-only">테이블별 추정 행 수와 용량</caption><thead><tr className="border-b border-[#E7DFD2]"><th scope="col" className="py-2">테이블</th><th scope="col" className="px-3 py-2 text-right">추정 행</th><th scope="col" className="py-2 text-right">용량</th></tr></thead>
            <tbody>{data.database.tables.map((table) => <tr key={table.name} className="border-b border-[#F0EAE0]"><th scope="row" className="py-2 font-mono font-normal">{table.name}</th><td className="px-3 py-2 text-right">{table.estimatedRows.toLocaleString('ko-KR')}</td><td className="whitespace-nowrap py-2 text-right">{mib(table.bytes)}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>
    </>}
    <section className={panel}>
      <h3 className="font-bold">요청 로그</h3><p className="mt-1 text-xs leading-relaxed text-[#687269]">현재 API 프로세스의 최근 1시간, 최대 1,000건을 보관하며 최근 50건을 표시합니다. 재시작하면 초기화됩니다. 5xx·2초 이상 요청은 기존 서버 로그에도 남습니다.</p>
      <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); setRequestId(draftId.trim()); }}>
        <label htmlFor="diagnostic-request-id" className="sr-only">요청 ID</label>
        <input id="diagnostic-request-id" value={draftId} onChange={(event) => setDraftId(event.target.value)} maxLength={64} pattern="[A-Za-z0-9._\-]*" placeholder="요청 ID로 찾기" className="h-11 min-w-0 flex-1 rounded-xl border border-[#E7DFD2] bg-white px-3 text-sm" />
        <button type="submit" className="rounded-xl bg-[#EEF4EF] px-4 text-sm font-bold">조회</button>
      </form>
      <label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={errorsOnly} onChange={(event) => setErrorsOnly(event.target.checked)} />오류 요청만 보기 (4xx·5xx)</label>
      {logs.isLoading ? <LoadingSpinner label="요청 로그 확인 중…" /> : logs.error ? <ErrorMessage message={logs.error} /> : logs.data && <>
        <p className="mb-3 text-xs text-[#687269]">보관 {logs.data.retainedCount}건 · 보관 범위 내 5xx {logs.data.errors}건 · 최대 응답 {logs.data.maxDurationMs}ms</p>
        {logs.data.entries.length === 0 ? <p className="rounded-xl bg-[#EEF4EF] p-4 text-sm">조건에 맞는 요청이 없습니다.</p> : <ol className="grid gap-2">{logs.data.entries.map((entry, index) => <li key={`${entry.requestId}-${index}`} className="rounded-xl bg-[#F7F1E7] p-3 text-xs">
          <div className="flex flex-wrap justify-between gap-2"><span className={entry.status >= 400 ? 'font-bold text-[#9D3D22]' : 'font-bold text-[#0B3B36]'}>{entry.status} · {entry.durationMs}ms</span><span>{date(entry.at)}</span></div>
          <p className="mt-2 break-all font-mono">{entry.method} {entry.route}</p><p className="mt-1 break-all font-mono text-[#687269]">요청 ID: {entry.requestId}</p>
        </li>)}</ol>}
      </>}
    </section>
    <p className="text-xs leading-relaxed text-[#687269]">배포·롤백은 GitHub Actions, 장기 로그·경보는 기존 CloudWatch, 서버 점검은 SSM에서 수행합니다. 이 화면의 개발자 권한으로 회원 제재·권한 변경·비공개 상담 열람을 할 수 없습니다.</p>
  </section>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-wrap justify-between gap-x-4 gap-y-1"><dt className="text-[#687269]">{label}</dt><dd className="break-all font-semibold">{value}</dd></div>;
}
function Percent({ label, value, fresh }: { label: string; value: number | null; fresh: boolean }) {
  return <div><p className="text-xs text-[#687269]">{label}</p><p className="mt-1 font-bold">{fresh && value !== null ? `${value.toFixed(1)}%${value >= 80 ? ' · 점검 필요' : ''}` : '확인 불가'}</p>
    {fresh && value !== null && <progress className="mt-2 h-2 w-full accent-[#0B3B36]" aria-label={label} value={value} max={100} />}
  </div>;
}
