import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HealthDataConsentGate } from '@/components/journal/HealthDataConsentGate';

describe('HealthDataConsentGate', () => {
  it('requires an explicit action before enabling journal access', async () => {
    const onAgree = vi.fn().mockResolvedValue(undefined);
    render(<HealthDataConsentGate isUpdating={false} onAgree={onAgree} />);

    expect(onAgree).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onAgree).toHaveBeenCalledOnce());
  });

  it('surfaces update failures without hiding the consent action', () => {
    render(
      <HealthDataConsentGate
        isUpdating={false}
        error="consent update failed"
        onAgree={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText('consent update failed')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeEnabled();
  });
});
