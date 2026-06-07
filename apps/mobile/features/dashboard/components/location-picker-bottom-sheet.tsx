import React, { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import { BottomSheetView } from "@gorhom/bottom-sheet";
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

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  const handleClose = useCallback(() => sheetRef.current?.close(), []);

  return (
    <BottomSheet ref={sheetRef} snapPoints={["40%"]}>
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Select a location</Text>
        {locations.map((location) => (
          <LocationItem
            key={location}
            location={location}
            isSelected={location === selectedLocation}
            onPress={onSelect}
            sheetClose={handleClose}
          />
        ))}
      </BottomSheetView>
    </BottomSheet>
  );
});

LocationPickerBottomSheet.displayName = "LocationPickerBottomSheet";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  title: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginBottom: 8,
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
});
