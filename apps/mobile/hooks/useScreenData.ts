import { useState, useEffect, useRef } from "react";
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
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const data = await fetcher();
        if (isMounted.current) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (isMounted.current) {
          setState({ data: null, loading: false, error: error as Error });
        }
      }
    });

    return () => {
      isMounted.current = false;
      task.cancel();
    };
  }, []);

  return state;
}
