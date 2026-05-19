import { View, Text, Switch, ScrollView } from "react-native";
import { useState } from "react";

export function NotificationSettings() {
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [promoNotifications, setPromoNotifications] = useState(false);

  return (
    <ScrollView className="flex-1 bg-background p-5">
      <Text className="text-sm text-gray-600 mb-4">
        Kelola preferensi notifikasi Anda
      </Text>

      <View className="gap-4">
        {/* Order Notifications */}
        <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-medium text-gray-800">Pesanan</Text>
            <Text className="text-sm text-gray-500">
              Status pesanan, pengiriman, dan transaksi
            </Text>
          </View>
          <Switch
            value={orderNotifications}
            onValueChange={setOrderNotifications}
            trackColor={{ false: "#E5E7EB", true: "#10B981" }}
            thumbColor={orderNotifications ? "#fff" : "#fff"}
          />
        </View>

        {/* Chat Notifications */}
        <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-medium text-gray-800">Chat</Text>
            <Text className="text-sm text-gray-500">
              Pesan dari pembeli dan penjual
            </Text>
          </View>
          <Switch
            value={chatNotifications}
            onValueChange={setChatNotifications}
            trackColor={{ false: "#E5E7EB", true: "#10B981" }}
            thumbColor={chatNotifications ? "#fff" : "#fff"}
          />
        </View>

        {/* Promo Notifications */}
        <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-medium text-gray-800">Promosi</Text>
            <Text className="text-sm text-gray-500">
              Penawaran, diskon, dan promosi menarik
            </Text>
          </View>
          <Switch
            value={promoNotifications}
            onValueChange={setPromoNotifications}
            trackColor={{ false: "#E5E7EB", true: "#10B981" }}
            thumbColor={promoNotifications ? "#fff" : "#fff"}
          />
        </View>
      </View>

      <Text className="text-xs text-gray-400 mt-6 text-center">
        Perubahan akan tersimpan otomatis
      </Text>
    </ScrollView>
  );
}
