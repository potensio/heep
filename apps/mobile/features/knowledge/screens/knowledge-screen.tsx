import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable } from "react-native";
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
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLocations } from "@/features/dashboard/hooks/use-locations";
import type { Location } from "@/features/dashboard/types";
import { KnowledgeCard } from "../components/knowledge-card";
import {
  CreateKnowledgeBottomSheet,
  CreateKnowledgeBottomSheetRef,
} from "../components/create-knowledge-bottom-sheet";
import {
  KnowledgeDetailBottomSheet,
  KnowledgeDetailBottomSheetRef,
} from "../components/knowledge-detail-bottom-sheet";
import {
  useCreateMemory,
  useDeleteMemory,
  useKnowledge,
} from "../hooks/use-knowledge";
import type { KnowledgeEntry } from "../types";

const COLLAPSE_THRESHOLD = 80;

export default function KnowledgeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();

  const { data: entries = [], isLoading } = useKnowledge();
  const { data: locations = [] } = useLocations();
  const createMemory = useCreateMemory();
  const deleteMemory = useDeleteMemory();

  // Memories now carry a restaurant_id; map it to a readable name for the card.
  const restaurantNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of locations) if (l.name) map.set(l.id, l.name);
    return map;
  }, [locations]);

  const createSheetRef = useRef<CreateKnowledgeBottomSheetRef>(null);
  const detailSheetRef = useRef<KnowledgeDetailBottomSheetRef>(null);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(
    null,
  );

  const [headerHeight, setHeaderHeight] = useState(60);
  const scrollY = useSharedValue(0);

  const handlePress = useCallback((item: KnowledgeEntry) => {
    setSelectedEntry(item);
    detailSheetRef.current?.open();
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      detailSheetRef.current?.close();
      Alert.alert(
        "Delete knowledge?",
        "This removes it from the AI's memory. This can't be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () =>
              deleteMemory.mutate(id, {
                onError: () =>
                  Toast.show({
                    type: "error",
                    text1: "Failed to delete. Try again.",
                  }),
              }),
          },
        ],
      );
    },
    [deleteMemory],
  );

  const handleAdd = useCallback(() => {
    createSheetRef.current?.open();
  }, []);

  const handleCreate = useCallback(
    ({ location, text }: { location: Location; text: string }) => {
      createMemory.mutate(
        { restaurantId: location.id, text },
        {
          onSuccess: () => Toast.show({ type: "success", text1: "Added" }),
          onError: () =>
            Toast.show({ type: "error", text1: "Failed to save. Try again." }),
        },
      );
    },
    [createMemory],
  );

  const renderItem = useCallback(
    ({ item }: { item: KnowledgeEntry }) => (
      <KnowledgeCard
        item={item}
        restaurantName={restaurantNames.get(item.restaurantId)}
        onPress={handlePress}
      />
    ),
    [handlePress, restaurantNames],
  );

  const keyExtractor = useCallback((item: KnowledgeEntry) => item.id, []);

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
            Knowledge
          </Animated.Text>

          <Pressable onPress={handleAdd}>
            <Box className="w-9 h-9 rounded-full bg-foreground items-center justify-center">
              <PlusIcon size={18} color={colors.background} />
            </Box>
          </Pressable>
        </HStack>
      </Animated.View>

      <Animated.FlatList<KnowledgeEntry>
        data={entries}
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
          isLoading ? (
            <Box className="items-center py-12">
              <ActivityIndicator color={colors.foregroundMuted} />
            </Box>
          ) : (
            <Box className="items-center py-12">
              <Text style={{ color: colors.foregroundMuted, fontSize: 14 }}>
                No knowledge added yet
              </Text>
            </Box>
          )
        }
      />

      <CreateKnowledgeBottomSheet ref={createSheetRef} onSubmit={handleCreate} />

      <KnowledgeDetailBottomSheet
        ref={detailSheetRef}
        entry={selectedEntry}
        restaurantName={
          selectedEntry
            ? restaurantNames.get(selectedEntry.restaurantId)
            : undefined
        }
        onDelete={handleDelete}
      />
    </Box>
  );
}
