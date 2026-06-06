import { withSpring, withTiming, Easing } from "react-native-reanimated";

export const spring = (toValue: number) =>
  withSpring(toValue, {
    damping: 20,
    stiffness: 200,
  });

export const timing = (toValue: number, duration = 250) =>
  withTiming(toValue, {
    duration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

export const fadeIn = () => timing(1, 200);

export const fadeOut = () => timing(0, 150);
