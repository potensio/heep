import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useCallback } from "react";
import { CheckSquare } from "@solar-icons/react-native/Linear";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SortOption = "relevan" | "terbaru" | "termurah" | "termahal";

interface SortBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  selected: SortOption;
  onSelect: (option: SortOption) => void;
}

const sortLabels: Record<SortOption, string> = {
  relevan: "Relevan",
  terbaru: "Terbaru",
  termurah: "Termurah (Harga Terendah)",
  termahal: "Termahal (Harga Tertinggi)",
};

const sortOptions: SortOption[] = ["relevan", "terbaru", "termurah", "termahal"];

export function SortBottomSheet({
  bottomSheetRef,
  selected,
  onSelect,
}: SortBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, [bottomSheetRef]);

  const handleSelect = useCallback(
    (option: SortOption) => {
      onSelect(option);
      handleClose();
    },
    [onSelect, handleClose]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["40%"]}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: "#E5E7EB", width: 40 }}
      style={{ paddingBottom: insets.bottom }}
    >
      <BottomSheetView className="flex-1 px-5 pt-2 pb-6">
        <Text className="text-lg font-heading font-medium text-gray-900 mb-4">
          Urutkan
        </Text>

        <View className="gap-2">
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => handleSelect(option)}
              className={`flex-row items-center justify-between py-4 px-4 rounded-xl ${
                selected === option ? "bg-primary/10" : "bg-gray-50"
              }`}
            >
              <Text
                className={`text-base ${
                  selected === option
                    ? "text-primary font-medium"
                    : "text-gray-700"
                }`}
              >
                {sortLabels[option]}
              </Text>
              {selected === option && (
                <CheckSquare size={20} color="#155DFC" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
