import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, ChatLine, Cart5, Tag, Card, CheckCircle } from "@solar-icons/react-native/Linear";
import { useState } from "react";

interface Notification {
  id: string;
  type: "message" | "order" | "promo" | "payment" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "Pesan Baru",
    message: "Anda memiliki pesan baru dari pembeli tentang produk Tas Selempang Wanita",
    time: "5 menit lalu",
    read: false,
  },
  {
    id: "2",
    type: "order",
    title: "Pesanan Baru",
    message: "Selamat! Produk Anda 'Kaos Polos Premium' baru saja dipesan",
    time: "1 jam lalu",
    read: false,
  },
  {
    id: "3",
    type: "payment",
    title: "Pembayaran Diterima",
    message: "Pembayaran untuk pesanan #BJ202401150001 telah dikonfirmasi",
    time: "2 jam lalu",
    read: true,
  },
  {
    id: "4",
    type: "promo",
    title: "Promo Spesial!",
    message: "Diskon 20% untuk semua produk fashion. Berlaku hingga akhir minggu!",
    time: "1 hari lalu",
    read: true,
  },
  {
    id: "5",
    type: "system",
    title: "Verifikasi Berhasil",
    message: "Akun Anda telah berhasil diverifikasi. Selamat berjualan!",
    time: "2 hari lalu",
    read: true,
  },
];

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "message":
      return <ChatLine size={24} color="#3B82F6" />;
    case "order":
      return <Cart5 size={24} color="#10B981" />;
    case "promo":
      return <Tag size={24} color="#F59E0B" />;
    case "payment":
      return <Card size={24} color="#8B5CF6" />;
    case "system":
      return <CheckCircle size={24} color="#6B7280" />;
    default:
      return <Bell size={24} color="#6B7280" />;
  }
};

const getNotificationBgColor = (type: Notification["type"]) => {
  switch (type) {
    case "message":
      return "bg-blue-50";
    case "order":
      return "bg-green-50";
    case "promo":
      return "bg-amber-50";
    case "payment":
      return "bg-purple-50";
    case "system":
      return "bg-gray-50";
    default:
      return "bg-gray-50";
  }
};

export function InboxScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top > 0 ? insets.top : 24 }}>
        {/* Header */}
        <View className="px-5 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-2xl font-heading font-medium text-neutral-900">
              Inbox
            </Text>
            {unreadCount > 0 && (
              <View className="ml-2 bg-primary px-2 py-0.5 rounded-full">
                <Text className="text-xs font-semibold text-white">
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text className="text-sm font-medium text-primary">
                Tandai dibaca
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Bell size={64} color="#D1D5DB" />
          <Text className="text-lg font-medium text-gray-400 mt-4">
            Tidak ada notifikasi
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            Notifikasi akan muncul di sini
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => markAsRead(notification.id)}
              className={`flex-row px-5 py-4 ${
                !notification.read ? "bg-blue-50/50" : "bg-transparent"
              }`}
              activeOpacity={0.7}
            >
              <View
                className={`w-12 h-12 rounded-full items-center justify-center ${getNotificationBgColor(
                  notification.type
                )}`}
              >
                {getNotificationIcon(notification.type)}
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-base ${
                      !notification.read ? "font-semibold" : "font-medium"
                    } text-text`}
                  >
                    {notification.title}
                  </Text>
                  {!notification.read && (
                    <View className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </View>
                <Text
                  className="text-sm text-gray-500 mt-0.5"
                  numberOfLines={2}
                >
                  {notification.message}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">
                  {notification.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
