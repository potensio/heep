import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { AltArrowDown, CheckSquare } from "@solar-icons/react-native/Linear";

export type SortOption = "relevan" | "terbaru" | "termurah" | "termahal";

interface SortDropdownProps {
  selected: SortOption;
  onSelect: (option: SortOption) => void;
}

const sortLabels: Record<SortOption, string> = {
  relevan: "Relevan",
  terbaru: "Terbaru",
  termurah: "Termurah",
  termahal: "Termahal",
};

const sortOptions: SortOption[] = ["relevan", "terbaru", "termurah", "termahal"];

export function SortDropdown({ selected, onSelect }: SortDropdownProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="px-5 py-3 flex-row items-center">
      <Text className="text-sm text-gray-500 mr-2">Urutkan:</Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className="flex-row items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200"
      >
        <Text className="text-sm text-gray-800 mr-1">
          {sortLabels[selected]}
        </Text>
        <AltArrowDown size={16} color="#666666" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View className="flex-1 bg-black/30 justify-center items-center px-10">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-2xl w-full py-2">
                <Text className="text-base font-medium text-gray-800 px-4 py-3 border-b border-gray-100">
                  Urutkan Berdasarkan
                </Text>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      onSelect(option);
                      setVisible(false);
                    }}
                    className="flex-row items-center justify-between px-4 py-3"
                  >
                    <Text
                      className={`text-base ${
                        selected === option ? "text-primary font-medium" : "text-gray-800"
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
