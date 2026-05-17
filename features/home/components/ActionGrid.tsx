import { View } from "react-native";
import { ActionButton } from "./ActionButton";

// Placeholder icon component
function PlaceholderIcon() {
  return <View className="w-6 h-6 bg-gray-400 rounded" />;
}

const actions = [
  { id: 'promo', label: 'Promo', color: '#D0F507' },
  { id: 'pesanan', label: 'Pesanan', color: '#155DFC' },
  { id: 'produk', label: 'Produk', color: '#F54802' },
  { id: 'setting', label: 'Setting', color: '#F9F906' },
] as const;

export function ActionGrid() {
  return (
    <View className="flex-row justify-between">
      {actions.map((action) => (
        <ActionButton
          key={action.id}
          icon={<PlaceholderIcon />}
          label={action.label}
          backgroundColor={action.color}
        />
      ))}
    </View>
  );
}
