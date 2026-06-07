import { forwardRef, useImperativeHandle, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomSheet, BottomSheetRef } from "@/components/ui/bottom-sheet";
import { Text } from "@/components/ui/text";

export type LocationPickerBottomSheetRef = BottomSheetRef;

interface LocationPickerBottomSheetProps {
  locations: string[];
  selectedLocation: string | null;
  onSelect: (location: string) => void;
}

export const LocationPickerBottomSheet = forwardRef<
  LocationPickerBottomSheetRef,
  LocationPickerBottomSheetProps
>(({ locations, selectedLocation, onSelect }, ref) => {
  const sheetRef = useRef<BottomSheetRef>(null);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  return (
    <BottomSheet ref={sheetRef} snapPoints={["40%"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Select a location</Text>
        {locations.map((location) => {
          const isSelected = location === selectedLocation;
          return (
            <Pressable
              key={location}
              testID={`location-item-${location}`}
              onPress={() => {
                onSelect(location);
                sheetRef.current?.close();
              }}
              style={[styles.item, isSelected && styles.itemSelected]}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {location}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
