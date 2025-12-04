import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useNotifications } from "@/contexts/NotificationContext";
import { Notification } from "@/types/notification";

/**
 * Format a date as relative time (e.g., "2 min ago", "Yesterday")
 * Requirements 2.3: Display relative time for notifications
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    // Format as date for older notifications
    return date.toLocaleDateString();
  }
}

const ArrowLeftIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 6L9 12L15 18"
      stroke="#1F1F1F"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, loading, error, markAsRead } =
    useNotifications();

  /**
   * Handle notification tap - mark as read if unread
   * Requirements 4.1, 4.2, 4.3: Mark notification as read on tap
   */
  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeftIcon />
        </TouchableOpacity>
        <View className="flex-row items-center gap-1">
          <Text className="text-lg font-medium text-[#1F1F1F]">
            Notification
          </Text>
          {unreadCount > 0 && (
            <View className="bg-[#F04F31] rounded-full px-1.5 py-0.5 min-w-[16px] items-center">
              <Text className="text-white text-[11px] font-medium">
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F04F31" />
          <Text className="text-sm text-[#767676] mt-2">
            Loading notifications...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-sm text-[#F04F31] text-center">
            Failed to load notifications
          </Text>
          <Text className="text-xs text-[#767676] mt-1 text-center">
            {error.message}
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-[#767676] text-center">
            No notifications yet
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="gap-2">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
}

function NotificationCard({ notification, onPress }: NotificationCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`p-2 rounded-lg ${
        notification.isRead ? "bg-white" : "bg-[#FFF6F4]"
      }`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <Text className="text-sm font-medium text-[#1F1F1F]">
          {notification.title}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-[10px] text-[#8D8D8D]">
            {formatRelativeTime(notification.createdAt)}
          </Text>
          {!notification.isRead && (
            <View className="w-2 h-2 rounded-full bg-[#F04F31]" />
          )}
        </View>
      </View>
      {/* Message */}
      <Text className="text-xs text-[#767676] mt-2 leading-[14.5px]">
        {notification.body}
      </Text>
    </TouchableOpacity>
  );
}
