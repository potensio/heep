import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Avatar, UnreadBadge } from '@/components/ui/Avatar';
import type { Conversation } from '@/lib/types';

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
      {/* Avatar & Product overlapped */}
      <View className="relative mr-3" style={{ width: 52, height: 48 }}>
        {/* Product thumbnail */}
        <Image
          source={{ uri: product.image }}
          className="absolute"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            right: 0,
            top: 0,
          }}
          resizeMode="cover"
        />
        {/* Avatar */}
        <View className="absolute" style={{ left: 0, bottom: 0 }}>
          <Avatar
            source={otherUser.avatar}
            name={otherUser.name}
            size="sm"
          />
        </View>
        {/* Unread badge */}
        {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-semibold text-neutral-900" numberOfLines={1}>
            {otherUser.name}
          </Text>
          <Text className="text-xs text-neutral-400">
            {formatRelativeTime(lastMessage.timestamp)}
          </Text>
        </View>
        <Text
          className={`text-sm ${unreadCount > 0 ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}
          numberOfLines={1}
        >
          {lastMessage.image ? '📷 Foto' : lastMessage.text}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
