import type { PageData } from '@/domain/common/types';
import type { Product } from '@/domain/product/types';
import { request } from '@/lib/api/client';

export function fetchProducts(params: { page?: number; size?: number } = {}): Promise<PageData<Product>> {
  return request<PageData<Product>>('/api/products', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 12,
      sort: 'createdAt,desc',
    },
  });
}

export function fetchProduct(productId: number): Promise<Product> {
  return request<Product>(`/api/products/${productId}`);
}
