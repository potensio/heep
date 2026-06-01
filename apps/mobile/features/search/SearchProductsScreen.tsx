import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchBar } from "./components/SearchBar";
import { ProductCard } from "./components/ProductCard";
import { EmptyState } from "./components/EmptyState";
import { SearchHistory } from "./components/SearchHistory";
import { useFilterSheet } from "./context/FilterSheetContext";
import type { FilterState, SortOption } from "./context/FilterSheetContext";
import { Filter, ArrowLeft, MapPoint } from "@solar-icons/react-native/Linear";
import { CityPicker } from "@/features/shared/components/CityPicker";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import type { Location } from "@/lib/types";
import { useProductSearch } from "./hooks/useProductSearch";

const searchSuggestions = [
  "Sepatu Nike",
  "Tas Laptop",
  "Kemeja Polos",
  "Jam Tangan",
];

interface SearchProductsScreenProps {
  initialQuery?: string;
  onBack: () => void;
  onProductPress: (id: string) => void;
  onSellerPress: (id: string) => void;
}

export function SearchProductsScreen({
  initialQuery = "",
  onBack,
  onProductPress,
  onSellerPress,
}: SearchProductsScreenProps) {
  const insets = useSafeAreaInsets();
  const { openFilterSheet } = useFilterSheet();
  const { user, token, updateUser } = useAuth();
  const [showCityPicker, setShowCityPicker] = useState(false);

  const handleLocationSelect = useCallback(async (location: Location) => {
    setShowCityPicker(false);
    if (!token) return;
    try {
      const updatedUser = await updateProfile(token, { location });
      updateUser({ ...updatedUser, location });
    } catch {
      // best-effort — picker is already dismissed
    }
  }, [token, updateUser]);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [hasSubmitted, setHasSubmitted] = useState(!!initialQuery.trim());
  const [history, setHistory] = useState<string[]>([]);
  const { data: filteredProducts, isLoading: searchLoading, hasMore, search, fetchMore } = useProductSearch();
  const [sortBy, setSortBy] = useState<SortOption>("relevan");

  const addToHistory = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setHistory((prev) =>
      [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 10),
    );
  }, []);

  useEffect(() => {
    if (initialQuery.trim()) {
      setHasSubmitted(true);
      search({ q: initialQuery.trim() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      addToHistory(trimmed);
      setHasSubmitted(true);
      search({
        q: trimmed || undefined,
        sortBy: sortBy === 'relevan' ? undefined : (sortBy as 'terbaru' | 'termurah' | 'termahal'),
      });
    },
    [addToHistory, search, sortBy],
  );

  const handleChangeText = useCallback((text: string) => {
    setSearchQuery(text);
    if (text === "") setHasSubmitted(false);
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) runSearch(searchQuery);
  }, [searchQuery, runSearch]);

  const handleHistorySelect = useCallback(
    (query: string) => {
      setSearchQuery(query);
      runSearch(query);
    },
    [runSearch],
  );

  const handleFilter = useCallback((filters: FilterState) => {
    setSortBy(filters.sortBy);
    search({
      q: searchQuery.trim() || undefined,
      category: filters.categories[0] ?? undefined,
      minPrice: filters.minPrice ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      sortBy: filters.sortBy === 'relevan'
        ? undefined
        : (filters.sortBy as 'terbaru' | 'termurah' | 'termahal'),
    });
  }, [search, searchQuery]);

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      setSearchQuery(suggestion);
      runSearch(suggestion);
    },
    [runSearch],
  );

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      <View
        className="bg-background px-4 pb-2"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={onBack} className="p-1">
            <ArrowLeft size={24} color="#0A0A0A" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowCityPicker(true)} className="p-1">
            <MapPoint size={22} color={user?.location ? '#155DFC' : '#6B7280'} />
          </TouchableOpacity>

          <View className="flex-1 ml-1">
            <SearchBar
              value={searchQuery}
              onChangeText={handleChangeText}
              onSubmit={handleSearch}
              autoFocus={!hasSubmitted}
            />
          </View>
          {hasSubmitted && (
            <TouchableOpacity
              onPress={() => openFilterSheet(handleFilter, { sortBy })}
              className="p-1"
            >
              <Filter size={22} color="#0A0A0A" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {hasSubmitted && user?.location && (
        <View className="px-5 pb-2">
          <Text className="text-xs text-gray-500">
            Menampilkan produk di{' '}
            <Text className="font-semibold text-gray-700">{user.location.name}</Text>
          </Text>
        </View>
      )}

      {!hasSubmitted ? (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <SearchHistory
            history={history}
            onSelect={handleHistorySelect}
            onDelete={(query) =>
              setHistory((prev) => prev.filter((h) => h !== query))
            }
            onClearAll={() => setHistory([])}
          />
          {history.length === 0 && (
            <View className="px-5 mt-6">
              <Text className="text-sm font-medium text-gray-500 mb-3">
                Coba cari
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {searchSuggestions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleSuggestionPress(s)}
                    className="bg-white px-3 py-2 rounded-full border border-gray-200"
                  >
                    <Text className="text-sm text-gray-700">{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 300 && hasMore && !searchLoading) {
              fetchMore();
            }
          }}
          scrollEventThrottle={400}
        >
          <View className="px-5 mt-6">
            {searchQuery.length > 0 && (
              <Text className="text-sm text-gray-500 mb-4">
                {filteredProducts.length} hasil untuk &quot;{searchQuery}&quot;
              </Text>
            )}
            <View className="flex-row flex-wrap">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => onProductPress(product.id)}
                  onSellerPress={() => onSellerPress(product.sellerId ?? "")}
                  width="48%"
                  marginRight={index % 2 === 0 ? "4%" : 0}
                />
              ))}
            </View>
            {filteredProducts.length === 0 && (
              <EmptyState
                query={searchQuery}
                suggestions={searchSuggestions}
                onSuggestionPress={handleSuggestionPress}
              />
            )}
          </View>
        </ScrollView>
      )}

      {showCityPicker && (
        <CityPicker
          value={user?.location ?? null}
          onSelect={handleLocationSelect}
          onClose={() => setShowCityPicker(false)}
        />
      )}
    </View>
  );
}
