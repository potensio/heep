import { useState } from "react";
import { Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SignOutIcon, TrashIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";

function ProfileField({
  label,
  value,
  onChangeText,
  disabled,
}: {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <VStack>
      <Text className="text-xs" style={{ color: "#666666", marginBottom: 6 }}>
        {label}
      </Text>
      <Box
        className="rounded-full px-4 justify-center"
        style={{
          backgroundColor: disabled ? "#f5f5f5" : "#e5e5e5",
          height: 48,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          style={{
            flex: 1,
            fontSize: 16,
            color: disabled ? "#999999" : "#1a1a1a",
            paddingVertical: 0,
            backgroundColor: "transparent",
          }}
        />
      </Box>
    </VStack>
  );
}

export function AccountSection() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("Hanif");
  const [lastName, setLastName] = useState("Yaskur");

  return (
    <VStack testID="account-section">
      <Text className="text-xl tracking-tighter">Account</Text>

      <Box className="bg-white rounded-[32px] p-6 mt-4">
        <HStack style={{ gap: 12, marginBottom: 16 }}>
          <Box style={{ flex: 1 }}>
            <ProfileField label="First Name" value={firstName} onChangeText={setFirstName} />
          </Box>
          <Box style={{ flex: 1 }}>
            <ProfileField label="Last Name" value={lastName} onChangeText={setLastName} />
          </Box>
        </HStack>
        <ProfileField label="Email" value="hanifyaskur@gmail.com" disabled />

        <Pressable
          onPress={() => router.replace("/auth")}
          className="flex-row items-center rounded-full self-start mt-5 bg-danger/10"
          style={{
            paddingHorizontal: 20,
            paddingVertical: 14,
            gap: 8,
          }}
        >
          <Text className="text-base text-danger">Log out</Text>
          <SignOutIcon size={18} color="#FB2C36" />
        </Pressable>
      </Box>

      {/* Danger Zone */}
      <VStack className="mt-6">
        <Text className="text-xl tracking-tighter">Danger Zone</Text>

        <Box
          className="bg-white rounded-[32px] p-6 mt-4"
          style={{ borderWidth: 1, borderColor: "#fecaca" }}
        >
          <Text
            className="text-sm mb-4"
            style={{ color: "#666666", lineHeight: 20 }}
          >
            Once you delete your account, there is no going back. Please be
            certain.
          </Text>

          <Pressable
            className="flex-row items-center rounded-full self-start"
            style={{
              backgroundColor: "#fef2f2",
              paddingHorizontal: 20,
              paddingVertical: 14,
              gap: 8,
            }}
          >
            <Text className="text-base text-danger">Delete my account</Text>
            <TrashIcon size={18} color="#FB2C36" />
          </Pressable>
        </Box>
      </VStack>
    </VStack>
  );
}
