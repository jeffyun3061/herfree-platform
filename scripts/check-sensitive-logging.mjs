import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('..', import.meta.url);
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'backend/src/main/java'], {
  cwd: root,
  encoding: 'utf8',
}).split(/\r?\n/).filter((file) => file.endsWith('.java'));

const sensitiveArgument = /\b(password|passwd|token|secret|clientsecret|email|memo|content|body|oauthcode|authorization|presigned|reseturl)\b/i;
const findings = [];

for (const file of files) {
  const lines = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!/\blog\.(trace|debug|info|warn|error)\s*\(/.test(line)) return;
    const withoutStrings = line.replace(/"(?:\\.|[^"\\])*"/g, '""');
    if (sensitiveArgument.test(withoutStrings)) {
      findings.push(`${file}:${index + 1}`);
    }
  });
}

if (findings.length > 0) {
  console.error('Sensitive values may be logged; review these logger calls:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(`[sensitive logging check passed] ${files.length} Java files`);
