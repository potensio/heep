import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPoint, CloseSquare } from '@solar-icons/react-native/Linear';
import { searchCities, getCityLocation } from '@/lib/googlePlaces';
import type { Location } from '@/lib/types';
import type { PlaceSuggestion } from '@/lib/googlePlaces';

interface CityPickerProps {
  value: Location | null;
  onSelect: (location: Location) => void;
  onClose: () => void;
}

export function CityPicker({ value, onSelect, onClose }: CityPickerProps) {
  const ref = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState(value?.name ?? '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    ref.current?.present();
  }, []);

  const lastQueryRef = useRef('');

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

  const handleSelect = useCallback(async (suggestion: PlaceSuggestion) => {
    try {
      const location = await getCityLocation(suggestion.placeId, suggestion.name);
      onSelect(location);
    } catch {
      // getCityLocation failed — sheet stays open so user can try again
    }
  }, [onSelect]);

  const snapPoints = useMemo(() => ['60%'], []);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      onDismiss={onClose}
      enablePanDownToClose
    >
      <BottomSheetView style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Pilih Kota</Text>
          <TouchableOpacity onPress={() => ref.current?.dismiss()}>
            <CloseSquare size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <MapPoint size={18} color="#9CA3AF" />
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

        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
              <MapPoint size={16} color="#6B7280" />
              <Text style={styles.resultText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query.length >= 2 && !isLoading ? (
              <Text style={styles.emptyText}>Kota tidak ditemukan</Text>
            ) : null
          }
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 20, fontFamily: 'Fjalla-One' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12,
    height: 48, paddingHorizontal: 12, marginBottom: 12, backgroundColor: 'white',
  },
  input: { flex: 1, marginLeft: 8, fontSize: 16 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  resultText: { fontSize: 16, color: '#111827' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 24 },
});
