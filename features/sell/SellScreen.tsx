// features/sell/SellScreen.tsx
import { useRouter } from 'expo-router';
import { SellWizard } from './components/SellWizard';
import type { SellFormData } from './types';

// Set to true untuk enable dev mode (bypass all validations)
const DEV_MODE = true;

export function SellScreen() {
  const router = useRouter();

  const handlePublish = async (formData: SellFormData): Promise<string> => {
    console.log('Publishing product:', formData);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockProductId = 'prod_' + Date.now().toString(36);
    return mockProductId;
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  return (
    <SellWizard 
      onPublish={handlePublish}
      onViewProduct={handleViewProduct}
      isDevMode={DEV_MODE}
    />
  );
}
