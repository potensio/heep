import { LoginFormData, SignupFormData } from './schemas/auth-schemas';

export type { LoginFormData, SignupFormData };

export interface LoginScreenProps {
  onSubmit: (data: LoginFormData) => void;
  onNavigateToSignup: () => void;
  isLoading?: boolean;
}

export interface SignupScreenProps {
  onSubmit: (data: SignupFormData) => void;
  onNavigateToLogin: () => void;
  isLoading?: boolean;
}
