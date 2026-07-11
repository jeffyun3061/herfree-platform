type IconProps = { className?: string };

function MenuStrokeIcon({ children, className = 'h-[18px] w-[18px]' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#0B3B36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

export function MenuHomeIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </MenuStrokeIcon>
  );
}

export function MenuCommunityIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" />
    </MenuStrokeIcon>
  );
}

export function MenuJournalIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </MenuStrokeIcon>
  );
}

export function MenuColumnIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </MenuStrokeIcon>
  );
}

export function MenuFaqIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2 2-2 3.3" />
      <line x1="12" y1="17" x2="12" y2="17.01" />
    </MenuStrokeIcon>
  );
}

export function MenuConsultIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </MenuStrokeIcon>
  );
}

export function MenuUserIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </MenuStrokeIcon>
  );
}

export function MenuBellIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <path d="M3 11l14-6v14L3 13z" />
      <path d="M3 11v2" />
      <path d="M8 13v4a2 2 0 0 0 3 1" />
    </MenuStrokeIcon>
  );
}

export function MenuDocIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </MenuStrokeIcon>
  );
}

export function MenuShieldIcon(props: IconProps) {
  return (
    <MenuStrokeIcon className={props.className}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    </MenuStrokeIcon>
  );
}
