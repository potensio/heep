import { useRef, useState, useCallback, useEffect } from "react";
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
  XIcon,
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
import { ConversationCard } from "../components/conversation-card";
import { FilterOverlay } from "../components/filters";
import {
  type ActiveFilters,
  EMPTY_FILTERS,
  countActiveFilters,
} from "../components/filters/filter-config";
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

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

  // `search` = text in the box; `committedSearch` = what actually queries.
  // Searching message content is expensive, so we only fire on submit
  // (keyboard "search"); clearing the box resets instantly.
  const [search, setSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (text.trim() === "") setCommittedSearch("");
  }, []);

  const clearSearch = useCallback(() => {
    setSearch("");
    setCommittedSearch("");
  }, []);

  const conversationQuery = {
    platform: filters.platform,
    priority: filters.priority,
    tags: filters.tags,
    isSpam: filters.isSpam,
    isArchived: filters.isArchived,
    search: committedSearch || undefined,
    restaurantId: selectedLocation?.id,
  };

  const activeFilterCount = countActiveFilters(filters);

  const [headerHeight, setHeaderHeight] = useState(164);
  const listRef = useRef<Animated.FlatList<Conversation>>(null);
  const prevTopIdRef = useRef<string | null>(null);

  const scrollY = useSharedValue(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useConversations(conversationQuery);

  useEffect(() => {
    if (isError && (error as Error)?.message === "UNAUTHORIZED") {
      clearTokens().then(() => {
        queryClient.clear();
        router.replace("/auth");
      });
    }
  }, [isError, error]);

  const allConversations = Array.from(
    new Map(
      (data?.pages.flatMap((p) => p.data) ?? []).map((c) => [c.id, c]),
    ).values(),
  );

  const topId = allConversations[0]?.id ?? null;
  if (topId && prevTopIdRef.current && topId !== prevTopIdRef.current) {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }
  prevTopIdRef.current = topId;

  const handlePress = useCallback(
    (id: string) => router.push(`/conversation/${id}`),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationCard
        item={item}
        onPress={handlePress}
        highlight={committedSearch}
      />
    ),
    [handlePress, committedSearch],
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
      [64, 0],
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
          <HStack className="items-center justify-between">
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
                <Pressable onPress={() => setFiltersOpen(true)}>
                  <Box className="w-8 h-8 rounded-full bg-white items-center justify-center">
                    <FunnelSimpleIcon size={16} color={colors.foreground} />
                    {activeFilterCount > 0 && (
                      <Box
                        className="rounded-full bg-foreground"
                        style={{
                          position: "absolute",
                          top: -2,
                          right: -2,
                          width: 10,
                          height: 10,
                        }}
                      />
                    )}
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
                className={`items-center px-6 rounded-full ${selectedLocation ? "bg-foreground" : "bg-white"}`}
                style={{ gap: 12, height: 64 }}
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

            <Pressable onPress={() => setFiltersOpen(true)}>
              <HStack
                className="items-center rounded-full bg-white/75"
                style={{ gap: 8, padding: 6 }}
              >
                <Box
                  className="rounded-full items-center justify-center"
                  style={{
                    width: 52,
                    height: 52,
                    backgroundColor: "rgba(251, 44, 54, 0.18)",
                  }}
                >
                  <FunnelSimpleIcon size={22} color="#FB2C36" />
                </Box>
                <HStack
                  className="items-center justify-center rounded-full bg-white"
                  style={{ paddingHorizontal: 28, paddingVertical: 16, gap: 6 }}
                >
                  <Text className="text-xs">Filters</Text>
                  {activeFilterCount > 0 && (
                    <Box
                      className="rounded-full bg-foreground items-center justify-center"
                      style={{ minWidth: 18, height: 18, paddingHorizontal: 5 }}
                    >
                      <Text className="text-2xs text-background">
                        {activeFilterCount}
                      </Text>
                    </Box>
                  )}
                </HStack>
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
              placeholder="Search messages"
              className="pl-5 text-base flex-1"
              style={{ height: "100%" }}
              value={search}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              onSubmitEditing={() => setCommittedSearch(search.trim())}
            />
            {search.length > 0 && (
              <Pressable onPress={clearSearch} hitSlop={10}>
                <XIcon size={18} color={colors.foregroundMuted} weight="bold" />
              </Pressable>
            )}
          </Box>
        </Animated.View>
      </Animated.View>

      <Animated.FlatList<Conversation>
        ref={listRef}
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
          <ConversationListHeader
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        }
        ListFooterComponent={
          <ConversationListFooter isFetchingNextPage={isFetchingNextPage} />
        }
        ListEmptyComponent={
          !isLoading && !isError ? (
            <Box className="items-center py-12">
              <Text style={{ color: colors.foregroundMuted, fontSize: 14 }}>
                No conversations found
              </Text>
            </Box>
          ) : null
        }
      />

      <LocationPickerBottomSheet
        ref={locationSheetRef}
        locations={locations}
        selectedLocation={selectedLocation}
        onSelect={setSelectedLocation}
        onClear={() => setSelectedLocation(null)}
      />

      <FilterOverlay
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={setFilters}
      />
    </Box>
  );
}
