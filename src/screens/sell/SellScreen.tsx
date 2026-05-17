import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function SellScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-white"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-xl font-bold text-gray-800">Jual Produk</Text>
      <Text className="text-gray-500 mt-2">Form jual produk akan muncul di sini</Text>
    </View>
  );
}
