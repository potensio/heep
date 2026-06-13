import { Switch, Pressable, View, Linking } from "react-native";
import Toast from "react-native-toast-message";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { useNotifications, useUpdateNotificationActivation } from "../hooks/use-settings";
import type { RestaurantSetting } from "../api/settings.api";

function RestaurantRow({ restaurant }: { restaurant: RestaurantSetting }) {
  const { mutate } = useUpdateNotificationActivation();

  const handleToggle = (value: boolean) => {
    mutate(
      { restaurantId: restaurant.restaurant_id, isActivated: value },
      {
        onSuccess: () => Toast.show({ type: "success", text1: `${restaurant.restaurant_name} updated` }),
        onError: () => Toast.show({ type: "error", text1: "Failed to update. Try again." }),
      }
    );
  };

  return (
    <HStack className="justify-between items-center">
      <Text className="text-base font-bold">{restaurant.restaurant_name}</Text>
      <Switch
        value={restaurant.is_active}
        onValueChange={handleToggle}
        trackColor={{ false: "#d1d5db", true: "#22c55e" }}
        thumbColor="#ffffff"
      />
    </HStack>
  );
}

export function NotificationsSection() {
  const { data: restaurants = [] } = useNotifications();

  return (
    <VStack testID="notifications-section">
      <Text className="text-xl tracking-tighter mb-4">Notifications</Text>

      <Box className="bg-white rounded-[32px] p-6">
        <Text className="text-sm mb-5">
          Enable notifications to be alerted when the AI needs your attention.
          This may include situations like: unusual customer questions, urgent
          requests, booking issues, or conversations where human help is
          preferred. If enabled, you&apos;ll receive a mobile notification when
          action is required.
        </Text>

        <HStack className="justify-between items-center" style={{ marginBottom: 10 }}>
          <Text className="text-xs" style={{ color: "#888888" }}>Name</Text>
          <Text className="text-xs" style={{ color: "#888888" }}>Notifications</Text>
        </HStack>

        <View style={{ height: 1, backgroundColor: "#e5e5e5", marginBottom: 12 }} />

        <VStack style={{ gap: 16 }}>
          {restaurants.map((restaurant) => (
            <RestaurantRow key={restaurant.restaurant_id} restaurant={restaurant} />
          ))}
        </VStack>

        <HStack className="justify-end" style={{ marginTop: 12 }}>
          <Pressable onPress={() => Linking.openSettings()}>
            <Text className="text-xs" style={{ color: "#9ca3af" }}>
              Allow push notifications
            </Text>
          </Pressable>
        </HStack>
      </Box>
    </VStack>
  );
}
