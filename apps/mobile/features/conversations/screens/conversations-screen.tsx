import { useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import {
  MagnifyingGlass,
  FunnelSimple,
  User,
  WhatsappLogo,
  CaretRight,
} from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { useTheme } from "@/context/ThemeContext";
import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from "@/features/dashboard/components/location-picker-bottom-sheet";

const LOCATIONS = ["Villa Sunset", "City Loft", "Beach House"];

export default function ConversationsScreen() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const iconColor = resolvedTheme === "dark" ? "#ffffff" : "#000000";

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const locationSheetRef = useRef<LocationPickerBottomSheetRef>(null);

  const filterGesture = Gesture.Tap();

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-light text-2xl mb-6 tracking-tighter">
          View conversations
        </Text>

        {/* Location Selector and Filters */}
        <HStack
          className="items-center justify-between mb-6 "
          style={{ gap: 16 }}
        >
          <Pressable onPress={() => locationSheetRef.current?.open()}>
            <HStack
              className="items-center px-6 py-4 rounded-full bg-white"
              style={{ gap: 12 }}
            >
              <Text className="text-xs text-foreground">
                {selectedLocation ?? "Select a location"}
              </Text>
              <CaretRight size={16} color={iconColor} weight="regular" />
            </HStack>
          </Pressable>

          <GestureDetector gesture={filterGesture}>
            <HStack
              className="items-center bg-white/75 rounded-full p-1"
              style={{ gap: 10 }}
            >
              <Box className="w-14 h-14 rounded-[1000px] bg-background-error/10 items-center justify-center">
                <FunnelSimple size={20} color="#FF6B6B" />
              </Box>
              <HStack
                className="items-center px-6 py-4 rounded-full bg-white"
                style={{ gap: 12 }}
              >
                <Text className="text-xs text-foreground">Filters</Text>
              </HStack>
            </HStack>
          </GestureDetector>
        </HStack>

        {/* Search Bar */}
        <Box className="mb-6">
          <Input
            variant="rounded"
            size="xl"
            className="bg-typography-900/5 border-0"
          >
            <InputSlot className="pl-0">
              <MagnifyingGlass size={18} color="#9BA5A0" weight="regular" />
            </InputSlot>
            <InputField placeholder="Search" className="pl-2" />
          </Input>
        </Box>

        {/* Conversation Card */}
        <VStack className="bg-white rounded-[32px] p-4 shadow-sm gap-3">
          <HStack className="items-center gap-2">
            <Box className="w-14 h-14">
              <Box className="w-14 h-14 rounded-full bg-[#C8D1CE] items-center justify-center">
                <User size={28} color="#8A9690" weight="light" />
              </Box>
              <Box className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border-2 border-white shadow-sm items-center justify-center">
                <WhatsappLogo size={16} color="#25D366" weight="fill" />
              </Box>
            </Box>

            <Text
              className="text-typography-900 text-2xl font-normal flex-1 tracking-tighter"
              numberOfLines={1}
            >
              Mathis Vella
            </Text>

            <Text className="text-typography-500 text-lg font-normal tracking-tighter">
              Jul 7, 2025
            </Text>
          </HStack>

          <Text
            className="text-typography-500 text-base font-normal"
            numberOfLines={3}
          >
            Hey, just wanted to follow up on our last conversation. Are you
            still interested in scheduling a meeting next week? Let me know what
            time works best for you and we can sort out the details then.
          </Text>
        </VStack>

        <Box className="h-8" />
      </ScrollView>

      <LocationPickerBottomSheet
        ref={locationSheetRef}
        locations={LOCATIONS}
        selectedLocation={selectedLocation}
        onSelect={setSelectedLocation}
      />
    </Box>
  );
}
