import { useCallback, useState, useEffect } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SignOutIcon, TrashIcon } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { useLogout, useCurrentUser } from "@/features/auth/hooks/use-auth";
import { queryClient } from "@/lib/query-client";
import { useUpdateAccount } from "../hooks/use-settings";

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
  const logout = useLogout();
  const user = useCurrentUser();
  const updateAccount = useUpdateAccount();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    queryClient.removeQueries({ queryKey: ['conversations'] });
    await logout();
  }, [logout]);

  const handleSave = useCallback(() => {
    updateAccount.mutate(
      { firstName, lastName },
      {
        onSuccess: () => Toast.show({ type: "success", text1: "Profile saved" }),
        onError: () => Toast.show({ type: "error", text1: "Failed to save. Try again." }),
      }
    );
  }, [firstName, lastName, updateAccount]);

  return (
    <View style={{ flex: 1 }}>
      <VStack testID="account-section">
        <Text className="text-xl tracking-tighter">Account</Text>

        <Box className="bg-white rounded-[32px] p-6 mt-4">
          <HStack style={{ gap: 12, marginBottom: 16 }}>
            <Box style={{ flex: 1 }}>
              <ProfileField
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
            </Box>
            <Box style={{ flex: 1 }}>
              <ProfileField
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
            </Box>
          </HStack>
          <ProfileField label="Email" value={user?.email ?? ""} disabled />

          <Pressable
            onPress={handleSave}
            disabled={updateAccount.isPending}
            className="rounded-full self-start mt-4"
            style={{
              backgroundColor: "#1a1a1a",
              paddingHorizontal: 24,
              paddingVertical: 12,
              opacity: updateAccount.isPending ? 0.6 : 1,
            }}
          >
            <Text className="text-base text-white font-medium">
              {updateAccount.isPending ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </Box>

        {/* Logout */}
        <VStack className="mt-6">
          <Text className="text-xl tracking-tighter">Session</Text>

          <Box className="bg-white rounded-[32px] p-6 mt-4">
            <Text
              className="text-sm mb-4"
              style={{ color: "#666666", lineHeight: 20 }}
            >
              End your current session and sign out of your account.
            </Text>

            <Pressable
              onPress={handleLogout}
              className="flex-row items-center rounded-full self-start"
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                paddingHorizontal: 20,
                paddingVertical: 14,
                gap: 8,
              }}
            >
              <Text className="text-base text-foreground">Log out</Text>
              <SignOutIcon size={18} color="#1a1a1a" />
            </Pressable>
          </Box>
        </VStack>

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
    </View>
  );
}
