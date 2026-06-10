'use client';

import { useState } from 'react';
import type { ReportCreateInput, ReportTargetType } from '@/domain/report/types';
import { REPORT_REASONS } from '@/domain/report/types';
import { useReport } from '@/hooks/useReport';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

type ReportModalProps = {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
};

export function ReportModal({ open, onClose, targetType, targetId }: ReportModalProps) {
  const { isSubmitting, error, submitReport, clearError } = useReport();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [done, setDone] = useState(false);

  const handleClose = () => {
    setDetail('');
    setReason(REPORT_REASONS[0]);
    setDone(false);
    clearError();
    onClose();
  };

  const handleSubmit = async () => {
    const input: ReportCreateInput = { targetType, targetId, reason, detail: detail || undefined };
    const ok = await submitReport(input);
    if (ok) setDone(true);
  };

  return (
    <Modal open={open} title="신고하기" onClose={handleClose}>
      {done ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-cream-foreground">신고가 접수되었습니다. 검토 후 조치하겠습니다.</p>
          <Button fullWidth onClick={handleClose}>
            확인
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-cream-foreground">신고 사유</p>
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={item}
                    checked={reason === item}
                    onChange={() => setReason(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
          <Textarea
            label="상세 내용 (선택)"
            placeholder="추가로 전달할 내용이 있으면 적어 주세요."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={500}
          />
          {error && <ErrorMessage message={error} />}
          <Button fullWidth disabled={isSubmitting} onClick={() => void handleSubmit()}>
            {isSubmitting ? '접수 중…' : '신고 접수'}
          </Button>
        </div>
      )}
    </Modal>
  );
}
