import { useRef, useState } from "react";
import { Pressable, ScrollView, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HouseIcon,
  CaretRightIcon,
  InfoIcon,
  ArrowsClockwiseIcon,
  ClipboardTextIcon,
  CalendarBlankIcon,
  ChatCircleIcon,
  CurrencyDollarIcon,
} from "phosphor-react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";

import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from "@/features/dashboard/components/location-picker-bottom-sheet";
import { useLocations } from "@/features/dashboard/hooks/use-locations";
import { useHomepage } from "@/features/dashboard/hooks/use-homepage";
import type { Location } from "@/features/dashboard/types";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const locationSheetRef = useRef<LocationPickerBottomSheetRef>(null);
  const { data: locations = [] } = useLocations();
  const { data: stats } = useHomepage(selectedLocation?.id);

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
          <HStack className="w-full mt-6 gap-3">
            {/* All Locations Button */}
            <Pressable onPress={() => setSelectedLocation(null)}>
              <HStack
                className={`items-center px-6 py-4 rounded-full ${!selectedLocation ? "bg-foreground" : "bg-white"}`}
                style={{ gap: 12 }}
              >
                <HouseIcon
                  size={20}
                  color={!selectedLocation ? "#fff" : "#000"}
                />
                <Text
                  className={`text-xs shrink ${!selectedLocation ? "text-background" : "text-foreground"}`}
                >
                  All Locations
                </Text>
              </HStack>
            </Pressable>

            {/* Select Location Button */}
            <Pressable onPress={() => locationSheetRef.current?.open()}>
              <HStack
                className={`items-center px-6 py-4 rounded-full ${selectedLocation ? "bg-foreground" : "bg-white"}`}
                style={{ gap: 12 }}
              >
                <Text
                  className={`text-xs shrink ${selectedLocation ? "text-background" : "text-foreground"}`}
                >
                  {selectedLocation?.name ?? "Select a location"}
                </Text>
                <CaretRightIcon
                  size={20}
                  color={selectedLocation ? "#fff" : "#000"}
                />
              </HStack>
            </Pressable>
          </HStack>

          {/* Greeting Text */}
          <Text className="mt-6 max-w-xs text-2xl self-start tracking-[-1] font-light">
            Hi — Heep has handled {stats?.messages_count ?? 0} messages for you.
          </Text>

          {/* Limited Features Toast */}
          <ImageBackground
            source={require("@/public/banner-bg.webp")}
            style={{
              width: "100%",
              marginTop: 24,
              borderRadius: 32,
              overflow: "hidden",
            }}
            resizeMode="cover"
          >
            <HStack
              className="px-4 py-3 w-full rounded-[32px]"
              style={{ gap: 16 }}
            >
              <Box className="self-center">
                <InfoIcon size={24} color="#eeff8c" weight="regular" />
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
          </ImageBackground>

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
                      <CalendarBlankIcon size={16} />
                      <Text numberOfLines={1} className="text-xs ml-2 shrink">
                        Bookings confirmed today
                      </Text>
                    </HStack>
                    <HStack className="mt-5 mx-3 items-end" style={{ gap: 10 }}>
                      <Text className="text-7xl font-normal leading-tight tracking-tight">
                        {stats?.booking_confirmed ?? 0}
                      </Text>
                      <Text className="text-xs mb-4 shrink">
                        Bookings confirmed
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Conversations Stat */}
                  <VStack className="mt-6 px-4">
                    <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                      <ChatCircleIcon size={16} />
                      <Text numberOfLines={1} className="text-xs ml-2 shrink">
                        Conversation handled
                      </Text>
                    </HStack>
                    <HStack className="mt-5 mx-3 items-end" style={{ gap: 10 }}>
                      <Text className="text-7xl font-normal leading-tight tracking-tight">
                        {stats?.chat_responded ?? 0}
                      </Text>
                      <Text className="text-xs mb-4 shrink">
                        Chats responded
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Revenue Stat */}
                  <VStack className="mt-6 mb-8 px-4">
                    <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                      <CurrencyDollarIcon size={16} />
                      <Text numberOfLines={1} className="text-xs ml-2 shrink">
                        Revenue with heep
                      </Text>
                    </HStack>
                    <HStack className="mt-5 mx-3 items-end" style={{ gap: 10 }}>
                      <Text className="text-[44px] font-normal tracking-tight">
                        {stats?.revenue_with_heep ?? 0}€
                      </Text>
                      <Text className="text-xs mb-1 shrink">Last 30 days</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </ImageBackground>
            </VStack>

            {/* Right Column: Monthly Usage & Requests Cards */}
            <VStack className="min-w-full" style={{ gap: 12 }}>
              {/* Monthly Usage Card */}
              <VStack className="border-2 border-border/30 rounded-[32px] p-6">
                {/* Header */}
                <HStack className="items-center" style={{ gap: 10 }}>
                  <HStack className="p-3 rounded-full border border-border">
                    <ArrowsClockwiseIcon size={20} />
                  </HStack>
                  <Text className="text-xl tracking-tighter shrink">
                    Monthly Usage
                  </Text>
                </HStack>

                {/* Credits */}
                <HStack className="mt-5 items-end" style={{ gap: 10 }}>
                  <Text className="text-7xl font-normal leading-tight tracking-tight">
                    {stats?.credit ?? 0}
                  </Text>
                  <Text className="text-xs mb-4 shrink">Credits remaining</Text>
                </HStack>

                {/* Daily Usage */}
                <VStack className="mt-6">
                  <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                    <ChatCircleIcon size={16} />
                    <Text numberOfLines={1} className="text-xs ml-2 shrink">
                      Avg daily usage
                    </Text>
                  </HStack>
                  <HStack className="mt-5 items-end" style={{ gap: 10 }}>
                    <Text className="text-5xl font-normal leading-tight tracking-tight">
                      {stats?.avg_daily_usage ?? 0}
                    </Text>
                    <Text className="text-xs mb-3 shrink">messages/day</Text>
                  </HStack>
                </VStack>
              </VStack>

              {/* Requests Card */}
              <VStack className="border-2 border-border/30 rounded-[32px] p-6">
                {/* Header */}
                <HStack className="items-center" style={{ gap: 10 }}>
                  <HStack
                    className="p-3 rounded-full border"
                    style={{ borderColor: "rgb(153, 153, 153)" }}
                  >
                    <ClipboardTextIcon size={20} />
                  </HStack>
                  <Text className="text-xl shrink">Requests</Text>
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
                    <Text className="text-xs font-semibold shrink">
                      {stats?.unfulfilled_request ?? 0}
                    </Text>
                    <Text className="text-xs shrink">Unfulfilled Requests</Text>
                  </HStack>
                  <HStack
                    className="pl-3 pr-4 py-2.5 rounded-full items-center self-start"
                    style={{
                      gap: 8,
                      backgroundColor: "rgba(118, 118, 128, 0.12)",
                    }}
                  >
                    <Text className="text-xs font-semibold shrink">
                      {stats?.most_requested_time ?? "-"}
                    </Text>
                    <Text className="text-xs shrink">Most Requested Time</Text>
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
        locations={locations}
        selectedLocation={selectedLocation}
        onSelect={setSelectedLocation}
        onClear={() => setSelectedLocation(null)}
      />
    </Box>
  );
}
