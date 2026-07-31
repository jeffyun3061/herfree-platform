import type { ReactNode } from 'react';

export type HeaderVariant = 'root' | 'subpage' | 'auth' | 'admin';

/**
 * A page declares header intent, while AppHeader owns the responsive markup.
 * Keeping this contract small prevents feature pages from depending on shell
 * implementation details such as sticky positioning or breakpoints.
 */
export type HeaderSpec = {
  variant: HeaderVariant;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightSlot?: ReactNode;
};
