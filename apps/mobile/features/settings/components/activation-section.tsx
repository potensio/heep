import { View, Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { useActivation, useUpdateActivation } from "../hooks/use-settings";
import type { RestaurantSetting } from "../api/settings.api";

type AiState = "on" | "off";

function AiToggle({
  value,
  onChange,
}: {
  value: AiState;
  onChange: (v: AiState) => void;
}) {
  return (
    <HStack style={{ gap: 8 }}>
      <Pressable
        onPress={() => onChange("on")}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: value === "on" ? "#3d6b61" : "#fcd5cf",
        }}
      >
        <Text
          className="text-sm font-semibold"
          style={{ color: value === "on" ? "#ffffff" : "#e8928c" }}
        >
          ON
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("off")}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: value === "off" ? "#3d6b61" : "#fcd5cf",
        }}
      >
        <Text
          className="text-sm font-semibold"
          style={{ color: value === "off" ? "#ffffff" : "#e8928c" }}
        >
          OFF
        </Text>
      </Pressable>
    </HStack>
  );
}

function RestaurantRow({ restaurant }: { restaurant: RestaurantSetting }) {
  const { mutate } = useUpdateActivation();

  const handleChange = (v: AiState) => {
    mutate(
      { restaurantId: restaurant.restaurant_id, isActivated: v === "on" },
      {
        onSuccess: () => Toast.show({ type: "success", text1: `${restaurant.restaurant_name} updated` }),
        onError: () => Toast.show({ type: "error", text1: "Failed to update. Try again." }),
      }
    );
  };

  return (
    <HStack className="justify-between items-center">
      <Text className="text-base font-bold">{restaurant.restaurant_name}</Text>
      <AiToggle value={restaurant.is_active ? "on" : "off"} onChange={handleChange} />
    </HStack>
  );
}

export function ActivationSection() {
  const { data: restaurants = [] } = useActivation();

  return (
    <VStack testID="activation-section">
      <Text className="text-xl tracking-tighter" style={{ marginBottom: 12 }}>
        Pause AI on all conversations
      </Text>

      <Box className="bg-white rounded-[32px] p-6">
        <Text className="text-sm mb-5">
          If something is wrong or you just want to take back control for a
          moment, you can pause the AI for any restaurant below. While paused,
          the AI stops replying and your team answers manually. You can resume
          anytime.
        </Text>

        <HStack className="justify-between items-center" style={{ marginBottom: 10 }}>
          <Text className="text-xs" style={{ color: "#888888" }}>Name</Text>
          <Text className="text-xs" style={{ color: "#888888" }}>Status</Text>
        </HStack>

        <View style={{ height: 1, backgroundColor: "#e5e5e5", marginBottom: 12 }} />

        <VStack style={{ gap: 16 }}>
          {restaurants.map((restaurant) => (
            <RestaurantRow key={restaurant.restaurant_id} restaurant={restaurant} />
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}
