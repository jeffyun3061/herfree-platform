import type { Post } from '@/domain/post/types';

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateKey(iso: string): string {
  return toLocalDateKey(new Date(iso));
}

export function getRecordDateKeys(posts: Post[]): Set<string> {
  return new Set(posts.map((post) => toDateKey(post.createdAt)));
}

export function countThisWeekRecords(posts: Post[]): number {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  return posts.filter((post) => {
    const created = new Date(post.createdAt);
    return created >= weekAgo;
  }).length;
}

export function getWeekDateKeys(weekOffset = 0): string[] {
  const today = new Date();
  const day = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - day + weekOffset * 7);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return toLocalDateKey(date);
  });
}

export function countRecordsInWeek(posts: Post[], weekOffset = 0): number {
  const recordDays = getRecordDateKeys(posts);
  return getWeekDateKeys(weekOffset).filter((key) => recordDays.has(key)).length;
}

export function computeWeekRecordRate(posts: Post[], weekOffset = 0): number {
  const daysWithRecords = countRecordsInWeek(posts, weekOffset);
  return Math.round((daysWithRecords / 7) * 100);
}

export function computeRecordStreak(posts: Post[]): number {
  const days = getRecordDateKeys(posts);
  if (days.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (days.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
