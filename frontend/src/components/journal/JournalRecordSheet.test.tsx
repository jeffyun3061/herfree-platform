import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { JournalRecordSheet } from '@/components/journal/JournalRecordSheet';

function renderSheet(closeOnSave = true) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <JournalRecordSheet
      open
      targetDate="2026-07-28"
      entryMode="daily"
      isSubmitting={false}
      closeOnSave={closeOnSave}
      onSave={onSave}
      onClose={onClose}
    />,
  );
  return { onSave, onClose };
}

describe('JournalRecordSheet', () => {
  it('leaves close/navigation to a route container when closeOnSave is false', async () => {
    const { onSave, onClose } = renderSheet(false);

    fireEvent.click(screen.getByRole('button', { name: '기록 저장하기' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps the existing close-after-save behavior by default', async () => {
    const { onSave, onClose } = renderSheet();

    fireEvent.click(screen.getByRole('button', { name: '기록 저장하기' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});
