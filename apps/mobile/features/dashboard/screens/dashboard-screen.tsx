import { useRef, useState } from "react";
import { Pressable, ScrollView, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  House,
  CaretRight,
  Info,
  ArrowsClockwise,
  ClipboardText,
  CalendarBlank,
  ChatCircle,
  CurrencyDollar,
} from "phosphor-react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { useTheme } from "@/context/ThemeContext";
import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from "@/features/dashboard/components/location-picker-bottom-sheet";

const LOCATIONS = ["Villa Sunset", "City Loft", "Beach House"];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const iconColor = resolvedTheme === "dark" ? "#ffffff" : "#000000";

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const locationSheetRef = useRef<LocationPickerBottomSheetRef>(null);

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, flexGrow: 1 }}
      >
        {/* Main Container */}
        <VStack className="items-center mt-6">
          {/* Logo */}
          <Box style={{ width: 110, height: 34 }} className="self-start">
            <Image
              uri="https://7cbab3b115b49c9476434817972a418e.cdn.bubble.io/cdn-cgi/image/w=,h=,f=auto,dpr=2,fit=contain/f1764007668221x929520795912023900/Heep.ai%20%282%29.png"
              width={110}
              height={34}
              contentFit="contain"
            />
          </Box>

          {/* Location Buttons Row */}
          <HStack className="w-full mt-6 gap-5">
            {/* All Locations Button */}
            <HStack
              className="items-center px-6 py-4 rounded-full bg-white"
              style={{ gap: 12 }}
            >
              <House size={20} color={iconColor} weight="regular" />
              <Text className="text-xs text-foreground">All Locations</Text>
            </HStack>

            {/* Select Location Button */}
            <Pressable onPress={() => locationSheetRef.current?.open()}>
              <HStack
                className="items-center px-6 py-4 rounded-full bg-white"
                style={{ gap: 12 }}
              >
                <Text className="text-xs text-foreground">
                  {selectedLocation ?? "Select a location"}
                </Text>
                <CaretRight size={20} color={iconColor} weight="regular" />
              </HStack>
            </Pressable>
          </HStack>

          {/* Greeting Text */}
          <Text className="mt-6 max-w-xs text-2xl self-start tracking-[-1] font-light">
            Hi — Heep has handled 461 messages for you.
          </Text>

          {/* Limited Features Toast */}
          <HStack
            className="mt-6 px-4 py-3 w-full bg-[#3c454a] rounded-[32px]"
            style={{ gap: 16 }}
          >
            <Box className="self-center">
              <Info size={24} color="yellow" weight="regular" />
            </Box>
            <VStack className="flex-1">
              <Text className="text-[17px] text-white tracking-tight">
                Limited features on mobile
              </Text>
              <Text className="text-[13px] opacity-70 mt-1 text-white/90">
                To access all features and options, open the web version
              </Text>
            </VStack>
          </HStack>

          {/* Main Content Cards Row */}
          <HStack className="mt-6 mb-6 w-full flex-wrap" style={{ gap: 12 }}>
            {/* AI Host Assistant Card */}
            <VStack
              className="overflow-hidden rounded-[32px] flex-1"
              style={{ minWidth: 0, flexGrow: 1, marginBottom: 12 }}
            >
              <ImageBackground
                source={require("@/public/card-bg-1.webp")}
                style={{ flex: 1 }}
                resizeMode="cover"
              >
                {/* Card Content */}
                <VStack className="">
                  {/* Title */}
                  <Text className="text-xl tracking-tighter pt-6 px-6">
                    Ai Host Assistant
                  </Text>

                  {/* Bookings Stat */}
                  <VStack className="mt-6 px-4">
                    <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                      <CalendarBlank
                        size={16}
                        color="#000000"
                        weight="regular"
                      />
                      <Text className="text-xs ml-2">
                        Bookings confirmed today
                      </Text>
                    </HStack>
                    <HStack className="mt-5 mx-3 items-end" style={{ gap: 10 }}>
                      <Text className="text-7xl font-normal tracking-tight">
                        12
                      </Text>
                      <Text className="text-xs mb-2">Bookings confirmed</Text>
                    </HStack>
                  </VStack>

                  {/* Conversations Stat */}
                  <VStack className="mt-6 px-4">
                    <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                      <ChatCircle size={16} color="#000000" weight="regular" />
                      <Text className="text-xs ml-2">Conversation handled</Text>
                    </HStack>
                    <HStack className="mt-5 mx-3 items-end" style={{ gap: 10 }}>
                      <Text className="text-7xl font-normal tracking-tight">
                        12
                      </Text>
                      <Text className="text-xs mb-2">Chats responded</Text>
                    </HStack>
                  </VStack>

                  {/* Revenue Stat */}
                  <VStack className="mt-6 mb-8 px-4">
                    <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                      <CurrencyDollar
                        size={16}
                        color="#000000"
                        weight="regular"
                      />
                      <Text className="text-xs ml-2">Revenue with heep</Text>
                    </HStack>
                    <HStack className="mt-5 mx-3 items-end" style={{ gap: 10 }}>
                      <Text className="text-5xl font-normal tracking-tight">
                        23.000€
                      </Text>
                      <Text className="text-xs mb-2">Last 30 days</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </ImageBackground>
            </VStack>

            {/* Right Column: Monthly Usage & Requests Cards */}
            <VStack className="min-w-full" style={{ gap: 12 }}>
              {/* Monthly Usage Card */}
              <VStack
                className="border-2 rounded-[32px] p-6"
                style={{ borderColor: "rgba(153, 153, 153, 0.3)" }}
              >
                {/* Header */}
                <HStack className="items-center" style={{ gap: 10 }}>
                  <HStack
                    className="p-3 rounded-full border"
                    style={{ borderColor: "rgb(153, 153, 153)" }}
                  >
                    <ArrowsClockwise
                      size={20}
                      color={iconColor}
                      weight="regular"
                    />
                  </HStack>
                  <Text className="text-xl tracking-tighter">
                    Monthly Usage
                  </Text>
                </HStack>

                {/* Credits */}
                <HStack className="mt-5 items-end" style={{ gap: 10 }}>
                  <Text className="text-7xl font-normal tracking-tight">
                    1000
                  </Text>
                  <Text className="text-xs mb-2">Credits remaining</Text>
                </HStack>

                {/* Daily Usage */}
                <VStack className="mt-6">
                  <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                    <ChatCircle size={16} color="#000000" weight="regular" />
                    <Text className="text-xs ml-2">Avg daily usage</Text>
                  </HStack>
                  <HStack className="mt-5 items-end" style={{ gap: 10 }}>
                    <Text className="text-5xl font-normal tracking-tight">
                      24
                    </Text>
                    <Text className="text-xs mb-2">messages/day</Text>
                  </HStack>
                </VStack>
              </VStack>

              {/* Requests Card */}
              <VStack
                className="border-2 rounded-[32px] p-6"
                style={{ borderColor: "rgba(153, 153, 153, 0.3)" }}
              >
                {/* Header */}
                <HStack className="items-center" style={{ gap: 10 }}>
                  <HStack
                    className="p-3 rounded-full border"
                    style={{ borderColor: "rgb(153, 153, 153)" }}
                  >
                    <ClipboardText
                      size={20}
                      color={iconColor}
                      weight="regular"
                    />
                  </HStack>
                  <Text className="text-xl">Requests</Text>
                </HStack>

                {/* Description */}
                <Text className="text-xs mt-4 opacity-80 tracking-tight">
                  Guests who couldn&apos;t book right away but still want a
                  table. Don&apos;t miss the chance to seat them.
                </Text>

                {/* Stats Pills */}
                <VStack className="mt-5 mb-6" style={{ gap: 16 }}>
                  <HStack
                    className="pl-3 pr-4 py-2.5 rounded-full items-center self-start"
                    style={{
                      gap: 8,
                      backgroundColor: "rgba(118, 118, 128, 0.12)",
                    }}
                  >
                    <Text className="text-xs font-semibold">22</Text>
                    <Text className="text-xs">Unfulfilled Requests</Text>
                  </HStack>
                  <HStack
                    className="pl-3 pr-4 py-2.5 rounded-full items-center self-start"
                    style={{
                      gap: 8,
                      backgroundColor: "rgba(118, 118, 128, 0.12)",
                    }}
                  >
                    <Text className="text-xs font-semibold">-</Text>
                    <Text className="text-xs">Most Requested Time</Text>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>
          </HStack>
        </VStack>
      </ScrollView>

      {/* Location Picker Sheet */}
      <LocationPickerBottomSheet
        ref={locationSheetRef}
        locations={LOCATIONS}
        selectedLocation={selectedLocation}
        onSelect={setSelectedLocation}
        onClear={() => setSelectedLocation(null)}
      />
    </Box>
  );
}
