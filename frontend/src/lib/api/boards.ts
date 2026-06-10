import type { Board } from '@/domain/board/types';
import { request } from '@/lib/api/client';

export function fetchBoards(): Promise<Board[]> {
  return request<Board[]>('/api/boards');
}
