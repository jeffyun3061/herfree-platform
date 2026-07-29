// Compatibility barrel. New feature code should import its focused module from ./admin/*.
// Existing callers can migrate incrementally without a REST/DTO contract change.
export * from './admin/dashboard';
export * from './admin/reports';
export * from './admin/moderation';
export * from './admin/contents';
export * from './admin/videos';
export * from './admin/products';
export * from './admin/notices';
export * from './admin/journal';
export * from './admin/users';
export * from './admin/types';
