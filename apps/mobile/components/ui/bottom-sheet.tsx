import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
} from "react-native-reanimated";
import {
  BottomSheetBackdropProps,
  BottomSheetModal,
  useBottomSheet,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
}

function CustomBackdrop({ animatedIndex, style }: BottomSheetBackdropProps) {
  const { close } = useBottomSheet();

  const animatedProps = useAnimatedProps(() => ({
    intensity: interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 55],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <AnimatedBlurView
      animatedProps={animatedProps}
      style={[style, StyleSheet.absoluteFill]}
      tint="dark"
    >
      <Pressable
        testID="bottom-sheet-backdrop"
        style={StyleSheet.absoluteFill}
        onPress={close}
      />
    </AnimatedBlurView>
  );
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  ({ children, snapPoints = ["40%"] }, ref) => {
    const modalRef = useRef<BottomSheetModal>(null);

    const animConfig = useBottomSheetTimingConfigs({
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    useImperativeHandle(ref, () => ({
      open: () => modalRef.current?.present(),
      close: () => modalRef.current?.dismiss(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => <CustomBackdrop {...props} />,
      []
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#000" }}
        handleComponent={() => null}
        animationConfigs={animConfig}
      >
        {children}
      </BottomSheetModal>
    );
  }
);

BottomSheet.displayName = "BottomSheet";
