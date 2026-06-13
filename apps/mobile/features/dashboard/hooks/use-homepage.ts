import { useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchHomepageStats } from '../api/homepage.api';

export function useHomepage(restaurantId?: string) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  return useQuery({
    queryKey: ['homepage', restaurantId],
    queryFn: () => fetchHomepageStats(restaurantId),
    enabled: ready,
    staleTime: 1000 * 60 * 5,
  });
}
