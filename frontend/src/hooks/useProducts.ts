'use client';

import { emptyPage } from '@/domain/common/types';
import type { Product } from '@/domain/product/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as productsApi from '@/lib/api/products';

export function useProducts(size = 12) {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => productsApi.fetchProducts({ size }),
    [size],
  );
  return { productPage: data ?? emptyPage<Product>(), isLoading, error, refetch };
}
