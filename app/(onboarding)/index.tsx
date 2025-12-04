import type { ComponentType } from "react";
import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image, ImageProps } from "expo-image";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";

// Workaround for expo-image type incompatibility with React 19
const ExpoImage = Image as unknown as ComponentType<ImageProps>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: 1,
    illustration: require("@/assets/images/onboarding-1-illustration-631234.png"),
    title: "Seamless hotel booking",
    description:
      "Enjoy a smoother and faster way to plan your stay. Browse room options, explore hotel facilities, and unlock exclusive offers directly through your app.",
  },
  {
    id: 2,
    illustration: require("@/assets/images/onboarding-2-illustration-5e770b.png"),
    title: "Access a world of exclusive Swiss-Belexecutive member benefits",
    description:
      "Track your visits, monitor your tier progress, and enjoy access to over 1000 member-only vouchers along with personalized offers crafted to elevate your stay.",
  },
  {
    id: 3,
    illustration: require("@/assets/images/onboarding-3-illustration-3420cb.png"),
    title: "One app, two experiences",
    description:
      "Access both hotel booking and the Swiss-Belexecutive Member Zone in a single platform. Choose your journey right after signing in.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const carouselRef = useRef<ICarouselInstance>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      carouselRef.current?.next();
    } else {
      // Last slide - continue to main app
      router.replace("/(tabs)");
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-between py-12">
        {/* Logo */}
        <ExpoImage
          source={require("@/assets/images/swissbel-logo.svg")}
          style={{ width: 209.53, height: 43.29 }}
          className="mt-[52px]"
          contentFit="contain"
        />

        {/* Carousel Content */}
        <View className="flex-1 w-full items-center justify-center mb-8">
          <Carousel
            ref={carouselRef}
            width={SCREEN_WIDTH}
            height={400}
            data={SLIDES}
            onSnapToItem={(index: number) => setCurrentIndex(index)}
            renderItem={({
              item,
              index,
            }: {
              item: (typeof SLIDES)[number];
              index: number;
            }) => (
              <SlideContent
                item={item}
                index={index}
                currentIndex={currentIndex}
              />
            )}
          />

          {/* Dot Indicators */}
          <View className="flex-row gap-2 mt-3">
            {SLIDES.map((_, index) => (
              <DotIndicator
                key={index}
                index={index}
                currentIndex={currentIndex}
              />
            ))}
          </View>
        </View>

        {/* Buttons */}
        <View className="w-[358px] gap-2.5">
          <TouchableOpacity
            className="bg-primary rounded-[10px] p-4 items-center"
            onPress={handleNext}
          >
            <Text className="text-white font-medium leading-5">
              {isLastSlide ? "Continue" : "Next"}
            </Text>
          </TouchableOpacity>

          {!isLastSlide && (
            <TouchableOpacity
              className="bg-white rounded-[10px] border border-primary p-4 items-center"
              onPress={handleSkip}
            >
              <Text className="text-primary text-sm font-medium leading-5">
                Skip
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function SlideContent({
  item,
  index,
  currentIndex,
}: {
  item: (typeof SLIDES)[0];
  index: number;
  currentIndex: number;
}) {
  return (
    <View className="flex-1 items-center justify-center px-4">
      <View className="w-[358px] items-center">
        {/* Illustration */}
        <ExpoImage
          source={item.illustration}
          style={{ width: 320, height: 225 }}
          contentFit="contain"
        />

        {/* Title */}
        <Text className="text-text-primary text-2xl font-semibold text-center mt-3">
          {item.title}
        </Text>

        {/* Description */}
        <Text className="text-text-secondary text-center leading-relaxed mt-4">
          {item.description}
        </Text>
      </View>
    </View>
  );
}

function DotIndicator({
  index,
  currentIndex,
}: {
  index: number;
  currentIndex: number;
}) {
  const isActive = index === currentIndex;

  return (
    <View
      className={`h-1 rounded-full transition-all ${
        isActive ? "w-8 bg-primary" : "w-5 bg-primary/30"
      }`}
    />
  );
}
