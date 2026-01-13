import { Image } from "expo-image";
import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useNotifications } from "@/src/hooks";

const BellIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0"
      stroke="#1F1F1F"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function HomeScreen() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-between py-8 p-4">
        {/* Header with Bell Icon */}
        <View className="flex-row justify-between items-start">
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 56, height: 56 }}
            contentFit="cover"
          />
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="relative p-2"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <View className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F04F31]" />
            )}
          </TouchableOpacity>
        </View>

        {/* Welcome Content */}
        <View className="pt-4">
          <Text className="text-xl font-semibold mt-2">
            Welcome to Swiss-Belhotel International
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
                Book Now
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
                Enjoy 10% to 35% discounts of rooms and dining plus over 1000
                member-only vouchers.
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

        {/* Test Button - Remove after debugging */}
        <TouchableOpacity
          className="bg-gray-500 rounded-lg px-4 py-3 self-center"
          onPress={() => router.push("/test-webview")}
        >
          <Text className="text-white font-medium">🧪 Test Plain WebView</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="items-center mt-[60px] gap-2">
          <Image
            source={require("@/assets/images/footer-logo.png")}
            style={{ width: 50, height: 38.56 }}
            contentFit="cover"
          />
          <Text className="text-[#1F1F1F] text-xs text-center leading-[19px]">
            © 2025 All Rights Reserved | Swiss-Belhotel International
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
