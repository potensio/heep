import { useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretRight, CaretDown } from 'phosphor-react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { AccountSection } from '../components/account-section';
import { NotificationsSection } from '../components/notifications-section';
import { ActivationSection } from '../components/activation-section';

type Tab = 'account' | 'notifications' | 'activation';

const TABS: { id: Tab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'activation', label: 'Activation' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('account');

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
      >
        <Text
          className="text-4xl font-light mt-6"
          style={{ opacity: 0.4, letterSpacing: -1 }}
        >
          Settings
        </Text>

        <HStack className="mt-6" style={{ gap: 10, flexWrap: 'wrap' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                testID={`tab-${tab.id}`}
                onPress={() => setActiveTab(tab.id)}
                className="flex-row items-center rounded-full"
                style={{
                  backgroundColor: isActive ? '#1a1a1a' : '#ffffff',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  gap: 6,
                }}
              >
                <Text style={{ color: isActive ? '#ffffff' : '#1a1a1a', fontSize: 14 }}>
                  {tab.label}
                </Text>
                {isActive ? (
                  <CaretDown size={14} color="#ffffff" weight="regular" />
                ) : (
                  <CaretRight size={14} color="#1a1a1a" weight="regular" />
                )}
              </Pressable>
            );
          })}
        </HStack>

        {activeTab === 'account' && <AccountSection />}
        {activeTab === 'notifications' && <NotificationsSection />}
        {activeTab === 'activation' && <ActivationSection />}
      </ScrollView>
    </Box>
  );
}
