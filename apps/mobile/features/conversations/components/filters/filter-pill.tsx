import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { CheckIcon } from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { usePopIn } from "./use-pop-in";
import type { FilterDef } from "./filter-config";

interface FilterPillProps {
  filter: FilterDef;
  /** Already-translated label text (parent resolves the i18n key). */
  label: string;
  /** Position in the cascade, controls entrance delay. */
  index: number;
  visible: boolean;
  selected: boolean;
  /** Number of selected options for sheet-opening (combo) pills. */
  count?: number;
  onPress: () => void;
}

/**
 * A single filter pill. Combo pills render a tinted icon circle next to a
 * label pill; channel pills render an inline icon inside one pill.
 */
export function FilterPill({
  filter,
  label,
  index,
  visible,
  selected,
  count = 0,
  onPress,
}: FilterPillProps) {
  const style = usePopIn(index, visible);
  const { Icon, color, combo } = filter;

  // Press feedback lives on a separate inner view so it never fights the
  // entrance transform on the outer Animated.View.
  const pressed = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.25,
    transform: [{ scale: 1 - pressed.value * 0.05 }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 90 });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: 160 });
        }}
      >
        <Animated.View style={pressStyle}>
          {combo && Icon && color ? (
          <HStack className="items-center" style={{ gap: 8 }}>
            <Box
              className="rounded-full items-center justify-center"
              style={{ width: 48, height: 48, backgroundColor: `${color}2E` }}
            >
              <Icon size={20} color={color} weight="fill" />
            </Box>
            <HStack
              className={`items-center rounded-full ${count > 0 ? "bg-foreground" : "bg-white"}`}
              style={{ paddingHorizontal: 24, paddingVertical: 13, gap: 8 }}
            >
              <Text
                className={`text-sm ${count > 0 ? "text-background" : "text-foreground"}`}
              >
                {label}
              </Text>
              {count > 0 && (
                <Box
                  className="rounded-full bg-white items-center justify-center"
                  style={{ minWidth: 20, height: 20, paddingHorizontal: 6 }}
                >
                  <Text className="text-2xs text-foreground">{count}</Text>
                </Box>
              )}
            </HStack>
          </HStack>
        ) : (
          <HStack
            className={`items-center rounded-full ${selected ? "bg-foreground" : "bg-white"}`}
            style={{ gap: 8, paddingHorizontal: 20, paddingVertical: 13 }}
          >
            {Icon && color && (
              <Icon size={20} color={selected ? "#fff" : color} weight="fill" />
            )}
            <Text
              className={`text-sm ${selected ? "text-background" : "text-foreground"}`}
            >
              {label}
            </Text>
            {selected && <CheckIcon size={16} color="#fff" weight="bold" />}
          </HStack>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
