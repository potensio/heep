import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { ArrowRightIcon } from "phosphor-react-native";
import { timing } from "@/lib/animations";

const DEFAULT_BG = "rgba(255,255,255,0.30)";
const PRESSED_BG = "#FFFFFF";
const PRESSED_FG = "#2A2825";
const BORDER_COLOR = "rgba(255,255,255,0.30)";
const GAP = 6;

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AuthButton({
  label,
  onPress,
  isLoading = false,
  isDisabled = false,
  style,
}: AuthButtonProps) {
  const pressed = useSharedValue(0);
  const disabled = isDisabled || isLoading;

  const ringStyle = useAnimatedStyle(() => ({
    borderWidth: interpolate(pressed.value, [0, 1], [1, 2]),
    borderColor: BORDER_COLOR,
  }));

  const innerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      [DEFAULT_BG, PRESSED_BG],
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(pressed.value, [0, 1], ["#FFFFFF", PRESSED_FG]),
  }));

  const whiteIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressed.value, [0, 1], [1, 0]),
    position: "absolute",
  }));

  const darkIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressed.value, [0, 1], [0, 1]),
    position: "absolute",
  }));

  return (
    <Pressable
      onPressIn={() => {
        pressed.value = timing(1, 100);
      }}
      onPressOut={() => {
        pressed.value = timing(0, 150);
      }}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={style}
    >
      <Animated.View
        style={[
          {
            borderRadius: 9999,
            padding: GAP,
            alignSelf: "flex-start",
          },
          ringStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderRadius: 9999,
              paddingHorizontal: 20,
              paddingVertical: 8,
            },
            innerStyle,
          ]}
        >
          <Animated.Text
            style={[
              { fontSize: 16, fontWeight: "400", fontFamily: "DM-Sans" },
              textStyle,
            ]}
          >
            {label}
          </Animated.Text>

          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={{ width: 16, height: 16 }}>
              <Animated.View style={whiteIconStyle}>
                <ArrowRightIcon size={16} color="#FFFFFF" />
              </Animated.View>
              <Animated.View style={darkIconStyle}>
                <ArrowRightIcon size={16} color={PRESSED_FG} />
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
