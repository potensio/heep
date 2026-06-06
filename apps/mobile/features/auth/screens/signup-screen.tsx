import { View, Text } from "react-native";

interface SignupScreenProps {
  onSubmit: (email: string) => void;
  onGuestLogin?: () => void;
}

export function SignupScreen({ onSubmit, onGuestLogin }: SignupScreenProps) {
  return (
    <View>
      <Text>SignupScreen</Text>
    </View>
  );
}
