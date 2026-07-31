import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  APP_NOTICE_CLEAR_EVENT,
  clearAppNotice,
  consumeAppNotice,
  publishAppNotice,
} from '@/lib/app-notice';

describe('app notice lifecycle', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('removes a stale session notice when a new session is established', () => {
    const onClear = vi.fn();
    window.addEventListener(APP_NOTICE_CLEAR_EVENT, onClear);
    publishAppNotice('session_expired');

    clearAppNotice();

    expect(consumeAppNotice()).toBeNull();
    expect(onClear).toHaveBeenCalledOnce();
    window.removeEventListener(APP_NOTICE_CLEAR_EVENT, onClear);
  });
});
