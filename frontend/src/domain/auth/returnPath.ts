const LOCAL_ORIGIN = 'https://herfree.invalid';

export function safeInternalReturnPath(value: string | null | undefined, fallback = '/'): string {
  if (!value
      || !value.startsWith('/')
      || value.startsWith('//')
      || value.includes('\\')
      || /[\u0000-\u001f\u007f]/.test(value)) {
    return fallback;
  }
  try {
    const parsed = new URL(value, LOCAL_ORIGIN);
    if (parsed.origin !== LOCAL_ORIGIN) return fallback;
    const result = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (result.startsWith('/login') || result.startsWith('/signup')) return fallback;
    return result;
  } catch {
    return fallback;
  }
}
