import { Stack, useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import { View, TouchableOpacity, Alert, Text, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { EditFormProvider, useEditFormContext } from '@/features/edit/context/EditFormContext';
import { StepIndicator } from '@/features/sell/components/StepIndicator';
import { useProduct } from '@/features/product/hooks/useProduct';
import { useAuth } from '@/context/AuthContext';
import type { WizardStep } from '@/features/sell/types';

const routeToStep: Record<string, WizardStep> = {
  foto: 1,
  kategori: 2,
  info: 3,
  review: 4,
};

function EditLayoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { hasChanges } = useEditFormContext();

  const currentRoute = pathname.split('/').pop() || 'foto';
  const currentStep = routeToStep[currentRoute] ?? 1;
  const isSuccessScreen = currentRoute === 'success';

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Batalkan Perubahan?',
        'Yakin ingin membatalkan? Perubahan yang sudah dibuat akan hilang.',
        [
          { text: 'Tidak', style: 'cancel' },
          { text: 'Ya, batalkan', style: 'destructive', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: isSuccessScreen ? 0 : insets.top }}>
      {isSuccessScreen && <StatusBar barStyle="dark-content" backgroundColor="#F9F906" />}

      {!isSuccessScreen && (
        <View className="relative">
          <StepIndicator
            currentStep={currentStep}
            stepLabels={['Foto', 'Kategori', 'Info', 'Review']}
          />
          <TouchableOpacity
            onPress={handleClose}
            className="absolute right-4 top-3 z-10"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#666666" />
          </TouchableOpacity>
        </View>
      )}

      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="foto" />
        <Stack.Screen name="kategori" />
        <Stack.Screen name="info" />
        <Stack.Screen name="review" />
        <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      </Stack>
    </View>
  );
}

export default function EditLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const { user } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-400">Memuat...</Text>
      </View>
    );
  }

  if (!product || !user || product.seller.id !== user.id) {
    router.replace(`/product/${id}` as any);
    return null;
  }

  return (
    <EditFormProvider product={product}>
      <EditLayoutContent />
    </EditFormProvider>
  );
}
