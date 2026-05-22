import { Text, TouchableOpacity, View } from "react-native";
import type { ReactNode } from "react";

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  backgroundColor: string;
  onPress?: () => void;
}

export function ActionButton({
  icon,
  label,
  backgroundColor,
  onPress
}: ActionButtonProps) {
  return (
    <TouchableOpacity
      className="items-center"
      style={{ width: 71.5 }}
      onPress={onPress}
    >
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center mb-2"
        style={{ backgroundColor }}
      >
        {icon}
      </View>
      <Text
        className="text-[10px] text-[#364153] text-center leading-4"
        style={{ fontWeight: "500" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
