import { View, Image, Dimensions, FlatList, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { useCallback, useRef, useState, useEffect } from "react";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Fixed height 180, 4:3 ratio => width = height * 4/3 = 240
const CARD_HEIGHT = 180;
const CARD_WIDTH = CARD_HEIGHT * (4 / 3); // = 240
const SPACING = 4; // minimal gap between cards
const PEEK_VISIBLE = 28; // pixels of prev/next card visible on edges

// Total width for snapping (card + its margin contribution)
const SNAP_INTERVAL = CARD_WIDTH + SPACING;
// Padding to center the active card
const HORIZONTAL_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2 - PEEK_VISIBLE;

const BANNERS = [
  { id: "1", source: require("@/public/fonts/banner-1.png") },
  { id: "2", source: require("@/public/fonts/banner-2.png") },
  { id: "3", source: require("@/public/fonts/banner-3.png") },
];

// Extended array: [last, ...banners, ...banners, ...banners, first]
const EXTENDED_BANNERS = [
  BANNERS[BANNERS.length - 1],
  ...BANNERS,
  ...BANNERS,
  ...BANNERS,
  BANNERS[0],
];

function BannerItem({
  item,
  index,
  scrollX,
  onPress,
}: {
  item: (typeof BANNERS)[0];
  index: number;
  scrollX: SharedValue<number>;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
    ];

    const scale = interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], "clamp");
    const opacity = interpolate(scrollX.value, inputRange, [0.6, 1, 0.6], "clamp");

    return {
      transform: [{ scale: withSpring(scale) }],
      opacity,
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            marginHorizontal: SPACING / 2,
            borderRadius: 16,
            overflow: "hidden",
          },
          animatedStyle,
        ]}
      >
        <Image source={item.source} className="w-full h-full" resizeMode="cover" />
      </Animated.View>
    </Pressable>
  );
}

export function BannerCarousel() {
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAutoPlaying = useRef(true);
  const currentScrollIndex = useRef(5);

  // Start in middle of middle set
  const initialScrollIndex = 5;

  const getRealIndexFromScrollIndex = useCallback((scrollIndex: number) => {
    if (scrollIndex === 0) return BANNERS.length - 1;
    if (scrollIndex === EXTENDED_BANNERS.length - 1) return 0;
    const adjustedIndex = scrollIndex - 1;
    return adjustedIndex % BANNERS.length;
  }, []);

  const normalizeToMiddleSet = useCallback((scrollIndex: number) => {
    if (scrollIndex >= 1 && scrollIndex <= 3) {
      return scrollIndex + BANNERS.length;
    }
    if (scrollIndex >= 7 && scrollIndex <= 9) {
      return scrollIndex - BANNERS.length;
    }
    return scrollIndex;
  }, []);

  const handleScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      scrollX.value = offsetX;
      const scrollIndex = Math.round(offsetX / SNAP_INTERVAL);
      currentScrollIndex.current = scrollIndex;
      const realIndex = getRealIndexFromScrollIndex(scrollIndex);
      setActiveIndex(realIndex);
    },
    [scrollX, getRealIndexFromScrollIndex]
  );

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const scrollIndex = Math.round(offsetX / SNAP_INTERVAL);
      const normalizedIndex = normalizeToMiddleSet(scrollIndex);
      if (normalizedIndex !== scrollIndex) {
        flatListRef.current?.scrollToIndex({
          index: normalizedIndex,
          animated: false,
        });
        currentScrollIndex.current = normalizedIndex;
      }
    },
    [normalizeToMiddleSet]
  );

  const goToSlide = useCallback((realIndex: number, animated = true) => {
    const targetScrollIndex = BANNERS.length + 1 + realIndex;
    flatListRef.current?.scrollToIndex({
      index: targetScrollIndex,
      animated,
    });
    currentScrollIndex.current = targetScrollIndex;
    setActiveIndex(realIndex);
  }, []);

  const goToNext = useCallback(() => {
    const nextScrollIndex = currentScrollIndex.current + 1;
    const normalizedNext = normalizeToMiddleSet(nextScrollIndex);
    flatListRef.current?.scrollToIndex({
      index: nextScrollIndex,
      animated: true,
    });
    currentScrollIndex.current = nextScrollIndex;
    if (normalizedNext !== nextScrollIndex) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: normalizedNext,
          animated: false,
        });
        currentScrollIndex.current = normalizedNext;
      }, 300);
    }
  }, [normalizeToMiddleSet]);

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      if (isAutoPlaying.current) {
        goToNext();
      }
    }, 3000);
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [goToNext]);

  const handleTouchStart = useCallback(() => {
    isAutoPlaying.current = false;
  }, []);

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => {
      isAutoPlaying.current = true;
    }, 5000);
  }, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SNAP_INTERVAL,
      offset: SNAP_INTERVAL * index,
      index,
    }),
    []
  );

  return (
    <View className="py-4">
      <FlatList
        ref={flatListRef}
        data={EXTENDED_BANNERS}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        decelerationRate={0.9}
        disableIntervalMomentum={true}
        initialScrollIndex={initialScrollIndex}
        getItemLayout={getItemLayout}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          alignItems: 'center',
        }}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <BannerItem
            item={item}
            index={index}
            scrollX={scrollX}
            onPress={() => goToSlide(getRealIndexFromScrollIndex(index))}
          />
        )}
      />

      <View className="flex-row justify-center gap-2 mt-4">
        {BANNERS.map((_, index) => (
          <Pressable key={index} onPress={() => goToSlide(index)}>
            <View
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index ? "w-4 bg-black" : "w-2 bg-black/30"
              }`}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
