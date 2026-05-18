import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function SellTab() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ke /sell stack (full screen tanpa tab bar)
    router.replace("/sell");
  }, [router]);

  return null;
}
