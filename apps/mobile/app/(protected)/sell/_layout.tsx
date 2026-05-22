import { Stack, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, Alert, BackHandler, StatusBar } from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { SellFormProvider, useSellFormContext } from '@/features/sell/context/SellFormContext';
import { StepIndicator } from '@/features/sell/components/StepIndicator';
import type { WizardStep } from '@/features/sell/types';

const routeToStep: Record<string, WizardStep> = {
  foto: 1,
  kategori: 2,
  info: 3,
  review: 4,
};

function SellLayoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { hasData, resetForm } = useSellFormContext();

  // Derive current step from route
  const currentRoute = pathname.split('/').pop() || 'foto';
  const currentStep = routeToStep[currentRoute] ?? 1;

  // Check if on success screen (no stepper needed)
  const isSuccessScreen = currentRoute === 'success';

  // Handle hardware back button on first step
  useEffect(() => {
    const backAction = () => {
      if (currentStep === 1) {
        if (hasData) {
          Alert.alert(
            'Batalkan?',
            'Yakin ingin membatalkan? Data yang sudah diisi akan hilang.',
            [
              { text: 'Tidak', style: 'cancel' },
              {
                text: 'Ya, batalkan',
                style: 'destructive',
                onPress: () => {
                  resetForm();
                  router.replace('/(tabs)');
                },
              },
            ]
          );
          return true; // Prevent default back behavior
        }
        // Let default back behavior close the wizard
        return false;
      }
      // For other steps, let default back behavior navigate
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [currentStep, hasData, resetForm, router]);

  const handleClose = () => {
    if (hasData) {
      Alert.alert(
        'Batalkan?',
        'Yakin ingin membatalkan? Data yang sudah diisi akan hilang.',
        [
          { text: 'Tidak', style: 'cancel' },
          {
            text: 'Ya, batalkan',
            style: 'destructive',
            onPress: () => {
              resetForm();
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: isSuccessScreen ? 0 : insets.top }}>
      {/* Status bar - matches success screen background */}
      {isSuccessScreen && (
        <StatusBar barStyle="dark-content" backgroundColor="#F9F906" />
      )}

      {/* Header with Step Indicator and Close Button - hidden on success screen */}
      {!isSuccessScreen && (
        <View className="relative">
          <StepIndicator
            currentStep={currentStep}
            stepLabels={['Foto', 'Kategori', 'Info', 'Review']}
          />

          {/* Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            className="absolute right-4 top-3 z-10"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#666666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Step Content */}
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

export default function SellLayout() {
  return (
    <SellFormProvider>
      <SellLayoutContent />
    </SellFormProvider>
  );
}
