import { afterEach, describe, expect, it, vi } from 'vitest';
import { mutationEnvironmentEnabled } from '../../e2e/support/mutation-environment';
import { verifyIsolatedReleaseTarget } from '../../e2e/support/isolated-release-target';

vi.mock('../../e2e/support/isolated-release-target', () => ({
  verifyIsolatedReleaseTarget: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe('staging mutation target safety', () => {
  it('does not enable mutation without explicit opt-in', () => {
    vi.stubEnv('E2E_ALLOW_MUTATION', 'false');
    expect(mutationEnvironmentEnabled('https://www.herpfree.co.kr')).toBe(false);
  });

  it('rejects an isolated target if its verifier fails, even for localhost', () => {
    vi.stubEnv('E2E_ALLOW_MUTATION', 'true');
    vi.stubEnv('ISOLATED_RELEASE_SHARE_QA', 'true');
    vi.mocked(verifyIsolatedReleaseTarget).mockImplementation(() => { throw new Error('unverified'); });
    expect(() => mutationEnvironmentEnabled('http://127.0.0.1:3100')).toThrow('unverified');
    expect(verifyIsolatedReleaseTarget).toHaveBeenCalledOnce();
  });

  it('requires an exact expected origin after isolated verification', () => {
    vi.stubEnv('E2E_ALLOW_MUTATION', 'true');
    vi.stubEnv('ISOLATED_RELEASE_SHARE_QA', 'true');
    vi.stubEnv('E2E_EXPECTED_BASE_URL', 'https://different.example');
    expect(() => mutationEnvironmentEnabled('https://qa.example')).toThrow('does not match');
  });

  it('rejects unapproved remote targets in the ordinary staging mode', () => {
    vi.stubEnv('E2E_ALLOW_MUTATION', 'true');
    vi.stubEnv('ISOLATED_RELEASE_SHARE_QA', 'false');
    expect(() => mutationEnvironmentEnabled('https://www.herpfree.co.kr')).toThrow('not an approved');
  });
});
