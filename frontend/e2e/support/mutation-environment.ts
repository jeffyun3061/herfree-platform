const APPROVED_STAGING_ORIGINS = new Set([
  'https://staging.herpfree.co.kr',
  'https://develop.d2bcg3vnlv5hkh.amplifyapp.com',
]);

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1';
}

export function expectedMutationBackendEnvironment(baseURL: string): 'local' | 'staging' {
  return isLocalHost(new URL(baseURL).hostname.toLowerCase()) ? 'local' : 'staging';
}

export function mutationEnvironmentEnabled(baseURL: string): boolean {
  if (process.env.E2E_ALLOW_MUTATION !== 'true') {
    return false;
  }

  const actualURL = new URL(baseURL);
  const actualOrigin = actualURL.origin;
  const actualHost = actualURL.hostname.toLowerCase();
  if (isLocalHost(actualHost)) {
    const configuredApiTarget = process.env.API_REWRITE_TARGET?.trim();
    if (configuredApiTarget) {
      let apiHost: string;
      try {
        apiHost = new URL(configuredApiTarget).hostname.toLowerCase();
      } catch {
        throw new Error('API_REWRITE_TARGET must be a valid absolute URL for local mutation tests.');
      }
      if (!isLocalHost(apiHost)) {
        throw new Error('Local mutation tests cannot proxy to a remote backend.');
      }
    }
    return true;
  }

  if (!APPROVED_STAGING_ORIGINS.has(actualOrigin)) {
    throw new Error(`Mutation target ${actualOrigin} is not an approved staging origin.`);
  }

  const expectedBaseURL = process.env.E2E_EXPECTED_BASE_URL?.trim();
  if (!expectedBaseURL) {
    throw new Error('E2E_EXPECTED_BASE_URL is required for non-local mutation tests.');
  }

  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(expectedBaseURL).origin;
  } catch {
    throw new Error('E2E_EXPECTED_BASE_URL must be a valid absolute URL.');
  }

  if (actualOrigin !== expectedOrigin) {
    throw new Error(
      `Mutation target ${actualOrigin} does not match the approved staging origin ${expectedOrigin}.`,
    );
  }

  return true;
}
