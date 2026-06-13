import { View, StyleSheet } from "react-native";
import { CheckCircleIcon, XCircleIcon } from "phosphor-react-native";
import { Text } from "./text";
import type { ToastConfig } from "react-native-toast-message";

function ToastPill({
  text1,
  color,
  icon,
}: {
  text1?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: color }]}>
      {icon}
      <Text style={styles.text}>{text1}</Text>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: ({ text1 }) => (
    <ToastPill
      text1={text1}
      color="#3d6b61"
      icon={<CheckCircleIcon size={16} color="#ffffff" weight="fill" />}
    />
  ),
  error: ({ text1 }) => (
    <ToastPill
      text1={text1}
      color="#ef4444"
      icon={<XCircleIcon size={16} color="#ffffff" weight="fill" />}
    />
  ),
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  text: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "DM-Sans-Medium",
  },
});
