import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretRightIcon, PlusIcon } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from "@/features/dashboard/components/location-picker-bottom-sheet";
import { useLocations } from "@/features/dashboard/hooks/use-locations";
import type { Location } from "@/features/dashboard/types";
import { KnowledgeCard } from "../components/knowledge-card";
import {
  KnowledgeEditBottomSheet,
  KnowledgeEditBottomSheetRef,
} from "../components/knowledge-edit-bottom-sheet";
import {
  useCreateMemory,
  useDeleteMemory,
  useKnowledge,
} from "../hooks/use-knowledge";
import type { KnowledgeEntry } from "../types";

export default function KnowledgeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();

  const { data: locations = [] } = useLocations();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const locationSheetRef = useRef<LocationPickerBottomSheetRef>(null);

  // Memories are scoped to a restaurant — default to the first location once loaded.
  useEffect(() => {
    if (!selectedLocation && locations.length > 0) {
      setSelectedLocation(locations[0]);
    }
  }, [locations, selectedLocation]);

  const restaurantId = selectedLocation?.id;
  const { data: entries = [], isLoading } = useKnowledge(restaurantId);

  const createMemory = useCreateMemory(restaurantId);
  const deleteMemory = useDeleteMemory(restaurantId);

  const sheetRef = useRef<KnowledgeEditBottomSheetRef>(null);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMemory.mutate(id, {
        onError: () =>
          Toast.show({ type: "error", text1: "Failed to delete. Try again." }),
      });
    },
    [deleteMemory],
  );

  const handleAdd = useCallback(() => {
    if (!restaurantId) {
      Toast.show({ type: "error", text1: "Select a location first" });
      return;
    }
    sheetRef.current?.open();
  }, [restaurantId]);

  const handleSave = useCallback(
    (text: string) => {
      createMemory.mutate(text, {
        onSuccess: () => Toast.show({ type: "success", text1: "Added" }),
        onError: () =>
          Toast.show({ type: "error", text1: "Failed to save. Try again." }),
      });
    },
    [createMemory],
  );

  const renderItem = useCallback(
    ({ item }: { item: KnowledgeEntry }) => (
      <KnowledgeCard item={item} onDelete={handleDelete} />
    ),
    [handleDelete],
  );

  const keyExtractor = useCallback((item: KnowledgeEntry) => item.id, []);

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <FlatList<KnowledgeEntry>
        data={entries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        ListHeaderComponent={
          <VStack className="mb-4" style={{ gap: 16 }}>
            <HStack className="items-start justify-between">
              <VStack style={{ gap: 4 }}>
                <Text className="text-foreground font-extralight tracking-tighter text-3xl">
                  Knowledge
                </Text>
                <Text className="text-subtle text-base font-normal tracking-tighter">
                  Information added to memory
                </Text>
              </VStack>

              <Pressable onPress={handleAdd}>
                <Box className="w-11 h-11 rounded-full bg-foreground items-center justify-center">
                  <PlusIcon size={20} color={colors.background} />
                </Box>
              </Pressable>
            </HStack>

            {/* Location selector — memories are scoped per restaurant. */}
            <Pressable onPress={() => locationSheetRef.current?.open()}>
              <HStack
                className="items-center justify-between bg-white px-5 py-4 rounded-full"
                style={{ gap: 12 }}
              >
                <Text
                  className="text-foreground text-sm font-normal tracking-tighter shrink"
                  numberOfLines={1}
                >
                  {selectedLocation?.name || "Select a location"}
                </Text>
                <CaretRightIcon size={18} color={colors.foreground} />
              </HStack>
            </Pressable>
          </VStack>
        }
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

      <KnowledgeEditBottomSheet ref={sheetRef} onSave={handleSave} />

      <LocationPickerBottomSheet
        ref={locationSheetRef}
        locations={locations}
        selectedLocation={selectedLocation}
        onSelect={setSelectedLocation}
      />
    </Box>
  );
}
