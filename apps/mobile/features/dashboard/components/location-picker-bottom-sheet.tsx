import React, {
  forwardRef,
  startTransition,
  useCallback,
  useDeferredValue,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { MagnifyingGlass } from "phosphor-react-native";
import { BottomSheet, BottomSheetRef } from "@/components/ui/bottom-sheet";
import { Text } from "@/components/ui/text";

export type LocationPickerBottomSheetRef = BottomSheetRef;

interface LocationPickerBottomSheetProps {
  locations: string[];
  selectedLocation: string | null;
  onSelect: (location: string) => void;
}

interface LocationItemProps {
  location: string;
  isSelected: boolean;
  onPress: (location: string) => void;
  sheetClose: () => void;
}

const LocationItem = React.memo(function LocationItem({
  location,
  isSelected,
  onPress,
  sheetClose,
}: LocationItemProps) {
  const handlePress = useCallback(() => {
    onPress(location);
    sheetClose();
  }, [location, onPress, sheetClose]);

  return (
    <Pressable
      testID={`location-item-${location}`}
      onPress={handlePress}
      style={[styles.item, isSelected && styles.itemSelected]}
    >
      <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
        {location}
      </Text>
    </Pressable>
  );
});

export const LocationPickerBottomSheet = forwardRef<
  LocationPickerBottomSheetRef,
  LocationPickerBottomSheetProps
>(({ locations, selectedLocation, onSelect }, ref) => {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredLocations = deferredQuery.trim()
    ? locations.filter((l) =>
        l.toLowerCase().includes(deferredQuery.toLowerCase().trim())
      )
    : locations;

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  const handleClose = useCallback(() => sheetRef.current?.close(), []);
  const handleQueryChange = useCallback((text: string) => {
    startTransition(() => setQuery(text));
  }, []);

  return (
    <BottomSheet ref={sheetRef} snapPoints={["55%"]}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Select a location</Text>
        <View style={styles.searchRow}>
          <MagnifyingGlass size={16} color="rgba(255,255,255,0.4)" weight="regular" />
          <BottomSheetTextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        {filteredLocations.length === 0 ? (
          <Text style={styles.emptyText}>No results</Text>
        ) : (
          filteredLocations.map((location) => (
            <LocationItem
              key={location}
              location={location}
              isSelected={location === selectedLocation}
              onPress={onSelect}
              sheetClose={handleClose}
            />
          ))
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

LocationPickerBottomSheet.displayName = "LocationPickerBottomSheet";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 8,
  },
  title: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 0,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  itemSelected: {
    backgroundColor: "#fff",
  },
  itemText: {
    color: "#fff",
    fontSize: 14,
  },
  itemTextSelected: {
    color: "#000",
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
});
