import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

// These checks are only an isolation preflight, never release approval.
export function verifyIsolatedReleaseTarget(): void {
  const branch = process.env.RELEASE_QA_BRANCH || '';
  const sha = process.env.RELEASE_SHA || '';
  const image = process.env.RELEASE_IMAGE || '';
  const run = process.env.ISOLATED_QA_RUN || '';
  const repo = process.env.ISOLATED_QA_CANDIDATE_DIR;
  const candidatePr = process.env.RELEASE_CANDIDATE_PR || '';
  const origin = `https://${branch}.d2bcg3vnlv5hkh.amplifyapp.com`;
  if (process.env.ISOLATED_RELEASE_SHARE_QA !== 'true'
      || process.env.PLAYWRIGHT_BASE_URL !== origin || process.env.ISOLATED_QA_COMMIT !== sha
      || process.env.ISOLATED_QA_IMAGE !== image || !/^[a-f0-9]{8}$/.test(run)
      || !/^[a-f0-9]{40}$/.test(sha) || !/^qa-[a-f0-9]{12}-[a-f0-9]{8}$/.test(branch)
      || branch.slice(3, 15) !== sha.slice(0, 12)
      || (candidatePr !== '' && candidatePr !== '206' && candidatePr !== '213')
      || !process.env.E2E_HTTP_USERNAME?.trim() || !process.env.E2E_HTTP_PASSWORD || !repo) {
    throw new Error('Isolated QA target or credentials are not the verified release.');
  }
  try {
    const verifier = candidatePr ? 'verify-candidate-release-qa.py' : 'verify-live-release-qa.py';
    execFileSync('python3', [join(process.cwd(), '../infra/scripts', verifier),
      ...(candidatePr ? ['--pr', candidatePr] : []), '--sha', sha, '--branch', branch, '--image', image],
    { stdio: 'pipe', timeout: 120_000 });
    execFileSync('python3', [join(process.cwd(), '../infra/scripts/verify-isolated-staging.py'),
      '--run', run, '--image', image], { stdio: 'pipe', timeout: 120_000 });
    execFileSync('python3', [join(process.cwd(), '../infra/scripts/verify-isolated-frontend.py'),
      '--account', '439777528445', '--app', 'd2bcg3vnlv5hkh', '--branch', branch, '--sha', sha,
      '--api', 'https://api-staging.herpfree.co.kr', '--repo', repo,
      ...(candidatePr ? ['--candidate-pr', candidatePr] : [])], {
      stdio: 'pipe', timeout: 120_000,
      env: { ...process.env, ISOLATED_QA_BASIC_USERNAME: process.env.E2E_HTTP_USERNAME,
        ISOLATED_QA_BASIC_PASSWORD: process.env.E2E_HTTP_PASSWORD },
    });
  } catch {
    throw new Error('Isolated staging verification failed; no test write was attempted.');
  }
}

export function verifyIfIsolatedRelease(): void {
  if (process.env.ISOLATED_RELEASE_SHARE_QA === 'true') verifyIsolatedReleaseTarget();
}
