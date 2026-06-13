'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream-foreground">{message}</p>
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" fullWidth onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          fullWidth
          disabled={isLoading}
          onClick={onConfirm}
        >
          {isLoading ? '처리 중…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
