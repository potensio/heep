import { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPointWave, CloseSquare } from "@solar-icons/react-native/Linear";
import { searchCities, getCityLocation } from "@/lib/googlePlaces";
import type { Location } from "@/lib/types";
import type { PlaceSuggestion } from "@/lib/googlePlaces";

interface CityPickerProps {
  value: Location | null;
  onSelect: (location: Location) => void;
  onClose: () => void;
}

export function CityPicker({ value, onSelect, onClose }: CityPickerProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(value?.name ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardWillShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideListener = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [onClose, backdropOpacity, sheetTranslateY]);

  const lastQueryRef = useRef("");

  const handleChangeText = useCallback(async (text: string) => {
    setQuery(text);
    lastQueryRef.current = text;
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchCities(text);
      if (text === lastQueryRef.current) {
        setSuggestions(results);
      }
    } finally {
      if (text === lastQueryRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleSelect = useCallback(
    async (suggestion: PlaceSuggestion) => {
      try {
        const location = await getCityLocation(
          suggestion.placeId,
          suggestion.name,
        );
        onSelect(location);
      } catch {
        // stays open so user can retry
      }
    },
    [onSelect],
  );

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "black",
          opacity: backdropOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: sheetTranslateY }],
          paddingBottom: keyboardHeight || insets.bottom + 16,
        }}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Pilih Kota</Text>
            <TouchableOpacity onPress={handleClose}>
              <CloseSquare size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={styles.inputRow}>
            <MapPointWave size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Cari kota..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={handleChangeText}
              autoFocus
            />
            {isLoading && <ActivityIndicator size="small" color="#9CA3AF" />}
          </View>

          {/* Results */}
          <View style={styles.resultsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.placeId}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelect(item)}
                >
                  <MapPointWave size={16} color="#6B7280" />
                  <Text style={styles.resultText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                query.length >= 2 && !isLoading ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyStateIcon}>
                      <MapPointWave size={32} color="#9CA3AF" />
                    </View>
                    <Text style={styles.emptyStateTitle}>Kota tidak ditemukan</Text>
                    <Text style={styles.emptyStateSubtitle}>Coba kata kunci lain</Text>
                  </View>
                ) : query.length < 2 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyStateIcon}>
                      <MapPointWave size={32} color="#9CA3AF" />
                    </View>
                    <Text style={styles.emptyStateTitle}>Cari kotamu</Text>
                    <Text style={styles.emptyStateSubtitle}>Ketik nama kota untuk mulai mencari</Text>
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  handleRow: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 40, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontFamily: "Fjalla-One" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#111827",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "white",
  },
  input: { flex: 1, marginLeft: 8, fontSize: 16 },
  resultsContainer: {
    minHeight: 120,
    maxHeight: 240,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  resultText: { fontSize: 16, color: "#111827" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: "Plus-Jakarta-Sans-SemiBold",
    color: "#262626",
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
