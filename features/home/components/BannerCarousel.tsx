import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function BannerCarousel() {
  return (
    <LinearGradient
      colors={["#BBF451", "#9AE600"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="h-[150px] rounded-2xl relative"
    >
      {/* Carousel indicators */}
      <View className="absolute bottom-8 left-0 right-0 flex-row justify-center gap-1">
        <View className="w-1.5 h-1.5 bg-black rounded-full" />
        <View className="w-1.5 h-1.5 bg-black/30 rounded-full" />
        <View className="w-1.5 h-1.5 bg-black/30 rounded-full" />
      </View>
    </LinearGradient>
  );
}
