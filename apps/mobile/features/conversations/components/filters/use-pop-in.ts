import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/** Delay between each pill's entrance, in ms. */
export const STAGGER = 35;
/** Small beat after the backdrop appears before pills start cascading in. */
export const ENTER_DELAY = 110;

/**
 * Staggered spring-in / quick fade-out for an item at `index`, driven by
 * `visible`. Returns an animated style to spread onto an Animated.View.
 */
export function usePopIn(index: number, visible: boolean) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = visible
      ? withDelay(
          ENTER_DELAY + index * STAGGER,
          withSpring(1, { damping: 10, stiffness: 220, mass: 0.7 }),
        )
      : withTiming(0, { duration: 110 });
  }, [visible, index, v]);

  return useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [
      { translateY: (1 - v.value) * 10 },
      { scale: 0.94 + v.value * 0.06 },
    ],
  }));
}
