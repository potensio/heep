import { useLocalSearchParams } from "expo-router";
import { SellerProfileScreen } from "@/features/seller/SellerProfileScreen";

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SellerProfileScreen id={id} />;
}
