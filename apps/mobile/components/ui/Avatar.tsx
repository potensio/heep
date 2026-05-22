import { View, Text, Image, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  /** Image URL for the avatar */
  source?: string | null;
  /** User name - used for initial letter and alt text */
  name?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Custom icon to show when no image/name */
  icon?: ReactNode;
  /** Custom text color for initial letter */
  textColor?: string;
  /** Badge element (e.g., unread count, online indicator) */
  badge?: ReactNode;
  /** Additional container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

const SIZE_CONFIG: Record<AvatarSize, { container: number; fontSize: number }> = {
  xs: { container: 24, fontSize: 10 },
  sm: { container: 32, fontSize: 12 },
  md: { container: 40, fontSize: 14 },
  lg: { container: 48, fontSize: 16 },
  xl: { container: 96, fontSize: 32 },
};



function getInitial(name: string | undefined): string {
  if (!name) return '';
  return name.charAt(0).toUpperCase();
}

export function Avatar({
  source,
  name,
  size = 'md',
  icon,
  textColor = '#FFFFFF',
  badge,
  style,
  testID,
}: AvatarProps) {
  const config = SIZE_CONFIG[size];
  const hasImage = !!source;
  const initial = getInitial(name);
  // Use primary blue (#155DFC) as default background
  const bgColor = '#155DFC';

  return (
    <View style={style} testID={testID}>
      <View
        className="items-center justify-center overflow-hidden"
        style={{
          width: config.container,
          height: config.container,
          borderRadius: config.container / 2,
          backgroundColor: hasImage ? 'transparent' : bgColor,
        }}
      >
        {hasImage ? (
          <Image
            source={{ uri: source! }}
            style={{
              width: config.container,
              height: config.container,
              borderRadius: config.container / 2,
            }}
            resizeMode="cover"
          />
        ) : icon ? (
          icon
        ) : (
          <Text
            style={{
              fontSize: config.fontSize,
              fontWeight: '600',
              color: textColor,
            }}
          >
            {initial}
          </Text>
        )}
      </View>
      {badge}
    </View>
  );
}

// Pre-built badge components
interface BadgeProps {
  count: number;
}

export function UnreadBadge({ count }: BadgeProps) {
  if (count <= 0) return null;

  return (
    <View
      className="absolute bg-accent-red rounded-full items-center justify-center"
      style={{
        minWidth: 18,
        height: 18,
        right: -2,
        top: -2,
        paddingHorizontal: 4,
      }}
    >
      <Text className="text-white text-xs font-bold">
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

interface OnlineIndicatorProps {
  size?: 'sm' | 'md';
}

export function OnlineIndicator({ size = 'md' }: OnlineIndicatorProps) {
  const indicatorSize = size === 'sm' ? 8 : 10;

  return (
    <View
      className="absolute bg-green-500 rounded-full border-2 border-white"
      style={{
        width: indicatorSize,
        height: indicatorSize,
        right: 0,
        bottom: 0,
      }}
    />
  );
}
