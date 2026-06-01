import type { ProductListItem } from '@/lib/api';
import type { Product } from '@/lib/types';

export function normalizeProduct(item: ProductListItem): Product {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.photos[0]?.url ?? '',
    seller: item.seller.name ?? '',
    sellerId: item.seller.id,
    category: item.category,
  };
}
