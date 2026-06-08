import { useMutation, useQuery } from '@tanstack/react-query';
import { loginApi, signupApi, type AuthUser } from '../api/auth.api';
import { saveTokens, clearTokens, saveUser, getStoredUser } from '../store/auth.store';
import { queryClient } from '@/lib/query-client';

const ME_KEY = ['me'] as const;

export function useAuthStatus() {
  const { data: user, isPending } = useQuery<AuthUser | null>({
    queryKey: ME_KEY,
    queryFn: getStoredUser,
    staleTime: Infinity,
  });
  return { user: user ?? null, isPending };
}

export function useCurrentUser() {
  return useAuthStatus().user;
}

async function onAuthSuccess(accessToken: string, refreshToken: string, user: AuthUser) {
  await Promise.all([saveTokens(accessToken, refreshToken), saveUser(user)]);
  queryClient.setQueryData(ME_KEY, user);
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: async ({ accessToken, refreshToken, user }) => {
      await onAuthSuccess(accessToken, refreshToken, user);
    },
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: ({
      firstName,
      lastName,
      email,
      password,
    }: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => signupApi(firstName, lastName, email, password),
    onSuccess: async ({ accessToken, refreshToken, user }) => {
      await onAuthSuccess(accessToken, refreshToken, user);
    },
  });
}

export function useLogout() {
  return async () => {
    await clearTokens();
    queryClient.setQueryData(ME_KEY, null);
  };
}
