import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
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
import { mockProducts } from "@/lib/mockData";
import { Button } from "@/components/ui";

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
  const [filteredProducts, setFilteredProducts] = useState(() => {
    if (!initialQuery.trim()) return mockProducts;
    return mockProducts.filter((p) =>
      p.name.toLowerCase().includes(initialQuery.toLowerCase()),
    );
  });
  const [sortBy, setSortBy] = useState<SortOption>("relevan");

  const addToHistory = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setHistory((prev) =>
      [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 10),
    );
  }, []);

  const runSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      addToHistory(trimmed);
      setFilteredProducts(
        trimmed
          ? mockProducts.filter((p) =>
              p.name.toLowerCase().includes(trimmed.toLowerCase()),
            )
          : mockProducts,
      );
      setHasSubmitted(true);
    },
    [addToHistory],
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
    let filtered = [...mockProducts];
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) =>
        filters.categories.some((cat) =>
          (p.category ?? "").toLowerCase().includes(cat.toLowerCase()),
        ),
      );
    }
    if (filters.minPrice !== null) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }
    setSortBy(filters.sortBy);
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "terbaru":
          return parseInt(b.id) - parseInt(a.id);
        case "termurah":
          return a.price - b.price;
        case "termahal":
          return b.price - a.price;
        default:
          return 0;
      }
    });
    setFilteredProducts(filtered);
  }, []);

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
        className="bg-background px-5 pb-2"
        style={{ paddingTop: (insets.top > 0 ? insets.top : 24) + 16 }}
      >
        <View className="flex-row items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={18} color="#374151" />}
            onPress={onBack}
          />

          <Button
            variant="ghost"
            size="sm"
            icon={<MapPoint size={18} color={user?.location ? '#155DFC' : '#6B7280'} />}
            onPress={() => setShowCityPicker(true)}
          />

          <View className="flex-1">
            <SearchBar
              value={searchQuery}
              onChangeText={handleChangeText}
              onSubmit={handleSearch}
              autoFocus={!hasSubmitted}
            />
          </View>
          {hasSubmitted && (
            <TouchableOpacity
              className="items-center justify-center bg-white rounded-xl border border-gray-200"
              style={{ width: 40, height: 40 }}
              onPress={() => openFilterSheet(handleFilter, { sortBy })}
            >
              <Filter size={20} color="#374151" />
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
