import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ChatScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-white"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-xl font-bold text-gray-800">Chat</Text>
      <Text className="text-gray-500 mt-2">Pesan akan muncul di sini</Text>
    </View>
  );
}
