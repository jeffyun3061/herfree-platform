import { request } from '@/lib/api/client';
import type { PageData } from '@/domain/common/types';
import type { Post } from '@/domain/post/types';

export function fetchAdminConcerns(answered = false, page = 0) {
  return request<PageData<Post>>(`/api/admin/concerns?answered=${answered}&page=${page}`);
}
