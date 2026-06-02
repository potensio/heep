import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { EditFormData, EditPhoto } from '../types';
import type { ProductDetailItem } from '@/lib/api';

function fromProduct(product: ProductDetailItem): EditFormData {
  return {
    productId: product.id,
    photos: product.photos
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(p => ({ kind: 'existing' as const, url: p.url })),
    category: product.category as EditFormData['category'],
    subcategory: product.subcategory as EditFormData['subcategory'],
    attributes: product.attributes,
    name: product.name,
    price: product.price,
    description: product.description,
    location: product.location,
  };
}

interface EditFormContextValue {
  formData: EditFormData;
  updateFormData: (updates: Partial<EditFormData>) => void;
  hasChanges: boolean;
  isSubmitting: boolean;
  setSubmitting: (value: boolean) => void;
}

const EditFormContext = createContext<EditFormContextValue | undefined>(undefined);

export function EditFormProvider({
  product,
  children,
}: {
  product: ProductDetailItem;
  children: ReactNode;
}) {
  const [formData, setFormData] = useState<EditFormData>(() => fromProduct(product));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = useCallback((updates: Partial<EditFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const original = useMemo(() => fromProduct(product), [product]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(original),
    [formData, original],
  );

  const setSubmitting = useCallback((value: boolean) => {
    setIsSubmitting(value);
  }, []);

  return (
    <EditFormContext.Provider value={{ formData, updateFormData, hasChanges, isSubmitting, setSubmitting }}>
      {children}
    </EditFormContext.Provider>
  );
}

export function useEditFormContext() {
  const context = useContext(EditFormContext);
  if (!context) throw new Error('useEditFormContext must be used within EditFormProvider');
  return context;
}
