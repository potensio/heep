import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Animated,
  Keyboard,
} from "react-native";
import { CloseSquare } from "@solar-icons/react-native/Linear";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORY_OPTIONS } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export type SortOption = "relevan" | "terbaru" | "termurah" | "termahal";

export interface FilterState {
  categories: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: SortOption;
}

interface FilterSheetContextValue {
  openFilterSheet: (
    onApply: (filters: FilterState) => void,
    initialFilters?: Partial<FilterState>,
  ) => void;
}

const FilterSheetContext = createContext<FilterSheetContextValue | null>(null);

export function useFilterSheet() {
  const context = useContext(FilterSheetContext);
  if (!context) {
    throw new Error("useFilterSheet must be used within FilterSheetProvider");
  }
  return context;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevan", label: "Relevan" },
  { value: "terbaru", label: "Terbaru" },
  { value: "termurah", label: "Termurah" },
  { value: "termahal", label: "Termahal" },
];

export function FilterSheetProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<SortOption>("relevan");
  const onApplyCallback = useRef<((filters: FilterState) => void) | null>(null);
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetTranslateY] = useState(() => new Animated.Value(300));
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Keyboard listener - seperti TikTok
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

  // Scroll ke bawah saat input focus
  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 100,
        animated: true,
      });
    }, 100);
  }, []);

  const openFilterSheet = useCallback(
    (
      onApply: (filters: FilterState) => void,
      initialFilters?: Partial<FilterState>,
    ) => {
      setSelectedCategories(initialFilters?.categories || []);
      setMinPrice(initialFilters?.minPrice?.toString() || "");
      setMaxPrice(initialFilters?.maxPrice?.toString() || "");
      setSelectedSort(initialFilters?.sortBy || "relevan");
      onApplyCallback.current = onApply;
      setVisible(true);

      // Animate in
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
    },
    [backdropOpacity, sheetTranslateY],
  );

  const handleClose = useCallback(() => {
    // Animate out
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
    ]).start(() => {
      setVisible(false);
    });
  }, [backdropOpacity, sheetTranslateY]);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }, []);

  const handleApply = useCallback(() => {
    if (onApplyCallback.current) {
      onApplyCallback.current({
        categories: selectedCategories,
        minPrice: minPrice ? parseInt(minPrice, 10) : null,
        maxPrice: maxPrice ? parseInt(maxPrice, 10) : null,
        sortBy: selectedSort,
      });
    }
    handleClose();
  }, [selectedCategories, minPrice, maxPrice, selectedSort, handleClose]);

  const handleReset = useCallback(() => {
    setSelectedCategories([]);
    setMinPrice("");
    setMaxPrice("");
    setSelectedSort("relevan");
  }, []);

  return (
    <FilterSheetContext.Provider value={{ openFilterSheet }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        {/* Backdrop - fades in */}
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
          <Pressable className="flex-1" onPress={handleClose} />
        </Animated.View>

        {/* Sheet - stays in place, content scrolls */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          <View
            className="bg-white rounded-t-3xl"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row justify-between items-center border-b border-gray-200 pb-3 px-5 mb-4">
              <Text className="text-2xl font-heading font-medium text-gray-900">
                Filter
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <CloseSquare size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              className="px-5"
              style={{ maxHeight: 450 }}
              contentContainerStyle={{ paddingBottom: 200 }}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={true}
              nestedScrollEnabled={true}
            >
              {/* Sort Options */}
              <View className="mb-6">
                <Text className="text-lg font-medium mb-3">Urutkan</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setSelectedSort(option.value)}
                      className={`p-2 rounded-lg border ${
                        selectedSort === option.value
                          ? "bg-primary/10 border-1.5 border-primary"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-lg font-semibold ${
                          selectedSort === option.value
                            ? "text-primary"
                            : "text-text-primary"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Categories */}
              <View className="mb-6">
                <Text className="text-lg font-medium mb-3">Kategori</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((category) => (
                    <TouchableOpacity
                      key={category.value}
                      onPress={() => toggleCategory(category.label)}
                      className={`p-2 rounded-lg border ${
                        selectedCategories.includes(category.label)
                          ? "bg-primary/10 border-1.5 border-primary"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-lg font-semibold ${
                          selectedCategories.includes(category.label)
                            ? "text-primary"
                            : "text-text-primary"
                        }`}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View className="mb-6">
                <Text className="text-lg font-medium mb-3">Rentang Harga</Text>
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500 mb-2">Minimum</Text>
                    <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-3 border border-gray-200">
                      <Text className="text-gray-500 mr-1">Rp</Text>
                      <TextInput
                        value={minPrice}
                        onChangeText={setMinPrice}
                        onFocus={handleInputFocus}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        className="flex-1 text-text-primary text-base"
                      />
                    </View>
                  </View>
                  <Text className="text-gray-400 mt-6">—</Text>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500 mb-2">Maksimum</Text>
                    <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-3 border border-gray-200">
                      <Text className="text-gray-500 mr-1">Rp</Text>
                      <TextInput
                        value={maxPrice}
                        onChangeText={setMaxPrice}
                        onFocus={handleInputFocus}
                        placeholder="∞"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        className="flex-1 text-text-primary text-base"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row gap-3 px-5 mt-4 pt-4 border-t border-gray-100">
              <Button variant="outline" onPress={handleReset} style={{ flex: 1 }}>
                Reset
              </Button>
              <Button variant="primary" onPress={handleApply} style={{ flex: 1 }}>
                Terapkan
              </Button>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </FilterSheetContext.Provider>
  );
}
