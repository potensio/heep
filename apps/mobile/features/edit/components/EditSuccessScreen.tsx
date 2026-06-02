import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckRead } from '@solar-icons/react-native/Linear';
import { Button } from '@/components/ui/Button';

interface EditSuccessScreenProps {
  productId: string;
  onViewProduct: () => void;
  onBackToHome: () => void;
}

export function EditSuccessScreen({
  productId: _productId,
  onViewProduct,
  onBackToHome,
}: EditSuccessScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-accent" style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6">
          <CheckRead size={80} color="#F97316" />
        </View>
        <Text className="text-5xl font-heading font-medium leading-snug text-center">
          Produk berhasil
        </Text>
        <Text className="text-5xl font-heading font-medium leading-snug text-center mb-3">
          diperbarui!
        </Text>
        <Text className="text-center text-xl px-4">
          Perubahanmu sudah tersimpan dan akan segera terlihat.
        </Text>
      </View>

      <View
        className="px-5 pt-4 gap-3"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <Button onPress={onViewProduct} style={{ width: '100%' }}>
          Lihat Produk
        </Button>
        <Button variant="outline" onPress={onBackToHome} style={{ width: '100%' }}>
          Kembali ke Beranda
        </Button>
      </View>
    </View>
  );
}
