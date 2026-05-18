import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

export default function JualTab() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ke sell stack (tanpa tab bar)
    router.replace("/sell");
  }, []);

  return <View />;
}
