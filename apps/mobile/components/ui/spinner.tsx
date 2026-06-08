import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { SpinnerIcon } from 'phosphor-react-native';

type Props = {
  size?: number;
  color?: string;
  duration?: number;
};

export function Spinner({ size = 24, color = '#A3A3A3', duration = 600 }: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration, easing: Easing.linear }),
      -1,
    );
    return () => cancelAnimation(rotation);
  }, [duration]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <SpinnerIcon size={size} color={color} weight="regular" />
    </Animated.View>
  );
}
