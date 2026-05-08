import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { WebViewScreen } from "@/src/components/ui";
import { useNotifications } from "@/src/hooks";
import {
  appendUtmParams,
  getAnalyticsInjectionScript,
} from "@/src/utils/analytics";
import {
  getTargetBlankHandlerScript,
  combineScripts,
} from "@/src/utils/webview-scripts";
import { getSwissBelhotelUrl } from "@/src/utils/url-helpers";

const COMBINED_SCRIPT = combineScripts(
  getTargetBlankHandlerScript(),
  getAnalyticsInjectionScript(),
);

function BellIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0"
        stroke="#1F1F1F"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellButton() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      onPress={() => router.push("/notifications")}
      className="relative p-2"
      accessibilityLabel="Notifications"
      accessibilityRole="button"
    >
      <BellIcon />
      {unreadCount > 0 && (
        <View className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F04F31]" />
      )}
    </TouchableOpacity>
  );
}

export default function MainWebView() {
  const bookingUrl = appendUtmParams(getSwissBelhotelUrl());

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen
        url={bookingUrl}
        injectedJavaScript={COMBINED_SCRIPT}
        showBackButton={false}
        trapBackAtRoot={true}
        rightAction={<BellButton />}
      />
    </>
  );
}
