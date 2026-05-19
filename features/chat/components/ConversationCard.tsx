import { View, Text, Image, TouchableOpacity } from 'react-native';
import type { Conversation } from '../types';

interface ConversationCardProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Baru saja' : `${diffMins} menit lalu`;
  }
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }
  if (diffDays === 1) {
    return 'Kemarin';
  }
  if (diffDays < 7) {
    return `${diffDays} hari lalu`;
  }
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const { otherUser, product, lastMessage, unreadCount } = conversation;

  return (
    <TouchableOpacity
      onPress={() => onPress(conversation)}
      className="flex-row items-center px-4 py-3 border-b border-neutral-100"
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
        <Text className="text-primary-500 text-lg font-semibold">
          {otherUser.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 mr-3">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-semibold text-neutral-900" numberOfLines={1}>
            {otherUser.name}
          </Text>
          <Text className="text-xs text-neutral-400">
            {formatRelativeTime(lastMessage.timestamp)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text
            className={`flex-1 text-sm ${unreadCount > 0 ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}
            numberOfLines={1}
          >
            {lastMessage.image ? '📷 Foto' : lastMessage.text}
          </Text>
        </View>
      </View>

      {/* Product thumbnail & unread badge */}
      <View className="relative">
        <Image
          source={{ uri: product.image }}
          className="w-10 h-10 rounded-full"
          resizeMode="cover"
        />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-accent-red rounded-full min-w-[20px] h-5 items-center justify-center px-1">
            <Text className="text-white text-xs font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
