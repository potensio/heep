// features/sell/context/SellFormContext.tsx
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { SellFormData } from '../types';

const initialFormData: SellFormData = {
  photos: [],
  category: '',
  subcategory: '',
  attributes: {},
  name: '',
  price: 0,
  description: '',
  location: null,
};

interface SellFormContextValue {
  formData: SellFormData;
  updateFormData: (updates: Partial<SellFormData>) => void;
  resetForm: () => void;
  hasData: boolean;
  isSubmitting: boolean;
  setSubmitting: (value: boolean) => void;
  publishedProductId: string | null;
  setPublishedProductId: (id: string | null) => void;
}

const SellFormContext = createContext<SellFormContextValue | undefined>(undefined);

export function SellFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<SellFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedProductId, setPublishedProductId] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<SellFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setIsSubmitting(false);
    setPublishedProductId(null);
  }, []);

  const hasData = useMemo(
    () =>
      formData.photos.length > 0 ||
      formData.category !== '' ||
      formData.subcategory !== '' ||
      formData.name !== '' ||
      formData.price !== 0 ||
      formData.description !== '' ||
      formData.location !== null,
    [formData],
  );

  const setSubmitting = useCallback((value: boolean) => {
    setIsSubmitting(value);
  }, []);

  return (
    <SellFormContext.Provider
      value={{
        formData,
        updateFormData,
        resetForm,
        hasData,
        isSubmitting,
        setSubmitting,
        publishedProductId,
        setPublishedProductId,
      }}
    >
      {children}
    </SellFormContext.Provider>
  );
}

export function useSellFormContext() {
  const context = useContext(SellFormContext);
  if (!context) {
    throw new Error('useSellFormContext must be used within a SellFormProvider');
  }
  return context;
}
