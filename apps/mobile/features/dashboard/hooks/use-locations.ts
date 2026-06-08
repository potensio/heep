import { useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchLocations } from '../api/locations.api';

export function useLocations() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  return useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    enabled: ready,
    staleTime: 1000 * 60 * 10,
  });
}
