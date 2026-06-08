import { useState, useRef } from "react";
import { ScrollView, Pressable, Dimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretRightIcon, CaretDownIcon } from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { AccountSection } from "../components/account-section";
import { NotificationsSection } from "../components/notifications-section";
import { ActivationSection } from "../components/activation-section";

type Tab = "account" | "notifications" | "activation";

const TABS: { id: Tab; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "notifications", label: "Notifications" },
  { id: "activation", label: "Activation" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get("window").width;

  const handleTabPress = (tab: Tab) => {
    setActiveTab(tab);
    const index = TABS.findIndex((t) => t.id === tab);
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true,
    });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    const tab = TABS[index];
    if (tab && tab.id !== activeTab) {
      setActiveTab(tab.id);
    }
  };

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16 }}>
        <Text className="text-4xl font-extralight leading-tight tracking-tighter text-subtle mt-6">
          Settings
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
        style={{ marginTop: 24, marginBottom: 0, height: 80 }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              testID={`tab-${tab.id}`}
              onPress={() => handleTabPress(tab.id)}
              className="flex-row items-center rounded-full"
              style={{
                backgroundColor: isActive
                  ? colors.foreground
                  : colors.background,
                paddingHorizontal: 12,
                height: 56,
                gap: 6,
              }}
            >
              <Text
                style={{
                  color: isActive ? colors.background : colors.foreground,
                  fontSize: 14,
                }}
              >
                {tab.label}
              </Text>
              {isActive ? (
                <CaretDownIcon
                  size={14}
                  color={colors.background}
                  weight="regular"
                />
              ) : (
                <CaretRightIcon
                  size={14}
                  color={colors.foreground}
                  weight="regular"
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ width: screenWidth * TABS.length }}
      >
        <View style={{ width: screenWidth }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          >
            <AccountSection />
          </ScrollView>
        </View>
        <View style={{ width: screenWidth }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          >
            <NotificationsSection />
          </ScrollView>
        </View>
        <View style={{ width: screenWidth }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          >
            <ActivationSection />
          </ScrollView>
        </View>
      </ScrollView>
    </Box>
  );
}
