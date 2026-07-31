export type JournalCalendarCell = {
  date: string | null;
  inMonth: boolean;
};

type DateParts = { year: number; month: number; day: number };

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

function parseIsoDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  if (
    date.getFullYear() !== year
    || date.getMonth() + 1 !== month
    || date.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function toLocalDate({ year, month, day }: DateParts): Date {
  return new Date(year, month - 1, day, 12);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** KST가 API의 journal recordDate 기준이므로 브라우저 지역 시간으로 날짜를 만들지 않는다. */
export function todayJournalDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export function formatJournalMonthTitle(value: string): string {
  const date = parseIsoDate(value);
  return date ? `${date.year}년 ${date.month}월` : value;
}

export function formatJournalDateTitle(value: string): string {
  const date = parseIsoDate(value);
  return date ? `${date.year}년 ${date.month}월 ${date.day}일` : value;
}

export function formatJournalWeekday(value: string): string {
  const date = parseIsoDate(value);
  return date ? WEEKDAYS_KO[toLocalDate(date).getDay()] : '';
}

export function formatJournalDayNumber(value: string): string {
  const date = parseIsoDate(value);
  return date ? String(date.day) : value;
}

export function buildJournalMonthDays(anchorDate: string): string[] {
  const anchor = parseIsoDate(anchorDate) ?? parseIsoDate(todayJournalDate())!;
  const lastDay = new Date(anchor.year, anchor.month, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) =>
    toIsoDate(new Date(anchor.year, anchor.month - 1, index + 1, 12)),
  );
}

export function buildJournalMonthCalendar(anchorDate: string): JournalCalendarCell[] {
  const anchor = parseIsoDate(anchorDate) ?? parseIsoDate(todayJournalDate())!;
  const firstDay = new Date(anchor.year, anchor.month - 1, 1, 12).getDay();
  const days = buildJournalMonthDays(anchorDate);
  const cells: JournalCalendarCell[] = Array.from(
    { length: firstDay },
    () => ({ date: null, inMonth: false }),
  );

  cells.push(...days.map((date) => ({ date, inMonth: true })));
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, inMonth: false });
  }
  return cells;
}

export function addJournalMonths(anchorDate: string, amount: number): string {
  const anchor = parseIsoDate(anchorDate) ?? parseIsoDate(todayJournalDate())!;
  return toIsoDate(new Date(anchor.year, anchor.month - 1 + amount, 1, 12));
}
