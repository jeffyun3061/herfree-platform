import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const mode = process.argv.includes('--staged')
  ? 'staged'
  : process.argv.includes('--all')
    ? 'all'
    : 'tracked';

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

const files = (mode === 'staged'
  ? git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
  : mode === 'all'
    ? git(['ls-files', '--cached', '--others', '--exclude-standard'])
    : git(['ls-files']))
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean);

const allowedSecretTemplates = [
  /(^|\/)\.env(?:\..+)?\.example$/,
  /(^|\/)\.env\.example$/,
  /(^|\/)local-secrets\.yml\.example$/,
  /(^|\/)application-(?:local|prod)\.yml\.example$/,
];
const allowedPublicCertificates = new Set([
  'infra/certs/rds-global-bundle.pem',
]);
const forbiddenPaths = [
  { name: '실제 환경변수 파일', pattern: /(^|\/)\.env(?:\..+)?$/ },
  { name: '로컬 비밀 설정', pattern: /(^|\/)local-secrets\.yml$/ },
  { name: '실행 환경 설정', pattern: /(^|\/)application-(?:local|prod|secret)\.yml$/ },
  { name: '인증서/개인키', pattern: /\.(?:pem|p12|pfx|jks|keystore|key)$/i },
  { name: 'secrets 폴더', pattern: /(^|\/)secrets\//i },
];
const valueRules = [
  { name: '개인키 본문', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key', pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/ },
  { name: 'GitHub Token', pattern: /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/ },
  { name: 'Google API Key', pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
];
const secretAssignment = /^\s*([A-Za-z0-9_.-]*(?:client[-_.]?secret|secret[-_.]?key|jwt[-_.]?secret|mysql[-_.]?(?:root[-_.]?)?password|datasource[-_.]?password|mail[-_.]?password|db[-_.]?password|admin[-_.]?password)[A-Za-z0-9_.-]*)\s*[:=]\s*["']?([^"'#\s]*)/i;

function isTemplate(path) {
  return allowedSecretTemplates.some((pattern) => pattern.test(path));
}

function isAllowedPublicCertificate(path) {
  return allowedPublicCertificates.has(path);
}

function isSafeExampleValue(value) {
  return !value
    || value.startsWith('${')
    || value.startsWith('<')
    || value === '...'
    || /^(?:YOUR_|CHANGE_ME|EXAMPLE_|TEST_|CI_TEST|LOCAL_)/i.test(value)
    || /^(?:test|local|demo|herfree|root)[-_]/i.test(value)
    || /(?:_DEV_|_PROD_|example|placeholder|dummy|test-only|ci-test|strong_password)/i.test(value);
}

function fileContent(path) {
  if (mode === 'staged') {
    return git(['show', `:${path}`], { maxBuffer: 5 * 1024 * 1024 });
  }
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const findings = [];
for (const path of files) {
  if (!isTemplate(path) && !isAllowedPublicCertificate(path)) {
    for (const rule of forbiddenPaths) {
      if (rule.pattern.test(path)) findings.push(`${path}: ${rule.name}`);
    }
  }

  let content;
  try {
    content = fileContent(path);
  } catch {
    continue;
  }
  if (content.includes('\0') || content.length > 5 * 1024 * 1024) continue;

  // 검사 규칙 자체의 토큰 예시는 자기 자신에 대한 오탐이므로 내용 검사를 생략한다.
  if (path === 'scripts/check-secrets.mjs') continue;

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of valueRules) {
      if (rule.pattern.test(line)) findings.push(`${path}:${index + 1}: ${rule.name}`);
    }
    const assignment = /\.(?:ya?ml|properties|env|md|txt|example)$/i.test(path)
      ? line.match(secretAssignment)
      : null;
    if (assignment && !isSafeExampleValue(assignment[2])) {
      findings.push(`${path}:${index + 1}: ${assignment[1]}에 실제 값 의심`);
    }
  });
}

if (findings.length > 0) {
  console.error('\n[비밀정보 검사 실패] 값은 출력하지 않습니다.');
  for (const finding of [...new Set(findings)]) console.error(`- ${finding}`);
  console.error('- 실제 비밀값은 로컬 제외 파일이나 AWS Secrets Manager로 옮기세요.\n');
  process.exit(1);
}

console.log(`[비밀정보 검사 통과] ${mode} 파일 ${files.length}개`);
