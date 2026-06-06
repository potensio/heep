import { SignupScreen } from "@/features/auth/screens/signup-screen";

export default function AuthSignup() {
  return (
    <SignupScreen
      onSubmit={(email) => {
        console.log("Email submitted:", email);
        // TODO: Navigate or handle submission
      }}
    />
  );
}
