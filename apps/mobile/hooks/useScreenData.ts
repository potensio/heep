import { useState, useEffect } from "react";
import { InteractionManager } from "react-native";

interface ScreenDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useScreenData<T>(
  fetcher: () => Promise<T>
): ScreenDataState<T> {
  const [state, setState] = useState<ScreenDataState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const data = await fetcher();
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({ data: null, loading: false, error: error as Error });
      }
    });

    return () => task.cancel();
  }, []);

  return state;
}
