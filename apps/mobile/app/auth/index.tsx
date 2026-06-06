import { View, Text, StyleSheet } from "react-native";
import { EmailScreen } from "@/features/auth/screens/EmailScreen";

export default function AuthIndex() {
  return (
    <EmailScreen
      onSubmit={(email) => {
        console.log("Email submitted:", email);
        // TODO: Navigate or handle submission
      }}
    />
  );
}
