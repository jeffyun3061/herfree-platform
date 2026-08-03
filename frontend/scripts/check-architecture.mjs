import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcRoot = fileURLToPath(new URL('../src/', import.meta.url));
const violations = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function check(relativePath, source, pattern, message) {
  if (pattern.test(source)) violations.push(`${relativePath}: ${message}`);
}

for (const file of await walk(srcRoot)) {
  const relativePath = relative(srcRoot, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');

  if (relativePath.startsWith('domain/')) {
    check(relativePath, source, /from ['"](?:react|next\/)/, 'domain must remain framework-free');
  }
  if (relativePath.startsWith('components/ui/')) {
    check(relativePath, source, /from ['"]@\/features\//, 'shared UI cannot import a feature');
  }
  if (relativePath.startsWith('app/') && !relativePath.startsWith('app/api/')) {
    check(relativePath, source, /\bfetch\s*\(/, 'route pages must use feature hooks/API modules');
  }
  if (relativePath.startsWith('features/')) {
    const owner = relativePath.split('/')[1];
    const crossFeature = new RegExp(`from ['"]@/features/(?!${owner}(?:/|['"]))`);
    check(relativePath, source, crossFeature, 'features may not import another feature internals');
  }
}

if (violations.length > 0) {
  console.error('Architecture boundary violations:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('[architecture] dependency boundaries passed');
