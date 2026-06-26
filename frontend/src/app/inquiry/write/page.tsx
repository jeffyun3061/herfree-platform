'use client';

import { Suspense } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PrivateBoardWriteForm } from '@/components/community/PrivateBoardWriteForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function InquiryWritePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RequireAuth>
        <PrivateBoardWriteForm boardType="INQUIRY" />
      </RequireAuth>
    </Suspense>
  );
}
