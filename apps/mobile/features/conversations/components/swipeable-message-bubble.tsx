import React, { memo, useCallback, useRef } from 'react';
import { Pressable } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { QuestionIcon, WarningCircleIcon } from 'phosphor-react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import type { Message } from '../types';

const ACTION_WIDTH = 110;
const PANEL_WIDTH = ACTION_WIDTH * 2;
// Covers the gap at the screen edge while the spring overshoots past the open position
const OVERSHOOT_BLEED = 60;

const SNAP_SPRING = {
  mass: 1,
  damping: 18,
  stiffness: 220,
  overshootClamping: false,
};

type ActionButtonProps = {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  onPress: () => void;
};

function ActionButton({ label, icon, bgClass, onPress }: ActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={{ width: ACTION_WIDTH }}>
      <VStack
        className={`flex-1 items-center justify-center ${bgClass}`}
        style={{ gap: 8 }}
      >
        {icon}
        <Text className="text-white text-xs text-center px-2">{label}</Text>
      </VStack>
    </Pressable>
  );
}

type RightActionsProps = {
  progress: SharedValue<number>;
  translation: SharedValue<number>;
  onClose: () => void;
};

function RightActions({ progress, translation, onClose }: RightActionsProps) {
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.value + PANEL_WIDTH }],
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.6, 1]),
  }));

  return (
    <Reanimated.View
      style={[{ width: PANEL_WIDTH, flexDirection: 'row', marginBottom: 8 }, panelStyle]}
    >
      <ActionButton
        label="Add a new FAQ"
        icon={<QuestionIcon size={24} color="#FFFFFF" weight="regular" />}
        bgClass="bg-[#4A6660]"
        onPress={onClose}
      />
      <ActionButton
        label="Report"
        icon={<WarningCircleIcon size={24} color="#FFFFFF" weight="regular" />}
        bgClass="bg-black"
        onPress={onClose}
      />
      <Box
        className="bg-black"
        style={{ position: 'absolute', left: PANEL_WIDTH, top: 0, bottom: 0, width: OVERSHOOT_BLEED }}
      />
    </Reanimated.View>
  );
}

type SwipeableMessageBubbleProps = {
  message: Message;
  onSwipeOpen: (methods: SwipeableMethods) => void;
};

export const SwipeableMessageBubble = memo(
  ({ message, onSwipeOpen }: SwipeableMessageBubbleProps) => {
    const swipeableRef = useRef<SwipeableMethods>(null);

    const isBot = message.sent_by === 'bot';
    const isManual = message.is_manual_response;
    const time = message.sent_at
      ? new Date(message.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '';

    const bubbleBg = isBot ? (isManual ? 'bg-black' : 'bg-[#4A6660]') : 'bg-white';

    const closeSwipeable = useCallback(() => {
      swipeableRef.current?.close();
    }, []);

    const renderRightActions = useCallback(
      (progress: SharedValue<number>, translation: SharedValue<number>) => (
        <RightActions progress={progress} translation={translation} onClose={closeSwipeable} />
      ),
      [closeSwipeable],
    );

    const handleWillOpen = useCallback(() => {
      if (swipeableRef.current) onSwipeOpen(swipeableRef.current);
    }, [onSwipeOpen]);

    return (
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={40}
        overshootFriction={8}
        animationOptions={SNAP_SPRING}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={handleWillOpen}
      >
        <Box className={`px-4 mb-2 ${isBot ? 'items-end' : 'items-start'}`}>
          <Box
            className={`rounded-[20px] px-4 py-3 max-w-[78%] ${bubbleBg}`}
            style={{
              borderBottomRightRadius: isBot ? 4 : 20,
              borderBottomLeftRadius: isBot ? 20 : 4,
            }}
          >
            <Text className={`text-sm leading-5 ${isBot ? 'text-white' : 'text-foreground'}`}>
              {message.text}
            </Text>
          </Box>
          <Text className="text-muted text-xs mt-1 px-1">{time}</Text>
        </Box>
      </ReanimatedSwipeable>
    );
  },
);

SwipeableMessageBubble.displayName = 'SwipeableMessageBubble';
