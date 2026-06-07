import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import {
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetModal,
  useBottomSheet,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";

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

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        testID="bottom-sheet-backdrop"
        style={StyleSheet.absoluteFill}
        onPress={close}
      />
      <BlurView
        intensity={50}
        style={StyleSheet.absoluteFill}
        tint="dark"
        pointerEvents="none"
      />
    </Animated.View>
  );
}

function SheetBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <View style={[style, styles.sheetBackground]}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
    </View>
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

    const renderBackground = useCallback(
      (props: BottomSheetBackgroundProps) => <SheetBackground {...props} />,
      []
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundComponent={renderBackground}
        handleComponent={() => null}
        animationConfigs={animConfig}
      >
        {children}
      </BottomSheetModal>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

const styles = StyleSheet.create({
  sheetBackground: {
    overflow: "hidden",
  },
});
