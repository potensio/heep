import { View } from "react-native";
import { ActionButton } from "./ActionButton";
import {
  CrownStar,
  Cart5,
  Box,
  Settings,
} from "@solar-icons/react-native/Linear";

const whiteStrokeColor = "#FFFFFF";
const blackStrokeColor = "#000000";

const actions = [
  {
    id: "promo",
    label: "Promo",
    color: "#D0F507",
    Icon: CrownStar,
    iconColor: blackStrokeColor,
  },
  {
    id: "pesanan",
    label: "Pesanan",
    color: "#155DFC",
    Icon: Cart5,
    iconColor: whiteStrokeColor,
  },
  {
    id: "produk",
    label: "Produk",
    color: "#F54802",
    Icon: Box,
    iconColor: whiteStrokeColor,
  },
  {
    id: "setting",
    label: "Setting",
    color: "#F9F906",
    Icon: Settings,
    iconColor: blackStrokeColor,
  },
] as const;

export function ActionGrid() {
  return (
    <View className="flex-row justify-between">
      {actions.map((action) => (
        <ActionButton
          key={action.id}
          icon={<action.Icon size={24} color={action.iconColor} />}
          label={action.label}
          backgroundColor={action.color}
        />
      ))}
    </View>
  );
}
