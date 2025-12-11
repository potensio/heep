import type { ComponentType } from "react";
import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image, ImageProps } from "expo-image";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { OneSignal } from "react-native-onesignal";

// Workaround for expo-image type incompatibility with React 19
const ExpoImage = Image as unknown as ComponentType<ImageProps>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: 1,
    illustration: require("@/assets/images/onboarding-3-illustration-3420cb.png"),
    title: "One app, two experiences",
    description:
      "Access both hotel booking and the Swiss-Belexecutive Member Zone in a single platform. Choose your journey right after signing in.",
  },
  {
    id: 2,
    illustration: require("@/assets/images/onboarding-1-illustration-631234.png"),
    title: "Enable Notification",
    description:
      "Stay updated with exclusive offers, booking confirmations, and important updates. Never miss a moment.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const carouselRef = useRef<ICarouselInstance>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const requestNotificationPermission = async (): Promise<void> => {
    try {
      // Check if permission already granted
      const hasPermission = await OneSignal.Notifications.getPermissionAsync();

      if (hasPermission) {
        // Already granted - just ensure subscription is active
        OneSignal.User.pushSubscription.optIn();
      } else {
        // Request permission - will show system popup
        await OneSignal.Notifications.requestPermission(true);
      }
    } catch (error) {
      console.error("Permission request error:", error);
    } finally {
      router.replace("/(tabs)");
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      carouselRef.current?.next();
    } else {
      requestNotificationPermission();
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const buttonText = isLastSlide ? "I'm in" : "Next";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-between py-12 px-4">
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
            renderItem={({ item }: { item: (typeof SLIDES)[number] }) => (
              <SlideContent item={item} />
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
              {buttonText}
            </Text>
          </TouchableOpacity>

          {isLastSlide && (
            <TouchableOpacity
              className="bg-white rounded-[10px] border border-primary p-4 items-center"
              onPress={handleSkip}
            >
              <Text className="text-primary text-sm font-medium leading-5">
                Maybe later
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function SlideContent({ item }: { item: (typeof SLIDES)[0] }) {
  return (
    <View className="flex-1 items-center justify-center px-4">
      <View className="w-[358px] items-center">
        <ExpoImage
          source={item.illustration}
          style={{ width: 320, aspectRatio: 7 / 5, borderRadius: 12 }}
          contentFit="contain"
        />
        <Text className="text-text-primary text-2xl font-semibold text-center mt-3">
          {item.title}
        </Text>
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
      className={`h-1 rounded-full ${
        isActive ? "w-8 bg-primary" : "w-5 bg-primary/30"
      }`}
    />
  );
}
