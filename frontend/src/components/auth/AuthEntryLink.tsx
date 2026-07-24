'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

type AuthEntryLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'> & {
  href: string;
};

/**
 * staging Amplify Basic Auth 환경에서 /login·/signup prefetch가 401을 유발하는 경우를 피한다.
 */
export function AuthEntryLink({ href, onClick, ...props }: AuthEntryLinkProps) {
  const router = useRouter();

  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }
        event.preventDefault();
        router.push(href);
      }}
    />
  );
}
