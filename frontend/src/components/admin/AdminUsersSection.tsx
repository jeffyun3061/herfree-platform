'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '@/lib/api/admin';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
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

export function AdminUsersSection() {
  const { user: session } = useAuth();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const hasKeyword = keyword.trim().length > 0;

  const { data, isLoading, error, refetch } = useApiQuery(
    () => fetchAdminUsers(page, 10, keyword.trim()),
    [page, keyword],
    { enabled: hasKeyword },
  );

  const canChangeStatus = isAdmin(session?.role);
  const canChangeRole = isSuperAdmin(session?.role);

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
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const handleStatusChange = async (userId: number, status: UserStatus) => {
    setPendingId(userId);
    setActionError(null);
    try {
      await updateAdminUserStatus(userId, status);
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setPendingId(null);
    }
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
                <div>
                  <p className="font-medium text-ink">
                    {member.nickname}
                    <span className="ml-2 text-xs font-normal text-muted">#{member.id}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">{member.email}</p>
                  <p className="mt-1 text-xs text-muted">
                    가입 {new Date(member.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {canChangeRole && member.role !== 'SUPER_ADMIN' ? (
                    <select
                      className="rounded-lg border border-border bg-white px-3 py-2 text-xs"
                      value={member.role}
                      disabled={pendingId === member.id || member.id === session?.userId}
                      onChange={(e) =>
                        void handleRoleChange(member.id, e.target.value as UserRole)
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
                        void handleStatusChange(member.id, e.target.value as UserStatus)
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
    </div>
  );
}
