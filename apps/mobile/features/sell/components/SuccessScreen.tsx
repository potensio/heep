import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckRead } from "@solar-icons/react-native/Linear";
import { Button } from "@/components/ui/Button";
import type { SuccessScreenProps } from "../types";

interface ExtendedSuccessScreenProps extends SuccessScreenProps {
  onBackToHome?: () => void;
}

export function SuccessScreen({
  productId,
  onViewProduct,
  onBackToHome,
}: ExtendedSuccessScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-accent" style={{ paddingTop: insets.top }}>
      {/* Main Content - Centered */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Success Icon - No background */}
        <View className="mb-6">
          <CheckRead size={80} color="#F97316" />
        </View>

        {/* Heading - Larger font, no emoji */}
        <Text className="text-5xl font-heading font-medium leading-snug text-center">
          Yeay!
        </Text>
        <Text className="text-5xl font-heading font-medium leading-snug text-center mb-3">
          Produkmu udah tayang!
        </Text>

        {/* Subtext */}
        <Text className="text-center text-xl px-4">
          Bagikan ke temanmu untuk menarik perhatian, siapa tau laku!
        </Text>
      </View>

      {/* Action Buttons - Bottom */}
      <View
        className="px-5 pt-4 pb-6 gap-3"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <Button
          onPress={onViewProduct}
          fullWidth
        >
          Lihat produk
        </Button>

        <TouchableOpacity
          onPress={onBackToHome}
          className="flex-row items-center justify-center py-4 rounded-2xl"
        >
          <Text className="font-medium text-lg">Kembali ke beranda</Text>
        </TouchableOpacity>
      </View>

      {/* Product ID hint */}
      <Text className="text-xs text-gray-300 text-center px-5 mb-2">
        ID: {productId.slice(0, 12)}...
      </Text>
    </View>
  );
}
