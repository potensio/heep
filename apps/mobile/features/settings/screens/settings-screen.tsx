import { useState } from "react";
import { ScrollView, Pressable } from "react-native";
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
          contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
          style={{ marginVertical: 24, marginHorizontal: -16 }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                testID={`tab-${tab.id}`}
                onPress={() => setActiveTab(tab.id)}
                className="flex-row items-center rounded-full"
                style={{
                  backgroundColor: isActive
                    ? colors.foreground
                    : colors.background,
                  paddingHorizontal: 12,
                  paddingVertical: 16,
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

        {activeTab === "account" && <AccountSection />}
        {activeTab === "notifications" && <NotificationsSection />}
        {activeTab === "activation" && <ActivationSection />}
      </ScrollView>
    </Box>
  );
}
