import { Image } from "expo-image";
import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-between py-8 p-4">
        {/* Welcome Content */}
        <View className="pt-8">
          {/* Logo */}
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 56, height: 56 }}
            contentFit="cover"
          />
          <Text className="text-xl font-semibold mt-6">
            Welcome to Swiss-belhotel
          </Text>
          <Text className="text-[#8A8A8A] mt-2 leading-relaxed">
            Choose whether you want to book a stay or access your member loyalty
            benefits.
          </Text>
        </View>

        {/* Cards */}
        <View className="flex-row gap-4">
          {/* Hotel Booking Card */}
          <View className="flex-1 gap-[9px]">
            <ImageBackground
              source={require("@/assets/images/hotel-booking-bg.png")}
              style={{ width: "100%", height: 121 }}
              imageStyle={{ borderRadius: 8 }}
              resizeMode="cover"
            />
            <View className="mt-2.5">
              <Text className="font-medium">Hotel Booking</Text>
              <Text className="text-sm text-[#8A8A8A] mt-2">
                Browse rooms, explore facilities, and book your stay.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-[#F04E30] rounded-lg px-[10px] py-[6px] self-start"
              onPress={() => router.push("/booking-webview")}
            >
              <Text className="text-white font-medium py-1 px-1.5">
                Booking Now
              </Text>
            </TouchableOpacity>
          </View>

          {/* Member Loyalty Card */}
          <View className="flex-1 gap-[9px]">
            <ImageBackground
              source={require("@/assets/images/member-loyalty-bg.png")}
              style={{ width: "100%", height: 121 }}
              imageStyle={{ borderRadius: 8 }}
              resizeMode="cover"
            />
            <View className="mt-2.5">
              <Text className="font-medium">Member Loyalty</Text>
              <Text className="text-sm text-[#8A8A8A] mt-2">
                View your points, rewards, and exclusive member benefits.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-[#F04E30] rounded-lg px-[10px] py-[6px] self-start"
              onPress={() => router.push("/member-loyalty-webview")}
            >
              <Text className="text-white font-medium py-1 px-1.5">
                Check Reward
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center mt-[60px] gap-2">
          <Image
            source={require("@/assets/images/footer-logo.png")}
            style={{ width: 50, height: 38.56 }}
            contentFit="cover"
          />
          <Text className="text-[#1F1F1F] text-xs text-center leading-[19px]">
            © 2025 All Rights Reserved | Swiss-Belhotel Internationa
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
