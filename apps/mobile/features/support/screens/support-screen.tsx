import { useCallback, useRef, useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  interpolateColor,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlusIcon } from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { SupportTicketCard } from "../components/support-ticket-card";
import {
  CreateTicketBottomSheet,
  CreateTicketBottomSheetRef,
} from "../components/create-ticket-bottom-sheet";
import { MOCK_TICKETS } from "../data/mock-tickets";
import type { SupportTicket } from "../types";
import type { Location } from "@/features/dashboard/types";

const COLLAPSE_THRESHOLD = 80;

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();

  // Mock state — replaced by a backend-backed query hook later.
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const createSheetRef = useRef<CreateTicketBottomSheetRef>(null);

  const [headerHeight, setHeaderHeight] = useState(60);
  const scrollY = useSharedValue(0);

  const handlePress = useCallback((_id: string) => {
    // TODO: navigate to ticket detail once backend is wired.
  }, []);

  const handleAdd = useCallback(() => {
    createSheetRef.current?.open();
  }, []);

  const handleCreate = useCallback(
    ({ location, description }: { location: Location; description: string }) => {
      const now = new Date().toISOString();
      const newTicket: SupportTicket = {
        id: now,
        contact: { name: location.name },
        status: "open",
        last_message: { text: description, sent_at: now },
      };
      setTickets((prev) => [newTicket, ...prev]);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: SupportTicket }) => (
      <SupportTicketCard item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item: SupportTicket) => item.id, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [24, 16],
      Extrapolation.CLAMP,
    );
    const lineHeight = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [28, 20],
      Extrapolation.CLAMP,
    );
    return { fontSize, lineHeight };
  });

  const headerBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      ["transparent", "#e8ede8"],
    );
    const paddingTop = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [16, 8],
      Extrapolation.CLAMP,
    );
    const paddingBottom = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [12, 6],
      Extrapolation.CLAMP,
    );
    return { backgroundColor, paddingTop, paddingBottom };
  });

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Sticky Header */}
      <Animated.View
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={[
          {
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            zIndex: 10,
          },
          headerBackgroundStyle,
        ]}
      >
        {/* Title row with add button */}
        <HStack className="items-center justify-between">
          <Animated.Text
            className="font-extralight text-foreground tracking-tighter"
            style={titleAnimatedStyle}
          >
            Support Tickets
          </Animated.Text>

          <Pressable onPress={handleAdd}>
            <Box className="w-9 h-9 rounded-full bg-foreground items-center justify-center">
              <PlusIcon size={18} color={colors.background} />
            </Box>
          </Pressable>
        </HStack>
      </Animated.View>

      <Animated.FlatList<SupportTicket>
        data={tickets}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: headerHeight,
          paddingBottom: 32,
        }}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        ListEmptyComponent={
          <Box className="items-center py-12">
            <Text style={{ color: colors.foregroundMuted, fontSize: 14 }}>
              No support tickets found
            </Text>
          </Box>
        }
      />

      <CreateTicketBottomSheet ref={createSheetRef} onSubmit={handleCreate} />
    </Box>
  );
}
