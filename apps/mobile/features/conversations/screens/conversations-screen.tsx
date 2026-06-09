import {
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  interpolateColor,
  Extrapolation,
} from "react-native-reanimated";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MagnifyingGlassIcon,
  FunnelSimpleIcon,
  CaretRightIcon,
} from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { InputField } from "@/components/ui/input";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from "@/features/dashboard/components/location-picker-bottom-sheet";
import { useLocations } from "@/features/dashboard/hooks/use-locations";
import { clearTokens } from "@/features/auth/store/auth.store";
import { queryClient } from "@/lib/query-client";
import { useConversations } from "../hooks/use-conversations";
import { useConversationsSocket } from "../hooks/use-conversations-socket";
import { ConversationCard } from "../components/conversation-card";
import type { Conversation } from "../types";
import type { Location } from "@/features/dashboard/types";

const COLLAPSE_THRESHOLD = 80;

function ConversationListHeader({
  isLoading,
  isError,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <>
      {isLoading && (
        <Box className="items-center py-12">
          <Spinner size={32} />
        </Box>
      )}
      {isError && (
        <Box className="items-center py-8" style={{ gap: 12 }}>
          <Text className="text-red-500 text-sm text-center">
            Failed to load conversations
          </Text>
          <Pressable onPress={onRetry}>
            <Text className="text-sm text-foreground underline">Try again</Text>
          </Pressable>
        </Box>
      )}
    </>
  );
}

function ConversationListFooter({
  isFetchingNextPage,
}: {
  isFetchingNextPage: boolean;
}) {
  return isFetchingNextPage ? (
    <Box className="items-center py-4">
      <Spinner size={20} />
    </Box>
  ) : null;
}

export default function ConversationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColor();

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const locationSheetRef = useRef<LocationPickerBottomSheetRef>(null);
  const { data: locations = [] } = useLocations();

  const [search, setSearch] = useState("");

  const [headerHeight, setHeaderHeight] = useState(164);

  const scrollY = useSharedValue(0);

  useConversationsSocket();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useConversations();

  useEffect(() => {
    if (isError && (error as Error)?.message === 'UNAUTHORIZED') {
      clearTokens().then(() => {
        queryClient.clear();
        router.replace('/auth');
      });
    }
  }, [isError, error]);

  const allConversations = Array.from(
    new Map(
      (data?.pages.flatMap((p) => p.data) ?? []).map((c) => [c.id, c]),
    ).values(),
  );

  const handlePress = useCallback(
    (id: string) => router.push(`/conversation/${id}`),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationCard item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const filterRowAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD * 0.6],
      [56, 0],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD * 0.4],
      [1, 0],
      Extrapolation.CLAMP,
    );
    const marginBottom = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD * 0.6],
      [12, 0],
      Extrapolation.CLAMP,
    );
    return { height, opacity, overflow: "hidden", marginBottom };
  });

  const compactControlsAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [COLLAPSE_THRESHOLD * 0.5, COLLAPSE_THRESHOLD * 0.8],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const searchAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [COLLAPSE_THRESHOLD * 0.3, COLLAPSE_THRESHOLD],
      [56, 36],
      Extrapolation.CLAMP,
    );
    return { height };
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

  const titleSpacingStyle = useAnimatedStyle(() => {
    const marginBottom = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [16, 8],
      Extrapolation.CLAMP,
    );
    return { marginBottom };
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
        {/* Title row with compact controls */}
        <Animated.View style={titleSpacingStyle}>
        <HStack
          className="items-center justify-between"
        >
          <Animated.Text
            className="font-extralight text-foreground tracking-tighter"
            style={titleAnimatedStyle}
          >
            View conversations
          </Animated.Text>

          {/* Compact controls - appear on scroll */}
          <Animated.View style={compactControlsAnimatedStyle}>
            <HStack className="items-center" style={{ gap: 8 }}>
              <Pressable onPress={() => locationSheetRef.current?.open()}>
                <HStack
                  className={`items-center px-3 py-1.5 rounded-full ${selectedLocation ? "bg-foreground" : "bg-white"}`}
                  style={{ gap: 4 }}
                >
                  <Text
                    className={`text-xs ${selectedLocation ? "text-background" : "text-foreground"}`}
                  >
                    {selectedLocation?.name ?? "Location"}
                  </Text>
                  <CaretRightIcon
                    size={12}
                    color={
                      selectedLocation ? colors.background : colors.foreground
                    }
                  />
                </HStack>
              </Pressable>
              <Pressable>
                <Box className="w-8 h-8 rounded-full bg-white items-center justify-center">
                  <FunnelSimpleIcon size={16} color={colors.foreground} />
                </Box>
              </Pressable>
            </HStack>
          </Animated.View>
        </HStack>
        </Animated.View>

        {/* Expanded Filter Row - collapses on scroll */}
        <Animated.View style={filterRowAnimatedStyle}>
          <HStack className="items-center justify-between" style={{ gap: 16 }}>
            <Pressable onPress={() => locationSheetRef.current?.open()}>
              <HStack
                className={`items-center px-6 py-4 rounded-full ${selectedLocation ? "bg-foreground" : "bg-white"}`}
                style={{ gap: 12 }}
              >
                <Text
                  className={`text-xs ${selectedLocation ? "text-background" : "text-foreground"}`}
                >
                  {selectedLocation?.name ?? "Select a location"}
                </Text>
                <CaretRightIcon
                  size={16}
                  color={
                    selectedLocation ? colors.background : colors.foreground
                  }
                />
              </HStack>
            </Pressable>

            <Pressable>
              <HStack
                className="items-center px-6 py-4 rounded-full bg-white"
                style={{ gap: 12 }}
              >
                <FunnelSimpleIcon size={20} color="#FB2C36" />
                <Text className="text-xs text-foreground">Filters</Text>
              </HStack>
            </Pressable>
          </HStack>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={searchAnimatedStyle}>
          <Box
            className="bg-foreground/5 rounded-full flex-row items-center h-full"
            style={{ paddingHorizontal: 16 }}
          >
            <MagnifyingGlassIcon size={18} color={colors.foregroundMuted} />
            <InputField
              placeholder="Search"
              className="pl-3 text-base flex-1"
              style={{ height: "100%" }}
              value={search}
              onChangeText={setSearch}
            />
          </Box>
        </Animated.View>
      </Animated.View>

      <Animated.FlatList<Conversation>
        data={allConversations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: headerHeight,
          paddingBottom: 32,
        }}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <ConversationListHeader isLoading={isLoading} isError={isError} onRetry={refetch} />
        }
        ListFooterComponent={
          <ConversationListFooter isFetchingNextPage={isFetchingNextPage} />
        }
      />

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
