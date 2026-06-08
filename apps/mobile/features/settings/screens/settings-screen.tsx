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
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          flexGrow: 1,
        }}
      >
        <Text className="text-4xl font-extralight leading-tight tracking-tighter text-subtle mt-6">
          Settings
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
          style={{ marginTop: 24, marginBottom: 8, marginHorizontal: -16, height: 80 }}
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
                  marginLeft: tab.id === TABS[0].id ? 16 : 0,
                  marginRight: tab.id === TABS[TABS.length - 1].id ? 16 : 0,
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
          style={{ marginHorizontal: -16 }}
        >
          <View style={{ width: screenWidth, paddingHorizontal: 16 }}>
            <AccountSection />
          </View>
          <View style={{ width: screenWidth, paddingHorizontal: 16 }}>
            <NotificationsSection />
          </View>
          <View style={{ width: screenWidth, paddingHorizontal: 16 }}>
            <ActivationSection />
          </View>
        </ScrollView>
      </ScrollView>
    </Box>
  );
}
