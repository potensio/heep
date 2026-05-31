// features/sell/hooks/useSellForm.ts
import { useState, useCallback } from 'react';
import type { SellFormData, WizardStep } from '../types';

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

export function useSellForm() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<SellFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<SellFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => (prev < 4 ? (prev + 1) as WizardStep : prev));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      if (prev === 3) return 1 as WizardStep;
      return prev > 1 ? (prev - 1) as WizardStep : prev;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setError(null);
  }, []);

  const setSubmitting = useCallback((value: boolean) => {
    setIsSubmitting(value);
  }, []);

  const setErrorMessage = useCallback((message: string | null) => {
    setError(message);
  }, []);

  return {
    currentStep,
    formData,
    isSubmitting,
    error,
    updateFormData,
    goToStep,
    nextStep,
    prevStep,
    resetForm,
    setSubmitting,
    setErrorMessage,
  };
}
