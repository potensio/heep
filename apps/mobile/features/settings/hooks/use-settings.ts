import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { getStoredUser, saveUser } from '@/features/auth/store/auth.store';
import {
  updateAccount,
  fetchNotifications,
  fetchActivation,
  updateActivation,
  updateNotificationActivation,
  type RestaurantSetting,
} from '../api/settings.api';

export function useUpdateAccount() {
  return useMutation({
    mutationFn: ({ firstName, lastName }: { firstName: string; lastName: string }) =>
      updateAccount(firstName, lastName),
    onSuccess: async (_, { firstName, lastName }) => {
      const user = await getStoredUser();
      if (user) {
        const updated = { ...user, first_name: firstName, last_name: lastName };
        await saveUser(updated);
        queryClient.setQueryData(['me'], updated);
      }
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: fetchNotifications,
    staleTime: 1000 * 60 * 5,
  });
}

export function useActivation() {
  return useQuery({
    queryKey: ['settings', 'activation'],
    queryFn: fetchActivation,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateActivation() {
  return useMutation({
    mutationFn: ({ restaurantId, isActivated }: { restaurantId: string; isActivated: boolean }) =>
      updateActivation(restaurantId, isActivated),
    onMutate: async ({ restaurantId, isActivated }) => {
      await queryClient.cancelQueries({ queryKey: ['settings', 'activation'] });
      const previous = queryClient.getQueryData<RestaurantSetting[]>(['settings', 'activation']);
      queryClient.setQueryData<RestaurantSetting[]>(['settings', 'activation'], (old = []) =>
        old.map(r => r.restaurant_id === restaurantId ? { ...r, is_active: isActivated } : r)
      );
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['settings', 'activation'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'activation'] });
    },
  });
}

export function useUpdateNotificationActivation() {
  return useMutation({
    mutationFn: ({ restaurantId, isActivated }: { restaurantId: string; isActivated: boolean }) =>
      updateNotificationActivation(restaurantId, isActivated),
    onMutate: async ({ restaurantId, isActivated }) => {
      await queryClient.cancelQueries({ queryKey: ['settings', 'notifications'] });
      const previous = queryClient.getQueryData<RestaurantSetting[]>(['settings', 'notifications']);
      queryClient.setQueryData<RestaurantSetting[]>(['settings', 'notifications'], (old = []) =>
        old.map(r => r.restaurant_id === restaurantId ? { ...r, is_active: isActivated } : r)
      );
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['settings', 'notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
    },
  });
}
