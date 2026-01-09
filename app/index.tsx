import { Redirect } from "expo-router";

export default function Index() {
  // Always show onboarding screen for now
  return <Redirect href="/(onboarding)" />;
}
