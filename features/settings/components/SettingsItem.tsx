import { TouchableOpacity, Text, View } from "react-native";
import { ArrowRight } from "@solar-icons/react-native/Linear";
import type { ReactNode } from "react";

interface SettingsItemProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}

export function SettingsItem({ icon, label, onPress }: SettingsItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-3.5 px-4 active:bg-gray-100"
    >
      <View className="w-6 items-center">{icon}</View>
      <Text className="flex-1 text-base text-gray-800 ml-3">{label}</Text>
      <ArrowRight size={20} className="text-gray-400" />
    </TouchableOpacity>
  );
}
