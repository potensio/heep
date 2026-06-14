import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
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
import Toast from "react-native-toast-message";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLocations } from "@/features/dashboard/hooks/use-locations";
import { SupportTicketCard } from "../components/support-ticket-card";
import {
  CreateTicketBottomSheet,
  CreateTicketBottomSheetRef,
} from "../components/create-ticket-bottom-sheet";
import { useTickets } from "../hooks/use-tickets";
import { useCreateTicket } from "../hooks/use-create-ticket";
import type { SupportTicket } from "../types";
import type { Location } from "@/features/dashboard/types";

const COLLAPSE_THRESHOLD = 80;

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const router = useRouter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useTickets();
  const tickets = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  // Resolve restaurant_id -> name for the card title.
  const { data: locations = [] } = useLocations();
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of locations) m.set(l.id, l.name);
    return m;
  }, [locations]);

  const createSheetRef = useRef<CreateTicketBottomSheetRef>(null);
  const { mutate: createTicket } = useCreateTicket();

  const [headerHeight, setHeaderHeight] = useState(60);
  const scrollY = useSharedValue(0);

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/support/${id}`);
    },
    [router],
  );

  const handleAdd = useCallback(() => {
    createSheetRef.current?.open();
  }, []);

  const handleCreate = useCallback(
    ({ location, description }: { location: Location; description: string }) => {
      createTicket(
        { restaurantId: location.id, body: description },
        {
          onSuccess: () => Toast.show({ type: "success", text1: "Ticket created" }),
          onError: () =>
            Toast.show({ type: "error", text1: "Failed to create ticket. Try again." }),
        },
      );
    },
    [createTicket],
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: SupportTicket }) => (
      <SupportTicketCard
        item={item}
        restaurantName={nameById.get(item.restaurant_id) ?? item.restaurant_id}
        onPress={handlePress}
      />
    ),
    [handlePress, nameById],
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <Box className="items-center py-4">
              <Spinner size={20} />
            </Box>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <Box className="items-center py-12">
              <Spinner size={28} />
            </Box>
          ) : (
            <Box className="items-center py-12">
              <Text style={{ color: colors.foregroundMuted, fontSize: 14 }}>
                No support tickets found
              </Text>
            </Box>
          )
        }
      />

      <CreateTicketBottomSheet ref={createSheetRef} onSubmit={handleCreate} />
    </Box>
  );
}
