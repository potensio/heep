// features/sell/SellScreen.tsx
import { useRouter } from 'expo-router';
import { SellWizard } from './components/SellWizard';
import type { SellFormData } from './types';

export function SellScreen() {
  const router = useRouter();

  const handlePublish = async (formData: SellFormData): Promise<string> => {
    // TODO: Implement actual API call to publish product
    // For now, simulate API delay and return mock product ID
    console.log('Publishing product:', formData);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock product ID
    const mockProductId = 'prod_' + Date.now().toString(36);
    
    return mockProductId;
  };

  const handleViewProduct = (productId: string) => {
    // Navigate to product detail screen
    router.push(`/product/${productId}`);
  };

  return (
    <SellWizard 
      onPublish={handlePublish}
      onViewProduct={handleViewProduct}
    />
  );
}
