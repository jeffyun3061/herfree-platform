'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type PageHeaderState = {
  title: string;
  showBack?: boolean;
  backHref?: string;
};

type PageHeaderContextValue = {
  header: PageHeaderState | null;
  setHeader: (header: PageHeaderState | null) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<PageHeaderState | null>(null);

  const setHeader = useCallback((next: PageHeaderState | null) => {
    setHeaderState((prev) => {
      if (prev === null && next === null) return prev;
      if (
        prev !== null &&
        next !== null &&
        prev.title === next.title &&
        prev.showBack === next.showBack &&
        prev.backHref === next.backHref
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ header, setHeader }), [header, setHeader]);

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeaderContext() {
  return useContext(PageHeaderContext);
}
