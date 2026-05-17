// Alternative: Use @expo/vector-icons if Solar Icons still has issues
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

interface IconProps {
  color: string;
  size: number;
}

export const HomeIcon = ({ color, size }: IconProps) => (
  <Ionicons name="home-outline" color={color} size={size} />
);

export const HomeIconBold = ({ color, size }: IconProps) => (
  <Ionicons name="home" color={color} size={size} />
);

export const OrderIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons name="clipboard-text-outline" color={color} size={size} />
);

export const OrderIconBold = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons name="clipboard-text" color={color} size={size} />
);

export const SellIcon = ({ color, size }: IconProps) => (
  <Ionicons name="add-circle" color={color} size={size} />
);

export const ChatIcon = ({ color, size }: IconProps) => (
  <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
);

export const ChatIconBold = ({ color, size }: IconProps) => (
  <Ionicons name="chatbubble-ellipses" color={color} size={size} />
);

export const AccountIcon = ({ color, size }: IconProps) => (
  <FontAwesome5 name="user" color={color} size={size} solid={false} />
);

export const AccountIconBold = ({ color, size }: IconProps) => (
  <FontAwesome5 name="user-alt" color={color} size={size} />
);
