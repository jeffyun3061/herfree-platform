import type { Product } from '@/domain/product/types';
import { request } from '@/lib/api/client';
import type { ProductCreateInput, ProductUpdateInput } from './types';

export function createProduct(input: ProductCreateInput): Promise<Product> {
  return request<Product>('/api/admin/products', { method: 'POST', body: input });
}

export function updateProduct(productId: number, input: ProductUpdateInput): Promise<Product> {
  return request<Product>(`/api/admin/products/${productId}`, { method: 'PATCH', body: input });
}

export function setProductVisibility(productId: number, isVisible: boolean): Promise<Product> {
  return request<Product>(`/api/admin/products/${productId}/visibility`, {
    method: 'PATCH',
    body: { isVisible },
  });
}

export function deleteProduct(productId: number): Promise<void> {
  return request<void>(`/api/admin/products/${productId}`, { method: 'DELETE' });
}
