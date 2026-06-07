import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SignOut, X } from 'phosphor-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <VStack style={{ marginBottom: 16 }}>
      <Text className="text-xs" style={{ color: '#666666', marginBottom: 6 }}>
        {label}
      </Text>
      <View
        className="rounded-full px-4 justify-center"
        style={{ backgroundColor: '#e5e5e5', height: 48 }}
      >
        <Text className="text-base text-foreground">{value}</Text>
      </View>
    </VStack>
  );
}

export function AccountSection() {
  const router = useRouter();

  return (
    <View testID="account-section" className="bg-white rounded-[32px] p-6 mt-6">
      <Text className="text-xl font-semibold" style={{ marginBottom: 16 }}>
        Account
      </Text>

      <ProfileField label="First Name" value="Hanif" />
      <ProfileField label="Last Name" value="Yaskur" />
      <ProfileField label="Email" value="hanifyaskur@gmail.com" />

      <Pressable
        onPress={() => router.replace('/auth')}
        className="flex-row items-center rounded-full self-start"
        style={{ backgroundColor: '#f4a89a', paddingHorizontal: 20, paddingVertical: 14, gap: 8, marginBottom: 12 }}
      >
        <Text className="text-base" style={{ color: '#c0392b' }}>
          Log out
        </Text>
        <SignOut size={18} color="#c0392b" weight="regular" />
      </Pressable>

      <Pressable
        className="flex-row items-center rounded-full self-start"
        style={{ backgroundColor: '#fcd5cf', paddingHorizontal: 20, paddingVertical: 14, gap: 8 }}
      >
        <Text className="text-base" style={{ color: '#c0392b' }}>
          Delete my account
        </Text>
        <X size={18} color="#c0392b" weight="regular" />
      </Pressable>
    </View>
  );
}
