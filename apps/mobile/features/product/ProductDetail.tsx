import { View, Text, Image, ScrollView, TouchableOpacity, FlatList, Dimensions, Modal } from "react-native";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { useCallback, useRef, useState, useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ProductDetailData {
  name: string;
  price: number;
  description: string;
  photos: string[];
  category?: string;
  condition?: string;
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
}

interface ProductDetailProps {
  product: ProductDetailData;
  showSeller?: boolean;
  onSellerPress?: () => void;
  footerContent?: React.ReactNode;
  isSaved?: boolean;
  onSaveToggle?: () => void;
  isSaving?: boolean;
  footerPaddingBottom?: number;
}

function formatRupiah(value: number): string {
  if (!value || value === 0) return "Rp 0";
  return "Rp " + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Fullscreen image preview item with pinch-to-zoom
function PreviewItem({
  uri,
  onClose,
  onSwipeLeft,
  onSwipeRight,
}: {
  uri: string;
  onClose: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => { savedScale.value = scale.value; })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4);
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        scale.value = withTiming(2);
      }
    });

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (scale.value === 1) runOnJS(onClose)();
    });

  const composed = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTapGesture, tapGesture),
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={{ width: SCREEN_WIDTH, height: "100%" }} className="items-center justify-center">
        <Animated.Image
          source={{ uri }}
          style={[{ width: SCREEN_WIDTH, height: "100%" }, animatedStyle]}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

// Fullscreen image preview modal with swipe + tap navigation
function ImagePreviewModal({
  visible,
  photos,
  initialIndex,
  onClose,
}: {
  visible: boolean;
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
    }
  }, [activeIndex]);

  const goToNext = useCallback(() => {
    if (activeIndex < photos.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  }, [activeIndex, photos.length]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  }), []);

  const renderPreviewItem = useCallback(({ item }: { item: string }) => (
    <PreviewItem uri={item} onClose={onClose} />
  ), [onClose]);

  // Reset active index when modal opens with new initialIndex
  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/95">
        <FlatList
          ref={flatListRef}
          data={photos}
          keyExtractor={(_, i) => `preview-${i}`}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={renderPreviewItem}
        />

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            {/* Left arrow */}
            {activeIndex > 0 && (
              <TouchableOpacity
                onPress={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 items-center justify-center"
              >
                <ChevronLeft size={24} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
            {/* Right arrow */}
            {activeIndex < photos.length - 1 && (
              <TouchableOpacity
                onPress={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 items-center justify-center"
              >
                <ChevronRight size={24} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/20 items-center justify-center"
        >
          <X size={20} color="white" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Dot indicators */}
        {photos.length > 1 && (
          <View className="absolute bottom-8 left-0 right-0 flex-row justify-center gap-2">
            {photos.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  activeIndex === index ? "w-4 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

export function ProductDetail({
  product,
  showSeller = true,
  onSellerPress,
  footerContent,
  isSaved = false,
  onSaveToggle,
  isSaving = false,
  footerPaddingBottom = 16,
}: ProductDetailProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveImageIndex(index);
  }, []);

  const scrollToImage = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const openPreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewVisible(false);
  }, []);

  const renderImageItem = useCallback(({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      onPress={() => openPreview(index)}
      activeOpacity={0.9}
      style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
    >
      <Image
        source={{ uri: item }}
        style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  ), [openPreview]);

  const renderThumbnailItem = useCallback(({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      onPress={() => scrollToImage(index)}
      className={`w-16 h-16 rounded-lg overflow-hidden border-2 mr-2 ${
        activeImageIndex === index ? "border-primary" : "border-transparent"
      }`}
    >
      <Image
        source={{ uri: item }}
        className="w-full h-full"
        resizeMode="cover"
      />
    </TouchableOpacity>
  ), [activeImageIndex, scrollToImage]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  }), []);

  return (
    <View className="flex-1 bg-background">
      {/* Main scrollable content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={true} bounces={true}>
        {/* Image Carousel */}
        {product.photos.length > 0 ? (
          <>
            {/* Main image carousel */}
            <FlatList
              ref={flatListRef}
              data={product.photos}
              keyExtractor={(item, index) => `image-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              getItemLayout={getItemLayout}
              renderItem={renderImageItem}
            />

            {/* Pagination dots */}
            {product.photos.length > 1 && (
              <View className="flex-row justify-center gap-2 py-3">
                {product.photos.map((_, index) => (
                  <View
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      activeImageIndex === index ? "w-4 bg-primary" : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </View>
            )}

            {/* Thumbnail row */}
            {product.photos.length > 1 && (
              <View className="px-4 pb-3">
                <FlatList
                  data={product.photos}
                  keyExtractor={(item, index) => `thumb-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={renderThumbnailItem}
                />
              </View>
            )}
          </>
        ) : (
          <View className="w-full aspect-square items-center justify-center bg-gray-100">
            <Text className="text-gray-400">Tidak ada foto</Text>
          </View>
        )}

        {/* Product info */}
        <View className="px-5 pt-5 pb-8">
          {(product.category || product.condition) && (
            <View className="flex-row gap-2 mb-3">
              {product.category && (
                <View className="bg-primary/20 px-3 py-1 rounded-full">
                  <Text className="text-xs font-medium text-gray-800">
                    {product.category}
                  </Text>
                </View>
              )}
              {product.condition && (
                <View className="bg-gray-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-medium text-gray-600">
                    {product.condition}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text className="text-2xl font-bold text-black mb-2">
            {formatRupiah(product.price)}
          </Text>

          <Text className="text-xl font-semibold text-gray-900 mb-4">
            {product.name || "Nama produk belum diisi"}
          </Text>

          {showSeller && product.sellerName && (
            <TouchableOpacity
              className="flex-row items-center py-4 border-t border-b border-gray-200 mb-4"
              onPress={onSellerPress}
            >
              <Avatar name={product.sellerName} size="md" />
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-gray-900">
                  {product.sellerName}
                </Text>
                <Text className="text-sm text-gray-500">Penjual</Text>
              </View>
              {onSellerPress && (
                <View className="px-4 py-2 rounded-full bg-black">
                  <Text className="text-sm font-medium text-white">
                    Lihat Profil
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">
              Deskripsi Produk
            </Text>
            {product.description ? (
              <Text className="text-gray-600 leading-6">
                {product.description}
              </Text>
            ) : (
              <Text className="text-gray-400 italic">
                Tidak ada deskripsi
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      {footerContent && (
        <View
          className="px-5 pt-4 pb-0 bg-cream border-t border-gray-200"
          style={{ paddingBottom: footerPaddingBottom }}
        >
          {footerContent}
        </View>
      )}

      {/* Image preview modal */}
      <ImagePreviewModal
        visible={previewVisible}
        photos={product.photos}
        initialIndex={previewIndex}
        onClose={closePreview}
      />
    </View>
  );
}
