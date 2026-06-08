import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";

export default function KnowledgeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 " style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-foreground font-sans text-2xl">
          Knowledge
        </Text>
      </View>
    </View>
  );
}
