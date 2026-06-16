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
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => fetchAdminUsers(page),
    [page],
  );

  const canChangeStatus = isAdmin(session?.role);
  const canChangeRole = isSuperAdmin(session?.role);

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

  if (isLoading) return <LoadingSpinner label="회원 목록 불러오는 중…" />;
  if (error) return <ErrorMessage message={getErrorMessage(error)} />;

  const members = data?.content ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        권한 변경은 최고 관리자(SUPER_ADMIN)만 가능합니다. 변경 내역은 서버 감사 로그에
        기록됩니다.
      </p>

      {actionError && <ErrorMessage message={actionError} />}

      {members.length === 0 ? (
        <p className="text-sm text-muted">표시할 회원이 없습니다.</p>
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

      {(data?.totalPages ?? 0) > 1 && (
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
      )}

      <Button variant="secondary" size="sm" onClick={() => void refetch()}>
        새로고침
      </Button>
    </div>
  );
}
