import { LoginFormData, SignupFormData, OtpFormData } from './schemas/auth-schemas';

export type { LoginFormData, SignupFormData, OtpFormData };

export type AuthFlowType = 'login' | 'signup';

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

export interface OtpScreenProps {
  email: string;
  type: AuthFlowType;
  onSubmit: (data: OtpFormData) => void;
  onResendOtp: () => void;
  isLoading?: boolean;
}
