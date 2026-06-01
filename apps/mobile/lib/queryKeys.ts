import type { SearchParams } from '@/lib/api';

export const queryKeys = {
  feed: () => ['feed'] as const,
  search: (params: SearchParams) => ['search', params] as const,
  product: (id: string) => ['product', id] as const,
  seller: (id: string) => ['seller', id] as const,
  sellerProducts: (id: string) => ['sellerProducts', id] as const,
  savedProducts: () => ['savedProducts'] as const,
  isSaved: (productId: string) => ['isSaved', productId] as const,
};
