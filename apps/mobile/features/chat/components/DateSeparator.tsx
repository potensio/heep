import { View, Text } from 'react-native';

interface DateSeparatorProps {
  date: Date;
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Hari ini';
  if (isYesterday) return 'Kemarin';

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <View className="items-center my-4">
      <View className="bg-neutral-200 px-3 py-1 rounded-full">
        <Text className="text-xs text-neutral-600 font-medium">
          {formatDate(date)}
        </Text>
      </View>
    </View>
  );
}
