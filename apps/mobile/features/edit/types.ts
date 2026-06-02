import type { CategoryId, SubcategoryId } from '@bantujual/categories';
import type { Location } from '@/lib/types';

export type EditPhoto =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; uri: string };

export interface EditFormData {
  productId: string;
  photos: EditPhoto[];
  category: CategoryId | '';
  subcategory: SubcategoryId | '';
  attributes: Record<string, string | number>;
  name: string;
  price: number;
  description: string;
  location: Location | null;
  listingStatus: 'draft' | 'active';
}
