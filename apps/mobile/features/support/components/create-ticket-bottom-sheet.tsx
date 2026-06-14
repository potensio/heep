import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { MagnifyingGlassIcon, XIcon } from "phosphor-react-native";
import { BottomSheet, BottomSheetRef } from "@/components/ui/bottom-sheet";
import { Text } from "@/components/ui/text";
import { useLocations } from "@/features/dashboard/hooks/use-locations";
import type { Location } from "@/features/dashboard/types";

export type CreateTicketBottomSheetRef = BottomSheetRef;

/** Above this count we surface a search box to filter the pills. */
const SEARCH_THRESHOLD = 6;

interface CreateTicketBottomSheetProps {
  onSubmit: (data: { location: Location; description: string }) => void;
}

export const CreateTicketBottomSheet = forwardRef<
  CreateTicketBottomSheetRef,
  CreateTicketBottomSheetProps
>(({ onSubmit }, ref) => {
  const sheetRef = useRef<BottomSheetRef>(null);
  const { data: locations = [] } = useLocations();

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [description, setDescription] = useState("");

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  const showSearch = locations.length > SEARCH_THRESHOLD;

  const filteredLocations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(q));
  }, [locations, query]);

  const canSubmit = !!selectedLocation && description.trim().length > 0;

  const handleSelect = useCallback((location: Location) => {
    setSelectedLocation((prev) => (prev?.id === location.id ? null : location));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedLocation || !description.trim()) return;
    onSubmit({ location: selectedLocation, description: description.trim() });
    setSelectedLocation(null);
    setDescription("");
    setQuery("");
    sheetRef.current?.close();
  }, [selectedLocation, description, onSubmit]);

  return (
    <BottomSheet ref={sheetRef} snapPoints={["68%"]}>
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>New ticket</Text>

        {/* Restaurant selector */}
        <View style={{ gap: 10 }}>
          <Text style={styles.label}>Restaurant</Text>

          {showSearch && (
            <View style={styles.searchRow}>
              <MagnifyingGlassIcon
                size={16}
                color="rgba(255,255,255,0.4)"
                weight="regular"
              />
              <BottomSheetTextInput
                style={styles.searchInput}
                placeholder="Search restaurants..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <XIcon size={16} color="rgba(255,255,255,0.4)" weight="bold" />
                </Pressable>
              )}
            </View>
          )}

          <BottomSheetScrollView
            style={styles.pillsScroll}
            contentContainerStyle={styles.pillsContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredLocations.length === 0 ? (
              <Text style={styles.emptyText}>No restaurants found</Text>
            ) : (
              filteredLocations.map((location) => {
                const isSelected = location.id === selectedLocation?.id;
                return (
                  <Pressable
                    key={location.id}
                    onPress={() => handleSelect(location)}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isSelected && styles.pillTextSelected,
                      ]}
                    >
                      {location.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </BottomSheetScrollView>
        </View>

        {/* Description */}
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Tell us what's wrong</Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="e.g. My order arrived with a dish missing and I'd like a refund."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
        >
          <Text style={styles.submitText}>Create ticket</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
});

CreateTicketBottomSheet.displayName = "CreateTicketBottomSheet";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  title: {
    color: "#fff",
    fontSize: 13,
  },
  label: {
    color: "#fff",
    fontSize: 13,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 0,
  },
  // Caps the pills at ~3 rows so the sheet never grows unbounded.
  pillsScroll: {
    maxHeight: 132,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  pillSelected: {
    backgroundColor: "#fff",
  },
  pillText: {
    color: "#fff",
    fontSize: 14,
  },
  pillTextSelected: {
    color: "#000",
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    marginTop: 8,
  },
  input: {
    minHeight: 110,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: "#000",
    fontSize: 15,
    fontFamily: "DM-Sans-Medium",
  },
});
