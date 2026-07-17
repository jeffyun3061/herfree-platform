'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  fetchAdminUsers,
  resetAdminUserNickname,
  restrictAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '@/lib/api/admin';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  ASSIGNABLE_ROLES,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  type UserRole,
  type UserStatus,
} from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin, isSuperAdmin } from '@/domain/user/types';

type PendingUserAction =
  | { kind: 'role'; userId: number; role: UserRole }
  | { kind: 'activate'; userId: number }
  | { kind: 'nickname'; userId: number };

export function AdminUsersSection() {
  const { user: session } = useAuth();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [restrictionUserId, setRestrictionUserId] = useState<number | null>(null);
  const [restrictionDays, setRestrictionDays] = useState('7');
  const [restrictionReason, setRestrictionReason] = useState('운영 정책 위반');
  const [restrictionNote, setRestrictionNote] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingUserAction | null>(null);
  const hasKeyword = keyword.trim().length > 0;

  const { data, isLoading, error, refetch } = useApiQuery(
    () => fetchAdminUsers(page, 10, keyword.trim()),
    [page, keyword],
    { enabled: hasKeyword },
  );

  const canChangeStatus = isAdmin(session?.role);
  const canChangeRole = isSuperAdmin(session?.role);

  useEffect(() => {
    const q = searchParams.get('q');
    if (!q) return;
    setSearchInput(q);
    setKeyword(q);
    setPage(0);
  }, [searchParams]);

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const handleRoleChange = async (userId: number, role: UserRole) => {
    setPendingId(userId);
    setActionError(null);
    try {
      await updateAdminUserRole(userId, role);
      await refetch();
      setPendingAction(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const handleStatusChange = async (userId: number, status: UserStatus) => {
    if (status === 'SUSPENDED') {
      setRestrictionUserId(userId);
      return;
    }
    setPendingId(userId);
    setActionError(null);
    try {
      await updateAdminUserStatus(userId, status);
      await refetch();
      setPendingAction(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const handleRestrict = async (userId: number) => {
    setPendingId(userId);
    setActionError(null);
    try {
      const permanent = restrictionDays === 'permanent';
      await restrictAdminUser(userId, {
        permanent,
        days: permanent ? undefined : Number(restrictionDays),
        reason: restrictionReason.trim(),
        note: restrictionNote.trim() || undefined,
      });
      setRestrictionUserId(null);
      setRestrictionNote('');
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const handleNicknameReset = async (userId: number) => {
    setPendingId(userId);
    setActionError(null);
    try {
      await resetAdminUserNickname(userId, {
        reason: '부적절한 닉네임',
        note: '관리자 화면에서 닉네임 초기화',
      });
      await refetch();
      setPendingAction(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction.kind === 'role') {
      void handleRoleChange(pendingAction.userId, pendingAction.role);
      return;
    }
    if (pendingAction.kind === 'activate') {
      void handleStatusChange(pendingAction.userId, 'ACTIVE');
      return;
    }
    void handleNicknameReset(pendingAction.userId);
  };

  if (error) return <ErrorMessage message={getErrorMessage(error)} />;

  const members = data?.content ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-[#E7DFD2] bg-[#FBF7EF] p-3 shadow-[0_14px_30px_-26px_rgba(20,31,26,.28)]">
        <p className="text-[13px] font-extrabold text-[#1E2621]">회원 검색</p>
        <p className="mt-1 text-[11.5px] leading-[1.6] text-[#7C847E]">
          이메일, 닉네임, 회원 ID를 입력해서 필요한 계정만 조회합니다.
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="예: user@email.com, 닉네임, #15"
            className="min-w-0 flex-1 rounded-[13px] border border-[#E4D8C8] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={searchInput.trim().length === 0}
            className="shrink-0 rounded-[13px] bg-[#0B3B36] px-4 py-2.5 text-[12px] font-bold text-white disabled:opacity-45"
          >
            검색
          </button>
        </form>
      </div>

      <p className="text-[12px] leading-[1.6] text-muted">
        권한 변경은 최고 관리자만 가능하며, 변경 이력은 서버 감사 로그에 기록됩니다.
      </p>

      {actionError && <ErrorMessage message={actionError} />}

      {!hasKeyword ? (
        <p className="rounded-[16px] border border-dashed border-[#D9CEBC] bg-white/50 px-4 py-8 text-center text-[12.5px] text-muted">
          계정을 검색하면 권한과 상태를 변경할 회원이 표시됩니다.
        </p>
      ) : isLoading ? (
        <LoadingSpinner label="회원 검색 중…" />
      ) : members.length === 0 ? (
        <p className="rounded-[16px] border border-dashed border-[#D9CEBC] bg-white/50 px-4 py-8 text-center text-[12.5px] text-muted">
          검색 결과가 없습니다.
        </p>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => (
            <li
              key={member.id}
              className="rounded-2xl border border-border/80 bg-card px-4 py-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="min-w-0 font-medium text-ink">
                    <span className="inline-block max-w-full truncate align-bottom">
                      {member.nickname}
                    </span>
                    <span className="ml-2 text-xs font-normal text-muted">#{member.id}</span>
                  </p>
                  <p className="mt-1 break-all text-xs text-muted">{member.email}</p>
                  <p className="mt-1 text-xs text-muted">
                    가입 {new Date(member.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                  {member.status === 'SUSPENDED' && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {member.suspensionReason ?? '제재 중'} ·{' '}
                      {member.suspendedUntil
                        ? `${new Date(member.suspendedUntil).toLocaleDateString('ko-KR')}까지`
                        : '영구 정지'}
                    </p>
                  )}
                </div>
                <div className="flex w-full shrink-0 flex-col gap-2">
                  {canChangeRole && member.role !== 'SUPER_ADMIN' ? (
                    <select
                      className="rounded-lg border border-border bg-white px-3 py-2 text-xs"
                      value={member.role}
                      disabled={pendingId === member.id || member.id === session?.userId}
                      onChange={(e) =>
                        setPendingAction({ kind: 'role', userId: member.id, role: e.target.value as UserRole })
                      }
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {USER_ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-lg bg-canvas px-3 py-2 text-xs text-muted">
                      {USER_ROLE_LABELS[member.role]}
                    </span>
                  )}

                  {canChangeStatus && member.role !== 'SUPER_ADMIN' ? (
                    <select
                      className="rounded-lg border border-border bg-white px-3 py-2 text-xs"
                      value={member.status}
                      disabled={pendingId === member.id || member.id === session?.userId}
                      onChange={(e) =>
                        e.target.value === 'SUSPENDED'
                          ? setRestrictionUserId(member.id)
                          : setPendingAction({ kind: 'activate', userId: member.id })
                      }
                    >
                      <option value="ACTIVE">{USER_STATUS_LABELS.ACTIVE}</option>
                      <option value="SUSPENDED">{USER_STATUS_LABELS.SUSPENDED}</option>
                    </select>
                  ) : (
                    <span className="rounded-lg bg-canvas px-3 py-2 text-xs text-muted">
                      {USER_STATUS_LABELS[member.status]}
                    </span>
                  )}
                </div>
              </div>

              {canChangeStatus && member.role !== 'SUPER_ADMIN' && member.id !== session?.userId && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pendingId === member.id}
                    onClick={() =>
                      setRestrictionUserId(restrictionUserId === member.id ? null : member.id)
                    }
                  >
                    제재 설정
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pendingId === member.id}
                    onClick={() => setPendingAction({ kind: 'nickname', userId: member.id })}
                  >
                    닉네임 초기화
                  </Button>
                  {member.status === 'SUSPENDED' && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={pendingId === member.id}
                      onClick={() => setPendingAction({ kind: 'activate', userId: member.id })}
                    >
                      정지 해제
                    </Button>
                  )}
                </div>
              )}

              {restrictionUserId === member.id && (
                <div className="mt-3 rounded-[16px] border border-[#E7DFD2] bg-[#FFFCF7] p-3">
                  <p className="text-[12px] font-extrabold text-[#1E2621]">회원 제재 설정</p>
                  <div className="mt-3 grid gap-2">
                    <select
                      value={restrictionDays}
                      onChange={(event) => setRestrictionDays(event.target.value)}
                      className="rounded-[12px] border border-[#E4D8C8] bg-white px-3 py-2 text-xs"
                    >
                      <option value="1">1일 정지</option>
                      <option value="7">7일 정지</option>
                      <option value="30">30일 정지</option>
                      <option value="permanent">영구 정지</option>
                    </select>
                    <input
                      value={restrictionReason}
                      onChange={(event) => setRestrictionReason(event.target.value)}
                      placeholder="제재 사유"
                      className="rounded-[12px] border border-[#E4D8C8] bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <textarea
                    value={restrictionNote}
                    onChange={(event) => setRestrictionNote(event.target.value)}
                    placeholder="운영 메모, 신고 맥락, 재검토 기준을 남겨주세요"
                    rows={3}
                    className="mt-2 w-full rounded-[12px] border border-[#E4D8C8] bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setRestrictionUserId(null)}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={pendingId === member.id || restrictionReason.trim().length === 0}
                      onClick={() => void handleRestrict(member.id)}
                    >
                      제재 적용
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasKeyword && (data?.totalPages ?? 0) > 1 && (
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
      )}

      {hasKeyword && (
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          검색 결과 새로고침
        </Button>
      )}

      <ConfirmModal
        open={pendingAction !== null}
        title={
          pendingAction?.kind === 'role'
            ? '회원 권한 변경'
            : pendingAction?.kind === 'activate'
              ? '계정 정지 해제'
              : '닉네임 초기화'
        }
        message={
          pendingAction?.kind === 'role'
            ? '운영 권한이 달라지며 변경 이력은 감사 로그에 기록됩니다.'
            : pendingAction?.kind === 'activate'
              ? '회원이 즉시 다시 로그인하고 서비스를 이용할 수 있습니다.'
              : '부적절한 닉네임을 기본값으로 초기화하며 변경 이력이 기록됩니다.'
        }
        confirmLabel={pendingAction?.kind === 'activate' ? '정지 해제' : '변경 적용'}
        variant={pendingAction?.kind === 'nickname' ? 'danger' : 'default'}
        isLoading={pendingId !== null}
        onConfirm={confirmPendingAction}
        onClose={() => pendingId === null && setPendingAction(null)}
      />
    </div>
  );
}
